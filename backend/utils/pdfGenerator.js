const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoice, store, res) {
  const doc = new PDFDocument({ margin: 36, size: 'A4' });

  doc.pipe(res);

  // Header
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f766e').text('TAMIL ENTERPRISES', 36, 36);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text('Wholesale Distributor & FMCG Goods Dealer', 36, 58);
  doc.text('124, Goods Shed Road, Madurai - 625001, Tamil Nadu', 36, 70);
  doc.text('GSTIN: 33AABCT9988C1Z4 | Contact: +91 94432 10987 | Email: billing@tamilenterprises.com', 36, 82);

  // Badge / Title
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('TAX INVOICE', 420, 36, { align: 'right' });
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
    .text(`Invoice No: ${invoice.invoiceNumber}`, 420, 56, { align: 'right' })
    .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 420, 68, { align: 'right' })
    .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Immediate'}`, 420, 80, { align: 'right' });

  // Divider
  doc.moveTo(36, 102).lineTo(558, 102).strokeColor('#cbd5e1').lineWidth(1).stroke();

  // Bill To details
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Billed To (Customer Store):', 36, 112);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text(store ? store.name : 'Valued Retail Store', 36, 126);
  doc.font('Helvetica').fillColor('#475569')
    .text(`Contact: ${store ? store.ownerName : ''} (${store ? store.phone : ''})`, 36, 138)
    .text(`Address: ${store ? store.address : ''}, ${store ? store.city : ''} - ${store ? store.pincode : ''}`, 36, 150)
    .text(`GSTIN: ${store && store.gstNumber ? store.gstNumber : 'URP (Unregistered Person)'}`, 36, 162);

  // Invoice & Dispatch Info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Dispatch / Payment Info:', 350, 112);
  doc.fontSize(9).font('Helvetica').fillColor('#475569')
    .text(`Payment Terms: ${invoice.saleType || 'Credit'}`, 350, 126)
    .text(`Status: ${invoice.status}`, 350, 138)
    .text(`E-Way Bill: ${invoice.eWayBillNo || 'Not Applicable'}`, 350, 150)
    .text(`Delivery Challan: ${invoice.deliveryChallanNo || 'DC-' + invoice.invoiceNumber}`, 350, 162);

  // Table Header
  const tableTop = 185;
  doc.rect(36, tableTop, 522, 22).fill('#f1f5f9');
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b')
    .text('S.No', 42, tableTop + 6)
    .text('Item Description', 70, tableTop + 6)
    .text('HSN', 240, tableTop + 6)
    .text('Qty', 290, tableTop + 6, { width: 35, align: 'right' })
    .text('Rate (₹)', 335, tableTop + 6, { width: 50, align: 'right' })
    .text('GST%', 395, tableTop + 6, { width: 35, align: 'right' })
    .text('Tax (₹)', 435, tableTop + 6, { width: 45, align: 'right' })
    .text('Total (₹)', 490, tableTop + 6, { width: 60, align: 'right' });

  // Table rows
  let y = tableTop + 26;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');

  invoice.items.forEach((item, index) => {
    if (y > 700) {
      doc.addPage();
      y = 40;
    }
    const bg = index % 2 === 1 ? '#f8fafc' : '#ffffff';
    doc.rect(36, y - 3, 522, 18).fill(bg);

    doc.fillColor('#334155')
      .text(index + 1, 42, y)
      .text(item.name.substring(0, 32), 70, y)
      .text(item.hsnCode || '2106', 240, y)
      .text(`${item.quantity} ${item.freeQuantity ? `(+${item.freeQuantity})` : ''}`, 290, y, { width: 35, align: 'right' })
      .text(Number(item.unitPrice).toFixed(2), 335, y, { width: 50, align: 'right' })
      .text(`${item.gstRate}%`, 395, y, { width: 35, align: 'right' })
      .text(Number(item.taxAmount || 0).toFixed(2), 435, y, { width: 45, align: 'right' })
      .text(Number(item.total).toFixed(2), 490, y, { width: 60, align: 'right' });

    y += 20;
  });

  // Bottom Line
  doc.moveTo(36, y + 2).lineTo(558, y + 2).strokeColor('#cbd5e1').stroke();
  y += 10;

  // Totals Box
  const summaryTop = Math.max(y, 450);
  doc.fontSize(8).font('Helvetica').fillColor('#475569');
  doc.text('Bank Details for NEFT / RTGS Payment:', 36, summaryTop);
  doc.text('Account Name: TAMIL ENTERPRISES', 36, summaryTop + 14);
  doc.text('Bank: HDFC Bank, Goods Shed Road Branch', 36, summaryTop + 26);
  doc.text('A/C No: 50200088991234 | IFSC: HDFC0001244', 36, summaryTop + 38);
  doc.text('UPI ID: tamilenterprises@hdfcbank', 36, summaryTop + 50);

  // Summary box right side
  doc.rect(340, summaryTop - 4, 218, 95).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#475569')
    .text('Taxable Value:', 350, summaryTop + 4)
    .text(`₹ ${Number(invoice.taxableSubtotal).toFixed(2)}`, 450, summaryTop + 4, { align: 'right' })
    .text('Total CGST + SGST:', 350, summaryTop + 20)
    .text(`₹ ${Number(invoice.taxTotal).toFixed(2)}`, 450, summaryTop + 20, { align: 'right' })
    .text('Discount Applied:', 350, summaryTop + 36)
    .text(`- ₹ ${Number(invoice.totalDiscount || 0).toFixed(2)}`, 450, summaryTop + 36, { align: 'right' });

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f766e')
    .text('Grand Total:', 350, summaryTop + 55)
    .text(`₹ ${Number(invoice.grandTotal).toFixed(2)}`, 450, summaryTop + 55, { align: 'right' });

  doc.fontSize(8).font('Helvetica').fillColor('#dc2626')
    .text('Balance Outstanding:', 350, summaryTop + 75)
    .text(`₹ ${Number(invoice.balanceAmount).toFixed(2)}`, 450, summaryTop + 75, { align: 'right' });

  // Signatures
  const signY = summaryTop + 115;
  doc.fontSize(8).font('Helvetica').fillColor('#64748b')
    .text('Customer Seal & Signature', 60, signY + 30)
    .text('For TAMIL ENTERPRISES (Authorized Signatory)', 360, signY + 30);
  doc.moveTo(40, signY + 25).lineTo(180, signY + 25).strokeColor('#94a3b8').stroke();
  doc.moveTo(350, signY + 25).lineTo(540, signY + 25).strokeColor('#94a3b8').stroke();

  doc.end();
}

module.exports = { generateInvoicePDF };
