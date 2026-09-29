const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Salesman = require('../models/Salesman');
const SalesmanVisit = require('../models/SalesmanVisit');
const User = require('../models/User');

const clearSalesmen = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing all mock salesmen and field visit records...');
    await Salesman.deleteMany({});
    await SalesmanVisit.deleteMany({});
    await User.deleteMany({ role: { $ne: 'Owner' } });

    console.log('=== MOCK SALESMEN CLEARED SUCCESSFULLY ===');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing salesmen:', error);
    process.exit(1);
  }
};

clearSalesmen();
