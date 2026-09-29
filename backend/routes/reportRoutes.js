const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getProductPerformance,
  getStorePerformance,
  getManufacturerPerformance
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/sales', protect, authorize('Owner'), getSalesReport);
router.get('/product-performance', protect, authorize('Owner'), getProductPerformance);
router.get('/store-performance', protect, authorize('Owner'), getStorePerformance);
router.get('/manufacturer-performance', protect, authorize('Owner'), getManufacturerPerformance);

module.exports = router;
