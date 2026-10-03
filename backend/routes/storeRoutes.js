const express = require('express');
const router = express.Router();
const {
  getStores,
  getStoreById,
  createStore,
  createBulkStores,
  updateStore,
  deleteStore
} = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getStores)
  .post(protect, authorize('Owner', 'Salesman'), createStore);

router.route('/bulk')
  .post(protect, authorize('Owner', 'Salesman'), createBulkStores);

router.route('/:id')
  .get(protect, getStoreById)
  .put(protect, authorize('Owner', 'Salesman'), updateStore)
  .delete(protect, authorize('Owner'), deleteStore);

module.exports = router;
