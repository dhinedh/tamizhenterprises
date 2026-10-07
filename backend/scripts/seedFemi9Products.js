const dns = require('node:dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');

const femi9ProductsData = [
  {
    name: '180mm (30 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-180-30P',
    barcode: '890900112201',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 24,
    mrp: 135,
    purchasePrice: 85.00,
    dealerPrice: 105.00,
    sellingPrice: 120.00,
    gstRate: 18,
    minStockAlert: 20,
    initialStock: 0,
    description: '180mm (30 PCS) breathable organic cotton sanitary pads'
  },
  {
    name: 'Combo pack - Femi9 Sanitary Napkins',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-COMBO',
    barcode: '890900112202',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 12,
    mrp: 299,
    purchasePrice: 190.00,
    dealerPrice: 230.00,
    sellingPrice: 260.00,
    gstRate: 18,
    minStockAlert: 15,
    initialStock: 0,
    description: 'All-in-one variety day & night combo pack with Anion strip'
  },
  {
    name: '330mm XL (SW-9 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-330-XL-9P',
    barcode: '890900112203',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 36,
    mrp: 145,
    purchasePrice: 95.00,
    dealerPrice: 115.00,
    sellingPrice: 130.00,
    gstRate: 18,
    minStockAlert: 50,
    initialStock: 0,
    description: 'Extra long 330mm XL overnight heavy flow pads with Anion protection'
  },
  {
    name: '290mm L (SW-9 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-290-L-9P',
    barcode: '890900112204',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 36,
    mrp: 135,
    purchasePrice: 88.00,
    dealerPrice: 108.00,
    sellingPrice: 120.00,
    gstRate: 18,
    minStockAlert: 50,
    initialStock: 0,
    description: '290mm Large regular flow pads with leak lock wings'
  },
  {
    name: '330mm XL (6 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-330-XL-6P',
    barcode: '890900112205',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 48,
    mrp: 99,
    purchasePrice: 65.00,
    dealerPrice: 78.00,
    sellingPrice: 90.00,
    gstRate: 18,
    minStockAlert: 30,
    initialStock: 0,
    description: '330mm XL 6 pcs travel handy pack'
  },
  {
    name: '330mm XL (3 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-330-XL-3P',
    barcode: '890900112206',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 60,
    mrp: 55,
    purchasePrice: 35.00,
    dealerPrice: 42.00,
    sellingPrice: 48.00,
    gstRate: 18,
    minStockAlert: 40,
    initialStock: 0,
    description: '330mm XL 3 pcs economy emergency pack'
  },
  {
    name: '290mm L (6 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-290-L-6P',
    barcode: '890900112207',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 48,
    mrp: 90,
    purchasePrice: 60.00,
    dealerPrice: 72.00,
    sellingPrice: 82.00,
    gstRate: 18,
    minStockAlert: 30,
    initialStock: 0,
    description: '290mm L 6 pcs daily value pack'
  },
  {
    name: '290mm L (3 PCS) - Femi9 Premium Sanitary Napkin',
    brand: 'femi9',
    category: 'Sanitary Hygiene',
    sku: 'FEMI9-290-L-3P',
    barcode: '890900112208',
    hsnCode: '96190010',
    unit: 'Pack',
    unitQuantityPerPack: 60,
    mrp: 50,
    purchasePrice: 32.00,
    dealerPrice: 39.00,
    sellingPrice: 45.00,
    gstRate: 18,
    minStockAlert: 40,
    initialStock: 0,
    description: '290mm L 3 pcs compact pocket pack'
  },
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

const seedFemi9 = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Find or create Femi9 manufacturer
    let femi9 = await Manufacturer.findOne({
      $or: [{ code: 'FEMI9' }, { name: /femi9/i }]
    });

    if (!femi9) {
      console.log('Creating Femi9 manufacturer...');
      femi9 = await Manufacturer.create({
        name: 'femi9',
        code: 'FEMI9',
        website: 'https://femi9.in',
        contactPerson: 'Deepa V. (Zonal Distributor Manager)',
        phone: '+91 98405 88991',
        email: 'sales@femi9.in',
        address: 'Femi9 Logistics Park, SIDCO Industrial Area',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600098',
        gstNumber: '33AABCF9988K1Z7',
        creditPeriodDays: 21,
        paymentTerms: '21 Days Net from Invoice',
        bankDetails: {
          bankName: 'ICICI Bank',
          accountNumber: '001105992831',
          ifscCode: 'ICIC0000011',
          branch: 'Chennai Central'
        },
        categories: ['Sanitary Hygiene', 'Personal Care', 'Anion Care'],
        status: 'Active',
        notes: 'Official manufacturer: femi9.in'
      });
      console.log('Femi9 manufacturer created with ID:', femi9._id);
    } else {
      console.log('Femi9 manufacturer found with ID:', femi9._id);
    }

    // 2. Upsert each real product
    console.log(`Updating ${femi9ProductsData.length} real Femi9 products in database...`);
    let addedCount = 0;
    let updatedCount = 0;

    for (const item of femi9ProductsData) {
      let product = await Product.findOne({
        $or: [
          { sku: item.sku },
          { name: item.name }
        ]
      });

      const productPayload = {
        name: item.name,
        brand: 'femi9.in',
        category: item.category,
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
        product = await Product.create(productPayload);
        addedCount++;
        console.log(`+ Added product: ${product.name} (SKU: ${product.sku})`);
      } else {
        Object.assign(product, productPayload);
        await product.save();
        updatedCount++;
        console.log(`✓ Updated product: ${product.name} (SKU: ${product.sku})`);
      }

      // 3. Ensure stock record exists
      let stock = await Stock.findOne({ productId: product._id });
      if (!stock) {
        await Stock.create({
          productId: product._id,
          currentStock: item.initialStock || 0,
          reservedStock: 0,
          damagedStock: 0,
          minStockAlert: item.minStockAlert || 20,
          warehouseLocation: 'Warehouse Central - FMCG Bay'
        });
      }
    }

    // 4. Update manufacturer metrics
    const totalCount = await Product.countDocuments({ manufacturerId: femi9._id });
    femi9.productsCount = totalCount;
    await femi9.save();

    console.log(`\n=== FEMI9 REAL PRODUCTS SYNCED SUCCESSFULLY ===`);
    console.log(`Total Products: ${totalCount}`);
    console.log(`Newly Added: ${addedCount}`);
    console.log(`Updated: ${updatedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Femi9 products:', error);
    process.exit(1);
  }
};

seedFemi9();
