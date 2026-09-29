const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

// @desc    Get complete dashboard overview KPIs & charts data
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 1. Sales metrics
    const todayInvoices = await Invoice.find({ invoiceDate: { $gte: todayStart } });
    const todaySales = todayInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);

    const monthInvoices = await Invoice.find({ invoiceDate: { $gte: monthStart } });
    const monthlySales = monthInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);

    // 2. Purchase metrics
    const monthPurchases = await Purchase.find({ orderDate: { $gte: monthStart } });
    const monthlyPurchasesTotal = monthPurchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);

    // 3. Stock valuation
    const stocks = await Stock.find().populate('productId');
    let totalStockValuePurchase = 0;
    let totalStockValueSelling = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockAlerts = [];

    stocks.forEach(stock => {
      if (stock.productId) {
        const available = Math.max(0, stock.currentStock - stock.reservedStock);
        totalStockValuePurchase += (stock.currentStock * (stock.productId.purchasePrice || 0));
        totalStockValueSelling += (stock.currentStock * (stock.productId.sellingPrice || 0));

        if (available <= (stock.minStockAlert || 20) && available > 0) {
          lowStockCount++;
          if (lowStockAlerts.length < 6) {
            lowStockAlerts.push({
              productId: stock.productId._id,
              name: stock.productId.name,
              sku: stock.productId.sku,
              brand: stock.productId.brand,
              availableStock: available,
              minAlert: stock.minStockAlert || 20,
              unit: stock.productId.unit
            });
          }
        } else if (available === 0) {
          outOfStockCount++;
        }
      }
    });

    // 4. Stores & Receivables
    const activeStoresCount = await Store.countDocuments({ status: 'Active' });
    const stores = await Store.find().select('outstandingBalance creditLimit name code city totalOrderValue');
    const totalOutstandingReceivables = stores.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);

    // 5. Collections
    const todayCollectionsDocs = await Payment.find({
      paymentType: 'Store_Collection',
      paymentDate: { $gte: todayStart }
    });
    const todayCollections = todayCollectionsDocs.reduce((acc, p) => acc + p.amount, 0);

    const monthCollectionsDocs = await Payment.find({
      paymentType: 'Store_Collection',
      paymentDate: { $gte: monthStart }
    });
    const monthCollections = monthCollectionsDocs.reduce((acc, p) => acc + p.amount, 0);

    // 6. Orders
    const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });
    const pendingOrders = await Order.find({ status: 'Pending' })
      .populate('storeId', 'name city')
      .sort({ orderDate: -1 })
      .limit(5);

    // 7. Estimated Profit & Margin
    let totalCogs = 0;
    for (const inv of monthInvoices) {
      for (const item of inv.items) {
        const prod = await Product.findById(item.productId).select('purchasePrice');
        if (prod) {
          totalCogs += (item.quantity * prod.purchasePrice);
        }
      }
    }
    const estimatedGrossProfit = Math.max(0, monthlySales - totalCogs);
    const profitMarginPercent = monthlySales > 0 ? ((estimatedGrossProfit / monthlySales) * 100).toFixed(1) : 0;

    // 8. Top 5 Products by Sales
    const productSalesMap = {};
    monthInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += item.quantity;
        productSalesMap[key].revenue += item.total;
      });
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 9. Top 5 Stores by Revenue
    const topStores = await Store.find()
      .select('name code city totalOrderValue outstandingBalance')
      .sort({ totalOrderValue: -1 })
      .limit(5);

    // 10. Last 6 Months Sales vs Purchase Trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const mInvs = await Invoice.find({ invoiceDate: { $gte: mStart, $lte: mEnd } });
      const mPurch = await Purchase.find({ orderDate: { $gte: mStart, $lte: mEnd } });

      const mSales = mInvs.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
      const mBuy = mPurch.reduce((acc, p) => acc + (p.grandTotal || 0), 0);

      const monthName = mStart.toLocaleString('default', { month: 'short' });
      monthlyTrend.push({
        month: monthName,
        sales: mSales,
        purchases: mBuy,
        profit: Math.max(0, mSales - mBuy * 0.82)
      });
    }

    // 11. Category Breakdown
    const categoriesMap = {};
    const allProducts = await Product.find().select('category');
    allProducts.forEach(p => {
      categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
    });
    const categoryDistribution = Object.keys(categoriesMap).map(cat => ({
      name: cat,
      count: categoriesMap[cat]
    }));

    // 12. Manufacturer-by-Manufacturer Cards with detailed drilldowns
    const manufacturers = await Manufacturer.find({ status: 'Active' });
    const allPurchases = await Purchase.find().populate('items.productId');
    const allInvoices = await Invoice.find();

    const manufacturerCards = await Promise.all(
      manufacturers.map(async (mfg) => {
        const mfgProducts = await Product.find({ manufacturerId: mfg._id });
        const mfgProductIds = mfgProducts.map(p => p._id.toString());

        // Stock for this manufacturer's products
        const mfgStocks = await Stock.find({ productId: { $in: mfgProductIds } }).populate('productId');
        let totalPhysicalStock = 0;
        let totalAvailableStock = 0;
        let stockValuation = 0;
        let lowStockCount = 0;

        const stockMap = {};
        mfgStocks.forEach(s => {
          if (s.productId) {
            const avail = Math.max(0, s.currentStock - s.reservedStock);
            totalPhysicalStock += s.currentStock;
            totalAvailableStock += avail;
            stockValuation += (s.currentStock * (s.productId.purchasePrice || 0));
            if (avail <= (s.minStockAlert || 20)) {
              lowStockCount++;
            }
            stockMap[s.productId._id.toString()] = {
              currentStock: s.currentStock,
              reservedStock: s.reservedStock,
              damagedStock: s.damagedStock,
              availableStock: avail,
              minStockAlert: s.minStockAlert,
              warehouseLocation: s.warehouseLocation
            };
          }
        });

        // Products with attached stock info
        const productsWithStock = mfgProducts.map(p => {
          const s = stockMap[p._id.toString()] || {
            currentStock: 0,
            availableStock: 0,
            reservedStock: 0,
            damagedStock: 0
          };
          return {
            _id: p._id,
            manufacturerId: p.manufacturerId || mfg._id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            sku: p.sku,
            hsnCode: p.hsnCode,
            unit: p.unit,
            purchasePrice: p.purchasePrice,
            dealerPrice: p.dealerPrice,
            sellingPrice: p.sellingPrice,
            mrp: p.mrp,
            gstRate: p.gstRate,
            stock: s
          };
        });

        // Purchases for this manufacturer
        const mfgPurchases = allPurchases.filter(p => p.manufacturerId?.toString() === mfg._id.toString());
        const totalPurchasedValue = mfgPurchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);

        // Sales for this manufacturer's items
        let mfgSalesRevenue = 0;
        let unitsSold = 0;
        allInvoices.forEach(inv => {
          inv.items.forEach(item => {
            if (mfgProductIds.includes(item.productId?.toString())) {
              mfgSalesRevenue += item.total;
              unitsSold += item.quantity;
            }
          });
        });

        return {
          _id: mfg._id,
          name: mfg.name,
          code: mfg.code,
          contactPerson: mfg.contactPerson,
          phone: mfg.phone,
          email: mfg.email,
          city: mfg.city,
          state: mfg.state,
          address: mfg.address,
          gstNumber: mfg.gstNumber,
          creditPeriodDays: mfg.creditPeriodDays,
          currentOutstanding: mfg.currentOutstanding,
          totalPurchased: totalPurchasedValue || mfg.totalPurchased || 0,
          salesRevenue: mfgSalesRevenue,
          unitsSold,
          productsCount: mfgProducts.length,
          totalPhysicalStock,
          totalAvailableStock,
          stockValuation,
          lowStockCount,
          categories: mfg.categories || [],
          bankDetails: mfg.bankDetails,
          products: productsWithStock,
          recentPurchases: mfgPurchases.slice(0, 5).map(p => ({
            _id: p._id,
            poNumber: p.poNumber,
            orderDate: p.orderDate,
            grandTotal: p.grandTotal,
            status: p.status,
            paymentStatus: p.paymentStatus
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        kpis: {
          todaySales,
          monthlySales,
          monthlyPurchases: monthlyPurchasesTotal,
          stockValuePurchase: totalStockValuePurchase,
          stockValueSelling: totalStockValueSelling,
          activeStoresCount,
          totalOutstandingReceivables,
          todayCollections,
          monthCollections,
          pendingOrdersCount,
          lowStockCount,
          outOfStockCount,
          estimatedGrossProfit,
          profitMarginPercent: Number(profitMarginPercent)
        },
        manufacturerCards,
        lowStockAlerts,
        topProducts,
        topStores,
        monthlyTrend,
        categoryDistribution,
        recentPendingOrders: pendingOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
