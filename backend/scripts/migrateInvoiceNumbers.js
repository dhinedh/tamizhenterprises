require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Invoice = require('../models/Invoice');

  // Customer invoices
  const custInvs = await Invoice.find({ customerId: { $ne: null } }).sort({ invoiceDate: 1, createdAt: 1 });
  for (let i = 0; i < custInvs.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    custInvs[i].invoiceNumber = num;
    await custInvs[i].save();
    console.log(`Updated Customer Invoice ${custInvs[i]._id} to ${num}`);
  }

  // Shop invoices
  const shopInvs = await Invoice.find({ storeId: { $ne: null }, customerId: null }).sort({ invoiceDate: 1, createdAt: 1 });
  for (let i = 0; i < shopInvs.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    shopInvs[i].invoiceNumber = num;
    await shopInvs[i].save();
    console.log(`Updated Shop Invoice ${shopInvs[i]._id} to ${num}`);
  }

  console.log('Migration complete!');
  const all = await Invoice.find({}, { invoiceNumber: 1, customerId: 1, storeId: 1 });
  console.log('All Invoices:', JSON.stringify(all, null, 2));
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
