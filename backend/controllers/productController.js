const Product = require('../models/Product');
const Stock = require('../models/Stock');

// @desc    Get all products with stock information
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, brand, manufacturerId, status, lowStock } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (manufacturerId) filter.manufacturerId = manufacturerId;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } }
      ];
    }

    let products = await Product.find(filter)
      .populate('manufacturerId', 'name code')
      .sort({ name: 1 })
      .lean();

    // Attach stock information to each product
    const productIds = products.map(p => p._id);
    const stocks = await Stock.find({ productId: { $in: productIds } }).lean();
    const stockMap = {};
    stocks.forEach(s => {
      stockMap[s.productId.toString()] = s;
    });

    products = products.map(p => {
      const stock = stockMap[p._id.toString()] || {
        currentStock: 0,
        reservedStock: 0,
        damagedStock: 0,
        minStockAlert: p.minStockAlert || 20
      };
      const availableStock = Math.max(0, stock.currentStock - stock.reservedStock);
      const isLowStock = availableStock <= (stock.minStockAlert || 20);
      return {
        ...p,
        stock: {
          ...stock,
          availableStock,
          isLowStock
        }
      };
    });

    if (lowStock === 'true') {
      products = products.filter(p => p.stock.isLowStock);
    }

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('manufacturerId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const stock = await Stock.findOne({ productId: product._id });
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stock: stock || { currentStock: 0, reservedStock: 0, damagedStock: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product and initialize stock
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, brand, category, manufacturerId, mrp, purchasePrice, dealerPrice, sellingPrice, initialStock } = req.body;
    let { sku, hsnCode } = req.body;

    if (!sku || !sku.trim()) {
      const cleanBrand = (brand || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      sku = `${cleanBrand}-${Date.now().toString().slice(-6)}`;
    } else {
      sku = sku.trim().toUpperCase();
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'Product SKU already exists' });
      }
    }

    if (!hsnCode || !hsnCode.trim()) {
      hsnCode = '190590';
    }

    const product = await Product.create({
      ...req.body,
      sku,
      hsnCode,
      category: (category && category.trim()) ? category.trim() : 'General',
      dealerPrice: Number(dealerPrice || mrp || purchasePrice || 0),
      sellingPrice: Number(sellingPrice || dealerPrice || mrp || purchasePrice || 0)
    });

    // Initialize stock record
    await Stock.create({
      productId: product._id,
      currentStock: Number(initialStock || 0),
      reservedStock: 0,
      damagedStock: 0,
      minStockAlert: req.body.minStockAlert || 20,
      warehouseLocation: req.body.warehouseLocation || 'Warehouse Main - Bay A'
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await Stock.deleteOne({ productId: product._id });
    await product.deleteOne();
    res.json({ success: true, message: 'Product and associated stock record removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
