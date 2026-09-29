const mongoose = require('mongoose');

const salesmanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  name: { type: String, required: true, trim: true },
  employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  territory: { type: String, required: true, trim: true }, // e.g. Chennai Central, Madurai North
  assignedStoresCount: { type: Number, default: 0 },
  targetMonthly: { type: Number, default: 200000 },
  currentMonthAchievement: { type: Number, default: 0 },
  commissionPercent: { type: Number, default: 2.5 },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  joiningDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Salesman', salesmanSchema);
