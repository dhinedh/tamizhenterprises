const express = require('express');
const router = express.Router();
const {
  getSalesmen,
  getSalesmanById,
  createSalesman,
  updateSalesman,
  recordVisit,
  getVisits
} = require('../controllers/salesmanController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getSalesmen)
  .post(protect, authorize('Owner'), createSalesman);

router.route('/visits')
  .get(protect, getVisits)
  .post(protect, recordVisit);

router.route('/:id')
  .get(protect, getSalesmanById)
  .put(protect, authorize('Owner'), updateSalesman);

module.exports = router;
