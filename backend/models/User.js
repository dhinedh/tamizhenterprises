const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Owner', 'Salesman', 'Store'], 
    default: 'Owner' 
  },
  phone: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesman', default: null },
  avatar: { type: String, default: '' },
  lastLogin: { type: Date },

  // Company & Business Profile Details
  gstin: { type: String, default: '', trim: true },
  companyName: { type: String, default: '', trim: true },
  logo: { type: String, default: '' },
  addressLine1: { type: String, default: '', trim: true },
  addressLine2: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  state: { type: String, default: '', trim: true },
  pincode: { type: String, default: '', trim: true },
  deliveryAddress: { type: String, default: '', trim: true },

  // Bank Details
  bankDetails: {
    accountName: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    bankName: { type: String, default: '', trim: true },
    branchName: { type: String, default: '', trim: true },
    ifscCode: { type: String, default: '', trim: true },
    upiNumber: { type: String, default: '', trim: true }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
