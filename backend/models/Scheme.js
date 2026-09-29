const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['BUY_X_GET_Y', 'SLAB_DISCOUNT', 'FLAT_PERCENT', 'CASH_DISCOUNT'], 
    required: true 
  },
  applicableProducts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  applicableCategories: [{ type: String }],
  minQuantity: { type: Number, default: 1 },
  freeQuantity: { type: Number, default: 0 }, // For BUY_X_GET_Y
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' },
  usageCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Scheme', schemeSchema);
