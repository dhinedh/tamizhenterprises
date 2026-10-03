const Manufacturer = require('../models/Manufacturer');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
const getManufacturers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } }
      ];
    }

    // Single parallel batch with .lean()
    const [manufacturers, products, stocks] = await Promise.all([
      Manufacturer.find(filter).sort({ name: 1 }).lean(),
      Product.find().select('manufacturerId purchasePrice mrp').lean(),
      Stock.find().select('productId currentStock reservedStock').lean()
    ]);

    // Build fast lookup maps in memory
    const priceMap = {};
    const mfgProductsMap = {};
    products.forEach(p => {
      const pid = p._id.toString();
      priceMap[pid] = p.purchasePrice || p.mrp || 0;
      if (p.manufacturerId) {
        const mid = p.manufacturerId.toString();
        if (!mfgProductsMap[mid]) mfgProductsMap[mid] = [];
        mfgProductsMap[mid].push(pid);
      }
    });

    const stockMap = {};
    stocks.forEach(s => {
      if (s.productId) {
        stockMap[s.productId.toString()] = s;
      }
    });

    const enriched = manufacturers.map(mfg => {
      const mid = mfg._id.toString();
      const productIds = mfgProductsMap[mid] || [];

      let totalPhysicalStock = 0;
      let totalAvailableStock = 0;
      let stockValuation = 0;

      productIds.forEach(pid => {
        const s = stockMap[pid];
        if (s) {
          const buyPrice = priceMap[pid] || 0;
          const curr = Number(s.currentStock || 0);
          const resv = Number(s.reservedStock || 0);
          const avail = Math.max(0, curr - resv);

          totalPhysicalStock += curr;
          totalAvailableStock += avail;
          stockValuation += curr * buyPrice;
        }
      });

      return {
        ...mfg,
        productsCount: productIds.length,
        totalPhysicalStock,
        totalAvailableStock,
        stockValuation
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single manufacturer details
// @route   GET /api/manufacturers/:id
const getManufacturerById = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    const purchases = await Purchase.find({ manufacturerId: manufacturer._id }).sort({ orderDate: -1 }).limit(10);
    const payments = await Payment.find({ manufacturerId: manufacturer._id }).sort({ paymentDate: -1 }).limit(10);
    const products = await Product.find({ manufacturerId: manufacturer._id }).lean();

    const productIds = products.map(p => p._id);
    const stocks = await Stock.find({ productId: { $in: productIds } }).lean();
    const stockMap = {};
    stocks.forEach(s => {
      stockMap[s.productId.toString()] = s;
    });

    let totalPhysicalStock = 0;
    let totalAvailableStock = 0;
    let stockValuation = 0;

    const productsWithStock = products.map(p => {
      const s = stockMap[p._id.toString()] || {
        currentStock: 0,
        reservedStock: 0,
        damagedStock: 0,
        minStockAlert: p.minStockAlert || 20,
        warehouseLocation: 'Warehouse Main - Bay A'
      };
      const availableStock = Math.max(0, s.currentStock - (s.reservedStock || 0));
      totalPhysicalStock += (s.currentStock || 0);
      totalAvailableStock += availableStock;
      stockValuation += (s.currentStock || 0) * (p.purchasePrice || 0);

      return {
        ...p,
        stock: {
          ...s,
          availableStock,
          isLowStock: availableStock <= (s.minStockAlert || 20)
        }
      };
    });

    res.json({
      success: true,
      data: {
        ...manufacturer.toObject(),
        purchases,
        payments,
        productsCount: products.length,
        totalPhysicalStock,
        totalAvailableStock,
        stockValuation,
        products: productsWithStock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new manufacturer (with optional initial products)
// @route   POST /api/manufacturers
const createManufacturer = async (req, res) => {
  try {
    const { name, phone, products } = req.body;
    let { code } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Company Name and Phone are required' });
    }

    let upperCode = code ? code.toUpperCase().trim() : '';
    if (!upperCode && name) {
      upperCode = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      if (!upperCode) upperCode = 'MFR';
      let candidate = upperCode;
      let counter = 1;
      while (await Manufacturer.findOne({ code: candidate })) {
        candidate = `${upperCode}${counter}`;
        counter++;
      }
      upperCode = candidate;
    }

    const existingCode = await Manufacturer.findOne({ code: upperCode });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Manufacturer code "${upperCode}" already exists` });
    }

    const manufacturer = await Manufacturer.create({
      ...req.body,
      code: upperCode,
      currentOutstanding: Number(req.body.openingBalance || 0),
      productsCount: 0,
      totalPhysicalStock: 0
    });

    // If products were provided, create them and initialize their stock
    if (products && Array.isArray(products) && products.length > 0) {
      let createdCount = 0;
      let totalStock = 0;

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.name || !p.name.trim()) continue;

        let sku = p.sku ? p.sku.toUpperCase().trim() : `${upperCode}-${p.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${i + 1}`;
        
        // Ensure SKU uniqueness
        const skuExists = await Product.findOne({ sku });
        if (skuExists) {
          sku = `${sku}-${Date.now().toString().slice(-4)}`;
        }

        const newProd = await Product.create({
          name: p.name.trim(),
          brand: p.brand?.trim() || manufacturer.name,
          category: p.category?.trim() || (req.body.categories?.[0] || 'General'),
          manufacturerId: manufacturer._id,
          sku: sku,
          hsnCode: p.hsnCode?.trim() || '190590',
          unit: p.unit || 'Pcs',
          unitQuantityPerPack: Number(p.unitQuantityPerPack || 1),
          mrp: Number(p.mrp || 0),
          purchasePrice: Number(p.purchasePrice || 0),
          dealerPrice: Number(p.dealerPrice || p.mrp || p.purchasePrice || 0),
          sellingPrice: Number(p.sellingPrice || p.dealerPrice || p.mrp || p.purchasePrice || 0),
          gstRate: Number(p.gstRate || 18),
          minStockAlert: Number(p.minStockAlert || 20)
        });

        const initialStockQty = Number(p.initialStock || 0);
        await Stock.create({
          productId: newProd._id,
          currentStock: initialStockQty,
          reservedStock: 0,
          damagedStock: 0,
          minStockAlert: Number(p.minStockAlert || 20),
          warehouseLocation: p.warehouseLocation || 'General Bay'
        });

        if (initialStockQty > 0) {
          await StockLedger.create({
            productId: newProd._id,
            manufacturerId: manufacturer._id,
            transactionType: 'INWARD_PURCHASE',
            referenceType: 'Purchase',
            referenceId: `INIT-${upperCode}`,
            quantity: initialStockQty,
            balanceBefore: 0,
            balanceAfter: initialStockQty,
            unitPrice: Number(p.purchasePrice || 0),
            totalAmount: initialStockQty * Number(p.purchasePrice || 0),
            billNumber: 'OPENING-STOCK',
            batchNumber: 'BATCH-INIT',
            notes: `Initial opening stock registered during ${manufacturer.name} onboarding`,
            performedBy: 'System'
          });
        }

        createdCount++;
        totalStock += initialStockQty;
      }

      manufacturer.productsCount = createdCount;
      manufacturer.totalPhysicalStock = totalStock;
      manufacturer.stockValuation = products.reduce((acc, p) => acc + (Number(p.initialStock || 0) * Number(p.purchasePrice || 0)), 0);
      await manufacturer.save();
    }

    res.status(201).json({ success: true, data: manufacturer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
const updateManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    res.json({ success: true, data: manufacturer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
const deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    const products = await Product.find({ manufacturerId: manufacturer._id });
    const productIds = products.map(p => p._id);
    await Stock.deleteMany({ productId: { $in: productIds } });
    await Product.deleteMany({ manufacturerId: manufacturer._id });
    await manufacturer.deleteOne();
    res.json({ success: true, message: 'Manufacturer and associated catalog removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer
};
