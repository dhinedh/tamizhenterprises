const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  manufacturerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Manufacturer', 
    required: true 
  },
  sku: { type: String, sparse: true, uppercase: true, trim: true },
  barcode: { type: String, trim: true },
  hsnCode: { type: String, default: '190590', trim: true },
  unit: { 
    type: String, 
    enum: ['Box', 'Pcs', 'Carton', 'Pack', 'Kg', 'Litre', 'Dozen', 'Bottle', 'Pouch', 'Jar'], 
    default: 'Pcs' 
  },
  unitQuantityPerPack: { type: Number, default: 1 },
  mrp: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 }, // From Manufacturer
  dealerPrice: { type: Number, default: 0, min: 0 },   // Base price for stores
  sellingPrice: { type: Number, default: 0, min: 0 },  // Standard wholesale selling price
  gstRate: { type: Number, required: true, default: 18 },  // 0, 5, 12, 18, 28%
  minStockAlert: { type: Number, default: 20 },
  maxStockLevel: { type: Number, default: 500 },
  images: [{ type: String }],
  description: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Discontinued', 'Out of Stock'], default: 'Active' },
  // Multi-tier store pricing overrides
  customStorePrices: [{
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    specialPrice: { type: Number }
  }]
}, {
  timestamps: true
});

productSchema.index({ sku: 1, barcode: 1, name: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
