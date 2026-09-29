const express = require('express');
const router = express.Router();
const {
  getManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer
} = require('../controllers/manufacturerController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getManufacturers)
  .post(protect, authorize('Owner'), createManufacturer);

router.route('/:id')
  .get(protect, getManufacturerById)
  .put(protect, authorize('Owner'), updateManufacturer)
  .delete(protect, authorize('Owner'), deleteManufacturer);

module.exports = router;
