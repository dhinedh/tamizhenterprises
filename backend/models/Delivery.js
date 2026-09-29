const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryNumber: { type: String, required: true, unique: true, uppercase: true },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice', 
    default: null 
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  vehicleNumber: { type: String, required: true, uppercase: true }, // e.g. TN 09 AB 1234
  vehicleType: { type: String, default: 'Tata Ace / Light Truck' },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  dispatchDate: { type: Date, default: Date.now },
  estimatedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Assigned', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'], 
    default: 'Assigned' 
  },
  deliveryNotes: { type: String, default: '' },
  receivedByName: { type: String, default: '' },
  proofOfDeliveryUrl: { type: String, default: '' } // uploaded image or signature
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
