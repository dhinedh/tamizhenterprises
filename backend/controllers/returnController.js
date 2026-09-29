const Return = require('../models/Return');
const Store = require('../models/Store');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Manufacturer = require('../models/Manufacturer');

// @desc    Get all returns
// @route   GET /api/returns
const getReturns = async (req, res) => {
  try {
    const { returnType, status, storeId } = req.query;
    const filter = {};
    if (returnType) filter.returnType = returnType;
    if (status) filter.status = status;
    if (storeId) filter.storeId = storeId;

    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }

    const returns = await Return.find(filter)
      .populate('storeId', 'name code city phone')
      .populate('manufacturerId', 'name code')
      .populate('invoiceId', 'invoiceNumber')
      .populate('items.productId', 'name sku brand')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new return request
// @route   POST /api/returns
const createReturn = async (req, res) => {
  try {
    const { returnType, storeId, manufacturerId, invoiceId, purchaseId, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide items to return' });
    }

    const count = await Return.countDocuments();
    const returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const creditNoteNumber = `CN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        productName: item.productName || 'Item',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        reason: item.reason || 'Damaged',
        condition: item.condition || 'Damaged/Scrap',
        totalAmount: lineTotal
      };
    });

    const returnDoc = await Return.create({
      returnNumber,
      returnType: returnType || 'Store_Return',
      storeId: storeId || null,
      manufacturerId: manufacturerId || null,
      invoiceId: invoiceId || null,
      purchaseId: purchaseId || null,
      items: formattedItems,
      totalAmount,
      creditNoteNumber,
      status: 'Pending',
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Return request submitted', data: returnDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve and Process Return (adjusts inventory and balances)
// @route   POST /api/returns/:id/approve
const approveReturn = async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnDoc.status === 'Approved' || returnDoc.status === 'Processed') {
      return res.status(400).json({ success: false, message: 'Return has already been processed' });
    }

    // Process Stock and Financial balance
    if (returnDoc.returnType === 'Store_Return') {
      // 1. Credit Note to Store: reduces store outstanding balance
      if (returnDoc.storeId) {
        const store = await Store.findById(returnDoc.storeId);
        if (store) {
          store.outstandingBalance = Math.max(0, store.outstandingBalance - returnDoc.totalAmount);
          await store.save();
        }
      }

      // 2. Stock updates based on condition
      for (const item of returnDoc.items) {
        let stock = await Stock.findOne({ productId: item.productId });
        if (stock) {
          const balanceBefore = stock.currentStock;
          if (item.condition === 'Resellable') {
            stock.currentStock += item.quantity;
            await StockLedger.create({
              productId: item.productId,
              transactionType: 'RETURN_INWARD',
              referenceType: 'Return',
              referenceId: returnDoc.creditNoteNumber,
              quantity: item.quantity,
              balanceBefore,
              balanceAfter: stock.currentStock,
              notes: `Resellable return from store, Credit Note ${returnDoc.creditNoteNumber}`,
              performedBy: req.user ? req.user.name : 'System'
            });
          } else {
            stock.damagedStock += item.quantity;
            await StockLedger.create({
              productId: item.productId,
              transactionType: 'RETURN_OUTWARD_DAMAGE',
              referenceType: 'Return',
              referenceId: returnDoc.creditNoteNumber,
              quantity: item.quantity,
              balanceBefore,
              balanceAfter: stock.currentStock,
              notes: `Damaged return placed in quarantine: ${item.reason}`,
              performedBy: req.user ? req.user.name : 'System'
            });
          }
          await stock.save();
        }
      }
    } else if (returnDoc.returnType === 'Manufacturer_Return') {
      // Return damaged stock back to manufacturer, reduce our payable to manufacturer
      if (returnDoc.manufacturerId) {
        const manufacturer = await Manufacturer.findById(returnDoc.manufacturerId);
        if (manufacturer) {
          manufacturer.currentOutstanding = Math.max(0, manufacturer.currentOutstanding - returnDoc.totalAmount);
          await manufacturer.save();
        }
      }

      for (const item of returnDoc.items) {
        let stock = await Stock.findOne({ productId: item.productId });
        if (stock) {
          stock.damagedStock = Math.max(0, stock.damagedStock - item.quantity);
          await stock.save();
        }
      }
    }

    returnDoc.status = 'Approved';
    returnDoc.approvalDate = new Date();
    returnDoc.approvedBy = req.user ? req.user.name : 'Owner';
    await returnDoc.save();

    res.json({ success: true, message: 'Return approved, Credit Note issued and balances updated', data: returnDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReturns,
  createReturn,
  approveReturn
};
