const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true, uppercase: true },
  paymentType: { 
    type: String, 
    enum: ['Store_Collection', 'Manufacturer_Payment'], 
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
  salesmanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salesman', 
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
  amount: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, default: Date.now },
  paymentMode: { 
    type: String, 
    enum: ['Cash', 'Cheque', 'NEFT/RTGS', 'UPI'], 
    required: true 
  },
  referenceNumber: { type: String, trim: true, default: '' }, // Cheque / UTR / Transaction ID
  chequeDate: { type: Date },
  bankName: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Completed', 'Pending Clearance', 'Bounced'], 
    default: 'Completed' 
  },
  notes: { type: String, default: '' },
  recordedBy: { type: String, default: 'Admin' }
}, {
  timestamps: true
});

paymentSchema.index({ paymentType: 1, storeId: 1, manufacturerId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
