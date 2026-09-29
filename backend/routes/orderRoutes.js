const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  approveOrder,
  updateOrder,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, authorize('Owner'), updateOrder);

router.route('/:id/approve')
  .post(protect, authorize('Owner'), approveOrder);

router.route('/:id/cancel')
  .post(protect, cancelOrder);

module.exports = router;
