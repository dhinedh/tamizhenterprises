const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');

const manufacturersData = [
  {
    manufacturer: {
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
      categories: ['Traditional Masala & Spices', 'Millet Mixes', 'Chettinad Snacks', 'Pure Oils'],
      status: 'Active',
      notes: 'Official manufacturer: mansarafoods.com'
    },
    products: [
      {
        name: 'Mansara Instant Chettinad Kulambu Masala Paste (200g)',
        brand: 'mansarafoods.com',
        category: 'Traditional Masala & Spices',
        sku: 'MANS-KUL-200G',
        barcode: '890800223301',
        hsnCode: '21039090',
        unit: 'Pouch',
        unitQuantityPerPack: 36,
        mrp: 65,
        purchasePrice: 42.00,
        dealerPrice: 50.00,
        sellingPrice: 54.00,
        gstRate: 12,
        minStockAlert: 35,
        initialStock: 0,
        description: 'Authentic stone-ground Chettinad style gravy paste, no added preservatives or MSG'
      },
      {
        name: 'Mansara Traditional Gunpowder / Idli Podi (250g)',
        brand: 'mansarafoods.com',
        category: 'Traditional Masala & Spices',
        sku: 'MANS-PDR-250G',
        barcode: '890800223302',
        hsnCode: '21039090',
        unit: 'Jar',
        unitQuantityPerPack: 24,
        mrp: 85,
        purchasePrice: 55.00,
        dealerPrice: 66.00,
        sellingPrice: 70.00,
        gstRate: 5,
        minStockAlert: 30,
        initialStock: 0,
        description: 'Crisp roasted lentils and dry red chilies blended with aromatic asafoetida'
      },
      {
        name: 'Mansara Pure Wood Pressed Sesame Oil / Gingelly Oil (500ml)',
        brand: 'mansarafoods.com',
        category: 'Pure Oils',
        sku: 'MANS-OIL-500ML',
        barcode: '890800223303',
        hsnCode: '15155091',
        unit: 'Bottle',
        unitQuantityPerPack: 16,
        mrp: 240,
        purchasePrice: 172.00,
        dealerPrice: 195.00,
        sellingPrice: 205.00,
        gstRate: 5,
        minStockAlert: 20,
        initialStock: 0,
        description: 'Chekku nallennai crushed with palm jaggery, rich nutty aroma and natural antioxidants'
      },
      {
        name: 'Mansara Traditional Kaikara Ragi Murukku (200g)',
        brand: 'mansarafoods.com',
        category: 'Chettinad Snacks',
        sku: 'MANS-MRK-200G',
        barcode: '890800223304',
        hsnCode: '19059040',
        unit: 'Pack',
        unitQuantityPerPack: 30,
        mrp: 60,
        purchasePrice: 38.00,
        dealerPrice: 46.00,
        sellingPrice: 49.00,
        gstRate: 12,
        minStockAlert: 25,
        initialStock: 0,
        description: 'Crunchy finger millet savoury snack spiced with roasted cumin and ajwain'
      }
    ]
  },
  {
    manufacturer: {
      name: 'femi9.in',
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
    },
    products: [
      {
        name: '180mm (30 PCS) - Femi9 Premium Sanitary Napkin',
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        brand: 'femi9.in',
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
        name: 'Femi9 Natural Intimate Foam Hygiene Wash (100ml)',
        brand: 'femi9.in',
        category: 'Personal Care',
        sku: 'FEMI9-WASH-100ML',
        barcode: '890900112209',
        hsnCode: '33049990',
        unit: 'Bottle',
        unitQuantityPerPack: 24,
        mrp: 220,
        purchasePrice: 140.00,
        dealerPrice: 170.00,
        sellingPrice: 195.00,
        gstRate: 18,
        minStockAlert: 20,
        initialStock: 0,
        description: 'Enriched with tea tree oil, lactic acid and aloe vera, pH 3.5 balanced formula'
      }
    ]
  }
];

const seedSelectedManufacturers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    for (const item of manufacturersData) {
      const { manufacturer, products } = item;

      // Upsert manufacturer by code or name
      let mfgDoc = await Manufacturer.findOne({
        $or: [
          { code: manufacturer.code },
          { name: manufacturer.name },
          { website: manufacturer.website }
        ]
      });

      if (!mfgDoc) {
        console.log(`Creating manufacturer: ${manufacturer.name} (${manufacturer.code})...`);
        mfgDoc = await Manufacturer.create({
          ...manufacturer,
          productsCount: products.length,
          totalPhysicalStock: 0,
          stockValuation: 0
        });
      } else {
        console.log(`Updating existing manufacturer: ${mfgDoc.name}...`);
        Object.assign(mfgDoc, manufacturer);
        await mfgDoc.save();
      }

      let totalStock = 0;
      let totalValuation = 0;
      let createdProductsCount = 0;

      for (const prodData of products) {
        const { initialStock, ...pData } = prodData;

        let prodDoc = await Product.findOne({ sku: pData.sku });
        if (!prodDoc) {
          prodDoc = await Product.create({
            ...pData,
            manufacturerId: mfgDoc._id
          });
          console.log(`  + Created product: ${prodDoc.name} (${prodDoc.sku})`);
        } else {
          Object.assign(prodDoc, {
            ...pData,
            manufacturerId: mfgDoc._id
          });
          await prodDoc.save();
          console.log(`  ~ Updated product: ${prodDoc.name} (${prodDoc.sku})`);
        }

        createdProductsCount++;

        // Stock record
        const stockQty = Number(initialStock || 0);
        let stockDoc = await Stock.findOne({ productId: prodDoc._id });
        if (!stockDoc) {
          stockDoc = await Stock.create({
            productId: prodDoc._id,
            currentStock: stockQty,
            reservedStock: 0,
            damagedStock: 0,
            minStockAlert: prodDoc.minStockAlert || 20,
            warehouseLocation: `${mfgDoc.code}-BAY-1`
          });

          if (stockQty > 0) {
            await StockLedger.create({
              productId: prodDoc._id,
              manufacturerId: mfgDoc._id,
              transactionType: 'INWARD_PURCHASE',
              referenceType: 'Purchase',
              referenceId: `INIT-${mfgDoc.code}`,
              quantity: stockQty,
              balanceBefore: 0,
              balanceAfter: stockQty,
              unitPrice: prodDoc.purchasePrice,
              totalAmount: stockQty * prodDoc.purchasePrice,
              billNumber: 'OPENING-STOCK',
              batchNumber: `BATCH-${mfgDoc.code}-01`,
              notes: `Opening stock registered for ${mfgDoc.name}`,
              performedBy: 'System'
            });
          }
        } else {
          totalStock += stockDoc.currentStock;
          totalValuation += stockDoc.currentStock * prodDoc.purchasePrice;
          continue;
        }

        totalStock += stockQty;
        totalValuation += stockQty * prodDoc.purchasePrice;
      }

      mfgDoc.productsCount = createdProductsCount;
      mfgDoc.totalPhysicalStock = totalStock;
      mfgDoc.stockValuation = totalValuation;
      await mfgDoc.save();

      console.log(`Manufacturer ${mfgDoc.name} setup completed: ${createdProductsCount} products, ${totalStock} total stock units, ₹${totalValuation} valuation.\n`);
    }

    console.log('All manufacturers and products onboarded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error adding manufacturers:', err);
    process.exit(1);
  }
};

seedSelectedManufacturers();
