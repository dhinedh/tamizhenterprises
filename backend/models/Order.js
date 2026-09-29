const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  sku: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  freeQuantity: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, uppercase: true },
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
  orderDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paymentType: { 
    type: String, 
    enum: ['Credit', 'Cash', 'UPI', 'Cheque'], 
    default: 'Credit' 
  },
  deliveryNotes: { type: String, default: '' },
  approvedBy: { type: String, default: '' },
  approvalDate: { type: Date },
  deliveryDate: { type: Date },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null }
}, {
  timestamps: true
});

orderSchema.index({ orderNumber: 1, storeId: 1, salesmanId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
