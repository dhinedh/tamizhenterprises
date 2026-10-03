const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  storeType: { 
    type: String, 
    default: 'Supermarket' 
  },
  category: { type: String, trim: true, default: '' }, // e.g. MEDICALS, SUPER MARKETS, etc.
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    default: null
  },
  manufacturerCode: { type: String, uppercase: true, trim: true, default: '' },
  femi9RetailerId: { type: String, uppercase: true, trim: true, default: '' },
  ownerName: { type: String, default: '', trim: true },
  phone: { type: String, required: true, trim: true },
  landline: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, default: '', trim: true },
  area: { type: String, trim: true, default: '' },
  city: { type: String, default: 'Chennai', trim: true },
  district: { type: String, default: 'Chennai', trim: true },
  state: { type: String, default: 'Tamil Nadu', trim: true },
  pincode: { type: String, trim: true, default: '' },
  gstNumber: { type: String, uppercase: true, trim: true, default: '' },
  salesmanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salesman', 
    default: null 
  },
  creditLimit: { type: Number, default: 50000, min: 0 },
  outstandingBalance: { type: Number, default: 0 }, // store owes Tamil Enterprises
  creditPeriodDays: { type: Number, default: 15 },
  status: { type: String, enum: ['Active', 'Suspended', 'Inactive'], default: 'Active' },
  totalOrdersCount: { type: Number, default: 0 },
  totalOrderValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

storeSchema.index({ code: 1, name: 1, city: 1, salesmanId: 1, manufacturerId: 1, manufacturerCode: 1 });

module.exports = mongoose.model('Store', storeSchema);

