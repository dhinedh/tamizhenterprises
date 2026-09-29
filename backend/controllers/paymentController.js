const Payment = require('../models/Payment');
const Store = require('../models/Store');
const Manufacturer = require('../models/Manufacturer');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res) => {
  try {
    const { paymentType, storeId, manufacturerId, paymentMode } = req.query;
    const filter = {};

    if (paymentType) filter.paymentType = paymentType;
    if (storeId) filter.storeId = storeId;
    if (manufacturerId) filter.manufacturerId = manufacturerId;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }

    const payments = await Payment.find(filter)
      .populate('storeId', 'name code city')
      .populate('manufacturerId', 'name code')
      .populate('salesmanId', 'name employeeCode')
      .populate('invoiceId', 'invoiceNumber grandTotal')
      .populate('purchaseId', 'poNumber grandTotal')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Store Collection (Store -> Tamil Enterprises)
// @route   POST /api/payments/store-collection
const recordStoreCollection = async (req, res) => {
  try {
    const { storeId, invoiceId, amount, paymentMode, referenceNumber, notes, salesmanId } = req.body;
    const paymentAmount = Number(amount);

    if (!storeId || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid Store and payment amount are required' });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const count = await Payment.countDocuments();
    const paymentNumber = `COL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Handle invoice linkage if specified
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.paidAmount += paymentAmount;
        invoice.balanceAmount = Math.max(0, invoice.balanceAmount - paymentAmount);
        invoice.status = invoice.balanceAmount <= 0 ? 'Paid' : 'Partially Paid';
        await invoice.save();
      }
    }

    // Deduct store outstanding
    store.outstandingBalance = Math.max(0, store.outstandingBalance - paymentAmount);
    await store.save();

    const payment = await Payment.create({
      paymentNumber,
      paymentType: 'Store_Collection',
      storeId,
      salesmanId: salesmanId || store.salesmanId || null,
      invoiceId: invoiceId || null,
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      status: 'Completed',
      recordedBy: req.user ? req.user.name : 'Sales Staff'
    });

    res.status(201).json({
      success: true,
      message: 'Store collection recorded successfully',
      data: payment,
      remainingStoreOutstanding: store.outstandingBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Manufacturer Payment (Tamil Enterprises -> Manufacturer)
// @route   POST /api/payments/manufacturer-payment
const recordManufacturerPayment = async (req, res) => {
  try {
    const { manufacturerId, purchaseId, amount, paymentMode, referenceNumber, notes, bankName } = req.body;
    const paymentAmount = Number(amount);

    if (!manufacturerId || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid Manufacturer and payment amount are required' });
    }

    const manufacturer = await Manufacturer.findById(manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    if (purchaseId) {
      const purchase = await Purchase.findById(purchaseId);
      if (purchase) {
        purchase.paidAmount += paymentAmount;
        purchase.balanceAmount = Math.max(0, purchase.balanceAmount - paymentAmount);
        purchase.paymentStatus = purchase.balanceAmount <= 0 ? 'Paid' : 'Partially Paid';
        await purchase.save();
      }
    }

    // Deduct manufacturer balance
    manufacturer.currentOutstanding = Math.max(0, manufacturer.currentOutstanding - paymentAmount);
    manufacturer.totalPaid = (manufacturer.totalPaid || 0) + paymentAmount;
    await manufacturer.save();

    const payment = await Payment.create({
      paymentNumber,
      paymentType: 'Manufacturer_Payment',
      manufacturerId,
      purchaseId: purchaseId || null,
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMode: paymentMode || 'NEFT/RTGS',
      referenceNumber: referenceNumber || '',
      bankName: bankName || 'HDFC Bank',
      notes: notes || '',
      status: 'Completed',
      recordedBy: req.user ? req.user.name : 'Accounts'
    });

    res.status(201).json({
      success: true,
      message: 'Manufacturer payment recorded successfully',
      data: payment,
      remainingManufacturerOutstanding: manufacturer.currentOutstanding
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Outstandings Summary (both store & manufacturer)
// @route   GET /api/payments/outstandings
const getOutstandingsSummary = async (req, res) => {
  try {
    const stores = await Store.find({ outstandingBalance: { $gt: 0 } }).sort({ outstandingBalance: -1 });
    const manufacturers = await Manufacturer.find({ currentOutstanding: { $gt: 0 } }).sort({ currentOutstanding: -1 });

    const totalStoreReceivables = stores.reduce((acc, s) => acc + s.outstandingBalance, 0);
    const totalManufacturerPayables = manufacturers.reduce((acc, m) => acc + m.currentOutstanding, 0);

    res.json({
      success: true,
      data: {
        totalStoreReceivables,
        totalManufacturerPayables,
        netWorkingCapital: totalStoreReceivables - totalManufacturerPayables,
        storesWithOutstanding: stores,
        manufacturersWithOutstanding: manufacturers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPayments,
  recordStoreCollection,
  recordManufacturerPayment,
  getOutstandingsSummary
};
