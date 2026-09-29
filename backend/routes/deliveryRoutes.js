const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getDeliveries)
  .post(protect, authorize('Owner'), createDelivery);

router.route('/:id/status')
  .put(protect, updateDeliveryStatus);

module.exports = router;
