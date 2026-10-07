const express = require('express');
const router = express.Router();
const {
  getSalesmen,
  getSalesmanById,
  createSalesman,
  updateSalesman,
  deleteSalesman,
  recordVisit,
  updateVisit,
  deleteVisit,
  getVisits
} = require('../controllers/salesmanController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getSalesmen)
  .post(protect, authorize('Owner'), createSalesman);

router.route('/visits')
  .get(protect, getVisits)
  .post(protect, recordVisit);

router.route('/visits/:id')
  .put(protect, updateVisit)
  .delete(protect, authorize('Owner'), deleteVisit);

router.route('/:id')
  .get(protect, getSalesmanById)
  .put(protect, authorize('Owner'), updateSalesman)
  .delete(protect, authorize('Owner'), deleteSalesman);

module.exports = router;

