const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Manufacturer = require('../models/Manufacturer');

// @desc    Get all stock levels
// @route   GET /api/stock
const getStockOverview = async (req, res) => {
  try {
    const { lowStock, outOfStock, search, location, manufacturerId } = req.query;
    const stocks = await Stock.find()
      .populate({
        path: 'productId',
        populate: { path: 'manufacturerId', select: 'name code' }
      })
      .sort({ currentStock: 1 });

    let filtered = stocks.filter(s => s.productId); // ensure valid populated product

    if (manufacturerId) {
      filtered = filtered.filter(s => 
        s.productId?.manufacturerId?._id?.toString() === manufacturerId || 
        s.productId?.manufacturerId?.toString() === manufacturerId
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        (s.productId?.name && s.productId.name.toLowerCase().includes(q)) ||
        (s.productId?.sku && s.productId.sku.toLowerCase().includes(q)) ||
        (s.productId?.brand && s.productId.brand.toLowerCase().includes(q))
      );
    }

    if (lowStock === 'true') {
      filtered = filtered.filter(s => (s.availableStock ?? (s.currentStock - (s.reservedStock || 0))) <= (s.minStockAlert || 20) && (s.availableStock ?? (s.currentStock - (s.reservedStock || 0))) > 0);
    }

    if (outOfStock === 'true') {
      filtered = filtered.filter(s => (s.availableStock ?? (s.currentStock - (s.reservedStock || 0))) === 0);
    }

    if (location) {
      filtered = filtered.filter(s => s.warehouseLocation && s.warehouseLocation.toLowerCase().includes(location.toLowerCase()));
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stock valuation summary
// @route   GET /api/stock/valuation
const getStockValuation = async (req, res) => {
  try {
    const stocks = await Stock.find().populate('productId');
    let totalItems = 0;
    let totalPurchaseValuation = 0;
    let totalSellingValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalDamagedUnits = 0;
    let damagedValuation = 0;

    stocks.forEach(stock => {
      if (stock.productId) {
        const available = Math.max(0, stock.currentStock - stock.reservedStock);
        totalItems += stock.currentStock;
        totalPurchaseValuation += (stock.currentStock * (stock.productId.purchasePrice || 0));
        totalSellingValuation += (stock.currentStock * (stock.productId.sellingPrice || 0));
        totalDamagedUnits += (stock.damagedStock || 0);
        damagedValuation += ((stock.damagedStock || 0) * (stock.productId.purchasePrice || 0));

        if (available <= (stock.minStockAlert || 20) && available > 0) {
          lowStockCount++;
        }
        if (available === 0) {
          outOfStockCount++;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalSkus: stocks.length,
        totalPhysicalQuantity: totalItems,
        totalPurchaseValuation,
        totalSellingValuation,
        potentialGrossProfit: totalSellingValuation - totalPurchaseValuation,
        lowStockCount,
        outOfStockCount,
        totalDamagedUnits,
        damagedValuation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manual stock adjustment
// @route   POST /api/stock/adjust
const adjustStock = async (req, res) => {
  try {
    const { productId, adjustmentQty, type = 'SET', reason, notes, warehouseLocation } = req.body;
    // type: 'SET' or 'ADDITION' or 'REDUCTION' or 'DAMAGE_TRANSFER'

    let stock = await Stock.findOne({ productId });
    if (!stock) {
      stock = await Stock.create({ productId, currentStock: 0, reservedStock: 0, damagedStock: 0 });
    }

    const qty = Number(adjustmentQty);
    if (isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid stock quantity is required' });
    }

    const balanceBefore = stock.currentStock;

    if (type === 'SET' || type === 'SET_STOCK' || type === 'OVERWRITE') {
      stock.currentStock = Math.max(0, qty);
    } else if (type === 'ADDITION') {
      stock.currentStock += qty;
    } else if (type === 'REDUCTION') {
      if (stock.currentStock < qty) {
        return res.status(400).json({ success: false, message: `Cannot reduce ${qty} units. Current stock is only ${stock.currentStock}` });
      }
      stock.currentStock -= qty;
    } else if (type === 'DAMAGE_TRANSFER') {
      // Move from current to damaged
      if (stock.currentStock < qty) {
        return res.status(400).json({ success: false, message: `Cannot transfer ${qty} units to damaged. Current stock is only ${stock.currentStock}` });
      }
      stock.currentStock -= qty;
      stock.damagedStock += qty;
    }

    if (warehouseLocation) {
      stock.warehouseLocation = warehouseLocation;
    }

    await stock.save();

    const changeQty = (type === 'SET' || type === 'SET_STOCK' || type === 'OVERWRITE')
      ? (stock.currentStock - balanceBefore)
      : (type === 'ADDITION' ? qty : -qty);

    // Log in Stock Ledger if there was any change
    if (changeQty !== 0 || balanceBefore === 0) {
      await StockLedger.create({
        productId,
        transactionType: 'STOCK_ADJUSTMENT',
        referenceType: 'Manual_Adjustment',
        referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
        quantity: changeQty,
        balanceBefore,
        balanceAfter: stock.currentStock,
        notes: `${reason || (type === 'SET' ? 'Stock count update' : 'Manual Adjustment')}: ${notes || ''}`,
        performedBy: req.user ? req.user.name : 'Warehouse Admin'
      });
    }

    // Update parent Manufacturer's total stock and valuation
    const prod = await Product.findById(productId);
    if (prod && prod.manufacturerId) {
      const allMfgProducts = await Product.find({ manufacturerId: prod.manufacturerId }).select('_id purchasePrice');
      const allStocks = await Stock.find({ productId: { $in: allMfgProducts.map(p => p._id) } });
      const priceMap = {};
      allMfgProducts.forEach(p => { priceMap[p._id.toString()] = p.purchasePrice || 0; });
      let totalStock = 0;
      let val = 0;
      allStocks.forEach(s => {
        totalStock += s.currentStock;
        val += s.currentStock * (priceMap[s.productId.toString()] || 0);
      });
      await Manufacturer.findByIdAndUpdate(prod.manufacturerId, {
        totalPhysicalStock: totalStock,
        stockValuation: val
      });
    }

    const updated = await Stock.findById(stock._id).populate('productId');
    res.json({ success: true, message: 'Stock updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stock ledger history
// @route   GET /api/stock/ledger
const getStockLedger = async (req, res) => {
  try {
    const { productId, transactionType, limit = 50 } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (transactionType) filter.transactionType = transactionType;

    const ledger = await StockLedger.find(filter)
      .populate('productId', 'name sku brand')
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: ledger.length, data: ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Direct Stock Update / Inward (No PO needed: price, date, quantity, product)
// @route   POST /api/stock/inward
const directStockInward = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      unitPrice,
      date,
      billNumber,
      batchNumber,
      notes,
      warehouseLocation,
      updateProductPrice = true,
      sellingPrice
    } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product selection is required' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const price = Number(unitPrice);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid unit purchase price is required' });
    }

    const product = await Product.findById(productId).populate('manufacturerId', 'name code');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let stock = await Stock.findOne({ productId });
    if (!stock) {
      stock = new Stock({
        productId,
        currentStock: 0,
        reservedStock: 0,
        damagedStock: 0,
        minStockAlert: 20,
        warehouseLocation: warehouseLocation || 'Main Warehouse - Bay 1'
      });
    }

    const balanceBefore = stock.currentStock;
    stock.currentStock += qty;

    if (warehouseLocation) {
      stock.warehouseLocation = warehouseLocation;
    }

    await stock.save();

    // Optionally update master product purchase / selling price
    if (updateProductPrice) {
      product.purchasePrice = price;
      if (sellingPrice && Number(sellingPrice) > 0) {
        product.sellingPrice = Number(sellingPrice);
      }
      await product.save();
    }

    const totalAmount = Math.round(qty * price * 100) / 100;
    const inwardDate = date ? new Date(date) : new Date();

    // Log to Stock Ledger
    const ledgerEntry = await StockLedger.create({
      productId,
      manufacturerId: product.manufacturerId?._id || product.manufacturerId,
      transactionType: 'INWARD_PURCHASE',
      referenceType: 'Purchase',
      referenceId: billNumber || `INW-${Date.now().toString().slice(-6)}`,
      quantity: qty,
      balanceBefore,
      balanceAfter: stock.currentStock,
      unitPrice: price,
      totalAmount,
      billNumber: billNumber || '',
      batchNumber: batchNumber || '',
      notes: notes || `Direct Stock Inward of ${qty} units @ ₹${price}`,
      performedBy: req.user ? req.user.name : 'Owner / Admin',
      date: inwardDate
    });

    const populatedStock = await Stock.findById(stock._id).populate({
      path: 'productId',
      populate: { path: 'manufacturerId', select: 'name code' }
    });

    res.status(201).json({
      success: true,
      message: `Successfully added ${qty} units of ${product.name} to stock at ₹${price}/unit`,
      data: {
        stock: populatedStock,
        ledger: ledgerEntry,
        product
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Direct Stock Inward entries history
// @route   GET /api/stock/inward
const getStockInwardEntries = async (req, res) => {
  try {
    const { manufacturerId, productId, limit = 100, search } = req.query;

    const filter = { transactionType: 'INWARD_PURCHASE' };
    if (productId) filter.productId = productId;
    if (manufacturerId) filter.manufacturerId = manufacturerId;

    const entries = await StockLedger.find(filter)
      .populate({
        path: 'productId',
        populate: { path: 'manufacturerId', select: 'name code brand' }
      })
      .sort({ date: -1 })
      .limit(Number(limit));

    let filtered = entries.filter(e => e.productId);

    if (manufacturerId) {
      filtered = filtered.filter(e => {
        const mfgId = e.manufacturerId?.toString() || e.productId?.manufacturerId?._id?.toString() || e.productId?.manufacturerId?.toString();
        return mfgId === manufacturerId;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.productId?.name?.toLowerCase().includes(q) ||
        e.productId?.sku?.toLowerCase().includes(q) ||
        e.billNumber?.toLowerCase().includes(q) ||
        e.batchNumber?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      );
    }

    const totalInwardQty = filtered.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalInwardValuation = filtered.reduce((sum, e) => sum + (e.totalAmount || ((e.quantity || 0) * (e.unitPrice || 0))), 0);

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
      summary: {
        totalInwardQty,
        totalInwardValuation: Math.round(totalInwardValuation * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Salesperson Field Requests with Live Warehouse Stock Availability
// @route   GET /api/stock/salesman-requests
const getSalesmanStockRequests = async (req, res) => {
  try {
    const { status = 'Pending', search } = req.query;
    const filter = {
      salesmanId: { $ne: null }
    };
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('storeId', 'name code city area phone ownerName creditLimit outstandingBalance state gstNumber')
      .populate('salesmanId', 'name employeeCode phone territory')
      .populate('items.productId', 'name sku brand purchasePrice dealerPrice sellingPrice unit minStockAlert')
      .sort({ createdAt: -1 });

    // Collect all product IDs to get real-time stock
    const allProductIds = [];
    orders.forEach(ord => {
      ord.items.forEach(item => {
        const pId = item.productId?._id || item.productId;
        if (pId) allProductIds.push(pId);
      });
    });

    const stocks = await Stock.find({ productId: { $in: allProductIds } });
    const stockMap = {};
    stocks.forEach(s => {
      stockMap[s.productId.toString()] = s;
    });

    const enrichedOrders = orders.map(ord => {
      const orderObj = ord.toObject();
      let allItemsInStock = true;
      let totalRequestedQty = 0;

      orderObj.items = orderObj.items.map(item => {
        const prodId = item.productId?._id?.toString() || item.productId?.toString();
        const stock = stockMap[prodId];
        const currentStock = stock ? stock.currentStock : 0;
        const reservedStock = stock ? stock.reservedStock : 0;
        const availableStock = Math.max(0, currentStock - reservedStock);
        const reqQty = (item.quantity || 0) + (item.freeQuantity || 0);
        totalRequestedQty += reqQty;

        const hasEnough = currentStock >= (item.quantity || 0);
        if (!hasEnough) {
          allItemsInStock = false;
        }

        return {
          ...item,
          currentStock,
          availableStock,
          hasEnoughStock: hasEnough,
          stockDeficit: hasEnough ? 0 : ((item.quantity || 0) - currentStock)
        };
      });

      return {
        ...orderObj,
        totalRequestedQty,
        allItemsInStock,
        canTransferImmediately: allItemsInStock && (orderObj.status === 'Pending' || orderObj.status === 'Approved')
      };
    });

    let result = enrichedOrders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.storeId?.name?.toLowerCase().includes(q) ||
        o.storeId?.city?.toLowerCase().includes(q) ||
        o.salesmanId?.name?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Direct Stock Transfer to Store & Automatic Invoice Bill Generation
// @route   POST /api/stock/transfer-to-store
const transferStockToStore = async (req, res) => {
  try {
    const {
      storeId,
      customerId,
      salesmanId,
      orderId,
      items,
      paymentType = 'Credit',
      notes = '',
      vehicleNumber = '',
      driverName = ''
    } = req.body;

    if (!storeId && !customerId) {
      return res.status(400).json({ success: false, message: 'Destination Store or Customer is required for invoice creation' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product item is required for stock transfer' });
    }

    let store = null;
    let customer = null;
    if (storeId) {
      store = await Store.findById(storeId);
    }
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    const billingEntity = store || customer;
    if (!billingEntity) {
      return res.status(404).json({ success: false, message: 'Destination store or customer not found' });
    }

    // Check stock availability for all items first
    for (const item of items) {
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Valid transfer quantity is required for all items' });
      }

      const stock = await Stock.findOne({ productId: item.productId }).populate('productId', 'name sku');
      if (!stock || stock.currentStock < qty) {
        const prodName = stock?.productId?.name || 'Product';
        const current = stock ? stock.currentStock : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient warehouse stock for "${prodName}". Current physical stock is only ${current} units, but requested transfer is ${qty} units.`
        });
      }
    }

    // Generate Invoice Number
    const invCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(5, '0')}`;
    const entityState = (billingEntity.state || 'Tamil Nadu').toLowerCase();
    const isInterstate = entityState !== 'tamil nadu' && entityState !== 'tamilnadu';

    let taxableSubtotal = 0;
    let totalDiscount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let grandTotal = 0;

    const invoiceItems = [];
    const formattedOrderItems = [];

    // Deduct stock, update ledger, calculate pricing & taxes
    for (const item of items) {
      const product = await Product.findById(item.productId);
      const qty = Number(item.quantity);
      const freeQty = Number(item.freeQuantity || 0);

      const stock = await Stock.findOne({ productId: item.productId });
      const balanceBefore = stock.currentStock;

      // Deduct from physical stock
      stock.currentStock -= qty;
      // If reserved stock existed, release it
      if (stock.reservedStock > 0) {
        stock.reservedStock = Math.max(0, stock.reservedStock - (qty + freeQty));
      }
      stock.lastStockOutwardDate = new Date();
      await stock.save();

      // Log to Stock Ledger
      await StockLedger.create({
        productId: item.productId,
        manufacturerId: product?.manufacturerId,
        transactionType: 'OUTWARD_SALE',
        referenceType: 'Invoice',
        referenceId: invoiceNumber,
        quantity: -qty,
        balanceBefore,
        balanceAfter: stock.currentStock,
        unitPrice: Number(item.unitPrice || product.dealerPrice || product.sellingPrice),
        totalAmount: qty * Number(item.unitPrice || product.dealerPrice || product.sellingPrice),
        billNumber: invoiceNumber,
        notes: `Stock Transfer & Billed to ${billingEntity.name} (${billingEntity.city || billingEntity.address || ''}) [Challan: DC-${invoiceNumber}]`,
        performedBy: req.user ? req.user.name : 'Store Dispatch Admin',
        date: new Date()
      });

      // Price calculation
      let unitPrice = Number(item.unitPrice);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        const custom = store ? product.customStorePrices?.find(csp => csp.storeId?.toString() === storeId) : null;
        unitPrice = (custom && custom.specialPrice) ? custom.specialPrice : (product.dealerPrice || product.sellingPrice || 0);
      }

      const discountPercent = Number(item.discountPercent || 0);
      const itemGross = qty * unitPrice;
      const discount = (itemGross * discountPercent) / 100;
      const taxable = itemGross - discount;
      const gstRate = Number(product.gstRate || 18);
      const taxAmount = (taxable * gstRate) / 100;
      const itemTotal = taxable + taxAmount;

      let cgst = 0, sgst = 0, igst = 0;
      if (isInterstate) {
        igst = taxAmount;
        igstTotal += igst;
      } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
        cgstTotal += cgst;
        sgstTotal += sgst;
      }

      taxableSubtotal += taxable;
      totalDiscount += discount;
      grandTotal += itemTotal;

      invoiceItems.push({
        productId: item.productId,
        name: product.name,
        hsnCode: product.hsnCode || '2106',
        quantity: qty,
        freeQuantity: freeQty,
        unitPrice,
        discountPercent,
        discountAmount: discount,
        taxableValue: taxable,
        gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        taxAmount,
        total: itemTotal
      });

      formattedOrderItems.push({
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        freeQuantity: freeQty,
        unitPrice,
        discountPercent,
        discountAmount: discount,
        gstRate,
        taxAmount,
        total: itemTotal
      });
    }

    const taxTotal = cgstTotal + sgstTotal + igstTotal;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (store ? (store.creditPeriodDays || 15) : 15));

    // Handle Order (create new or update existing order from salesperson)
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
      if (order) {
        order.status = 'Dispatched';
        order.approvedBy = req.user ? req.user.name : 'Admin';
        order.approvalDate = new Date();
        order.subtotal = taxableSubtotal + totalDiscount;
        order.discountTotal = totalDiscount;
        order.taxTotal = taxTotal;
        order.grandTotal = grandTotal;
        order.items = formattedOrderItems;
        order.deliveryNotes = notes ? `${order.deliveryNotes || ''} | ${notes}` : order.deliveryNotes;
        await order.save();
      }
    }

    if (!order) {
      const orderCount = await Order.countDocuments();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;
      order = await Order.create({
        orderNumber,
        storeId: store ? store._id : null,
        customerId: customer ? customer._id : null,
        salesmanId: salesmanId || (store ? store.salesmanId : null),
        orderDate: new Date(),
        status: 'Dispatched',
        items: formattedOrderItems,
        subtotal: taxableSubtotal + totalDiscount,
        discountTotal: totalDiscount,
        taxTotal,
        grandTotal,
        paymentType,
        deliveryNotes: notes || `Direct Billed to ${billingEntity.name} via ${vehicleNumber || 'Dispatch Van'}`,
        approvedBy: req.user ? req.user.name : 'Owner / Dispatch Admin',
        approvalDate: new Date()
      });
    }

    // Create Invoice
    const isCash = paymentType === 'Cash';
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      storeId: store ? store._id : null,
      customerId: customer ? customer._id : null,
      salesmanId: salesmanId || order.salesmanId || (store ? store.salesmanId : null),
      invoiceDate: new Date(),
      dueDate,
      items: invoiceItems,
      taxableSubtotal,
      totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal,
      paidAmount: isCash ? grandTotal : 0,
      balanceAmount: isCash ? 0 : grandTotal,
      status: isCash ? 'Paid' : 'Unpaid',
      saleType: paymentType,
      eWayBillNo: grandTotal > 50000 ? `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}` : '',
      deliveryChallanNo: `DC-${invoiceNumber}`,
      notes: notes || `Billed to ${billingEntity.name}. Vehicle: ${vehicleNumber || 'Van'}, Driver: ${driverName || 'Depot Driver'}`
    });

    // Link Invoice to Order
    order.invoiceId = invoice._id;
    await order.save();

    // Update Store balance and stats if billed to a store
    if (store) {
      if (!isCash) {
        store.outstandingBalance = (store.outstandingBalance || 0) + grandTotal;
      }
      store.totalOrdersCount = (store.totalOrdersCount || 0) + 1;
      store.totalOrderValue = (store.totalOrderValue || 0) + grandTotal;
      store.lastOrderDate = new Date();
      await store.save();
    }

    // Populate for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('storeId')
      .populate('customerId')
      .populate('salesmanId')
      .populate('items.productId');

    res.status(201).json({
      success: true,
      message: `Stock transfer of ${items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} units completed! Invoice ${invoiceNumber} generated successfully.`,
      data: {
        invoice: populatedInvoice,
        order,
        invoiceNumber,
        grandTotal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStockOverview,
  getStockValuation,
  adjustStock,
  getStockLedger,
  directStockInward,
  getStockInwardEntries,
  getSalesmanStockRequests,
  transferStockToStore
};
