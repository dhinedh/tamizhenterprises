const express = require('express');
const router = express.Router();
const {
  getPayments,
  recordStoreCollection,
  recordManufacturerPayment,
  getOutstandingsSummary
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPayments);
router.get('/outstandings', protect, authorize('Owner'), getOutstandingsSummary);
router.post('/store-collection', protect, recordStoreCollection);
router.post('/manufacturer-payment', protect, authorize('Owner'), recordManufacturerPayment);

module.exports = router;
