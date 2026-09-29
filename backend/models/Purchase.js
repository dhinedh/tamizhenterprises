const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  orderedQty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0, min: 0 },
  damagedQty: { type: Number, default: 0, min: 0 },
  shortageQty: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true, uppercase: true },
  manufacturerInvoiceNo: { type: String, trim: true, default: '' },
  manufacturerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Manufacturer', 
    required: true 
  },
  orderDate: { type: Date, default: Date.now },
  expectedDate: { type: Date },
  receivedDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled'], 
    default: 'Ordered' 
  },
  items: [purchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  taxTotal: { type: Number, required: true, default: 0 },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Partially Paid', 'Paid'], 
    default: 'Unpaid' 
  },
  verificationNotes: { type: String, default: '' },
  receivedBy: { type: String, default: 'Warehouse Manager' },
  invoiceAttachment: { type: String, default: '' }
}, {
  timestamps: true
});

purchaseSchema.index({ poNumber: 1, manufacturerId: 1, status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
