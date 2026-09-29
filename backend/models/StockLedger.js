const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: [
      'INWARD_PURCHASE', 
      'OUTWARD_SALE', 
      'RETURN_INWARD', 
      'RETURN_OUTWARD_DAMAGE', 
      'STOCK_ADJUSTMENT', 
      'STOCK_RESERVATION',
      'STOCK_RELEASE'
    ], 
    required: true 
  },
  referenceType: { 
    type: String, 
    enum: ['Purchase', 'Order', 'Invoice', 'Return', 'Manual_Adjustment'] 
  },
  referenceId: { type: String, default: '' },
  quantity: { type: Number, required: true }, // positive for additions, negative for deductions
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  billNumber: { type: String, default: '' },
  batchNumber: { type: String, default: '' },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  notes: { type: String, default: '' },
  performedBy: { type: String, default: 'System' },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

stockLedgerSchema.index({ productId: 1, date: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
