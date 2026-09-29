const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
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

    console.log('Clearing all mock transactional, inventory, catalog, customer, and sales force data...');
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
      SalesmanVisit.deleteMany({}),
      Salesman.deleteMany({}),
      Manufacturer.deleteMany({}),
      User.deleteMany({ role: { $ne: 'Owner' } })
    ]);

    // Ensure Admin / Owner account is intact
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

    console.log('=== ALL MOCK DATA REMOVED SUCCESSFULLY ===');
    console.log('The database is completely fresh with 0 mock records.');
    console.log('Admin login (admin@tamilenterprises.com / admin123) is preserved and ready for manual operations.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing mock data:', error);
    process.exit(1);
  }
};

clearMockData();
