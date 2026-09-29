const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  name: { type: String, required: true },
  hsnCode: { type: String, required: true },
  quantity: { type: Number, required: true },
  freeQuantity: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  salesmanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salesman', 
    default: null 
  },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  items: [invoiceItemSchema],
  taxableSubtotal: { type: Number, required: true, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Cancelled'], 
    default: 'Unpaid' 
  },
  saleType: { type: String, enum: ['Credit', 'Cash'], default: 'Credit' },
  eWayBillNo: { type: String, default: '' },
  deliveryChallanNo: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

invoiceSchema.index({ invoiceNumber: 1, storeId: 1, status: 1, invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
