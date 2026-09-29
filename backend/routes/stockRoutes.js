const express = require('express');
const router = express.Router();
const {
  getStockOverview,
  getStockValuation,
  adjustStock,
  getStockLedger,
  directStockInward,
  getStockInwardEntries,
  getSalesmanStockRequests,
  transferStockToStore
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getStockOverview);
router.get('/valuation', protect, getStockValuation);
router.get('/ledger', protect, getStockLedger);
router.get('/inward', protect, getStockInwardEntries);
router.get('/salesman-requests', protect, getSalesmanStockRequests);
router.post('/inward', protect, authorize('Owner'), directStockInward);
router.post('/adjust', protect, authorize('Owner'), adjustStock);
router.post('/transfer-to-store', protect, authorize('Owner'), transferStockToStore);

module.exports = router;
