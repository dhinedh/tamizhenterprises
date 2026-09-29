const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  storeType: { 
    type: String, 
    enum: ['Supermarket', 'Kirana', 'Departmental', 'Wholesaler', 'Pharmacy/FMCG'], 
    default: 'Supermarket' 
  },
  ownerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, required: true, trim: true },
  area: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, default: 'Tamil Nadu', trim: true },
  pincode: { type: String, trim: true },
  gstNumber: { type: String, uppercase: true, trim: true },
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

storeSchema.index({ code: 1, name: 1, city: 1, salesmanId: 1 });

module.exports = mongoose.model('Store', storeSchema);
