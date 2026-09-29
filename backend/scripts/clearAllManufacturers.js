const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');

const clearAllManufacturers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Removing all manufacturers and associated mock catalogues...');
    await Manufacturer.deleteMany({});
    await Product.deleteMany({});
    await Stock.deleteMany({});

    console.log('=== ALL MANUFACTURERS REMOVED SUCCESSFULLY ===');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error removing manufacturers:', error);
    process.exit(1);
  }
};

clearAllManufacturers();
