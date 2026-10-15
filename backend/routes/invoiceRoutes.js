const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  generateInvoiceFromOrder,
  downloadInvoicePDF,
  updateInvoice,
  voidInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

// Public endpoints for WhatsApp / external PDF viewing without requiring login
router.get('/public/:id/pdf', downloadInvoicePDF);
router.get('/:id/public-pdf', downloadInvoicePDF);

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/generate-from-order/:orderId', protect, authorize('Owner'), generateInvoiceFromOrder);
router.get('/:id/pdf', protect, downloadInvoicePDF);
router.put('/:id', protect, authorize('Owner', 'Salesman'), updateInvoice);
router.put('/:id/void', protect, authorize('Owner', 'Salesman'), voidInvoice);
router.delete('/:id', protect, authorize('Owner'), deleteInvoice);

module.exports = router;
