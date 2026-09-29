const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Store = require('../models/Store');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// @desc    Get all invoices
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, storeId, search, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (storeId) filter.storeId = storeId;

    if (req.user && req.user.role === 'Store' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }
    if (req.user && req.user.role === 'Salesman' && req.user.salesmanId) {
      filter.salesmanId = req.user.salesmanId;
    }

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { eWayBillNo: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('storeId', 'name code phone city gstNumber')
      .populate('orderId', 'orderNumber orderDate')
      .sort({ invoiceDate: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('storeId')
      .populate('orderId')
      .populate('salesmanId')
      .populate('items.productId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate GST Invoice from Order
// @route   POST /api/invoices/generate-from-order/:orderId
const generateInvoiceFromOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('storeId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.invoiceId) {
      const existing = await Invoice.findById(order.invoiceId);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Invoice already generated for this order', data: existing });
      }
    }

    const store = order.storeId;
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let taxableSubtotal = 0;
    let totalDiscount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let grandTotal = 0;

    const isInterstate = store && store.state && store.state.toLowerCase() !== 'tamil nadu';

    const invoiceItems = [];

    // Deduct stock, release reserved stock, and log to stock ledger
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      const totalQty = item.quantity + (item.freeQuantity || 0);

      const stock = await Stock.findOne({ productId: item.productId });
      if (!stock || stock.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient physical stock for ${item.productName}. Current: ${stock ? stock.currentStock : 0}, Ordered: ${item.quantity}`
        });
      }

      // Deduct stock
      const balanceBefore = stock.currentStock;
      stock.currentStock -= item.quantity;
      if (order.status === 'Approved') {
        stock.reservedStock = Math.max(0, stock.reservedStock - totalQty);
      }
      stock.lastStockOutwardDate = new Date();
      await stock.save();

      // Log Stock Ledger
      await StockLedger.create({
        productId: item.productId,
        transactionType: 'OUTWARD_SALE',
        referenceType: 'Invoice',
        referenceId: invoiceNumber,
        quantity: -item.quantity,
        balanceBefore,
        balanceAfter: stock.currentStock,
        notes: `Sold via Invoice ${invoiceNumber} to ${store.name}`,
        performedBy: req.user ? req.user.name : 'Billing System'
      });

      const itemGross = item.quantity * item.unitPrice;
      const discount = item.discountAmount || 0;
      const taxable = itemGross - discount;
      const gstRate = item.gstRate || 18;
      const taxAmount = (taxable * gstRate) / 100;
      const itemTotal = taxable + taxAmount;

      let cgst = 0, sgst = 0, igst = 0;
      if (isInterstate) {
        igst = taxAmount;
        igstTotal += igst;
      } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
        cgstTotal += cgst;
        sgstTotal += sgst;
      }

      taxableSubtotal += taxable;
      totalDiscount += discount;
      grandTotal += itemTotal;

      invoiceItems.push({
        productId: item.productId,
        name: item.productName,
        hsnCode: product ? product.hsnCode : '2106',
        quantity: item.quantity,
        freeQuantity: item.freeQuantity || 0,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount: discount,
        taxableValue: taxable,
        gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        taxAmount,
        total: itemTotal
      });
    }

    const taxTotal = cgstTotal + sgstTotal + igstTotal;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (store.creditPeriodDays || 15));

    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      storeId: store._id,
      salesmanId: order.salesmanId,
      invoiceDate: new Date(),
      dueDate,
      items: invoiceItems,
      taxableSubtotal,
      totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      status: 'Unpaid',
      saleType: order.paymentType === 'Cash' ? 'Cash' : 'Credit',
      eWayBillNo: grandTotal > 50000 ? `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}` : '',
      deliveryChallanNo: `DC-${invoiceNumber}`
    });

    // Update Order
    order.status = 'Processing';
    order.invoiceId = invoice._id;
    await order.save();

    // Update Store financial stats & outstanding
    store.outstandingBalance += grandTotal;
    store.totalOrdersCount = (store.totalOrdersCount || 0) + 1;
    store.totalOrderValue = (store.totalOrderValue || 0) + grandTotal;
    store.lastOrderDate = new Date();
    await store.save();

    res.status(201).json({ success: true, message: 'GST Invoice generated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download / Stream PDF Invoice
// @route   GET /api/invoices/:id/pdf
const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const store = await Store.findById(invoice.storeId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

    generateInvoicePDF(invoice, store, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  generateInvoiceFromOrder,
  downloadInvoicePDF
};
