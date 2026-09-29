const Store = require('../models/Store');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Salesman = require('../models/Salesman');
const Delivery = require('../models/Delivery');
const Return = require('../models/Return');

// @desc    Get all stores
// @route   GET /api/stores
const getStores = async (req, res) => {
  try {
    const { search, city, salesmanId, status, overdueOnly } = req.query;
    const filter = {};

    if (city) filter.city = city;
    if (salesmanId) filter.salesmanId = salesmanId;
    if (status) filter.status = status;

    // If salesman role is logged in, restrict to assigned stores
    if (req.user && req.user.role === 'Salesman' && req.user.salesmanId) {
      filter.salesmanId = req.user.salesmanId;
    }

    // If store role is logged in, restrict to their own store
    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter._id = req.user.storeId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ];
    }

    let stores = await Store.find(filter)
      .populate('salesmanId', 'name employeeCode phone territory')
      .sort({ outstandingBalance: -1, name: 1 });

    if (overdueOnly === 'true') {
      stores = stores.filter(s => s.outstandingBalance > 0);
    }

    res.json({ success: true, count: stores.length, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single store with complete 360 overview
// @route   GET /api/stores/:id
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('salesmanId');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const [orders, invoices, payments, deliveries, returns] = await Promise.all([
      Order.find({ storeId: store._id }).sort({ orderDate: -1 }).limit(30),
      Invoice.find({ storeId: store._id }).sort({ invoiceDate: -1 }).limit(30),
      Payment.find({ storeId: store._id }).sort({ paymentDate: -1 }).limit(30),
      Delivery.find({ storeId: store._id }).sort({ dispatchDate: -1 }).limit(30),
      Return.find({ storeId: store._id }).sort({ createdAt: -1 }).limit(30)
    ]);

    res.json({
      success: true,
      data: {
        ...store.toObject(),
        orders,
        invoices,
        payments,
        deliveries,
        returns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new store
// @route   POST /api/stores
const createStore = async (req, res) => {
  try {
    const { name, code, ownerName, phone, address, city, salesmanId, creditLimit } = req.body;
    if (!name || !ownerName || !phone || !address || !city) {
      return res.status(400).json({ success: false, message: 'Store Name, Owner Name, Phone, Address, and City are required' });
    }

    let finalCode = (code || '').trim().toUpperCase();
    if (!finalCode) {
      // Auto-generate clean, unique store code (e.g. STR-MDU-05)
      const cityClean = (city || 'STR').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MDU';
      const count = await Store.countDocuments();
      let candidate = `STR-${cityClean}-${String(count + 1).padStart(2, '0')}`;
      let exists = await Store.findOne({ code: candidate });
      let counter = count + 1;
      while (exists) {
        counter++;
        candidate = `STR-${cityClean}-${String(counter).padStart(2, '0')}`;
        exists = await Store.findOne({ code: candidate });
      }
      finalCode = candidate;
    } else {
      const existing = await Store.findOne({ code: finalCode });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Store code already exists' });
      }
    }

    const store = await Store.create({
      ...req.body,
      code: finalCode,
      creditLimit: creditLimit || 50000
    });

    if (salesmanId) {
      await Salesman.findByIdAndUpdate(salesmanId, { $inc: { assignedStoresCount: 1 } });
    }

    res.status(201).json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
const updateStore = async (req, res) => {
  try {
    const oldStore = await Store.findById(req.params.id);
    if (!oldStore) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Check if salesman assignment changed
    if (req.body.salesmanId && req.body.salesmanId !== oldStore.salesmanId?.toString()) {
      if (oldStore.salesmanId) {
        await Salesman.findByIdAndUpdate(oldStore.salesmanId, { $inc: { assignedStoresCount: -1 } });
      }
      await Salesman.findByIdAndUpdate(req.body.salesmanId, { $inc: { assignedStoresCount: 1 } });
    }

    const updated = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('salesmanId');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (store.salesmanId) {
      await Salesman.findByIdAndUpdate(store.salesmanId, { $inc: { assignedStoresCount: -1 } });
    }
    await store.deleteOne();
    res.json({ success: true, message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};
