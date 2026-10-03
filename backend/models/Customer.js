const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  countryCode: { type: String, default: '+91', trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  gstNumber: { type: String, uppercase: true, trim: true, default: '' },
  address: { type: String, default: '', trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

customerSchema.index({ name: 1, phone: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);
