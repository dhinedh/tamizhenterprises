const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Manufacturer = require('../models/Manufacturer');

// @desc    Get all purchases
// @route   GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const { status, manufacturerId, paymentStatus, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (manufacturerId) filter.manufacturerId = manufacturerId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      filter.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { manufacturerInvoiceNo: { $regex: search, $options: 'i' } }
      ];
    }

    const purchases = await Purchase.find(filter)
      .populate('manufacturerId', 'name code phone gstNumber')
      .populate('items.productId', 'name sku brand')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single purchase by ID
// @route   GET /api/purchases/:id
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('manufacturerId')
      .populate('items.productId');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Purchase Order
// @route   POST /api/purchases
const createPurchase = async (req, res) => {
  try {
    const { manufacturerId, items, expectedDate, notes, manufacturerInvoiceNo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please include at least one item' });
    }

    // Generate PO Number
    const count = await Purchase.countDocuments();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;

    const formattedItems = items.map(item => {
      const lineSubtotal = Number(item.orderedQty) * Number(item.unitPrice);
      const lineTax = (lineSubtotal * (Number(item.gstRate || 18))) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        productId: item.productId,
        orderedQty: Number(item.orderedQty),
        receivedQty: 0,
        damagedQty: 0,
        shortageQty: 0,
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate || 18),
        taxAmount: lineTax,
        totalAmount: lineTotal
      };
    });

    const grandTotal = subtotal + taxTotal;

    const purchase = await Purchase.create({
      poNumber,
      manufacturerId,
      manufacturerInvoiceNo: manufacturerInvoiceNo || '',
      expectedDate,
      items: formattedItems,
      subtotal,
      taxTotal,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      status: 'Ordered',
      verificationNotes: notes || ''
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Receive goods & inspect damage/shortage (Inwarding)
// @route   POST /api/purchases/:id/receive
const receiveGoods = async (req, res) => {
  try {
    const { items, manufacturerInvoiceNo, verificationNotes, receivedBy } = req.body;
    const purchase = await Purchase.findById(req.params.id).populate('items.productId');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (purchase.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Goods for this purchase order have already been received' });
    }

    // Process item by item
    for (let i = 0; i < items.length; i++) {
      const incoming = items[i];
      const purchaseItem = purchase.items.find(pi => pi.productId._id.toString() === incoming.productId.toString());

      if (purchaseItem) {
        const receivedQty = Number(incoming.receivedQty || 0);
        const damagedQty = Number(incoming.damagedQty || 0);
        const usableQty = Math.max(0, receivedQty - damagedQty);
        const shortageQty = Math.max(0, purchaseItem.orderedQty - receivedQty);

        purchaseItem.receivedQty = receivedQty;
        purchaseItem.damagedQty = damagedQty;
        purchaseItem.shortageQty = shortageQty;

        // Update Stock
        let stock = await Stock.findOne({ productId: incoming.productId });
        if (!stock) {
          stock = await Stock.create({
            productId: incoming.productId,
            currentStock: 0,
            reservedStock: 0,
            damagedStock: 0
          });
        }

        const balanceBefore = stock.currentStock;
        stock.currentStock += usableQty;
        stock.damagedStock += damagedQty;
        stock.lastStockInwardDate = new Date();
        await stock.save();

        // Write to Stock Ledger for usable inward stock
        if (usableQty > 0) {
          await StockLedger.create({
            productId: incoming.productId,
            transactionType: 'INWARD_PURCHASE',
            referenceType: 'Purchase',
            referenceId: purchase.poNumber,
            quantity: usableQty,
            balanceBefore: balanceBefore,
            balanceAfter: stock.currentStock,
            notes: `Inward from PO ${purchase.poNumber} (${usableQty} usable units received)`,
            performedBy: receivedBy || 'Warehouse Manager'
          });
        }

        // Write to Stock Ledger if damaged stock was received
        if (damagedQty > 0) {
          await StockLedger.create({
            productId: incoming.productId,
            transactionType: 'RETURN_OUTWARD_DAMAGE',
            referenceType: 'Purchase',
            referenceId: purchase.poNumber,
            quantity: damagedQty,
            balanceBefore: stock.currentStock,
            balanceAfter: stock.currentStock,
            notes: `Damaged stock inwarded from PO ${purchase.poNumber} (${damagedQty} damaged units to claim back)`,
            performedBy: receivedBy || 'Warehouse Manager'
          });
        }
      }
    }

    purchase.status = 'Received';
    purchase.receivedDate = new Date();
    if (manufacturerInvoiceNo) purchase.manufacturerInvoiceNo = manufacturerInvoiceNo;
    if (verificationNotes) purchase.verificationNotes = verificationNotes;
    if (receivedBy) purchase.receivedBy = receivedBy;

    await purchase.save();

    // Update Manufacturer outstanding balance
    const manufacturer = await Manufacturer.findById(purchase.manufacturerId);
    if (manufacturer) {
      manufacturer.currentOutstanding += purchase.grandTotal;
      manufacturer.totalPurchased += purchase.grandTotal;
      await manufacturer.save();
    }

    res.json({ success: true, message: 'Goods received, inspected and stock updated successfully', data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update purchase order status
// @route   PUT /api/purchases/:id
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receiveGoods,
  updatePurchase
};
