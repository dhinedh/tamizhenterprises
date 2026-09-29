const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  generateInvoiceFromOrder,
  downloadInvoicePDF
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/generate-from-order/:orderId', protect, authorize('Owner'), generateInvoiceFromOrder);
router.get('/:id/pdf', protect, downloadInvoicePDF);

module.exports = router;
