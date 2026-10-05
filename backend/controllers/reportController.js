const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Salesman = require('../models/Salesman');
const Payment = require('../models/Payment');

// @desc    Sales Report (aggregated by store, product, brand, or date)
// @route   GET /api/reports/sales
const getSalesReport = async (req, res) => {
  try {
    const { groupBy = 'store', startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter)
      .populate('storeId', 'name code city state')
      .populate('salesmanId', 'name employeeCode')
      .populate('items.productId', 'brand category');

    const result = {};

    invoices.forEach(inv => {
      let key = 'Other';
      if (groupBy === 'store') {
        key = inv.storeId ? `${inv.storeId.name} (${inv.storeId.city})` : 'Unknown Store';
      } else if (groupBy === 'salesman') {
        key = inv.salesmanId ? inv.salesmanId.name : 'Direct / Unassigned';
      }

      if (groupBy === 'product' || groupBy === 'brand') {
        inv.items.forEach(item => {
          const itemKey = groupBy === 'product' ? item.name : (item.productId?.brand || 'Generic');
          if (!result[itemKey]) {
            result[itemKey] = { name: itemKey, quantity: 0, revenue: 0, tax: 0, orderCount: 0 };
          }
          result[itemKey].quantity += item.quantity;
          result[itemKey].revenue += item.total;
          result[itemKey].tax += (item.taxAmount || 0);
          result[itemKey].orderCount += 1;
        });
      } else {
        if (!result[key]) {
          result[key] = { name: key, invoiceCount: 0, grandTotal: 0, taxTotal: 0, paidAmount: 0, balanceAmount: 0 };
        }
        result[key].invoiceCount += 1;
        result[key].grandTotal += inv.grandTotal;
        result[key].taxTotal += inv.taxTotal;
        result[key].paidAmount += inv.paidAmount;
        result[key].balanceAmount += inv.balanceAmount;
      }
    });

    const reportData = Object.values(result).sort((a, b) => (b.revenue || b.grandTotal) - (a.revenue || a.grandTotal));
    res.json({ success: true, count: reportData.length, groupBy, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Product Performance (Fast/Slow/Dead stock & Margin analysis)
// @route   GET /api/reports/product-performance
const getProductPerformance = async (req, res) => {
  try {
    const products = await Product.find().populate('manufacturerId', 'name code');
    const stocks = await Stock.find();
    const invoices = await Invoice.find({ invoiceDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }); // last 90 days

    const stockMap = {};
    stocks.forEach(s => {
      stockMap[s.productId.toString()] = s;
    });

    const salesVelocityMap = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const pId = item.productId?.toString();
        if (!salesVelocityMap[pId]) {
          salesVelocityMap[pId] = { soldQty: 0, revenue: 0 };
        }
        salesVelocityMap[pId].soldQty += item.quantity;
        salesVelocityMap[pId].revenue += item.total;
      });
    });

    const performanceList = products.map(prod => {
      const stock = stockMap[prod._id.toString()] || { currentStock: 0 };
      const sales = salesVelocityMap[prod._id.toString()] || { soldQty: 0, revenue: 0 };

      const marginUnit = prod.sellingPrice - prod.purchasePrice;
      const marginPercent = prod.sellingPrice > 0 ? ((marginUnit / prod.sellingPrice) * 100).toFixed(1) : 0;

      let movementType = 'Normal';
      if (sales.soldQty > 60) {
        movementType = 'Fast Moving';
      } else if (sales.soldQty > 10) {
        movementType = 'Medium Moving';
      } else if (sales.soldQty > 0) {
        movementType = 'Slow Moving';
      } else {
        movementType = 'Dead Stock (0 Sales 90d)';
      }

      return {
        _id: prod._id,
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        sku: prod.sku,
        manufacturer: prod.manufacturerId?.name || 'N/A',
        currentStock: stock.currentStock,
        soldQty90d: sales.soldQty,
        revenue90d: sales.revenue,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        marginPercent: Number(marginPercent),
        movementType
      };
    });

    res.json({ success: true, count: performanceList.length, data: performanceList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Store Performance (Order frequency, Growth, Average order value)
// @route   GET /api/reports/store-performance
const getStorePerformance = async (req, res) => {
  try {
    const stores = await Store.find().populate('salesmanId', 'name');
    const invoices = await Invoice.find();

    const storeInvoicesMap = {};
    invoices.forEach(inv => {
      const sId = inv.storeId.toString();
      if (!storeInvoicesMap[sId]) {
        storeInvoicesMap[sId] = [];
      }
      storeInvoicesMap[sId].push(inv);
    });

    const report = stores.map(store => {
      const storeInvs = storeInvoicesMap[store._id.toString()] || [];
      const totalRevenue = storeInvs.reduce((acc, i) => acc + i.grandTotal, 0);
      const invoiceCount = storeInvs.length;
      const averageOrderValue = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;

      return {
        storeId: store._id,
        name: store.name,
        code: store.code,
        city: store.city,
        salesman: store.salesmanId?.name || 'Unassigned',
        creditLimit: store.creditLimit,
        outstandingBalance: store.outstandingBalance,
        totalRevenue,
        orderCount: invoiceCount,
        averageOrderValue,
        lastOrderDate: store.lastOrderDate
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ success: true, count: report.length, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manufacturer & Brand Performance (Purchase vs Sales vs Margin)
// @route   GET /api/reports/manufacturer-performance
const getManufacturerPerformance = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find();
    const purchases = await Purchase.find();
    const products = await Product.find();
    const invoices = await Invoice.find();

    const prodToMfgMap = {};
    products.forEach(p => {
      prodToMfgMap[p._id.toString()] = p.manufacturerId?.toString();
    });

    const report = manufacturers.map(mfg => {
      const mId = mfg._id.toString();
      const mfgPurchases = purchases.filter(p => p.manufacturerId.toString() === mId);
      const totalPurchased = mfgPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

      let salesRevenue = 0;
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          if (prodToMfgMap[item.productId?.toString()] === mId) {
            salesRevenue += item.total;
          }
        });
      });

      const estimatedMargin = Math.max(0, salesRevenue - (totalPurchased * 0.85));
      const marginPercent = salesRevenue > 0 ? ((estimatedMargin / salesRevenue) * 100).toFixed(1) : 0;

      return {
        manufacturerId: mfg._id,
        name: mfg.name,
        code: mfg.code,
        currentOutstanding: mfg.currentOutstanding,
        totalPurchased,
        salesRevenue,
        estimatedMargin,
        marginPercent: Number(marginPercent)
      };
    });

    res.json({ success: true, count: report.length, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop Report — Sales & Payments (Aggregated by shop with invoices, billed, received, due, and date filters)
// @route   GET /api/reports/shop-sales
const getShopSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, status, search } = req.query;
    const invoiceFilter = {};

    if (startDate || endDate) {
      invoiceFilter.invoiceDate = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        invoiceFilter.invoiceDate.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        invoiceFilter.invoiceDate.$lte = e;
      }
    }

    if (status && status !== 'All') {
      invoiceFilter.status = status;
    }

    const stores = await Store.find().sort({ name: 1 });
    const invoices = await Invoice.find(invoiceFilter);

    // Group invoices by storeId
    const storeInvoicesMap = {};
    invoices.forEach(inv => {
      if (inv.storeId) {
        const sId = inv.storeId.toString();
        if (!storeInvoicesMap[sId]) storeInvoicesMap[sId] = [];
        storeInvoicesMap[sId].push(inv);
      }
    });

    const reportList = stores.map(store => {
      const storeInvs = storeInvoicesMap[store._id.toString()] || [];
      const invoiceCount = storeInvs.length;
      const billed = storeInvs.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
      const received = storeInvs.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0);
      const due = storeInvs.reduce((acc, i) => acc + (Number(i.balanceAmount) || 0), 0);

      let paymentStatus = 'Not Paid';
      if (billed > 0 && due <= 0) {
        paymentStatus = 'Paid';
      } else if (received > 0 && due > 0) {
        paymentStatus = 'Partial';
      } else if (billed === 0) {
        paymentStatus = 'Not Paid';
      }

      return {
        storeId: store._id,
        name: store.name,
        code: store.code || store.femi9RetailerId || `STORE-${store._id.toString().slice(-5).toUpperCase()}`,
        phone: store.phone,
        category: (store.category || store.storeType || 'SUPER MARKETS').toUpperCase(),
        invoicesCount: invoiceCount,
        billed,
        received,
        due,
        status: paymentStatus,
        invoices: storeInvs
      };
    });

    // Summary stats
    const totalShopsCount = stores.length;
    const shopsWithSales = reportList.filter(s => s.invoicesCount > 0).length;
    const totalInvoicesCount = invoices.length;
    const totalBilled = invoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
    const totalReceived = invoices.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0);
    const totalDue = invoices.reduce((acc, i) => acc + (Number(i.balanceAmount) || 0), 0);

    res.json({
      success: true,
      summary: {
        totalShopsCount,
        shopsWithSales,
        totalInvoicesCount,
        totalBilled,
        totalReceived,
        totalDue
      },
      data: reportList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSalesReport,
  getProductPerformance,
  getStorePerformance,
  getManufacturerPerformance,
  getShopSalesReport
};
