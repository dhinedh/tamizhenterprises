const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

// In-memory cache for dashboard KPIs to prevent repeated heavy aggregations on rapid navigation
let statsCache = null;
let statsCacheTime = 0;
const STATS_CACHE_TTL_MS = 25 * 1000; // 25 seconds cache TTL

const invalidateDashboardCache = () => {
  statsCache = null;
  statsCacheTime = 0;
};

// @desc    Get complete dashboard overview KPIs & charts data
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // Return cached aggregated stats instantly if within TTL (unless forced fresh)
    if (req.query.fresh !== 'true' && statsCache && (Date.now() - statsCacheTime < STATS_CACHE_TTL_MS)) {
      return res.json(statsCache);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Run all database calls in ONE parallel batch using .lean() and selecting only needed fields
    const [
      allInvoices,
      allPurchases,
      stocks,
      stores,
      payments,
      pendingOrders,
      products,
      manufacturers
    ] = await Promise.all([
      Invoice.find({ invoiceDate: { $gte: sixMonthsAgo } })
        .select('invoiceDate grandTotal items.productId items.name items.quantity items.total')
        .lean(),
      Purchase.find({ orderDate: { $gte: sixMonthsAgo } })
        .select('orderDate grandTotal manufacturerId poNumber status paymentStatus')
        .lean(),
      Stock.find()
        .select('productId warehouseLocation currentStock reservedStock damagedStock minStockAlert')
        .populate('productId', 'name sku brand purchasePrice sellingPrice unit minStockAlert')
        .lean(),
      Store.find()
        .select('outstandingBalance creditLimit name code city totalOrderValue status')
        .lean(),
      Payment.find({ paymentType: 'Store_Collection', paymentDate: { $gte: sixMonthsAgo } })
        .select('paymentDate amount')
        .lean(),
      Order.find({ status: 'Pending' })
        .select('orderNumber orderDate grandTotal status storeId')
        .populate('storeId', 'name city')
        .sort({ orderDate: -1 })
        .limit(5)
        .lean(),
      Product.find()
        .select('name sku brand category purchasePrice dealerPrice sellingPrice mrp gstRate unit manufacturerId minStockAlert hsnCode')
        .lean(),
      Manufacturer.find({ status: 'Active' })
        .lean()
    ]);

    // Fast product lookup map
    const productMap = {};
    const priceMap = {};
    products.forEach(p => {
      const id = p._id.toString();
      productMap[id] = p;
      priceMap[id] = p.purchasePrice || p.mrp || 0;
    });

    // 1. Sales metrics
    let todaySales = 0;
    let monthlySales = 0;
    const monthInvoices = [];

    allInvoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      if (invDate >= todayStart) {
        todaySales += (inv.grandTotal || 0);
      }
      if (invDate >= monthStart) {
        monthlySales += (inv.grandTotal || 0);
        monthInvoices.push(inv);
      }
    });

    // 2. Purchase metrics
    let monthlyPurchasesTotal = 0;
    allPurchases.forEach(p => {
      const pDate = new Date(p.orderDate);
      if (pDate >= monthStart) {
        monthlyPurchasesTotal += (p.grandTotal || 0);
      }
    });

    // 3. Stock valuation
    let totalStockValuePurchase = 0;
    let totalStockValueSelling = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockAlerts = [];

    stocks.forEach(stock => {
      if (stock.productId) {
        const available = Math.max(0, (stock.currentStock || 0) - (stock.reservedStock || 0));
        totalStockValuePurchase += ((stock.currentStock || 0) * (stock.productId.purchasePrice || 0));
        totalStockValueSelling += ((stock.currentStock || 0) * (stock.productId.sellingPrice || 0));

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
    let activeStoresCount = 0;
    let totalOutstandingReceivables = 0;
    stores.forEach(s => {
      if (s.status === 'Active') activeStoresCount++;
      totalOutstandingReceivables += (s.outstandingBalance || 0);
    });

    // 5. Collections
    let todayCollections = 0;
    let monthCollections = 0;
    payments.forEach(p => {
      const payDate = new Date(p.paymentDate);
      if (payDate >= todayStart) todayCollections += (p.amount || 0);
      if (payDate >= monthStart) monthCollections += (p.amount || 0);
    });

    // 6. Orders
    const pendingOrdersCount = pendingOrders.length;

    // 7. Estimated Profit & Margin (computed instantly in memory using priceMap)
    let totalCogs = 0;
    monthInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const buyPrice = priceMap[item.productId?.toString()] || 0;
        totalCogs += ((item.quantity || 0) * buyPrice);
      });
    });
    const estimatedGrossProfit = Math.max(0, monthlySales - totalCogs);
    const profitMarginPercent = monthlySales > 0 ? ((estimatedGrossProfit / monthlySales) * 100).toFixed(1) : 0;

    // 8. Top 5 Products by Sales
    const productSalesMap = {};
    monthInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const key = item.name || 'Item';
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += (item.quantity || 0);
        productSalesMap[key].revenue += (item.total || 0);
      });
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 9. Top 5 Stores by Revenue
    const topStores = [...stores]
      .sort((a, b) => (b.totalOrderValue || 0) - (a.totalOrderValue || 0))
      .slice(0, 5);

    // 10. Last 6 Months Sales vs Purchase Trend (calculated in memory)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 0, 23, 59, 59);

      let mSales = 0;
      allInvoices.forEach(inv => {
        const dt = new Date(inv.invoiceDate);
        if (dt >= mStart && dt <= mEnd) mSales += (inv.grandTotal || 0);
      });

      let mBuy = 0;
      allPurchases.forEach(p => {
        const dt = new Date(p.orderDate);
        if (dt >= mStart && dt <= mEnd) mBuy += (p.grandTotal || 0);
      });

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
    products.forEach(p => {
      if (p.category) {
        categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
      }
    });
    const categoryDistribution = Object.keys(categoriesMap).map(cat => ({
      name: cat,
      count: categoriesMap[cat]
    }));

    // 12. Manufacturer Cards (aggregated in memory)
    const stockMapByProduct = {};
    stocks.forEach(s => {
      if (s.productId?._id) {
        stockMapByProduct[s.productId._id.toString()] = s;
      }
    });

    const manufacturerCards = manufacturers.map(mfg => {
      const mid = mfg._id.toString();
      const mfgProducts = products.filter(p => p.manufacturerId?.toString() === mid);
      const mfgProductIds = mfgProducts.map(p => p._id.toString());

      let totalPhysicalStock = 0;
      let totalAvailableStock = 0;
      let stockValuation = 0;
      let lowStockCount = 0;

      const productsWithStock = mfgProducts.map(p => {
        const s = stockMapByProduct[p._id.toString()] || {
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
          damagedStock: 0
        };
        const curr = Number(s.currentStock || 0);
        const resv = Number(s.reservedStock || 0);
        const avail = Math.max(0, curr - resv);

        totalPhysicalStock += curr;
        totalAvailableStock += avail;
        stockValuation += (curr * (p.purchasePrice || 0));
        if (avail <= (s.minStockAlert || 20)) {
          lowStockCount++;
        }

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
          stock: {
            currentStock: curr,
            reservedStock: resv,
            damagedStock: s.damagedStock || 0,
            availableStock: avail,
            minStockAlert: s.minStockAlert,
            warehouseLocation: s.warehouseLocation
          }
        };
      });

      // Purchases for this manufacturer
      const mfgPurchases = allPurchases.filter(p => p.manufacturerId?.toString() === mid);
      const totalPurchasedValue = mfgPurchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);

      // Sales for this manufacturer
      let mfgSalesRevenue = 0;
      let unitsSold = 0;
      allInvoices.forEach(inv => {
        (inv.items || []).forEach(item => {
          if (mfgProductIds.includes(item.productId?.toString())) {
            mfgSalesRevenue += (item.total || 0);
            unitsSold += (item.quantity || 0);
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
    });

    const responsePayload = {
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
    };

    // Cache computed stats
    statsCache = responsePayload;
    statsCacheTime = Date.now();

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, invalidateDashboardCache };
