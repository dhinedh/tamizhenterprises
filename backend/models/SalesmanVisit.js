const mongoose = require('mongoose');

const salesmanVisitSchema = new mongoose.Schema({
  salesmanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salesman', 
    required: true 
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  visitDate: { type: Date, default: Date.now },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date },
  status: { type: String, enum: ['In Progress', 'Completed', 'Cancelled'], default: 'Completed' },
  purpose: { 
    type: String, 
    enum: ['Order Booking', 'Payment Collection', 'Stock Audit', 'New Store Intro', 'Relationship Meeting'], 
    default: 'Order Booking' 
  },
  notes: { type: String, default: '' },
  orderCreatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  orderValue: { type: Number, default: 0 },
  paymentCollectedAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'UPI', 'None'], default: 'None' },
  locationLat: { type: Number, default: 13.0827 },
  locationLng: { type: Number, default: 80.2707 }
}, {
  timestamps: true
});

salesmanVisitSchema.index({ salesmanId: 1, storeId: 1, visitDate: -1 });

module.exports = mongoose.model('SalesmanVisit', salesmanVisitSchema);
