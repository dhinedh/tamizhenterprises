const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  contactPerson: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, default: 'Tamil Nadu', trim: true },
  pincode: { type: String, trim: true },
  gstNumber: { type: String, uppercase: true, trim: true },
  panNumber: { type: String, uppercase: true, trim: true },
  creditPeriodDays: { type: Number, default: 30 },
  paymentTerms: { type: String, default: '30 Days Net' },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branch: { type: String, default: '' }
  },
  openingBalance: { type: Number, default: 0 },
  currentOutstanding: { type: Number, default: 0 }, // what Tamil Enterprises owes manufacturer
  totalPurchased: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  categories: [{ type: String }],
  productsCount: { type: Number, default: 0 },
  totalPhysicalStock: { type: Number, default: 0 },
  stockValuation: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
