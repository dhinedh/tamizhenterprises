const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');

async function recalculate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  require('../models/Product');
  require('../models/Store');
  require('../models/Customer');
  const Invoice = require('../models/Invoice');
  const Product = require('../models/Product');

  const products = await Product.find({});
  const productMap = {};
  products.forEach(p => {
    productMap[p._id.toString()] = p;
  });

  const invoices = await Invoice.find({});
  console.log(`Found ${invoices.length} invoices to verify and recalculate.`);

  for (const inv of invoices) {
    let invTaxableSubtotal = 0;
    let invTaxTotal = 0;
    let invGrandTotal = 0;
    let invTotalDiscount = 0;

    for (const it of inv.items) {
      const prod = it.productId ? productMap[it.productId.toString()] : null;
      const qty = Number(it.quantity || 0);
      const finalSellingPrice = Number(it.rateInclTax || it.unitPrice || 0);
      const mrp = Number(it.mrp || prod?.mrp || finalSellingPrice || 0);
      const gstRate = it.gstRate !== undefined && it.gstRate !== null
        ? Number(it.gstRate)
        : (prod?.gstRate !== undefined && prod?.gstRate !== null ? Number(prod.gstRate) : 0);

      const rateInclTax = finalSellingPrice;
      const rateExclTax = gstRate > 0 ? (finalSellingPrice / (1 + gstRate / 100)) : finalSellingPrice;

      const gross = qty * finalSellingPrice;
      let discAmt = Number(it.discountAmount || 0);
      const discPct = Number(it.discountPercent || 0);
      if (discAmt === 0 && discPct > 0) {
        discAmt = (gross * discPct) / 100;
      }

      const lineTotal = Math.max(0, gross - discAmt);
      const lineTaxable = gstRate > 0 ? (lineTotal / (1 + gstRate / 100)) : lineTotal;
      const lineTax = lineTotal - lineTaxable;

      it.mrp = mrp;
      it.unitPrice = finalSellingPrice;
      it.rateInclTax = Math.round(rateInclTax * 100) / 100;
      it.rateExclTax = Math.round(rateExclTax * 100) / 100;
      it.gstRate = gstRate;
      it.discountPercent = discPct;
      it.discountAmount = Math.round(discAmt * 100) / 100;
      it.taxableValue = Math.round(lineTaxable * 100) / 100;
      it.taxAmount = Math.round(lineTax * 100) / 100;
      it.total = Math.round(lineTotal * 100) / 100;
      it.cgstAmount = Math.round((lineTax / 2) * 100) / 100;
      it.sgstAmount = Math.round((lineTax / 2) * 100) / 100;
      it.igstAmount = 0;

      invTaxableSubtotal += lineTaxable;
      invTaxTotal += lineTax;
      invGrandTotal += lineTotal;
      invTotalDiscount += discAmt;
    }

    inv.taxableSubtotal = Math.round(invTaxableSubtotal * 100) / 100;
    inv.taxTotal = Math.round(invTaxTotal * 100) / 100;
    inv.cgstTotal = Math.round((invTaxTotal / 2) * 100) / 100;
    inv.sgstTotal = Math.round((invTaxTotal / 2) * 100) / 100;
    inv.igstTotal = 0;
    inv.totalDiscount = Math.round(invTotalDiscount * 100) / 100;
    inv.grandTotal = Math.round(invGrandTotal);

    await inv.save();
    console.log(`Invoice #${inv.invoiceNumber}: Taxable = ₹ ${inv.taxableSubtotal}, Tax = ₹ ${inv.taxTotal}, Grand Total = ₹ ${inv.grandTotal}`);
  }

  console.log('Recalculation complete!');
  process.exit(0);
}

recalculate().catch(err => {
  console.error('Recalculation error:', err);
  process.exit(1);
});
