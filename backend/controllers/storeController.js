const mongoose = require('mongoose');
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
    const { search, city, district, salesmanId, status, manufacturerId, overdueOnly } = req.query;
    const filter = {};

    if (city) filter.city = city;
    if (district) filter.district = district;
    if (salesmanId) filter.salesmanId = salesmanId;
    if (status) filter.status = status;
    if (manufacturerId) {
      if (mongoose.Types.ObjectId.isValid(manufacturerId)) {
        filter.manufacturerId = manufacturerId;
      } else {
        filter.manufacturerCode = manufacturerId.toUpperCase();
      }
    }

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
        { area: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { pincode: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ];
    }

    let stores = await Store.find(filter)
      .populate('salesmanId', 'name employeeCode phone territory')
      .populate('manufacturerId', 'name code')
      .sort({ outstandingBalance: -1, name: 1 })
      .lean();

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
// @desc    Create bulk stores in batch
// @route   POST /api/stores/bulk
const createBulkStores = async (req, res) => {
  try {
    const rawStores = req.body.stores || (Array.isArray(req.body) ? req.body : [req.body]);
    if (!Array.isArray(rawStores) || rawStores.length === 0) {
      return res.status(400).json({ success: false, message: 'An array of stores is required' });
    }

    const createdStores = [];
    const errors = [];
    let count = await Store.countDocuments();

    for (let i = 0; i < rawStores.length; i++) {
      const s = rawStores[i];
      if (!s.name || !s.name.trim()) {
        errors.push(`Row #${i + 1}: Shop Name is required`);
        continue;
      }
      if (!s.phone || !s.phone.trim()) {
        errors.push(`Row #${i + 1} (${s.name}): Mobile phone number is required`);
        continue;
      }

      // Generate clean unique store code
      const cityClean = (s.city || 'MDU').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MDU';
      count++;
      let candidate = `STR-${cityClean}-${String(count).padStart(2, '0')}`;
      let exists = await Store.findOne({ code: candidate });
      while (exists) {
        count++;
        candidate = `STR-${cityClean}-${String(count).padStart(2, '0')}`;
        exists = await Store.findOne({ code: candidate });
      }

      const cleanSalesmanId = (s.salesmanId && mongoose.Types.ObjectId.isValid(s.salesmanId)) ? s.salesmanId : null;

      try {
        const newStore = await Store.create({
          name: s.name.trim(),
          code: s.code ? s.code.trim().toUpperCase() : candidate,
          storeType: s.storeType || 'Supermarket',
          category: s.category ? s.category.trim() : '',
          manufacturerId: s.manufacturerId || null,
          manufacturerCode: s.manufacturerCode ? s.manufacturerCode.trim().toUpperCase() : '',
          femi9RetailerId: s.femi9RetailerId ? s.femi9RetailerId.trim().toUpperCase() : '',
          ownerName: s.ownerName ? s.ownerName.trim() : '',
          phone: s.phone.trim(),
          landline: s.landline ? s.landline.trim() : '',
          email: s.email ? s.email.trim() : '',
          address: s.address ? s.address.trim() : '',
          area: s.area ? s.area.trim() : '',
          city: s.city ? s.city.trim() : 'Chennai',
          district: s.district ? s.district.trim() : 'Chennai',
          state: s.state ? s.state.trim() : 'Tamil Nadu',
          pincode: s.pincode ? s.pincode.trim() : '',
          gstNumber: s.gstNumber ? s.gstNumber.trim().toUpperCase() : '',
          salesmanId: cleanSalesmanId,
          creditLimit: Number(s.creditLimit) || 50000,
          creditPeriodDays: Number(s.creditPeriodDays) || 21,
          status: s.status || 'Active'
        });

        if (cleanSalesmanId) {
          await Salesman.findByIdAndUpdate(cleanSalesmanId, { $inc: { assignedStoresCount: 1 } });
        }

        createdStores.push(newStore);
      } catch (err) {
        errors.push(`Row #${i + 1} (${s.name}): ${err.message}`);
      }
    }

    if (createdStores.length === 0 && errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', '), errors });
    }

    res.status(201).json({
      success: true,
      count: createdStores.length,
      data: createdStores,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully registered ${createdStores.length} shop(s)`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new store
// @route   POST /api/stores
const createStore = async (req, res) => {
  // If array or bulk payload is passed, forward to createBulkStores
  if (Array.isArray(req.body) || req.body.stores) {
    return createBulkStores(req, res);
  }

  try {
    const { name, code, ownerName, phone, address, city, salesmanId, creditLimit } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Shop Name and Phone number are required' });
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

    const cleanSalesmanId = (salesmanId && mongoose.Types.ObjectId.isValid(salesmanId)) ? salesmanId : null;

    const store = await Store.create({
      ...req.body,
      code: finalCode,
      salesmanId: cleanSalesmanId,
      creditLimit: creditLimit || 50000
    });

    if (cleanSalesmanId) {
      await Salesman.findByIdAndUpdate(cleanSalesmanId, { $inc: { assignedStoresCount: 1 } });
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

    const cleanSalesmanId = (req.body.salesmanId && mongoose.Types.ObjectId.isValid(req.body.salesmanId))
      ? req.body.salesmanId
      : (req.body.salesmanId === '' || req.body.salesmanId === null ? null : undefined);

    // Check if salesman assignment changed
    if (cleanSalesmanId !== undefined && String(cleanSalesmanId) !== String(oldStore.salesmanId || '')) {
      if (oldStore.salesmanId) {
        await Salesman.findByIdAndUpdate(oldStore.salesmanId, { $inc: { assignedStoresCount: -1 } });
      }
      if (cleanSalesmanId) {
        await Salesman.findByIdAndUpdate(cleanSalesmanId, { $inc: { assignedStoresCount: 1 } });
      }
    }

    const updatePayload = { ...req.body };
    if (cleanSalesmanId !== undefined) {
      updatePayload.salesmanId = cleanSalesmanId;
    }

    const updated = await Store.findByIdAndUpdate(req.params.id, updatePayload, {
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
  createBulkStores,
  updateStore,
  deleteStore
};
