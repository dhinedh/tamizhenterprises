const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

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

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp');
    console.log('Connected to MongoDB. Clearing existing ERP data...');

    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      Manufacturer.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      StockLedger.deleteMany({}),
      Store.deleteMany({}),
      Salesman.deleteMany({}),
      SalesmanVisit.deleteMany({}),
      Purchase.deleteMany({}),
      Order.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Return.deleteMany({}),
      Delivery.deleteMany({}),
      Scheme.deleteMany({})
    ]);

    console.log('Collections cleared. Seeding Tamil Enterprises data...');

    // 1. Manufacturers
    const manufacturers = await Manufacturer.create([
      {
        name: 'Femi9 Healthcare Pvt Ltd',
        code: 'FEMI9',
        contactPerson: 'Deepa V. (Zonal Distributor Manager)',
        phone: '+91 98405 88991',
        email: 'sales@femi9.in',
        website: 'https://femi9.in',
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
        openingBalance: 0,
        currentOutstanding: 68500,
        totalPurchased: 245000,
        totalPaid: 176500,
        categories: ['Sanitary Hygiene', 'Personal Care', 'Anion Care'],
        status: 'Active'
      },
      {
        name: 'Mansara Foods & Agro Products',
        code: 'MANSARA',
        contactPerson: 'S. Ramanathan (Sales Head)',
        phone: '+91 94432 77881',
        email: 'orders@mansarafoods.com',
        website: 'https://mansarafoods.com',
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
        openingBalance: 0,
        currentOutstanding: 38000,
        totalPurchased: 165000,
        totalPaid: 127000,
        categories: ['Traditional Masala & Spices', 'Millet Mixes', 'Chettinad Snacks'],
        status: 'Active'
      },
      {
        name: 'ITC Limited',
        code: 'ITC',
        contactPerson: 'K. Rajasekaran (Zonal Sales Manager)',
        phone: '+91 98401 22334',
        email: 'sales.south@itc.in',
        address: 'ITC Centre, 760 Anna Salai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600002',
        gstNumber: '33AAACI1234A1Z1',
        creditPeriodDays: 30,
        paymentTerms: '30 Days Net from GRN',
        bankDetails: {
          bankName: 'State Bank of India',
          accountNumber: '30491028374',
          ifscCode: 'SBIN0000843',
          branch: 'Anna Salai, Chennai'
        },
        openingBalance: 0,
        currentOutstanding: 145000,
        totalPurchased: 450000,
        totalPaid: 305000,
        categories: ['Biscuits', 'Atta & Staples', 'Confectionery', 'Snacks'],
        status: 'Active'
      },
      {
        name: 'Hindustan Unilever Limited',
        code: 'HUL',
        contactPerson: 'S. Ramanathan (Distributor Officer)',
        phone: '+91 94431 88776',
        email: 'orders.tamilnadu@unilever.com',
        address: 'HUL Depot, Ring Road Industrial Estate',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625016',
        gstNumber: '33AAACH4455B1Z9',
        creditPeriodDays: 21,
        paymentTerms: '21 Days Net',
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '00120340056789',
          ifscCode: 'HDFC0000124',
          branch: 'Madurai Main'
        },
        openingBalance: 0,
        currentOutstanding: 210000,
        totalPurchased: 680000,
        totalPaid: 470000,
        categories: ['Soaps & Detergents', 'Personal Care', 'Tea & Coffee'],
        status: 'Active'
      },
      {
        name: 'Britannia Industries Ltd',
        code: 'BRITANNIA',
        contactPerson: 'V. Sundaram (Supply Chain Lead)',
        phone: '+91 98840 55667',
        email: 'southsales@britindia.com',
        address: 'Britannia Warehousing Hub, Ambattur',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600058',
        gstNumber: '33AAACB9911C1Z3',
        creditPeriodDays: 30,
        paymentTerms: '30 Days Credit',
        bankDetails: {
          bankName: 'ICICI Bank',
          accountNumber: '000105023948',
          ifscCode: 'ICIC0000001',
          branch: 'Ambattur, Chennai'
        },
        openingBalance: 0,
        currentOutstanding: 85000,
        totalPurchased: 350000,
        totalPaid: 265000,
        categories: ['Biscuits', 'Dairy', 'Cakes & Rusk'],
        status: 'Active'
      },
      {
        name: 'Parle Products Pvt Ltd',
        code: 'PARLE',
        contactPerson: 'G. Natarajan',
        phone: '+91 97890 33441',
        email: 'orders.parle@parle.biz',
        address: 'Parle Depot, SIDCO Industrial Complex',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641021',
        gstNumber: '33AAACP7788D1Z2',
        creditPeriodDays: 15,
        paymentTerms: '15 Days Net',
        bankDetails: {
          bankName: 'Axis Bank',
          accountNumber: '915020038472910',
          ifscCode: 'UTIB0000142',
          branch: 'Coimbatore Town'
        },
        openingBalance: 0,
        currentOutstanding: 62000,
        totalPurchased: 240000,
        totalPaid: 178000,
        categories: ['Biscuits', 'Confectionery'],
        status: 'Active'
      },
      {
        name: 'Godrej Consumer Products',
        code: 'GODREJ',
        contactPerson: 'P. Anand',
        phone: '+91 99400 12890',
        email: 'sales@godrejcp.com',
        address: 'Godrej Depot, Guindy Industrial Estate',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600032',
        gstNumber: '33AAACG3322E1Z5',
        creditPeriodDays: 30,
        paymentTerms: '30 Days Credit',
        bankDetails: {
          bankName: 'Canara Bank',
          accountNumber: '11029384756',
          ifscCode: 'CNRB0001102',
          branch: 'Guindy'
        },
        openingBalance: 0,
        currentOutstanding: 45000,
        totalPurchased: 180000,
        totalPaid: 135000,
        categories: ['Personal Care', 'Home Care'],
        status: 'Active'
      }
    ]);

    console.log(`Seeded ${manufacturers.length} Manufacturers`);

    // 2. Salesmen
    const salesmen = await Salesman.create([
      {
        name: 'Murugan P',
        employeeCode: 'SLS-001',
        phone: '+91 98402 34567',
        email: 'murugan@tamilenterprises.com',
        territory: 'Chennai Central & North',
        assignedStoresCount: 4,
        targetMonthly: 300000,
        currentMonthAchievement: 185000,
        commissionPercent: 2.5,
        status: 'Active'
      },
      {
        name: 'Senthil Kumar',
        employeeCode: 'SLS-002',
        phone: '+91 94432 98765',
        email: 'senthil@tamilenterprises.com',
        territory: 'Madurai & South TN',
        assignedStoresCount: 3,
        targetMonthly: 250000,
        currentMonthAchievement: 140000,
        commissionPercent: 2.5,
        status: 'Active'
      },
      {
        name: 'Karthik Raja',
        employeeCode: 'SLS-003',
        phone: '+91 98941 12345',
        email: 'karthik@tamilenterprises.com',
        territory: 'Coimbatore & West TN',
        assignedStoresCount: 2,
        targetMonthly: 220000,
        currentMonthAchievement: 98000,
        commissionPercent: 2.0,
        status: 'Active'
      }
    ]);

    console.log(`Seeded ${salesmen.length} Salesmen`);

    // 3. Stores (Retailers)
    const stores = await Store.create([
      {
        name: 'Sri Krishna Supermarket',
        code: 'STR-CHE-01',
        storeType: 'Supermarket',
        ownerName: 'M. Balasubramanian',
        phone: '+91 98410 44556',
        email: 'store@srikrishnastores.com',
        address: '45, Usman Road, T. Nagar',
        area: 'T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        gstNumber: '33AABCS1122D1Z8',
        salesmanId: salesmen[0]._id,
        creditLimit: 120000,
        outstandingBalance: 42500,
        creditPeriodDays: 15,
        status: 'Active',
        totalOrdersCount: 14,
        totalOrderValue: 245000,
        lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Murugan Departmental Store',
        code: 'STR-MDU-01',
        storeType: 'Departmental',
        ownerName: 'T. Palaniappan',
        phone: '+91 94431 66778',
        email: 'muruganstore.mdu@gmail.com',
        address: '112, Simmakkal Main Road',
        area: 'Simmakkal',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
        gstNumber: '33AABCM3344E1Z7',
        salesmanId: salesmen[1]._id,
        creditLimit: 90000,
        outstandingBalance: 28000,
        creditPeriodDays: 15,
        status: 'Active',
        totalOrdersCount: 9,
        totalOrderValue: 165000,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Annapoorna Hypermarket',
        code: 'STR-CBE-01',
        storeType: 'Supermarket',
        ownerName: 'R. Senthil Nathan',
        phone: '+91 98940 77889',
        email: 'purchase@annapoornahyper.com',
        address: '88, D.B. Road, RS Puram',
        area: 'RS Puram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641002',
        gstNumber: '33AABCA5566F1Z6',
        salesmanId: salesmen[2]._id,
        creditLimit: 150000,
        outstandingBalance: 65000,
        creditPeriodDays: 20,
        status: 'Active',
        totalOrdersCount: 12,
        totalOrderValue: 310000,
        lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Lakshmi Vilas Provisions',
        code: 'STR-SLM-01',
        storeType: 'Kirana',
        ownerName: 'V. Sivakumar',
        phone: '+91 97880 22331',
        email: 'lakshmivilas.salem@yahoo.com',
        address: '14, Fort Main Road',
        area: 'Town Hall',
        city: 'Salem',
        state: 'Tamil Nadu',
        pincode: '636001',
        gstNumber: '33AABCL7788G1Z5',
        salesmanId: salesmen[1]._id,
        creditLimit: 60000,
        outstandingBalance: 18500,
        creditPeriodDays: 10,
        status: 'Active',
        totalOrdersCount: 8,
        totalOrderValue: 92000,
        lastOrderDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Vasantham Provision Stores',
        code: 'STR-MDU-02',
        storeType: 'Kirana',
        ownerName: 'A. Muthuraman',
        phone: '+91 94420 55443',
        email: 'vasantham.kk@gmail.com',
        address: '77, 80 Feet Road, KK Nagar',
        area: 'KK Nagar',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625020',
        gstNumber: '',
        salesmanId: salesmen[1]._id,
        creditLimit: 40000,
        outstandingBalance: 12400,
        creditPeriodDays: 7,
        status: 'Active',
        totalOrdersCount: 6,
        totalOrderValue: 58000,
        lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Ponmani Mart',
        code: 'STR-CHE-02',
        storeType: 'Supermarket',
        ownerName: 'K. Thirunavukkarasu',
        phone: '+91 98408 99887',
        email: 'ponmani.mart@gmail.com',
        address: '23, 2nd Avenue, Anna Nagar',
        area: 'Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600040',
        gstNumber: '33AABCP9900H1Z4',
        salesmanId: salesmen[0]._id,
        creditLimit: 100000,
        outstandingBalance: 31200,
        creditPeriodDays: 15,
        status: 'Active',
        totalOrdersCount: 11,
        totalOrderValue: 180000,
        lastOrderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`Seeded ${stores.length} Retail Stores`);

    // 4. Users (Role-based logins)
    const users = await User.create([
      {
        name: 'Muralitharan (Owner & Admin)',
        email: 'admin@tamilenterprises.com',
        password: 'admin123',
        role: 'Owner',
        phone: '+91 94432 10987',
        status: 'Active'
      },
      {
        name: 'Murugan P (Sales Executive)',
        email: 'murugan@tamilenterprises.com',
        password: 'sales123',
        role: 'Salesman',
        salesmanId: salesmen[0]._id,
        phone: '+91 98402 34567',
        status: 'Active'
      },
      {
        name: 'Sri Krishna Stores (Retail Store Portal)',
        email: 'store@srikrishnastores.com',
        password: 'store123',
        role: 'Store',
        storeId: stores[0]._id,
        phone: '+91 98410 44556',
        status: 'Active'
      }
    ]);

    salesmen[0].userId = users[1]._id;
    await salesmen[0].save();

    console.log(`Seeded ${users.length} Users with Owner, Salesman, and Store credentials`);

    // 5. Products Catalogue
    const mfgMap = {};
    manufacturers.forEach(m => {
      mfgMap[m.code] = m._id;
    });

    const productsData = [
      // Femi9 Healthcare Products
      {
        name: 'Femi9 Premium Anion Sanitary Napkins - XL (Pack of 8)',
        brand: 'Femi9',
        category: 'Sanitary Hygiene',
        manufacturerId: mfgMap['FEMI9'],
        sku: 'FEMI9-PAD-XL',
        barcode: '890800112201',
        hsnCode: '96190010',
        unit: 'Pack',
        unitQuantityPerPack: 24,
        mrp: 140,
        purchasePrice: 95.00,
        dealerPrice: 112.00,
        sellingPrice: 118.00,
        gstRate: 12,
        minStockAlert: 30,
        description: 'Anion chip breathable antibacterial sanitary pads with super absorbent core for day use',
        status: 'Active'
      },
      {
        name: 'Femi9 Ultra Thin Overnight Napkins - XXL (Pack of 12)',
        brand: 'Femi9',
        category: 'Sanitary Hygiene',
        manufacturerId: mfgMap['FEMI9'],
        sku: 'FEMI9-PAD-XXL',
        barcode: '890800112202',
        hsnCode: '96190010',
        unit: 'Pack',
        unitQuantityPerPack: 20,
        mrp: 195,
        purchasePrice: 135.00,
        dealerPrice: 155.00,
        sellingPrice: 165.00,
        gstRate: 12,
        minStockAlert: 25,
        description: 'Extra long 320mm overnight wings pad for complete leak lock protection',
        status: 'Active'
      },
      {
        name: 'Femi9 Natural Intimate Foam Hygiene Wash (100ml)',
        brand: 'Femi9',
        category: 'Personal Care',
        manufacturerId: mfgMap['FEMI9'],
        sku: 'FEMI9-WASH-100ML',
        barcode: '890800112203',
        hsnCode: '33049990',
        unit: 'Bottle',
        unitQuantityPerPack: 24,
        mrp: 220,
        purchasePrice: 145.00,
        dealerPrice: 172.00,
        sellingPrice: 180.00,
        gstRate: 18,
        minStockAlert: 20,
        description: 'pH 3.5 balanced intimate foam wash with tea tree oil and organic aloe vera extract',
        status: 'Active'
      },
      {
        name: 'Femi9 Organic Cotton Panty Liners (Pack of 24)',
        brand: 'Femi9',
        category: 'Sanitary Hygiene',
        manufacturerId: mfgMap['FEMI9'],
        sku: 'FEMI9-PL-24P',
        barcode: '890800112204',
        hsnCode: '96190010',
        unit: 'Pack',
        unitQuantityPerPack: 30,
        mrp: 120,
        purchasePrice: 78.00,
        dealerPrice: 92.00,
        sellingPrice: 98.00,
        gstRate: 12,
        minStockAlert: 25,
        description: '100% organic cotton daily freshness panty liners with breathable base layer',
        status: 'Active'
      },

      // Mansara Foods & Agro Products
      {
        name: 'Mansara Instant Chettinad Kulambu Masala Paste (200g)',
        brand: 'Mansara Foods',
        category: 'Spices & Pastes',
        manufacturerId: mfgMap['MANSARA'],
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
        description: 'Authentic stone-ground Chettinad style gravy paste, no added preservatives or MSG',
        status: 'Active'
      },
      {
        name: 'Mansara Traditional Gunpowder / Idli Podi (250g)',
        brand: 'Mansara Foods',
        category: 'Traditional Foods',
        manufacturerId: mfgMap['MANSARA'],
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
        description: 'Crisp roasted lentils and dry red chilies blended with aromatic asafoetida',
        status: 'Active'
      },
      {
        name: 'Mansara Pure Wood Pressed Sesame Oil / Gingelly Oil (500ml)',
        brand: 'Mansara Foods',
        category: 'Edible Oils',
        manufacturerId: mfgMap['MANSARA'],
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
        description: 'Chekku nallennai crushed with palm jaggery, rich nutty aroma and natural antioxidants',
        status: 'Active'
      },
      {
        name: 'Mansara Traditional Kaikara Ragi Murukku (200g)',
        brand: 'Mansara Foods',
        category: 'Traditional Snacks',
        manufacturerId: mfgMap['MANSARA'],
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
        description: 'Crunchy finger millet savoury snack spiced with roasted cumin and ajwain',
        status: 'Active'
      },

      // ITC Products
      {
        name: 'Sunfeast Dark Fantasy Choco Fills (75g)',
        brand: 'Sunfeast',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['ITC'],
        sku: 'ITC-DF-75G',
        barcode: '8901725181123',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 24,
        mrp: 40,
        purchasePrice: 28.50,
        dealerPrice: 32.00,
        sellingPrice: 33.50,
        gstRate: 18,
        minStockAlert: 30,
        description: 'Rich dark crunchy cookie with luscious molten chocolate core',
        status: 'Active'
      },
      {
        name: 'Sunfeast Mom’s Magic Cashew & Almond (150g)',
        brand: 'Sunfeast',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['ITC'],
        sku: 'ITC-MM-150G',
        barcode: '8901725181154',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 30,
        mrp: 35,
        purchasePrice: 24.50,
        dealerPrice: 28.00,
        sellingPrice: 29.50,
        gstRate: 18,
        minStockAlert: 25,
        description: 'Crispy butter cookies packed with roast cashews and almonds',
        status: 'Active'
      },
      {
        name: 'Aashirvaad Shudh Chakki Atta (5kg)',
        brand: 'Aashirvaad',
        category: 'Staples & Flour',
        manufacturerId: mfgMap['ITC'],
        sku: 'ITC-ATT-5KG',
        barcode: '8901725112233',
        hsnCode: '11010000',
        unit: 'Pack',
        unitQuantityPerPack: 6,
        mrp: 290,
        purchasePrice: 235.00,
        dealerPrice: 255.00,
        sellingPrice: 265.00,
        gstRate: 5,
        minStockAlert: 20,
        description: '100% whole wheat flour with 4-step advantage process',
        status: 'Active'
      },
      {
        name: 'Bingo! Mad Angles Achaari Masti (66g)',
        brand: 'Bingo!',
        category: 'Snacks & Namkeen',
        manufacturerId: mfgMap['ITC'],
        sku: 'ITC-BMA-66G',
        barcode: '8901725133445',
        hsnCode: '19059040',
        unit: 'Carton',
        unitQuantityPerPack: 48,
        mrp: 20,
        purchasePrice: 14.00,
        dealerPrice: 16.20,
        sellingPrice: 17.00,
        gstRate: 12,
        minStockAlert: 40,
        description: 'Tangy mango pickle flavoured triangular corn chips',
        status: 'Active'
      },

      // HUL Products
      {
        name: 'Surf Excel Easy Wash Detergent Powder (1kg)',
        brand: 'Surf Excel',
        category: 'Laundry & Detergents',
        manufacturerId: mfgMap['HUL'],
        sku: 'HUL-SE-1KG',
        barcode: '8901030744120',
        hsnCode: '34022020',
        unit: 'Pack',
        unitQuantityPerPack: 16,
        mrp: 145,
        purchasePrice: 110.00,
        dealerPrice: 124.00,
        sellingPrice: 128.00,
        gstRate: 18,
        minStockAlert: 25,
        description: 'Superfine powder that dissolves easily and removes tough stains',
        status: 'Active'
      },
      {
        name: 'Dove Cream Beauty Bathing Soap (100g Pack of 3)',
        brand: 'Dove',
        category: 'Personal Care',
        manufacturerId: mfgMap['HUL'],
        sku: 'HUL-DOVE-3X100',
        barcode: '8901030822119',
        hsnCode: '34011110',
        unit: 'Pack',
        unitQuantityPerPack: 20,
        mrp: 195,
        purchasePrice: 148.00,
        dealerPrice: 165.00,
        sellingPrice: 172.00,
        gstRate: 18,
        minStockAlert: 20,
        description: 'Contains 1/4th moisturizing cream for soft and smooth skin',
        status: 'Active'
      },
      {
        name: 'Brooke Bond Red Label Tea (500g)',
        brand: 'Red Label',
        category: 'Beverages',
        manufacturerId: mfgMap['HUL'],
        sku: 'HUL-RL-500G',
        barcode: '8901030388911',
        hsnCode: '09024020',
        unit: 'Pack',
        unitQuantityPerPack: 24,
        mrp: 260,
        purchasePrice: 205.00,
        dealerPrice: 228.00,
        sellingPrice: 236.00,
        gstRate: 5,
        minStockAlert: 20,
        description: 'Carefully selected tea leaves with warm aroma and taste of togetherness',
        status: 'Active'
      },
      {
        name: 'Lifebuoy Total 10 Soap Bar (125g)',
        brand: 'Lifebuoy',
        category: 'Personal Care',
        manufacturerId: mfgMap['HUL'],
        sku: 'HUL-LB-125G',
        barcode: '8901030511227',
        hsnCode: '34011110',
        unit: 'Carton',
        unitQuantityPerPack: 48,
        mrp: 38,
        purchasePrice: 28.00,
        dealerPrice: 31.50,
        sellingPrice: 33.00,
        gstRate: 18,
        minStockAlert: 35,
        description: 'Advanced silver shield formula for 100% stronger germ protection',
        status: 'Active'
      },

      // Britannia Products
      {
        name: 'Britannia Good Day Butter Cookies (120g Pack of 4)',
        brand: 'Good Day',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['BRITANNIA'],
        sku: 'BRIT-GD-480G',
        barcode: '8901063124567',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 24,
        mrp: 120,
        purchasePrice: 92.00,
        dealerPrice: 102.00,
        sellingPrice: 106.00,
        gstRate: 18,
        minStockAlert: 20,
        description: 'Rich butter cookies with wonderful smiling design',
        status: 'Active'
      },
      {
        name: 'Britannia Marie Gold Biscuits (250g)',
        brand: 'Marie Gold',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['BRITANNIA'],
        sku: 'BRIT-MG-250G',
        barcode: '8901063189912',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 36,
        mrp: 35,
        purchasePrice: 26.50,
        dealerPrice: 29.80,
        sellingPrice: 31.00,
        gstRate: 18,
        minStockAlert: 30,
        description: 'Light and crunchy tea biscuit with vitamins and minerals',
        status: 'Active'
      },
      {
        name: 'Britannia Milk Bikis Cream Biscuits (100g)',
        brand: 'Milk Bikis',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['BRITANNIA'],
        sku: 'BRIT-MB-100G',
        barcode: '8901063177811',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 40,
        mrp: 20,
        purchasePrice: 14.80,
        dealerPrice: 16.80,
        sellingPrice: 17.50,
        gstRate: 18,
        minStockAlert: 25,
        description: 'Kids favourite biscuit with goodness of pure milk and calcium',
        status: 'Active'
      },
      {
        name: 'Britannia Toastea Premium Bake Rusk (400g)',
        brand: 'Toastea',
        category: 'Bakery & Rusk',
        manufacturerId: mfgMap['BRITANNIA'],
        sku: 'BRIT-RSK-400G',
        barcode: '8901063199223',
        hsnCode: '19054000',
        unit: 'Pack',
        unitQuantityPerPack: 20,
        mrp: 60,
        purchasePrice: 44.00,
        dealerPrice: 50.00,
        sellingPrice: 52.50,
        gstRate: 18,
        minStockAlert: 15,
        description: 'Crispy wheat rusks infused with aromatic elaichi',
        status: 'Active'
      },

      // Parle Products
      {
        name: 'Parle-G Original Gluco Biscuits (250g Family Pack)',
        brand: 'Parle-G',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['PARLE'],
        sku: 'PARLE-G-250G',
        barcode: '8901719101011',
        hsnCode: '19053100',
        unit: 'Carton',
        unitQuantityPerPack: 48,
        mrp: 30,
        purchasePrice: 23.50,
        dealerPrice: 26.00,
        sellingPrice: 27.20,
        gstRate: 18,
        minStockAlert: 40,
        description: 'India’s most beloved glucose biscuit for tea time nourishment',
        status: 'Active'
      },
      {
        name: 'Parle Monaco Salted Classic Crackers (200g)',
        brand: 'Monaco',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['PARLE'],
        sku: 'PARLE-MON-200G',
        barcode: '8901719102025',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 36,
        mrp: 35,
        purchasePrice: 26.00,
        dealerPrice: 29.50,
        sellingPrice: 30.50,
        gstRate: 18,
        minStockAlert: 20,
        description: 'Light, crunchy salty crackers ideal for toppings and chaats',
        status: 'Active'
      },
      {
        name: 'Parle Hide & Seek Chocolate Chip Cookies (120g)',
        brand: 'Hide & Seek',
        category: 'Biscuits & Cookies',
        manufacturerId: mfgMap['PARLE'],
        sku: 'PARLE-HS-120G',
        barcode: '8901719103039',
        hsnCode: '19053100',
        unit: 'Box',
        unitQuantityPerPack: 30,
        mrp: 40,
        purchasePrice: 29.00,
        dealerPrice: 33.00,
        sellingPrice: 34.50,
        gstRate: 18,
        minStockAlert: 25,
        description: 'Real chocolate chips embedded in crunchy chocolate biscuits',
        status: 'Active'
      },

      // Godrej Products
      {
        name: 'Goodknight Gold Flash Liquid Mosquito Vaporizer Refill (45ml x 2)',
        brand: 'Goodknight',
        category: 'Home Care',
        manufacturerId: mfgMap['GODREJ'],
        sku: 'GDJ-GK-TWIN',
        barcode: '8901023024881',
        hsnCode: '38089199',
        unit: 'Pack',
        unitQuantityPerPack: 24,
        mrp: 160,
        purchasePrice: 118.00,
        dealerPrice: 134.00,
        sellingPrice: 140.00,
        gstRate: 18,
        minStockAlert: 20,
        description: 'Advanced dual mode mosquito protection for peaceful night sleep',
        status: 'Active'
      },
      {
        name: 'Godrej No.1 Sandal & Turmeric Soap (100g Pack of 4)',
        brand: 'Godrej No.1',
        category: 'Personal Care',
        manufacturerId: mfgMap['GODREJ'],
        sku: 'GDJ-NO1-4X100',
        barcode: '8901023019917',
        hsnCode: '34011110',
        unit: 'Pack',
        unitQuantityPerPack: 20,
        mrp: 120,
        purchasePrice: 88.00,
        dealerPrice: 100.00,
        sellingPrice: 104.00,
        gstRate: 18,
        minStockAlert: 25,
        description: 'Grade 1 soap with 76% TFM enriched with natural sandalwood oils',
        status: 'Active'
      }
    ];

    const products = await Product.create(productsData);
    console.log(`Seeded ${products.length} Products catalogue`);

    const prodMap = {};
    products.forEach(p => {
      prodMap[p.sku] = p;
    });

    // 6. Stocks for Products
    const stockDocs = [
      // Femi9 Stocks
      {
        productId: prodMap['FEMI9-PAD-XL']._id,
        warehouseLocation: 'Warehouse Main - Bay D-01 (Hygiene)',
        currentStock: 150,
        reservedStock: 15,
        damagedStock: 0,
        minStockAlert: 30,
        batchNumber: 'FEMI-2601'
      },
      {
        productId: prodMap['FEMI9-PAD-XXL']._id,
        warehouseLocation: 'Warehouse Main - Bay D-02 (Hygiene)',
        currentStock: 95,
        reservedStock: 10,
        damagedStock: 1,
        minStockAlert: 25,
        batchNumber: 'FEMI-2602'
      },
      {
        productId: prodMap['FEMI9-WASH-100ML']._id,
        warehouseLocation: 'Warehouse Main - Bay D-03 (Personal Care)',
        currentStock: 18, // LOW STOCK (min is 20)
        reservedStock: 2,
        damagedStock: 0,
        minStockAlert: 20,
        batchNumber: 'FEMI-2603'
      },
      {
        productId: prodMap['FEMI9-PL-24P']._id,
        warehouseLocation: 'Warehouse Main - Bay D-04 (Hygiene)',
        currentStock: 80,
        reservedStock: 5,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'FEMI-2604'
      },

      // Mansara Foods Stocks
      {
        productId: prodMap['MANS-KUL-200G']._id,
        warehouseLocation: 'Warehouse Main - Bay E-01 (Food & Spices)',
        currentStock: 210,
        reservedStock: 20,
        damagedStock: 0,
        minStockAlert: 35,
        batchNumber: 'MANS-2601'
      },
      {
        productId: prodMap['MANS-PDR-250G']._id,
        warehouseLocation: 'Warehouse Main - Bay E-02 (Traditional Foods)',
        currentStock: 140,
        reservedStock: 15,
        damagedStock: 0,
        minStockAlert: 30,
        batchNumber: 'MANS-2602'
      },
      {
        productId: prodMap['MANS-OIL-500ML']._id,
        warehouseLocation: 'Warehouse Main - Bay E-03 (Edible Oils)',
        currentStock: 75,
        reservedStock: 8,
        damagedStock: 0,
        minStockAlert: 20,
        batchNumber: 'MANS-2603'
      },
      {
        productId: prodMap['MANS-MRK-200G']._id,
        warehouseLocation: 'Warehouse Main - Bay E-04 (Snacks)',
        currentStock: 12, // LOW STOCK (min is 25)
        reservedStock: 2,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'MANS-2604'
      },

      // ITC Stocks
      {
        productId: prodMap['ITC-DF-75G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-12',
        currentStock: 180,
        reservedStock: 20,
        damagedStock: 2,
        minStockAlert: 30,
        batchNumber: 'ITC-2601'
      },
      {
        productId: prodMap['ITC-MM-150G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-14',
        currentStock: 120,
        reservedStock: 10,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'ITC-2602'
      },
      {
        productId: prodMap['ITC-ATT-5KG']._id,
        warehouseLocation: 'Warehouse Main - Bay C-01 (Heavy Racks)',
        currentStock: 14, // LOW STOCK (min is 20)
        reservedStock: 4,
        damagedStock: 1,
        minStockAlert: 20,
        batchNumber: 'ATT-2603'
      },
      {
        productId: prodMap['ITC-BMA-66G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-08',
        currentStock: 95,
        reservedStock: 15,
        damagedStock: 0,
        minStockAlert: 40,
        batchNumber: 'ITC-2604'
      },

      // HUL Stocks
      {
        productId: prodMap['HUL-SE-1KG']._id,
        warehouseLocation: 'Warehouse Main - Bay B-05',
        currentStock: 110,
        reservedStock: 10,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'HUL-2601'
      },
      {
        productId: prodMap['HUL-DOVE-3X100']._id,
        warehouseLocation: 'Warehouse Main - Bay B-08',
        currentStock: 80,
        reservedStock: 5,
        damagedStock: 0,
        minStockAlert: 20,
        batchNumber: 'HUL-2602'
      },
      {
        productId: prodMap['HUL-RL-500G']._id,
        warehouseLocation: 'Warehouse Main - Bay B-11',
        currentStock: 12, // LOW STOCK (min is 20)
        reservedStock: 2,
        damagedStock: 0,
        minStockAlert: 20,
        batchNumber: 'HUL-2603'
      },
      {
        productId: prodMap['HUL-LB-125G']._id,
        warehouseLocation: 'Warehouse Main - Bay B-12',
        currentStock: 160,
        reservedStock: 20,
        damagedStock: 3,
        minStockAlert: 35,
        batchNumber: 'HUL-2604'
      },

      // Britannia Stocks
      {
        productId: prodMap['BRIT-GD-480G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-02',
        currentStock: 140,
        reservedStock: 15,
        damagedStock: 1,
        minStockAlert: 20,
        batchNumber: 'BRIT-2601'
      },
      {
        productId: prodMap['BRIT-MG-250G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-03',
        currentStock: 220,
        reservedStock: 30,
        damagedStock: 0,
        minStockAlert: 30,
        batchNumber: 'BRIT-2602'
      },
      {
        productId: prodMap['BRIT-MB-100G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-04',
        currentStock: 0, // OUT OF STOCK
        reservedStock: 0,
        damagedStock: 4,
        minStockAlert: 25,
        batchNumber: 'BRIT-2603'
      },
      {
        productId: prodMap['BRIT-RSK-400G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-06',
        currentStock: 85,
        reservedStock: 5,
        damagedStock: 0,
        minStockAlert: 15,
        batchNumber: 'BRIT-2604'
      },

      // Parle Stocks
      {
        productId: prodMap['PARLE-G-250G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-18',
        currentStock: 320,
        reservedStock: 40,
        damagedStock: 2,
        minStockAlert: 40,
        batchNumber: 'PARLE-2601'
      },
      {
        productId: prodMap['PARLE-MON-200G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-19',
        currentStock: 110,
        reservedStock: 10,
        damagedStock: 0,
        minStockAlert: 20,
        batchNumber: 'PARLE-2602'
      },
      {
        productId: prodMap['PARLE-HS-120G']._id,
        warehouseLocation: 'Warehouse Main - Bay A-20',
        currentStock: 130,
        reservedStock: 15,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'PARLE-2603'
      },

      // Godrej Stocks
      {
        productId: prodMap['GDJ-GK-TWIN']._id,
        warehouseLocation: 'Warehouse Main - Bay B-18',
        currentStock: 75,
        reservedStock: 5,
        damagedStock: 1,
        minStockAlert: 20,
        batchNumber: 'GDJ-2601'
      },
      {
        productId: prodMap['GDJ-NO1-4X100']._id,
        warehouseLocation: 'Warehouse Main - Bay B-20',
        currentStock: 90,
        reservedStock: 10,
        damagedStock: 0,
        minStockAlert: 25,
        batchNumber: 'GDJ-2602'
      }
    ];

    await Stock.create(stockDocs);
    console.log(`Seeded Stock records for ${stockDocs.length} items`);

    // 7. Purchases from Manufacturers
    // ITC Purchase
    const purchase1 = await Purchase.create({
      poNumber: 'PO-2026-0001',
      manufacturerId: mfgMap['ITC'],
      manufacturerInvoiceNo: 'ITC-INV-88912',
      orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      status: 'Received',
      items: [
        {
          productId: prodMap['ITC-DF-75G']._id,
          orderedQty: 200,
          receivedQty: 200,
          damagedQty: 2,
          shortageQty: 0,
          unitPrice: 28.50,
          gstRate: 18,
          taxAmount: 1026,
          totalAmount: 6726
        },
        {
          productId: prodMap['ITC-MM-150G']._id,
          orderedQty: 150,
          receivedQty: 150,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 24.50,
          gstRate: 18,
          taxAmount: 661.50,
          totalAmount: 4336.50
        }
      ],
      subtotal: 9375,
      taxTotal: 1687.50,
      grandTotal: 11062.50,
      paidAmount: 11062.50,
      balanceAmount: 0,
      paymentStatus: 'Paid',
      verificationNotes: 'All boxes verified at Bay A. 2 Dark Fantasy packs damaged during transit.',
      receivedBy: 'R. Veeramani (Storekeeper)'
    });

    // Britannia Purchase
    const purchase2 = await Purchase.create({
      poNumber: 'PO-2026-0002',
      manufacturerId: mfgMap['BRITANNIA'],
      manufacturerInvoiceNo: 'BRIT-INV-44129',
      orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'Ordered',
      items: [
        {
          productId: prodMap['BRIT-GD-480G']._id,
          orderedQty: 150,
          receivedQty: 0,
          unitPrice: 92.00,
          gstRate: 18,
          taxAmount: 2484,
          totalAmount: 16284
        },
        {
          productId: prodMap['BRIT-MB-100G']._id,
          orderedQty: 100,
          receivedQty: 0,
          unitPrice: 14.80,
          gstRate: 18,
          taxAmount: 266.40,
          totalAmount: 1746.40
        }
      ],
      subtotal: 15280,
      taxTotal: 2750.40,
      grandTotal: 18030.40,
      paidAmount: 0,
      balanceAmount: 18030.40,
      paymentStatus: 'Unpaid',
      verificationNotes: 'Pending delivery from Britannia Ambattur warehouse'
    });

    // Femi9 Healthcare Purchase
    const purchaseFemi9 = await Purchase.create({
      poNumber: 'PO-2026-0003',
      manufacturerId: mfgMap['FEMI9'],
      manufacturerInvoiceNo: 'FEMI9-INV-10928',
      orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expectedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'Received',
      items: [
        {
          productId: prodMap['FEMI9-PAD-XL']._id,
          orderedQty: 150,
          receivedQty: 150,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 95.00,
          gstRate: 12,
          taxAmount: 1710,
          totalAmount: 15960
        },
        {
          productId: prodMap['FEMI9-PAD-XXL']._id,
          orderedQty: 100,
          receivedQty: 100,
          damagedQty: 1,
          shortageQty: 0,
          unitPrice: 135.00,
          gstRate: 12,
          taxAmount: 1620,
          totalAmount: 15120
        },
        {
          productId: prodMap['FEMI9-WASH-100ML']._id,
          orderedQty: 50,
          receivedQty: 50,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 145.00,
          gstRate: 18,
          taxAmount: 1305,
          totalAmount: 8555
        }
      ],
      subtotal: 35000,
      taxTotal: 4635,
      grandTotal: 39635,
      paidAmount: 25000,
      balanceAmount: 14635,
      paymentStatus: 'Partially Paid',
      verificationNotes: 'Stock verified at Hygiene Bay D. Direct shipment from Chennai plant.',
      receivedBy: 'R. Veeramani (Storekeeper)'
    });

    // Mansara Foods Purchase
    const purchaseMansara = await Purchase.create({
      poNumber: 'PO-2026-0004',
      manufacturerId: mfgMap['MANSARA'],
      manufacturerInvoiceNo: 'MANS-INV-55421',
      orderDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expectedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'Received',
      items: [
        {
          productId: prodMap['MANS-KUL-200G']._id,
          orderedQty: 200,
          receivedQty: 200,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 42.00,
          gstRate: 12,
          taxAmount: 1008,
          totalAmount: 9408
        },
        {
          productId: prodMap['MANS-PDR-250G']._id,
          orderedQty: 120,
          receivedQty: 120,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 55.00,
          gstRate: 5,
          taxAmount: 330,
          totalAmount: 6930
        },
        {
          productId: prodMap['MANS-OIL-500ML']._id,
          orderedQty: 60,
          receivedQty: 60,
          damagedQty: 0,
          shortageQty: 0,
          unitPrice: 172.00,
          gstRate: 5,
          taxAmount: 516,
          totalAmount: 10836
        }
      ],
      subtotal: 25340,
      taxTotal: 1854,
      grandTotal: 27194,
      paidAmount: 20000,
      balanceAmount: 7194,
      paymentStatus: 'Partially Paid',
      verificationNotes: 'Fresh batches received from Madurai factory unit.',
      receivedBy: 'R. Veeramani (Storekeeper)'
    });

    console.log('Seeded Purchase Orders for ITC, Britannia, Femi9, and Mansara Foods');

    // 8. Schemes & Promotions
    const schemes = await Scheme.create([
      {
        title: 'Good Day Bulk Dealer Incentive',
        code: 'SCH-GD-10PLUS1',
        description: 'Buy 10 Boxes of Britannia Good Day Butter Cookies, Get 1 Box Free',
        type: 'BUY_X_GET_Y',
        applicableProducts: [prodMap['BRIT-GD-480G']._id],
        minQuantity: 10,
        freeQuantity: 1,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'Active',
        usageCount: 14
      },
      {
        title: 'Monsoon Fast-Moving FMCG Slab Discount',
        code: 'SCH-SLAB-5PCT',
        description: '5% instant cash discount on bulk purchase of 50+ units across confectionery & biscuits',
        type: 'SLAB_DISCOUNT',
        applicableCategories: ['Biscuits & Cookies', 'Snacks & Namkeen'],
        minQuantity: 50,
        discountPercent: 5,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        status: 'Active',
        usageCount: 22
      }
    ]);

    console.log(`Seeded ${schemes.length} Schemes`);

    // 9. Store Orders & GST Invoices
    const order1 = await Order.create({
      orderNumber: 'ORD-2026-00001',
      storeId: stores[0]._id, // Sri Krishna Supermarket
      salesmanId: salesmen[0]._id, // Murugan
      orderDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'Delivered',
      items: [
        {
          productId: prodMap['ITC-DF-75G']._id,
          productName: prodMap['ITC-DF-75G'].name,
          sku: prodMap['ITC-DF-75G'].sku,
          quantity: 20,
          freeQuantity: 0,
          unitPrice: 32.00,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: 18,
          taxAmount: 115.20,
          total: 755.20
        },
        {
          productId: prodMap['BRIT-GD-480G']._id,
          productName: prodMap['BRIT-GD-480G'].name,
          sku: prodMap['BRIT-GD-480G'].sku,
          quantity: 10,
          freeQuantity: 1, // Scheme applied
          unitPrice: 102.00,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: 18,
          taxAmount: 183.60,
          total: 1203.60
        },
        {
          productId: prodMap['HUL-SE-1KG']._id,
          productName: prodMap['HUL-SE-1KG'].name,
          sku: prodMap['HUL-SE-1KG'].sku,
          quantity: 15,
          freeQuantity: 0,
          unitPrice: 124.00,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: 18,
          taxAmount: 334.80,
          total: 2194.80
        }
      ],
      subtotal: 3520.00,
      discountTotal: 0,
      taxTotal: 633.60,
      grandTotal: 4153.60,
      paymentType: 'Credit',
      deliveryNotes: 'Deliver before 11 AM to rear loading dock',
      approvedBy: 'Muralitharan',
      approvalDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    const invoice1 = await Invoice.create({
      invoiceNumber: 'INV-2026-00001',
      orderId: order1._id,
      storeId: stores[0]._id,
      salesmanId: salesmen[0]._id,
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: prodMap['ITC-DF-75G']._id,
          name: prodMap['ITC-DF-75G'].name,
          hsnCode: prodMap['ITC-DF-75G'].hsnCode,
          quantity: 20,
          freeQuantity: 0,
          unitPrice: 32.00,
          taxableValue: 640.00,
          gstRate: 18,
          cgstAmount: 57.60,
          sgstAmount: 57.60,
          taxAmount: 115.20,
          total: 755.20
        },
        {
          productId: prodMap['BRIT-GD-480G']._id,
          name: prodMap['BRIT-GD-480G'].name,
          hsnCode: prodMap['BRIT-GD-480G'].hsnCode,
          quantity: 10,
          freeQuantity: 1,
          unitPrice: 102.00,
          taxableValue: 1020.00,
          gstRate: 18,
          cgstAmount: 91.80,
          sgstAmount: 91.80,
          taxAmount: 183.60,
          total: 1203.60
        },
        {
          productId: prodMap['HUL-SE-1KG']._id,
          name: prodMap['HUL-SE-1KG'].name,
          hsnCode: prodMap['HUL-SE-1KG'].hsnCode,
          quantity: 15,
          freeQuantity: 0,
          unitPrice: 124.00,
          taxableValue: 1860.00,
          gstRate: 18,
          cgstAmount: 167.40,
          sgstAmount: 167.40,
          taxAmount: 334.80,
          total: 2194.80
        }
      ],
      taxableSubtotal: 3520.00,
      totalDiscount: 0,
      cgstTotal: 316.80,
      sgstTotal: 316.80,
      igstTotal: 0,
      taxTotal: 633.60,
      grandTotal: 4153.60,
      paidAmount: 2000.00,
      balanceAmount: 2153.60,
      status: 'Partially Paid',
      saleType: 'Credit',
      deliveryChallanNo: 'DC-INV-2026-00001'
    });

    order1.invoiceId = invoice1._id;
    await order1.save();

    // Delivery for Order 1
    const delivery1 = await Delivery.create({
      deliveryNumber: 'DEL-2026-00001',
      orderId: order1._id,
      invoiceId: invoice1._id,
      storeId: stores[0]._id,
      vehicleNumber: 'TN 09 AB 4591',
      driverName: 'R. Kandan',
      driverPhone: '+91 94440 12890',
      vehicleType: 'Tata Ace (Chhota Hathi)',
      dispatchDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      actualDeliveryDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'Delivered',
      receivedByName: 'P. Suresh (Store Receiving Manager)'
    });

    order1.deliveryId = delivery1._id;
    await order1.save();

    // Order 2: Pending Approval
    const order2 = await Order.create({
      orderNumber: 'ORD-2026-00002',
      storeId: stores[1]._id, // Murugan Dept Store, Madurai
      salesmanId: salesmen[1]._id, // Senthil Kumar
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      items: [
        {
          productId: prodMap['PARLE-G-250G']._id,
          productName: prodMap['PARLE-G-250G'].name,
          sku: prodMap['PARLE-G-250G'].sku,
          quantity: 40,
          unitPrice: 26.00,
          gstRate: 18,
          taxAmount: 187.20,
          total: 1227.20
        },
        {
          productId: prodMap['PARLE-HS-120G']._id,
          productName: prodMap['PARLE-HS-120G'].name,
          sku: prodMap['PARLE-HS-120G'].sku,
          quantity: 20,
          unitPrice: 33.00,
          gstRate: 18,
          taxAmount: 118.80,
          total: 778.80
        }
      ],
      subtotal: 1700.00,
      discountTotal: 0,
      taxTotal: 306.00,
      grandTotal: 2006.00,
      paymentType: 'Credit',
      deliveryNotes: 'Deliver along with weekly Madurai south route'
    });

    // Order 3: Approved & In Transit
    const order3 = await Order.create({
      orderNumber: 'ORD-2026-00003',
      storeId: stores[2]._id, // Annapoorna Coimbatore
      salesmanId: salesmen[2]._id,
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'Dispatched',
      items: [
        {
          productId: prodMap['HUL-DOVE-3X100']._id,
          productName: prodMap['HUL-DOVE-3X100'].name,
          sku: prodMap['HUL-DOVE-3X100'].sku,
          quantity: 20,
          unitPrice: 165.00,
          gstRate: 18,
          taxAmount: 594.00,
          total: 3894.00
        },
        {
          productId: prodMap['GDJ-GK-TWIN']._id,
          productName: prodMap['GDJ-GK-TWIN'].name,
          sku: prodMap['GDJ-GK-TWIN'].sku,
          quantity: 25,
          unitPrice: 134.00,
          gstRate: 18,
          taxAmount: 603.00,
          total: 3953.00
        }
      ],
      subtotal: 6650.00,
      discountTotal: 0,
      taxTotal: 1197.00,
      grandTotal: 7847.00,
      paymentType: 'Credit',
      approvedBy: 'Muralitharan',
      approvalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    const invoice3 = await Invoice.create({
      invoiceNumber: 'INV-2026-00002',
      orderId: order3._id,
      storeId: stores[2]._id,
      salesmanId: salesmen[2]._id,
      invoiceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: prodMap['HUL-DOVE-3X100']._id,
          name: prodMap['HUL-DOVE-3X100'].name,
          hsnCode: prodMap['HUL-DOVE-3X100'].hsnCode,
          quantity: 20,
          unitPrice: 165.00,
          taxableValue: 3300.00,
          gstRate: 18,
          cgstAmount: 297.00,
          sgstAmount: 297.00,
          taxAmount: 594.00,
          total: 3894.00
        },
        {
          productId: prodMap['GDJ-GK-TWIN']._id,
          name: prodMap['GDJ-GK-TWIN'].name,
          hsnCode: prodMap['GDJ-GK-TWIN'].hsnCode,
          quantity: 25,
          unitPrice: 134.00,
          taxableValue: 3350.00,
          gstRate: 18,
          cgstAmount: 301.50,
          sgstAmount: 301.50,
          taxAmount: 603.00,
          total: 3953.00
        }
      ],
      taxableSubtotal: 6650.00,
      totalDiscount: 0,
      cgstTotal: 598.50,
      sgstTotal: 598.50,
      igstTotal: 0,
      taxTotal: 1197.00,
      grandTotal: 7847.00,
      paidAmount: 0,
      balanceAmount: 7847.00,
      status: 'Unpaid',
      saleType: 'Credit',
      eWayBillNo: '',
      deliveryChallanNo: 'DC-INV-2026-00002'
    });

    const delivery3 = await Delivery.create({
      deliveryNumber: 'DEL-2026-00002',
      orderId: order3._id,
      invoiceId: invoice3._id,
      storeId: stores[2]._id,
      vehicleNumber: 'TN 38 CB 7714',
      driverName: 'M. Selvaraj',
      driverPhone: '+91 98421 88990',
      vehicleType: 'Mahindra Bolero Pickup',
      dispatchDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      estimatedDeliveryDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: 'In Transit'
    });

    order3.invoiceId = invoice3._id;
    order3.deliveryId = delivery3._id;
    await order3.save();

    // Order 4: Ponmani Mart - Featuring Femi9 & Mansara Foods
    const order4 = await Order.create({
      orderNumber: 'ORD-2026-00004',
      storeId: stores[5]._id, // Ponmani Mart, Anna Nagar Chennai
      salesmanId: salesmen[0]._id, // Murugan P
      orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'Delivered',
      items: [
        {
          productId: prodMap['FEMI9-PAD-XL']._id,
          productName: prodMap['FEMI9-PAD-XL'].name,
          sku: prodMap['FEMI9-PAD-XL'].sku,
          quantity: 25,
          unitPrice: 112.00,
          gstRate: 12,
          taxAmount: 336.00,
          total: 3136.00
        },
        {
          productId: prodMap['FEMI9-PAD-XXL']._id,
          productName: prodMap['FEMI9-PAD-XXL'].name,
          sku: prodMap['FEMI9-PAD-XXL'].sku,
          quantity: 15,
          unitPrice: 155.00,
          gstRate: 12,
          taxAmount: 279.00,
          total: 2604.00
        },
        {
          productId: prodMap['MANS-KUL-200G']._id,
          productName: prodMap['MANS-KUL-200G'].name,
          sku: prodMap['MANS-KUL-200G'].sku,
          quantity: 30,
          unitPrice: 50.00,
          gstRate: 12,
          taxAmount: 180.00,
          total: 1680.00
        },
        {
          productId: prodMap['MANS-OIL-500ML']._id,
          productName: prodMap['MANS-OIL-500ML'].name,
          sku: prodMap['MANS-OIL-500ML'].sku,
          quantity: 12,
          unitPrice: 195.00,
          gstRate: 5,
          taxAmount: 117.00,
          total: 2457.00
        }
      ],
      subtotal: 8900.00,
      discountTotal: 0,
      taxTotal: 977.00,
      grandTotal: 9877.00,
      paymentType: 'Credit',
      deliveryNotes: 'Ponmani Mart Anna Nagar front shelf replenishment',
      approvedBy: 'Muralitharan',
      approvalDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    const invoice4 = await Invoice.create({
      invoiceNumber: 'INV-2026-00003',
      orderId: order4._id,
      storeId: stores[5]._id,
      salesmanId: salesmen[0]._id,
      invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: prodMap['FEMI9-PAD-XL']._id,
          name: prodMap['FEMI9-PAD-XL'].name,
          hsnCode: prodMap['FEMI9-PAD-XL'].hsnCode,
          quantity: 25,
          unitPrice: 112.00,
          taxableValue: 2800.00,
          gstRate: 12,
          cgstAmount: 168.00,
          sgstAmount: 168.00,
          taxAmount: 336.00,
          total: 3136.00
        },
        {
          productId: prodMap['FEMI9-PAD-XXL']._id,
          name: prodMap['FEMI9-PAD-XXL'].name,
          hsnCode: prodMap['FEMI9-PAD-XXL'].hsnCode,
          quantity: 15,
          unitPrice: 155.00,
          taxableValue: 2325.00,
          gstRate: 12,
          cgstAmount: 139.50,
          sgstAmount: 139.50,
          taxAmount: 279.00,
          total: 2604.00
        },
        {
          productId: prodMap['MANS-KUL-200G']._id,
          name: prodMap['MANS-KUL-200G'].name,
          hsnCode: prodMap['MANS-KUL-200G'].hsnCode,
          quantity: 30,
          unitPrice: 50.00,
          taxableValue: 1500.00,
          gstRate: 12,
          cgstAmount: 90.00,
          sgstAmount: 90.00,
          taxAmount: 180.00,
          total: 1680.00
        },
        {
          productId: prodMap['MANS-OIL-500ML']._id,
          name: prodMap['MANS-OIL-500ML'].name,
          hsnCode: prodMap['MANS-OIL-500ML'].hsnCode,
          quantity: 12,
          unitPrice: 195.00,
          taxableValue: 2340.00,
          gstRate: 5,
          cgstAmount: 58.50,
          sgstAmount: 58.50,
          taxAmount: 117.00,
          total: 2457.00
        }
      ],
      taxableSubtotal: 8965.00,
      totalDiscount: 0,
      cgstTotal: 456.00,
      sgstTotal: 456.00,
      igstTotal: 0,
      taxTotal: 912.00,
      grandTotal: 9877.00,
      paidAmount: 5000.00,
      balanceAmount: 4877.00,
      status: 'Partially Paid',
      saleType: 'Credit',
      deliveryChallanNo: 'DC-INV-2026-00003'
    });

    order4.invoiceId = invoice4._id;
    await order4.save();

    console.log('Seeded Orders, GST Invoices, and Deliveries');

    // 10. Payments (Store Collections + Manufacturer Disbursements)
    await Payment.create([
      {
        paymentNumber: 'COL-2026-00001',
        paymentType: 'Store_Collection',
        storeId: stores[0]._id,
        salesmanId: salesmen[0]._id,
        invoiceId: invoice1._id,
        amount: 2000,
        paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paymentMode: 'UPI',
        referenceNumber: 'UPI/329481928471',
        status: 'Completed',
        notes: 'Partial payment against INV-2026-00001 via GooglePay',
        recordedBy: 'Murugan P'
      },
      {
        paymentNumber: 'COL-2026-00002',
        paymentType: 'Store_Collection',
        storeId: stores[1]._id,
        salesmanId: salesmen[1]._id,
        amount: 15000,
        paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        paymentMode: 'Cheque',
        referenceNumber: 'CHQ-882910',
        bankName: 'Canara Bank',
        status: 'Completed',
        notes: 'Weekly clearance against ledger outstanding',
        recordedBy: 'Senthil Kumar'
      },
      {
        paymentNumber: 'COL-2026-00003',
        paymentType: 'Store_Collection',
        storeId: stores[5]._id,
        salesmanId: salesmen[0]._id,
        invoiceId: invoice4._id,
        amount: 5000,
        paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paymentMode: 'NEFT/RTGS',
        referenceNumber: 'UTR-IOB202609918',
        bankName: 'Indian Overseas Bank',
        status: 'Completed',
        notes: 'Partial payment against Ponmani Mart invoice for Femi9 & Mansara goods',
        recordedBy: 'Murugan P'
      },
      {
        paymentNumber: 'PAY-2026-00001',
        paymentType: 'Manufacturer_Payment',
        manufacturerId: mfgMap['ITC'],
        purchaseId: purchase1._id,
        amount: 11062.50,
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paymentMode: 'NEFT/RTGS',
        referenceNumber: 'UTR-HDFC260981920',
        bankName: 'HDFC Bank',
        status: 'Completed',
        notes: 'Full payment for PO-2026-0001 to ITC Ltd',
        recordedBy: 'Admin'
      },
      {
        paymentNumber: 'PAY-2026-00002',
        paymentType: 'Manufacturer_Payment',
        manufacturerId: mfgMap['FEMI9'],
        purchaseId: purchaseFemi9._id,
        amount: 25000.00,
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paymentMode: 'NEFT/RTGS',
        referenceNumber: 'UTR-ICICI26091028',
        bankName: 'ICICI Bank',
        status: 'Completed',
        notes: 'Advance disbursement to Femi9 Healthcare for PO-2026-0003',
        recordedBy: 'Admin'
      },
      {
        paymentNumber: 'PAY-2026-00003',
        paymentType: 'Manufacturer_Payment',
        manufacturerId: mfgMap['MANSARA'],
        purchaseId: purchaseMansara._id,
        amount: 20000.00,
        paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paymentMode: 'NEFT/RTGS',
        referenceNumber: 'UTR-HDFC26093318',
        bankName: 'HDFC Bank',
        status: 'Completed',
        notes: 'Part payment to Mansara Foods for PO-2026-0004',
        recordedBy: 'Admin'
      }
    ]);

    console.log('Seeded Payments & Collections');

    // 11. Salesman Field Visits
    await SalesmanVisit.create([
      {
        salesmanId: salesmen[0]._id,
        storeId: stores[0]._id,
        visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        checkInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'Completed',
        purpose: 'Payment Collection',
        notes: 'Met Mr. Balasubramanian. Collected ₹2,000 partial payment. Store requested new batch of Dark Fantasy for weekend rush.',
        paymentCollectedAmount: 2000,
        paymentMode: 'UPI',
        locationLat: 13.0418,
        locationLng: 80.2341
      },
      {
        salesmanId: salesmen[1]._id,
        storeId: stores[1]._id,
        visitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'Completed',
        purpose: 'Order Booking',
        notes: 'Booked Order ORD-2026-00002 for Parle biscuits.',
        orderCreatedId: order2._id,
        orderValue: 2006.00,
        locationLat: 9.9252,
        locationLng: 78.1198
      }
    ]);

    console.log('Seeded Salesman field visits');

    // 12. Stock Ledger initial entries
    await StockLedger.create([
      {
        productId: products[0]._id,
        transactionType: 'INWARD_PURCHASE',
        referenceType: 'Purchase',
        referenceId: 'PO-2026-0001',
        quantity: 198,
        balanceBefore: 0,
        balanceAfter: 198,
        notes: 'Initial inward from ITC PO-2026-0001 (2 units damaged in transit)'
      },
      {
        productId: products[0]._id,
        transactionType: 'OUTWARD_SALE',
        referenceType: 'Invoice',
        referenceId: 'INV-2026-00001',
        quantity: -20,
        balanceBefore: 198,
        balanceAfter: 178,
        notes: 'Sold to Sri Krishna Supermarket via INV-2026-00001'
      }
    ]);

    console.log('Seeded Stock Ledger entries');

    console.log('\n======================================================');
    console.log(' TAMIL ENTERPRISES ERP SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Test Logins:');
    console.log('1. Owner / Admin:');
    console.log('   Email:    admin@tamilenterprises.com');
    console.log('   Password: admin123');
    console.log('2. Sales Executive (Field):');
    console.log('   Email:    murugan@tamilenterprises.com');
    console.log('   Password: sales123');
    console.log('3. Retail Store Portal:');
    console.log('   Email:    store@srikrishnastores.com');
    console.log('   Password: store123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
