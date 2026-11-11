const dns = require('node:dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');

const mansaraProductsData = [
  // 1. Urad Health Mix - Classic (250g)
  {
    name: 'URAD HEALTH MIX - CLASSIC (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Urad Health Mix',
    barcode: '890800223311',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 165,
    purchasePrice: 115.00,
    sellingPrice: 165.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Urad Health Mix - Classic (250g) rich traditional protein breakfast blend'
  },
  // 2. Urad Health Mix - Salt&Pepper (250g)
  {
    name: 'URAD HEALTH MIX -SALT&PEPPER (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Urad Health Mix',
    barcode: '890800223312',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 165,
    purchasePrice: 115.00,
    sellingPrice: 165.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Urad Health Mix - Salt & Pepper (250g) savoury spiced traditional porridge mix'
  },
  // 3. Urad Health Mix - Millet Magic (250g)
  {
    name: 'URAD HEALTH MIX -MILLET MAGIC (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Urad Health Mix',
    barcode: '890800223313',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 165,
    purchasePrice: 115.00,
    sellingPrice: 165.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Urad Health Mix - Millet Magic (250g) multi-millet nutrient dense energy drink'
  },
  // 4. Urad Health Mix - Delicious (250g)
  {
    name: 'URAD HEALTH MIX -DELICIOUS (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Urad Health Mix',
    barcode: '890800223314',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 165,
    purchasePrice: 115.00,
    sellingPrice: 165.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Urad Health Mix - Delicious (250g) wholesome sweet cardamom health mix'
  },
  // 5. Health Mix - Black Rice Delight (250g)
  {
    name: 'HEALTH MIX -BLACK RICE DELIGHT (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Health Mix',
    barcode: '890800223315',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 165,
    purchasePrice: 115.00,
    sellingPrice: 165.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Health Mix - Black Rice Delight (250g) Kavuni Arisi antioxidant blend'
  },
  // 6. Health Mix - Ragi Choco Malt (250g)
  {
    name: 'HEALTH MIX - RAGI CHOCO MALT (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Health Mix',
    barcode: '890800223316',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 250,
    purchasePrice: 175.00,
    sellingPrice: 250.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Health Mix - Ragi Choco Malt (250g) finger millet malt with natural cocoa'
  },
  // 7. Health Mix - Nutrimix (250g)
  {
    name: 'HEALTH MIX - NUTRIMIX (250g)',
    brand: 'mansarafoods.com',
    category: 'Health Mix & Cereals',
    subCategory: 'Health Mix',
    barcode: '890800223317',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 200,
    purchasePrice: 140.00,
    sellingPrice: 200.00,
    gstRate: 5,
    minStockAlert: 20,
    initialStock: 0,
    description: 'Mansara Health Mix - Nutrimix (250g) multi-grain protein supplement'
  },
  // 8. Idly Podi - Millet Idly Podi (100g)
  {
    name: 'IDLY PODI - MILLET IDLY PODI (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Idly Podi',
    barcode: '890800223318',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Idly Podi - Millet Idly Podi (100g) stone-ground roasted millet gunpowder'
  },
  // 9. Idly Podi - Traditional Idly Podi (100g)
  {
    name: 'IDLY PODI - TRADITIONAL IDLY PODI (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Idly Podi',
    barcode: '890800223319',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Idly Podi - Traditional Idly Podi (100g) authentic Chettinad roasted dal podi'
  },
  // 10. Rice Podi Mix Home Style Paruppu (100g)
  {
    name: 'RICE PODI MIX HOME STYLE PARUPPU (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Rice Podi Mix',
    barcode: '890800223320',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Rice Podi Mix Home Style Paruppu (100g) comforting roasted lentil rice mix'
  },
  // 11. Rice Podi Mix Pirandai Power (100g)
  {
    name: 'RICE PODI MIX PIRANDAI POWER (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Rice Podi Mix',
    barcode: '890800223321',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Rice Podi Mix Pirandai Power (100g) adamantine creeper digestive rice podi'
  },
  // 12. Rice Podi Mix Murungai Vital (100g)
  {
    name: 'RICE PODI MIX MURUNGAI VITAL (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Rice Podi Mix',
    barcode: '890800223322',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Rice Podi Mix Murungai Vital (100g) nutrient rich moringa leaf rice podi'
  },
  // 13. Rice Podi Mix Karuveppillai Special (100g)
  {
    name: 'RICE PODI MIX KARUVEPPILLAI SPECIAL (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Rice Podi Mix',
    barcode: '890800223323',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Rice Podi Mix Karuveppillai Special (100g) aromatic fresh curry leaf rice podi'
  },
  // 14. Rice Podi Mix Kothamalli Aroma (100g)
  {
    name: 'RICE PODI MIX KOTHAMALLI AROMA (100g)',
    brand: 'mansarafoods.com',
    category: 'Traditional Masala & Spices',
    subCategory: 'Rice Podi Mix',
    barcode: '890800223324',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Rice Podi Mix Kothamalli Aroma (100g) roasted coriander leaf aromatic podi'
  },
  // 15. Herbal Bathing Powder (100g)
  {
    name: 'HERBAL BATHING POWDER (100g)',
    brand: 'mansarafoods.com',
    category: 'Personal Care',
    subCategory: 'Herbal Bathing Powder',
    barcode: '890800223325',
    hsnCode: '1904',
    unit: 'Pack',
    unitQuantityPerPack: 1,
    mrp: 75,
    purchasePrice: 52.00,
    sellingPrice: 75.00,
    gstRate: 5,
    minStockAlert: 25,
    initialStock: 0,
    description: 'Mansara Herbal Bathing Powder (100g) traditional Nalangu Maavu natural skin care bath blend'
  }
];

