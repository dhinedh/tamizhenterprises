const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Store = require('../models/Store');
const Salesman = require('../models/Salesman');
const SalesmanVisit = require('../models/SalesmanVisit');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Return = require('../models/Return');
const Delivery = require('../models/Delivery');
const Scheme = require('../models/Scheme');

const clearMockData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // 1. Wipe all transactional, inventory, customer, and catalogue mock data
    console.log('Clearing Products, Stock, Stores, Purchases, Orders, Invoices, Payments, Deliveries, Returns, Schemes, and Visits...');
    await Promise.all([
      Product.deleteMany({}),
      Stock.deleteMany({}),
      StockLedger.deleteMany({}),
      Store.deleteMany({}),
      Purchase.deleteMany({}),
      Order.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Return.deleteMany({}),
      Delivery.deleteMany({}),
      Scheme.deleteMany({}),
      SalesmanVisit.deleteMany({})
    ]);

    // 2. Reset Manufacturer financial and inventory counters to 0
    console.log('Resetting manufacturer counters (outstanding, purchased, paid to 0)...');
    await Manufacturer.updateMany({}, {
      $set: {
        currentOutstanding: 0,
        totalPurchased: 0,
        totalPaid: 0,
        productsCount: 0,
        totalPhysicalStock: 0
      }
    });

    // 3. Ensure Admin / Owner account is intact and clean up any mock store users
    await User.deleteMany({ role: { $in: ['Store'] } });

    let admin = await User.findOne({ email: 'admin@tamilenterprises.com' });
    if (!admin) {
      console.log('Creating clean Admin / Owner account...');
      await User.create({
        name: 'Muralitharan (Owner & Admin)',
        email: 'admin@tamilenterprises.com',
        password: 'admin123',
        role: 'Owner',
        phone: '+91 94432 10987',
        status: 'Active'
      });
    } else {
      console.log('Admin account preserved:', admin.email);
    }

    // 4. Ensure 1 field salesman exists for field activities
    let salesman = await Salesman.findOne();
    if (!salesman) {
      salesman = await Salesman.create({
        name: 'Murugan P',
        phone: '+91 98402 34567',
        email: 'murugan@tamilenterprises.com',
        assignedRoute: 'Madurai Central & Retail Beat',
        totalOrdersCount: 0,
        totalSalesValue: 0,
        status: 'Active'
      });
    } else {
      salesman.totalOrdersCount = 0;
      salesman.totalSalesValue = 0;
      await salesman.save();
    }

    console.log('=== DATA CLEAR COMPLETE ===');
    console.log('All mock products, stock, stores, orders, invoices, and payments have been removed.');
    console.log('Manufacturer brands and Admin login (admin@tamilenterprises.com / admin123) are ready for manual entries.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing mock data:', error);
    process.exit(1);
  }
};

clearMockData();
