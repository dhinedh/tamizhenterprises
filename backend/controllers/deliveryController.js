const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// @desc    Get all deliveries
// @route   GET /api/deliveries
const getDeliveries = async (req, res) => {
  try {
    const { status, vehicleNumber, driverName } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vehicleNumber) filter.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
    if (driverName) filter.driverName = { $regex: driverName, $options: 'i' };

    const deliveries = await Delivery.find(filter)
      .populate('orderId', 'orderNumber orderDate grandTotal')
      .populate('invoiceId', 'invoiceNumber grandTotal eWayBillNo')
      .populate('storeId', 'name code city phone address')
      .sort({ dispatchDate: -1 });

    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create / Assign Delivery
// @route   POST /api/deliveries
const createDelivery = async (req, res) => {
  try {
    const { orderId, invoiceId, storeId, vehicleNumber, driverName, driverPhone, vehicleType, deliveryNotes, estimatedDeliveryDate } = req.body;

    if (!orderId || !vehicleNumber || !driverName || !driverPhone) {
      return res.status(400).json({ success: false, message: 'Order ID, Vehicle Number, Driver Name, and Phone are required' });
    }

    const count = await Delivery.countDocuments();
    const deliveryNumber = `DEL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const delivery = await Delivery.create({
      deliveryNumber,
      orderId,
      invoiceId: invoiceId || null,
      storeId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      driverName,
      driverPhone,
      vehicleType: vehicleType || 'Tata Ace / Light Truck',
      dispatchDate: new Date(),
      estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'In Transit',
      deliveryNotes: deliveryNotes || ''
    });

    // Update order status to Dispatched
    await Order.findByIdAndUpdate(orderId, {
      status: 'Dispatched',
      deliveryId: delivery._id
    });

    const populated = await Delivery.findById(delivery._id)
      .populate('orderId')
      .populate('storeId');

    res.status(201).json({ success: true, message: 'Delivery assigned and vehicle dispatched', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Delivery status / Mark Delivered
// @route   PUT /api/deliveries/:id/status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, receivedByName, proofOfDeliveryUrl, deliveryNotes } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (status) delivery.status = status;
    if (deliveryNotes) delivery.deliveryNotes = deliveryNotes;

    if (status === 'Delivered') {
      delivery.actualDeliveryDate = new Date();
      delivery.receivedByName = receivedByName || 'Store Receiving Manager';
      if (proofOfDeliveryUrl) delivery.proofOfDeliveryUrl = proofOfDeliveryUrl;

      // Update Order to Delivered
      if (delivery.orderId) {
        await Order.findByIdAndUpdate(delivery.orderId, { status: 'Delivered' });
      }
    }

    await delivery.save();
    res.json({ success: true, message: 'Delivery status updated', data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus
};
