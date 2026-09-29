const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true, 
    unique: true 
  },
  warehouseLocation: { type: String, default: 'Warehouse Main - Bay A' },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },   // Locked for pending dispatched orders
  damagedStock: { type: Number, default: 0, min: 0 },    // Returned or received broken
  minStockAlert: { type: Number, default: 20 },
  maxStockLevel: { type: Number, default: 500 },
  batchNumber: { type: String, default: 'BATCH-2026' },
  expiryDate: { type: Date },
  lastStockInwardDate: { type: Date },
  lastStockOutwardDate: { type: Date }
}, {
  timestamps: true
});

stockSchema.virtual('availableStock').get(function() {
  return Math.max(0, this.currentStock - this.reservedStock);
});

stockSchema.set('toJSON', { virtuals: true });
stockSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stock', stockSchema);
