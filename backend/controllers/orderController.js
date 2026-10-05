const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Invoice = require('../models/Invoice');
const Delivery = require('../models/Delivery');

// @desc    Get all orders
// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { status, storeId, salesmanId, search, shopName, startDate, endDate, from, to, orderType } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (storeId) filter.storeId = storeId;
    if (salesmanId) filter.salesmanId = salesmanId;
    if (orderType) filter.orderType = orderType;

    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }
    if (req.user && req.user.role === 'Salesman' && req.user.salesmanId) {
      filter.salesmanId = req.user.salesmanId;
    }

    const start = startDate || from;
    const end = endDate || to;
    if (start || end) {
      filter.orderDate = {};
      if (start) {
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);
        filter.orderDate.$gte = s;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        filter.orderDate.$lte = e;
      }
    }

    const queryShop = shopName || search;
    if (queryShop) {
      const matchedStores = await Store.find({
        name: { $regex: queryShop, $options: 'i' }
      }).select('_id');
      const storeIds = matchedStores.map(s => s._id);

      filter.$or = [
        { orderNumber: { $regex: queryShop, $options: 'i' } },
        { storeId: { $in: storeIds } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('storeId', 'name code city district address ownerName phone creditLimit outstandingBalance')
      .populate('salesmanId', 'name employeeCode phone')
      .sort({ orderDate: -1, createdAt: -1 });

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
    const {
      storeId,
      salesmanId,
      salesmanName,
      orderType = 'Get Order',
      noOrderReason,
      district,
      division,
      taluk,
      notes,
      orderDate,
      shopLocation,
      orderLocation,
      items,
      paymentType,
      deliveryNotes
    } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const count = await Order.countDocuments();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    if (orderType === 'No Order') {
      const order = await Order.create({
        orderNumber,
        storeId,
        salesmanId: salesmanId || store.salesmanId || null,
        salesmanName: salesmanName || (req.user?.name) || 'KARTHIBAN',
        orderType: 'No Order',
        noOrderReason: noOrderReason || notes || 'No order taken',
        district: district || store.district || '',
        division: division || '',
        taluk: taluk || '',
        notes: notes || '',
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        status: 'Pending',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        paymentType: paymentType || 'Credit',
        deliveryNotes: deliveryNotes || '',
        shopLocation: shopLocation || { lat: 13.0827, lng: 80.2707, address: store.address || '' },
        orderLocation: orderLocation || { lat: 13.0827, lng: 80.2707, address: 'Field GPS Verified' }
      });
      return res.status(201).json({ success: true, message: 'No Order recorded successfully', data: order });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const qty = Number(item.quantity);
      let unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : (product.dealerPrice || product.sellingPrice));
      const custom = product.customStorePrices?.find(csp => csp.storeId?.toString() === storeId);
      if (custom && custom.specialPrice) {
        unitPrice = custom.specialPrice;
      }

      const discountPercent = Number(item.discountPercent || 0);
      const gross = qty * unitPrice;
      let discount = (gross * discountPercent) / 100;
      if (item.discountAmount) {
        discount = Number(item.discountAmount);
      }
      const taxable = Math.max(0, gross - discount);
      const gstRate = Number(product.gstRate !== undefined ? product.gstRate : 0);
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

    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    const order = await Order.create({
      orderNumber,
      storeId,
      salesmanId: salesmanId || store.salesmanId || null,
      salesmanName: salesmanName || (req.user?.name) || 'KARTHIBAN',
      orderType: 'Get Order',
      district: district || store.district || '',
      division: division || '',
      taluk: taluk || '',
      notes: notes || '',
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      status: 'Pending',
      items: formattedItems,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentType: paymentType || 'Credit',
      deliveryNotes: deliveryNotes || '',
      shopLocation: shopLocation || { lat: 13.0827, lng: 80.2707, address: store.address || '' },
      orderLocation: orderLocation || { lat: 13.0827, lng: 80.2707, address: 'Field GPS Verified' }
    });

    res.status(201).json({
      success: true,
      message: 'Field Order placed successfully',
      data: order
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
