const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Invoice = require('../models/Invoice');
const Delivery = require('../models/Delivery');

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { status, storeId, salesmanId, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (storeId) filter.storeId = storeId;
    if (salesmanId) filter.salesmanId = salesmanId;

    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }
    if (req.user && req.user.role === 'Salesman' && req.user.salesmanId) {
      filter.salesmanId = req.user.salesmanId;
    }

    if (search) {
      filter.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('storeId', 'name code city ownerName phone creditLimit outstandingBalance')
      .populate('salesmanId', 'name employeeCode phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('storeId')
      .populate('salesmanId')
      .populate('items.productId')
      .populate('invoiceId')
      .populate('deliveryId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Place a new store order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { storeId, salesmanId, items, paymentType, deliveryNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Check credit limit warning
    const currentOutstanding = store.outstandingBalance || 0;
    const creditLimit = store.creditLimit || 50000;

    // Calculate item pricing & taxes
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const qty = Number(item.quantity);
      // Unit price: check custom store price first, else dealerPrice / sellingPrice
      let unitPrice = Number(item.unitPrice || product.dealerPrice || product.sellingPrice);
      const custom = product.customStorePrices?.find(csp => csp.storeId?.toString() === storeId);
      if (custom && custom.specialPrice) {
        unitPrice = custom.specialPrice;
      }

      const discountPercent = Number(item.discountPercent || 0);
      const gross = qty * unitPrice;
      const discount = (gross * discountPercent) / 100;
      const taxable = gross - discount;
      const gstRate = Number(product.gstRate || 18);
      const tax = (taxable * gstRate) / 100;
      const total = taxable + tax;

      subtotal += gross;
      discountTotal += discount;
      taxTotal += tax;

      formattedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        freeQuantity: Number(item.freeQuantity || 0),
        unitPrice,
        discountPercent,
        discountAmount: discount,
        gstRate,
        taxAmount: tax,
        total
      });
    }

    const grandTotal = subtotal - discountTotal + taxTotal;

    // Generate Order Number
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const order = await Order.create({
      orderNumber,
      storeId,
      salesmanId: salesmanId || store.salesmanId || null,
      orderDate: new Date(),
      status: 'Pending',
      items: formattedItems,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentType: paymentType || 'Credit',
      deliveryNotes: deliveryNotes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
      creditWarning: (currentOutstanding + grandTotal) > creditLimit
        ? `Order placed, but store total balance (₹${currentOutstanding + grandTotal}) will exceed credit limit (₹${creditLimit})`
        : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Order (locks & reserves stock)
// @route   POST /api/orders/:id/approve
const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot approve order with status ${order.status}` });
    }

    // Verify stock availability and reserve
    for (const item of order.items) {
      const stock = await Stock.findOne({ productId: item.productId });
      const available = stock ? (stock.currentStock - stock.reservedStock) : 0;
      const required = item.quantity + (item.freeQuantity || 0);

      if (available < required) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${available}, Required: ${required}`
        });
      }
    }

    // Stock verified, lock reserved stock
    for (const item of order.items) {
      const required = item.quantity + (item.freeQuantity || 0);
      await Stock.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { reservedStock: required } }
      );
    }

    order.status = 'Approved';
    order.approvedBy = req.user ? req.user.name : 'Owner';
    order.approvalDate = new Date();
    await order.save();

    res.json({ success: true, message: 'Order approved and stock reserved', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { status, receivedByName } = req.body;
    const updateData = { ...req.body };

    if (status === 'Delivered') {
      updateData.deliveryDate = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('storeId')
      .populate('salesmanId')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If marked as Delivered, also sync any associated Delivery document
    if (status === 'Delivered') {
      await Delivery.updateMany(
        { orderId: order._id },
        {
          status: 'Delivered',
          actualDeliveryDate: new Date(),
          receivedByName: receivedByName || 'Store Receiving Manager'
        }
      );
    }

    res.json({ success: true, message: `Order status updated to ${order.status}`, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order (releases any reserved stock)
// @route   POST /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled' });
    }

    // If order was approved, release reserved stock
    if (order.status === 'Approved' || order.status === 'Processing') {
      for (const item of order.items) {
        const required = item.quantity + (item.freeQuantity || 0);
        await Stock.findOneAndUpdate(
          { productId: item.productId },
          { $inc: { reservedStock: -required } }
        );
      }
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ success: true, message: 'Order cancelled and reserved stock released', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  approveOrder,
  updateOrder,
  cancelOrder
};
