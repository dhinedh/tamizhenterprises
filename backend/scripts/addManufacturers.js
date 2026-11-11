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
      categories: ['Health Mix & Cereals', 'Traditional Masala & Spices', 'Personal Care'],
      status: 'Active',
      notes: 'Official manufacturer: mansarafoods.com'
    },
    products: [
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
