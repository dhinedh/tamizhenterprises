const express = require('express');
const router = express.Router();
const {
  getReturns,
  createReturn,
  approveReturn
} = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getReturns)
  .post(protect, createReturn);

router.route('/:id/approve')
  .post(protect, authorize('Owner'), approveReturn);

module.exports = router;
