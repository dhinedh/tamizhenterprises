const dns = require('node:dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');

const updateName = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Update Manufacturer
    const mfgResult = await Manufacturer.updateMany(
      { $or: [{ name: 'femi9.in' }, { code: 'FEMI9' }] },
      { $set: { name: 'femi9' } }
    );
    console.log('Manufacturers updated:', mfgResult.modifiedCount);

    // 2. Update Products
    const prodResult = await Product.updateMany(
      { $or: [{ brand: 'femi9.in' }, { brand: 'Femi9' }, { brand: /femi9/i }] },
      { $set: { brand: 'femi9' } }
    );
    console.log('Products brand updated to femi9:', prodResult.modifiedCount);

    // Verify
    const mfgs = await Manufacturer.find({ code: 'FEMI9' });
    console.log('Verified Manufacturers:', mfgs.map(m => ({ id: m._id, name: m.name, code: m.code })));

    const prods = await Product.find({ brand: 'femi9' });
    console.log('Verified Products count with brand "femi9":', prods.length);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
};

updateName();
