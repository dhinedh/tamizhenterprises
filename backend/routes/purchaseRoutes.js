const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receiveGoods,
  updatePurchase
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getPurchases)
  .post(protect, authorize('Owner'), createPurchase);

router.route('/:id')
  .get(protect, getPurchaseById)
  .put(protect, authorize('Owner'), updatePurchase);

router.route('/:id/receive')
  .post(protect, authorize('Owner'), receiveGoods);

module.exports = router;
