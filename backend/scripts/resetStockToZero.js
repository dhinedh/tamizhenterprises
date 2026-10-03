const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Manufacturer = require('../models/Manufacturer');

async function resetStock() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // 1. Reset all stock records to 0
    const stockUpdateRes = await Stock.updateMany({}, {
      $set: {
        currentStock: 0,
        reservedStock: 0,
        damagedStock: 0
      }
    });
    console.log(`Updated ${stockUpdateRes.modifiedCount} stock documents to 0 quantity.`);

    // 2. Ensure every product has a Stock document with 0 quantity
    const allProducts = await Product.find();
    let createdStockCount = 0;
    for (const prod of allProducts) {
      const existing = await Stock.findOne({ productId: prod._id });
      if (!existing) {
        await Stock.create({
          productId: prod._id,
          currentStock: 0,
          reservedStock: 0,
          damagedStock: 0,
          minStockAlert: prod.minStockAlert || 20,
          warehouseLocation: 'General Bay'
        });
        createdStockCount++;
      }
    }
    if (createdStockCount > 0) {
      console.log(`Initialized 0 stock records for ${createdStockCount} products.`);
    }

    // 3. Reset totalPhysicalStock and stockValuation on Manufacturer models
    const mfgUpdateRes = await Manufacturer.updateMany({}, {
      $set: {
        totalPhysicalStock: 0,
        stockValuation: 0
      }
    });
    console.log(`Reset totalPhysicalStock and stockValuation for ${mfgUpdateRes.modifiedCount} manufacturers.`);

    // 4. Verify results
    const mfgs = await Manufacturer.find();
    console.log('\n--- VERIFICATION OF EMPTY STOCK ---');
    for (const m of mfgs) {
      const prods = await Product.find({ manufacturerId: m._id });
      console.log(`Manufacturer: ${m.name} (${m.code}) - Products: ${prods.length}`);
      for (const p of prods) {
        const s = await Stock.findOne({ productId: p._id });
        console.log(`  SKU: ${p.sku} | Name: ${p.name} | Stock: ${s ? s.currentStock : 0}`);
      }
    }

    console.log('\nSUCCESS: All stock quantities set to 0. Catalogs and products are preserved.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error resetting stock:', err);
    process.exit(1);
  }
}

resetStock();
