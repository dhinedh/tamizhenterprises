const express = require('express');
const router = express.Router();
const {
  getSchemes,
  createScheme,
  updateScheme,
  deleteScheme
} = require('../controllers/schemeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getSchemes)
  .post(protect, authorize('Owner'), createScheme);

router.route('/:id')
  .put(protect, authorize('Owner'), updateScheme)
  .delete(protect, authorize('Owner'), deleteScheme);

module.exports = router;