const seedMansara = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Find or create Mansara manufacturer
    let mansara = await Manufacturer.findOne({
      $or: [{ code: 'MANSARA' }, { name: /mansara/i }]
    });

    const mfgData = {
      name: 'mansarafoods.com',
      code: 'MANSARA',
      website: 'https://mansarafoods.com',
      contactPerson: 'S. Ramanathan (Sales Head)',
      phone: '+91 94432 77881',
      email: 'orders@mansarafoods.com',
      address: 'Mansara Food Processing Unit, Kappalur Industrial Estate',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625008',
      gstNumber: '33AABCM8899L1Z2',
      creditPeriodDays: 30,
      paymentTerms: '30 Days Credit',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '50200078129034',
        ifscCode: 'HDFC0001244',
        branch: 'Madurai Goods Shed'
      },
      categories: ['Health Mix & Cereals', 'Traditional Masala & Spices', 'Personal Care'],
      status: 'Active',
      notes: 'Official manufacturer: mansarafoods.com'
    };

    if (!mansara) {
      console.log('Creating Mansara manufacturer...');
      mansara = await Manufacturer.create(mfgData);
      console.log('Mansara manufacturer created with ID:', mansara._id);
    } else {
      Object.assign(mansara, mfgData);
      await mansara.save();
      console.log('Mansara manufacturer updated with ID:', mansara._id);
    }

    // 2. Remove SKU and dealerPrice from all Mansara products in database
    console.log('Updating Mansara products in database without SKU and without Dealer Price...');
    let updatedCount = 0;

    for (const item of mansaraProductsData) {
      let product = await Product.findOne({
        name: item.name,
        manufacturerId: mansara._id
      });

      if (!product) {
        product = await Product.findOne({ name: item.name });
      }

      if (!product) {
        product = await Product.create({
          name: item.name,
          brand: 'mansarafoods.com',
          category: item.category,
          subCategory: item.subCategory,
          manufacturerId: mansara._id,
          barcode: item.barcode,
          hsnCode: item.hsnCode,
          unit: item.unit,
          unitQuantityPerPack: item.unitQuantityPerPack,
          mrp: item.mrp,
          purchasePrice: item.purchasePrice,
          dealerPrice: 0,
          sellingPrice: item.sellingPrice,
          gstRate: item.gstRate,
          minStockAlert: item.minStockAlert,
          description: item.description,
          status: 'Active'
        });
      }

      // Explicitly unset sku and dealerPrice
      await Product.collection.updateOne(
        { _id: product._id },
        { 
          $unset: { sku: "", dealerPrice: "" },
          $set: {
            name: item.name,
            brand: 'mansarafoods.com',
            category: item.category,
            subCategory: item.subCategory,
            manufacturerId: mansara._id,
            barcode: item.barcode,
            hsnCode: item.hsnCode,
            unit: item.unit,
            unitQuantityPerPack: item.unitQuantityPerPack,
            mrp: item.mrp,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            gstRate: item.gstRate,
            minStockAlert: item.minStockAlert,
            description: item.description,
            status: 'Active'
          }
        }
      );

      updatedCount++;
      console.log(`✓ Updated (no SKU, no Dealer Price): ${item.name} (MRP: ₹${item.mrp})`);

      // Ensure Stock entry exists
      let stock = await Stock.findOne({ productId: product._id });
      if (!stock) {
        await Stock.create({
          productId: product._id,
          currentStock: item.initialStock || 0,
          reservedStock: 0,
          damagedStock: 0,
          minStockAlert: item.minStockAlert || 20,
          warehouseLocation: 'Warehouse Central - Food & Agro Bay'
        });
      }
    }

    // 3. Update manufacturer metrics
    const totalCount = await Product.countDocuments({ manufacturerId: mansara._id });
    mansara.productsCount = totalCount;
    await mansara.save();

    console.log(`\n=== MANSARA PRODUCTS UPDATED (SKU & DEALER PRICE REMOVED) ===`);
    console.log(`Manufacturer ID: ${mansara._id}`);
    console.log(`Total Mansara Products: ${totalCount}`);
    console.log(`Updated: ${updatedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error updating Mansara products:', error);
    process.exit(1);
  }
};

seedMansara();
