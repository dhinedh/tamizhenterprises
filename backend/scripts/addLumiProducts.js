const dns = require('node:dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');

const lumiProducts = [
  {
    name: 'Lumi9 Baby Diaper L(24)',
    brand: 'femi9',
    category: 'Baby Diaper',
    subCategory: 'Lumi Diaper',
    sku: 'LUMI9-BD-L-24',
    barcode: '890900113301',
    hsnCode: '96190020',
    unit: 'Pack',
    unitQuantityPerPack: 24,
    mrp: 449,
    purchasePrice: 280.00,
    dealerPrice: 340.00,
    sellingPrice: 390.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'Lumi9 Baby Diaper Large Size (L) - 24 Count with ultra absorption & wetness indicator'
  },
  {
    name: 'Lumi9 Baby Diaper L(54)',
    brand: 'femi9',
    category: 'Baby Diaper',
    subCategory: 'Lumi Diaper',
    sku: 'LUMI9-BD-L-54',
    barcode: '890900113302',
    hsnCode: '96190020',
    unit: 'Pack',
    unitQuantityPerPack: 54,
    mrp: 899,
    purchasePrice: 560.00,
    dealerPrice: 680.00,
    sellingPrice: 780.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'Lumi9 Baby Diaper Large Size (L) - 54 Count jumbo economy value pack'
  },
  {
    name: 'Lumi9 Baby Diaper M(24)',
    brand: 'femi9',
    category: 'Baby Diaper',
    subCategory: 'Lumi Diaper',
    sku: 'LUMI9-BD-M-24',
    barcode: '890900113303',
    hsnCode: '96190020',
    unit: 'Pack',
    unitQuantityPerPack: 24,
    mrp: 399,
    purchasePrice: 250.00,
    dealerPrice: 300.00,
    sellingPrice: 350.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'Lumi9 Baby Diaper Medium Size (M) - 24 Count breathable soft cotton pads'
  },
  {
    name: 'Lumi9 Baby Diaper M(54)',
    brand: 'femi9',
    category: 'Baby Diaper',
    subCategory: 'Lumi Diaper',
    sku: 'LUMI9-BD-M-54',
    barcode: '890900113304',
    hsnCode: '96190020',
    unit: 'Pack',
    unitQuantityPerPack: 54,
    mrp: 849,
    purchasePrice: 530.00,
    dealerPrice: 640.00,
    sellingPrice: 740.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'Lumi9 Baby Diaper Medium Size (M) - 54 Count jumbo economy value pack'
  },
  {
    name: 'Lumi9 Baby Diaper NB(24)',
    brand: 'femi9',
    category: 'Baby Diaper',
    subCategory: 'Lumi Diaper',
    sku: 'LUMI9-BD-NB-24',
    barcode: '890900113305',
    hsnCode: '96190020',
    unit: 'Pack',
    unitQuantityPerPack: 24,
    mrp: 369,
    purchasePrice: 230.00,
    dealerPrice: 280.00,
    sellingPrice: 320.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'Lumi9 Baby Diaper Newborn Size (NB) - 24 Count gentle sensitive skin protection'
  }
];

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas.');

    let femi9 = await Manufacturer.findOne({
      $or: [{ code: 'FEMI9' }, { name: /femi9/i }]
    });

    if (!femi9) {
      console.log('Femi9 manufacturer not found, creating...');
      femi9 = await Manufacturer.create({
        name: 'femi9',
        code: 'FEMI9',
        status: 'Active'
      });
    }

    console.log(`Using Manufacturer: ${femi9.name} (${femi9._id})`);

    let created = 0;
    let updated = 0;

    for (const item of lumiProducts) {
      let product = await Product.findOne({
        $or: [
          { name: item.name },
          { sku: item.sku }
        ]
      });

      const payload = {
        name: item.name,
        brand: item.brand,
        category: item.category,
        subCategory: item.subCategory,
        manufacturerId: femi9._id,
        sku: item.sku,
        barcode: item.barcode,
        hsnCode: item.hsnCode,
        unit: item.unit,
        unitQuantityPerPack: item.unitQuantityPerPack,
        mrp: item.mrp,
        purchasePrice: item.purchasePrice,
        dealerPrice: item.dealerPrice,
        sellingPrice: item.sellingPrice,
        gstRate: item.gstRate,
        minStockAlert: item.minStockAlert,
        description: item.description,
        status: 'Active'
      };

      if (!product) {
        product = await Product.create(payload);
        created++;
        console.log(`+ Added: ${product.name} (SKU: ${product.sku})`);
      } else {
        Object.assign(product, payload);
        await product.save();
        updated++;
        console.log(`✓ Updated: ${product.name} (SKU: ${product.sku})`);
      }

      // Stock record
      let stock = await Stock.findOne({ productId: product._id });
      if (!stock) {
        await Stock.create({
          productId: product._id,
          currentStock: item.initialStock || 0,
          reservedStock: 0,
          damagedStock: 0,
          minStockAlert: item.minStockAlert || 15,
          warehouseLocation: 'Warehouse Central - Baby Care Bay'
        });
      }
    }

    const totalCount = await Product.countDocuments({ manufacturerId: femi9._id });
    femi9.productsCount = totalCount;
    await femi9.save();

    console.log('\n=== LUMI9 PRODUCTS SUCCESSFULLY INSERTED INTO REAL DATABASE ===');
    console.log(`Added: ${created}, Updated: ${updated}, Total Femi9 Products: ${totalCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error inserting Lumi9 products:', err);
    process.exit(1);
  }
};

run();
