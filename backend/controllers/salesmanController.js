const Salesman = require('../models/Salesman');
const SalesmanVisit = require('../models/SalesmanVisit');
const Store = require('../models/Store');
const Order = require('../models/Order');

// @desc    Get all salesmen
// @route   GET /api/salesmen
const getSalesmen = async (req, res) => {
  try {
    const salesmen = await Salesman.find().populate('userId', 'email role avatar').sort({ name: 1 });
    res.json({ success: true, count: salesmen.length, data: salesmen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single salesman details
// @route   GET /api/salesmen/:id
const getSalesmanById = async (req, res) => {
  try {
    const salesman = await Salesman.findById(req.params.id);
    if (!salesman) {
      return res.status(404).json({ success: false, message: 'Salesman not found' });
    }

    const assignedStores = await Store.find({ salesmanId: salesman._id });
    const visits = await SalesmanVisit.find({ salesmanId: salesman._id })
      .populate('storeId', 'name city area')
      .sort({ visitDate: -1 })
      .limit(20);

    const orders = await Order.find({ salesmanId: salesman._id })
      .populate('storeId', 'name city')
      .sort({ orderDate: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...salesman.toObject(),
        assignedStores,
        visits,
        recentOrders: orders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new salesman
// @route   POST /api/salesmen
const createSalesman = async (req, res) => {
  try {
    const { name, employeeCode, phone, territory, targetMonthly } = req.body;
    if (!name || !employeeCode || !phone || !territory) {
      return res.status(400).json({ success: false, message: 'Name, Employee Code, Phone, and Territory are required' });
    }

    const existing = await Salesman.findOne({ employeeCode: employeeCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee Code already exists' });
    }

    const salesman = await Salesman.create({
      ...req.body,
      employeeCode: employeeCode.toUpperCase()
    });

    res.status(201).json({ success: true, data: salesman });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update salesman
// @route   PUT /api/salesmen/:id
const updateSalesman = async (req, res) => {
  try {
    const salesman = await Salesman.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!salesman) {
      return res.status(404).json({ success: false, message: 'Salesman not found' });
    }
    res.json({ success: true, data: salesman });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Field Visit (Check-in or Completed visit)
// @route   POST /api/salesmen/visits
const recordVisit = async (req, res) => {
  try {
    const { salesmanId, storeId, purpose, notes, orderCreatedId, orderValue, paymentCollectedAmount, paymentMode, locationLat, locationLng } = req.body;

    const visit = await SalesmanVisit.create({
      salesmanId,
      storeId,
      visitDate: new Date(),
      checkInTime: new Date(),
      checkOutTime: new Date(),
      status: 'Completed',
      purpose: purpose || 'Order Booking',
      notes: notes || '',
      orderCreatedId: orderCreatedId || null,
      orderValue: Number(orderValue || 0),
      paymentCollectedAmount: Number(paymentCollectedAmount || 0),
      paymentMode: paymentMode || 'None',
      locationLat: locationLat || 13.0827,
      locationLng: locationLng || 80.2707
    });

    // Update salesman achievement if order value present
    if (orderValue && Number(orderValue) > 0) {
      await Salesman.findByIdAndUpdate(salesmanId, {
        $inc: { currentMonthAchievement: Number(orderValue) }
      });
    }

    const populated = await SalesmanVisit.findById(visit._id).populate('storeId').populate('salesmanId');
    res.status(201).json({ success: true, message: 'Visit logged successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all visits
// @route   GET /api/salesmen/visits
const getVisits = async (req, res) => {
  try {
    const { salesmanId, storeId } = req.query;
    const filter = {};
    if (salesmanId) filter.salesmanId = salesmanId;
    if (storeId) filter.storeId = storeId;

    const visits = await SalesmanVisit.find(filter)
      .populate('salesmanId', 'name employeeCode phone')
      .populate('storeId', 'name code city area ownerName phone')
      .sort({ visitDate: -1 });

    res.json({ success: true, count: visits.length, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSalesmen,
  getSalesmanById,
  createSalesman,
  updateSalesman,
  recordVisit,
  getVisits
};
