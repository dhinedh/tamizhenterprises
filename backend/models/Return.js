const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ['Damaged', 'Expired', 'Wrong Item', 'Excess Stock', 'Defective Packaging'], 
    required: true 
  },
  condition: { 
    type: String, 
    enum: ['Resellable', 'Damaged/Scrap', 'Return to Manufacturer'], 
    default: 'Damaged/Scrap' 
  },
  totalAmount: { type: Number, required: true }
});

const returnSchema = new mongoose.Schema({
  returnNumber: { type: String, required: true, unique: true, uppercase: true },
  returnType: { 
    type: String, 
    enum: ['Store_Return', 'Manufacturer_Return'], 
    required: true 
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    default: null 
  },
  manufacturerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Manufacturer', 
    default: null 
  },
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice', 
    default: null 
  },
  purchaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Purchase', 
    default: null 
  },
  items: [returnItemSchema],
  totalAmount: { type: Number, required: true },
  creditNoteNumber: { type: String, uppercase: true, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Processed'], 
    default: 'Pending' 
  },
  approvalDate: { type: Date },
  approvedBy: { type: String, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);
