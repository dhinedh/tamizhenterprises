const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { numberToWordsINR } = require('./numberToWords');

// Company Default Profile matching Invoice_16.pdf reference exactly
const COMPANY_DEFAULTS = {
  companyName: 'Tamizh Enterprises',
  addressLine1: '10-A,hospital road',
  addressLine2: 'cholapuram',
  city: 'ambattur',
  state: 'Tamil Nadu',
  pincode: '600053',
  gstin: '33AGVPT5588R1ZW',
  contact: '9841433607',
  email: 'tamizhmozhi.enterprises@gmail.com',
  bankDetails: {
    accountName: 'TAMIZH ENTERPRISES',
    accountNumber: '134661900000504',
    bankName: 'Yes bank',
    branchName: 'Ambattur',
    ifscCode: 'YESB0001346',
    upiNumber: '9841433607'
  }
};

function formatCurrency(num) {
  const n = Number(num || 0);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function generateInvoicePDF(invoice, party, res, owner = null) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    autoFirstPage: true
  });

  doc.pipe(res);

  // Register fonts if available
  const fontsDir = path.join(__dirname, '../assets/fonts');
  const regularFontPath = path.join(fontsDir, 'DejaVuSans.ttf');
  const boldFontPath = path.join(fontsDir, 'DejaVuSans-Bold.ttf');
  const obliqueFontPath = path.join(fontsDir, 'DejaVuSans-Oblique.ttf');
  const boldObliqueFontPath = path.join(fontsDir, 'DejaVuSans-BoldOblique.ttf');

  let fontRegular = 'Helvetica';
  let fontBold = 'Helvetica-Bold';
  let fontOblique = 'Helvetica-Oblique';
  let fontBoldOblique = 'Helvetica-Bold';

  if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
    try {
      doc.registerFont('CustomRegular', regularFontPath);
      doc.registerFont('CustomBold', boldFontPath);
      if (fs.existsSync(obliqueFontPath)) doc.registerFont('CustomOblique', obliqueFontPath);
      if (fs.existsSync(boldObliqueFontPath)) doc.registerFont('CustomBoldOblique', boldObliqueFontPath);

      fontRegular = 'CustomRegular';
      fontBold = 'CustomBold';
      fontOblique = fs.existsSync(obliqueFontPath) ? 'CustomOblique' : 'CustomRegular';
      fontBoldOblique = fs.existsSync(boldObliqueFontPath) ? 'CustomBoldOblique' : 'CustomBold';
    } catch (e) {
      console.warn('Font registration fallback:', e.message);
    }
  }

  // Seller details (from owner or defaults)
  const seller = {
    companyName: owner?.companyName || COMPANY_DEFAULTS.companyName,
    addressLine1: owner?.addressLine1 || COMPANY_DEFAULTS.addressLine1,
    addressLine2: owner?.addressLine2 || COMPANY_DEFAULTS.addressLine2,
    city: owner?.city || COMPANY_DEFAULTS.city,
    state: owner?.state || COMPANY_DEFAULTS.state,
    pincode: owner?.pincode || COMPANY_DEFAULTS.pincode,
    gstin: owner?.gstin || COMPANY_DEFAULTS.gstin,
    contact: owner?.phone || COMPANY_DEFAULTS.contact,
    email: owner?.email || COMPANY_DEFAULTS.email,
    bankDetails: {
      accountName: owner?.bankDetails?.accountName || COMPANY_DEFAULTS.bankDetails.accountName,
      accountNumber: owner?.bankDetails?.accountNumber || COMPANY_DEFAULTS.bankDetails.accountNumber,
      bankName: owner?.bankDetails?.bankName || COMPANY_DEFAULTS.bankDetails.bankName,
      branchName: owner?.bankDetails?.branchName || COMPANY_DEFAULTS.bankDetails.branchName,
      ifscCode: owner?.bankDetails?.ifscCode || COMPANY_DEFAULTS.bankDetails.ifscCode,
      upiNumber: owner?.bankDetails?.upiNumber || COMPANY_DEFAULTS.bankDetails.upiNumber
    }
  };

  // Buyer / Consignee details
  const partyName = party?.name || 'Valued Customer';
  const partyAddress = party?.address || '';
  const partyGstin = party?.gstNumber || 'URP';
  const partyPhone = party?.phone || '';
  const partyDistrict = (party?.city || party?.district || 'CHENNAI').toUpperCase();

  // Coordinates matching Invoice_16.pdf exactly
  const leftX = 17.4;
  const rightX = 579.4;
  const midX = 308.1;
  const rightSubColX = 436.7;
  const totalW = rightX - leftX; // 562 pt

  // Table Column Xs
  const cols = [
    17.4,  // 0: Sl No left
    43.9,  // 1: Description left (Sl No W = 26.5)
    192.2, // 2: HSN/SAC left (Desc W = 148.3)
    239.4, // 3: Qty left (HSN W = 47.2)
    284.4, // 4: MRP left (Qty W = 45.0)
    318.6, // 5: Rate Excl left (MRP W = 34.2)
    369.8, // 6: Rate Incl left (Rate Excl W = 51.2)
    420.0, // 7: per left (Rate Incl W = 50.2)
    448.9, // 8: GST(%) left (per W = 28.9)
    488.1, // 9: Disc left (GST% W = 39.2)
    522.6, // 10: Amount left (Disc W = 34.5)
    579.4  // 11: Amount right (Amount W = 56.8)
  ];

  const strokeBorder = (x1, y1, x2, y2) => {
    doc.lineWidth(0.75).strokeColor('#000000').moveTo(x1, y1).lineTo(x2, y2).stroke();
  };

  // Determine Invoice Title: "Bill of Supply" if GST is 0% or composition, else "Tax Invoice"
  const isTaxInvoice = Number(invoice.taxTotal || 0) > 0;
  const titleText = isTaxInvoice ? 'Tax Invoice' : 'Bill of Supply';

  // --- PAGE 1 START ---
  const p1Top = 17.4;

  // 1. Top Title Bar (Y: 17.4 -> 46.7)
  strokeBorder(leftX, p1Top, rightX, p1Top);
  strokeBorder(leftX, 46.7, rightX, 46.7);
  doc.font(fontBold).fontSize(12.8).fillColor('#000000');
  doc.text(titleText, leftX, 28.2, { width: totalW, align: 'center' });

  // 2. Vertical border between Left (Seller/Buyer) and Right (Invoice Info)
  strokeBorder(midX, 46.7, midX, 413.2);

  // 3. Top-Left Seller Section (Y: 46.7 -> 177.1)
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 22.8, 51.5, { fit: [105.8, 106.4], align: 'center', valign: 'center' });
    } catch (e) {
      doc.rect(22.8, 51.5, 105.8, 106.4).strokeColor('#cccccc').stroke();
    }
  }

  // Seller Text
  const sellerTextX = 137.8;
  const sellerTextW = midX - sellerTextX - 2;

  doc.font(fontBold).fontSize(12.8).fillColor('#000000');
  doc.text(seller.companyName, sellerTextX, 51.9, { width: sellerTextW });

  doc.font(fontRegular).fontSize(9.0);
  doc.text(seller.addressLine1, sellerTextX, 70.1, { width: sellerTextW });
  doc.text(seller.addressLine2, sellerTextX, 85.5, { width: sellerTextW });
  doc.text(`${seller.city}, ${seller.state} - ${seller.pincode}`, sellerTextX, 100.9, { width: sellerTextW });

  // GSTIN
  doc.font(fontBold).text('GSTIN/UIN : ', sellerTextX, 116.2, { continued: true });
  doc.font(fontRegular).text(seller.gstin);

  // Contact
  doc.font(fontBold).text('Contact : ', sellerTextX, 131.6, { continued: true });
  doc.font(fontRegular).text(seller.contact);

  // Email
  doc.font(fontBold).text('Email : ', sellerTextX, 147.0);
  doc.font(fontRegular).fontSize(8.0).text(seller.email, sellerTextX, 162.3, { width: sellerTextW });

  strokeBorder(leftX, 177.1, midX, 177.1);

  // 4. Middle-Left Consignee (Ship to) (Y: 177.1 -> 295.2)
  const custX = 17.8;
  const custW = midX - custX - 4;

  doc.font(fontRegular).fontSize(9.0).fillColor('#000000');
  doc.text('Consignee (Ship to):', custX, 188.2);

  doc.font(fontBold).fontSize(9.0);
  doc.text(partyName, custX, 203.5, { width: custW });

  doc.font(fontRegular).fontSize(8.5);
  doc.text(partyAddress || '-', custX, 234.3, { width: custW });

  doc.font(fontRegular).fontSize(9.0);
  doc.text(`GSTIN: ${partyGstin}`, custX, 249.6);
  doc.text(`Mobile: ${partyPhone || '-'}`, custX, 265.0);
  doc.text(`State : , District: ${partyDistrict}`, custX, 280.4);

  strokeBorder(leftX, 295.2, midX, 295.2);

  // 5. Bottom-Left Buyer (Bill to) (Y: 295.2 -> 413.2)
  doc.font(fontRegular).fontSize(9.0);
  doc.text('Buyer (Bill to):', custX, 306.2);

  doc.font(fontBold).fontSize(9.0);
  doc.text(partyName, custX, 321.6, { width: custW });

  doc.font(fontRegular).fontSize(8.5);
  doc.text(partyAddress || '-', custX, 352.3, { width: custW });

  doc.font(fontRegular).fontSize(9.0);
  doc.text(`GSTIN: ${partyGstin}`, custX, 367.7);
  doc.text(`Mobile: ${partyPhone || '-'}`, custX, 383.1);
  doc.text(`State : , District: ${partyDistrict}`, custX, 398.4);

  // 6. Right Side Grid (X: 308.1 -> 579.4, Y: 46.7 -> 413.2)
  const rightGridLines = [84.1, 107.4, 130.6, 153.9, 177.1, 200.4, 413.2];
  rightGridLines.forEach((y) => strokeBorder(midX, y, rightX, y));

  // Vertical divider between right sub-columns (Y: 46.7 to 200.4)
  strokeBorder(rightSubColX, 46.7, rightSubColX, 200.4);

  const colR1_X = midX + 6;
  const colR2_X = rightSubColX + 6;

  // Format invoice number to clean standard
  let displayInvNo = String(invoice.invoiceNumber || '16');
  if (displayInvNo.includes('-')) {
    const parts = displayInvNo.split('-');
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) displayInvNo = lastPart;
  }

  // Row 1 (Y: 46.7 -> 84.1)
  doc.font(fontRegular).fontSize(8.2).text('Invoice #', colR1_X, 58.0);
  doc.font(fontBold).fontSize(9.0).text(displayInvNo, colR1_X, 70.1);

  doc.font(fontRegular).fontSize(8.2).text('Invoice Date:', colR2_X, 58.0);
  doc.font(fontBold).fontSize(9.0).text(formatDate(invoice.invoiceDate), colR2_X, 70.1);

  // Row 2 (Y: 84.1 -> 107.4)
  doc.font(fontRegular).fontSize(8.2).text('Delivery Note', colR1_X, 90.9);
  doc.font(fontRegular).fontSize(8.2).text('Mode/Terms of Payment', colR2_X, 90.9);

  // Row 3 (Y: 107.4 -> 130.6)
  doc.font(fontRegular).fontSize(8.2).text('Reference No. & Date', colR1_X, 116.2);
  doc.font(fontRegular).fontSize(8.2).text('Other References', colR2_X, 116.2);

  // Row 4 (Y: 130.6 -> 153.9)
  doc.font(fontRegular).fontSize(8.2).text("Buyer's Order No.", colR1_X, 137.4);
  doc.font(fontRegular).fontSize(8.2).text('Dated', colR2_X, 137.4);

  // Row 5 (Y: 153.9 -> 177.1)
  doc.font(fontRegular).fontSize(8.2).text('Dispatch Doc No.', colR1_X, 162.3);
  doc.font(fontRegular).fontSize(8.2).text('Delivery Note Date', colR2_X, 162.3);

  // Row 6 (Y: 177.1 -> 200.4)
  doc.font(fontRegular).fontSize(8.2).text('Dispatched through', colR1_X, 183.9);
  doc.font(fontRegular).fontSize(8.2).text('Destination', colR2_X, 183.9);

  // Row 7 (Y: 200.4 -> 413.2) - Terms of Delivery
  doc.font(fontRegular).fontSize(8.2).text('Terms of Delivery', colR1_X, 211.7);

  // 7. Products Table Header (Y: 413.2 -> 459.5)
  const thTop = 413.2;
  const thBottom = 459.5;
  strokeBorder(leftX, thTop, rightX, thTop);
  strokeBorder(leftX, thBottom, rightX, thBottom);

  cols.forEach((cx) => strokeBorder(cx, thTop, cx, thBottom));

  doc.font(fontRegular).fontSize(8.2).fillColor('#000000');
  doc.text('Sl\nNo.', cols[0], 421.3, { width: cols[1] - cols[0], align: 'center' });
  doc.text('Description of Goods', cols[1] + 4, 421.3, { width: cols[2] - cols[1] - 8, align: 'left' });
  doc.text('HSN/SAC', cols[2], 421.3, { width: cols[3] - cols[2], align: 'center' });
  doc.text('Quantity', cols[3], 421.3, { width: cols[4] - cols[3], align: 'center' });
  doc.text('MRP', cols[4] + 2, 421.3, { width: cols[5] - cols[4] - 4, align: 'right' });
  doc.text('Rate\n(Excl.\nTax)', cols[5] + 2, 421.3, { width: cols[6] - cols[5] - 4, align: 'right' });
  doc.text('Rate\n(Incl. Tax)', cols[6] + 2, 421.3, { width: cols[7] - cols[6] - 4, align: 'right' });
  doc.text('per', cols[7], 421.3, { width: cols[8] - cols[7], align: 'center' });
  doc.text('GST(%)', cols[8], 421.3, { width: cols[9] - cols[8], align: 'center' });
  doc.text('Disc', cols[9] + 2, 421.3, { width: cols[10] - cols[9] - 4, align: 'right' });
  doc.text('Amount', cols[10] + 2, 421.3, { width: cols[11] - cols[10] - 6, align: 'right' });

  // 8. Render Items Rows
  let currentY = thBottom;
  let totalQty = 0;
  const items = invoice.items || [];

  items.forEach((item, idx) => {
    const rowH = 30.0;
    const yText = currentY + 5.0;

    const qty = Number(item.quantity || 0);
    totalQty += qty;
    const unitStr = item.unit || 'Packs';
    const mrp = Number(item.mrp || (item.productId?.mrp) || item.unitPrice || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const gstRate = Number(item.gstRate || 0);
    const rateIncl = unitPrice * (1 + gstRate / 100);
    const discAmount = Number(item.discountAmount || 0);
    const discPct = Number(item.discountPercent || 0);
    const lineTotal = Number(item.total || (qty * unitPrice));

    // Sl No
    doc.font(fontRegular).fontSize(8.2).text(String(idx + 1), cols[0], yText, {
      width: cols[1] - cols[0],
      align: 'center'
    });

    // Description
    doc.font(fontBold).fontSize(8.2).text(item.name, cols[1] + 4, yText, {
      width: cols[2] - cols[1] - 8,
      align: 'left'
    });

    // HSN/SAC
    doc.font(fontRegular).fontSize(8.2).text(item.hsnCode || '96190010', cols[2], yText, {
      width: cols[3] - cols[2],
      align: 'center'
    });

    // Quantity
    doc.text(`${qty} ${unitStr}`, cols[3], yText, {
      width: cols[4] - cols[3],
      align: 'center'
    });

    // MRP
    doc.text(mrp.toFixed(2), cols[4] + 2, yText, {
      width: cols[5] - cols[4] - 4,
      align: 'right'
    });

    // Rate (Excl. Tax)
    doc.text(unitPrice.toFixed(2), cols[5] + 2, yText, {
      width: cols[6] - cols[5] - 4,
      align: 'right'
    });

    // Rate (Incl. Tax)
    doc.text(rateIncl.toFixed(2), cols[6] + 2, yText, {
      width: cols[7] - cols[6] - 4,
      align: 'right'
    });

    // per
    doc.text(unitStr, cols[7], yText, {
      width: cols[8] - cols[7],
      align: 'center'
    });

    // GST(%)
    doc.text(`${gstRate}%`, cols[8], yText, {
      width: cols[9] - cols[8],
      align: 'center'
    });

    // Disc
    doc.text(`${discAmount.toFixed(2)}\n(${discPct}%)`, cols[9] + 2, yText, {
      width: cols[10] - cols[9] - 4,
      align: 'right'
    });

    // Amount
    doc.text(formatCurrency(lineTotal), cols[10] + 2, yText, {
      width: cols[11] - cols[10] - 6,
      align: 'right'
    });

    // Draw column vertical dividers
    cols.forEach((cx) => strokeBorder(cx, currentY, cx, currentY + rowH));

    currentY += rowH;
  });

  strokeBorder(leftX, currentY, rightX, currentY);

  // 9. Subtotal Quantity Row (Height ~ 30 pt)
  const qtyRowH = 30.0;
  cols.forEach((cx) => strokeBorder(cx, currentY, cx, currentY + qtyRowH));

  doc.font(fontBold).fontSize(8.2).text(String(totalQty), cols[3], currentY + 6, {
    width: cols[4] - cols[3],
    align: 'center'
  });
  doc.text('Packs', cols[3], currentY + 18, {
    width: cols[4] - cols[3],
    align: 'center'
  });

  doc.text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 2, currentY + 6, {
    width: cols[11] - cols[10] - 6,
    align: 'right'
  });

  currentY += qtyRowH;
  strokeBorder(leftX, currentY, rightX, currentY);

  // 10. "Total" Row (Height ~ 18 pt)
  const totalRowH = 18.0;
  cols.forEach((cx) => strokeBorder(cx, currentY, cx, currentY + totalRowH));

  doc.font(fontBoldOblique).fontSize(8.2).text('Total', cols[1], currentY + 4, {
    width: cols[10] - cols[1] - 8,
    align: 'right'
  });

  doc.font(fontBold).fontSize(8.2).text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 2, currentY + 4, {
    width: cols[11] - cols[10] - 6,
    align: 'right'
  });

  currentY += totalRowH;
  strokeBorder(leftX, currentY, rightX, currentY);

  // 11. Amount Chargeable (in words) & E. & O.E (Height ~ 36 pt)
  const wordsRowH = 36.8;
  doc.font(fontRegular).fontSize(8.2).text('Amount Chargeable (in words)', leftX + 4, currentY + 4);
  doc.font('Times-Roman').fontSize(12.0).text('E. & O.E', rightX - 60, currentY + 4, { width: 56, align: 'right' });

  const amountInWords = numberToWordsINR(invoice.grandTotal, 'INR ');
  doc.font(fontBold).fontSize(9.0).text(amountInWords, leftX + 4, currentY + 21);

  strokeBorder(leftX, currentY, leftX, currentY + wordsRowH);
  strokeBorder(rightX, currentY, rightX, currentY + wordsRowH);
  currentY += wordsRowH;
  strokeBorder(leftX, currentY, rightX, currentY);

  // 12. HSN/SAC Tax Breakdown Table
  const hsnTableTop = currentY;
  const hsnMainCols = [
    17.4,  // 0: HSN/SAC left
    115.7, // 1: Taxable Value left
    200.1, // 2: CGST left
    331.9, // 3: SGST left
    463.7, // 4: Total Tax Amount left
    579.4  // 5: Right edge
  ];

  const hsnAllCols = [
    17.4,  // HSN/SAC left
    115.7, // Taxable Value left
    200.1, // CGST Rate left
    251.5, // CGST Amount left
    331.9, // SGST Rate left
    383.3, // SGST Amount left
    463.7, // Total Tax Amount left
    579.4  // Right edge
  ];

  const hsnH1 = 23.3;
  const hsnH2 = 13.6;
  const subH_Top = hsnTableTop + hsnH1;
  const hsnRowsTop = subH_Top + hsnH2;

  // Header 1 (Top half)
  strokeBorder(leftX, hsnTableTop, rightX, hsnTableTop);
  strokeBorder(leftX, subH_Top, rightX, subH_Top);
  hsnMainCols.forEach((cx) => strokeBorder(cx, hsnTableTop, cx, subH_Top));

  doc.font(fontRegular).fontSize(8.2).fillColor('#000000');
  doc.text('HSN/SAC', hsnMainCols[0], hsnTableTop + 6, { width: hsnMainCols[1] - hsnMainCols[0], align: 'center' });
  doc.text('Taxable\nValue', hsnMainCols[1], hsnTableTop + 2, { width: hsnMainCols[2] - hsnMainCols[1], align: 'center' });
  doc.text('CGST', hsnMainCols[2], hsnTableTop + 6, { width: hsnMainCols[3] - hsnMainCols[2], align: 'center' });
  doc.text('SGST', hsnMainCols[3], hsnTableTop + 6, { width: hsnMainCols[4] - hsnMainCols[3], align: 'center' });
  doc.text('Total\nTax Amount', hsnMainCols[4], hsnTableTop + 2, { width: hsnMainCols[5] - hsnMainCols[4], align: 'center' });

  // Sub-header 2 (Bottom half: Rate and Amount)
  strokeBorder(leftX, hsnRowsTop, rightX, hsnRowsTop);
  hsnAllCols.forEach((cx) => strokeBorder(cx, subH_Top, cx, hsnRowsTop));

  doc.text('Rate', hsnAllCols[2], subH_Top + 2, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center' });
  doc.text('Amount', hsnAllCols[3], subH_Top + 2, { width: hsnAllCols[4] - hsnAllCols[3], align: 'center' });
  doc.text('Rate', hsnAllCols[4], subH_Top + 2, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center' });
  doc.text('Amount', hsnAllCols[5], subH_Top + 2, { width: hsnAllCols[6] - hsnAllCols[5], align: 'center' });

  // Aggregate items by HSN Code
  const hsnMap = {};
  items.forEach((it) => {
    const code = it.hsnCode || '96190010';
    if (!hsnMap[code]) {
      hsnMap[code] = {
        taxable: 0,
        cgstRate: (it.gstRate || 0) / 2,
        cgstAmount: 0,
        sgstRate: (it.gstRate || 0) / 2,
        sgstAmount: 0,
        totalTax: 0
      };
    }
    const lineTaxable = Number(it.taxableValue || (it.quantity * it.unitPrice));
    const lineTax = Number(it.taxAmount || 0);
    hsnMap[code].taxable += lineTaxable;
    hsnMap[code].cgstAmount += lineTax / 2;
    hsnMap[code].sgstAmount += lineTax / 2;
    hsnMap[code].totalTax += lineTax;
  });

  let hsnRowY = hsnRowsTop;
  const hsnRowH = 13.5;

  Object.keys(hsnMap).forEach((hsn) => {
    const row = hsnMap[hsn];
    strokeBorder(leftX, hsnRowY + hsnRowH, rightX, hsnRowY + hsnRowH);
    hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnRowH));

    doc.font(fontRegular).fontSize(8.2);
    doc.text(hsn, hsnAllCols[0], hsnRowY + 2, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center' });
    doc.text(formatCurrency(row.taxable), hsnAllCols[1] + 2, hsnRowY + 2, { width: hsnAllCols[2] - hsnAllCols[1] - 4, align: 'right' });
    doc.text(`${row.cgstRate}%`, hsnAllCols[2], hsnRowY + 2, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center' });
    doc.text(formatCurrency(row.cgstAmount), hsnAllCols[3] + 2, hsnRowY + 2, { width: hsnAllCols[4] - hsnAllCols[3] - 4, align: 'right' });
    doc.text(`${row.sgstRate}%`, hsnAllCols[4], hsnRowY + 2, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center' });
    doc.text(formatCurrency(row.sgstAmount), hsnAllCols[5] + 2, hsnRowY + 2, { width: hsnAllCols[6] - hsnAllCols[5] - 4, align: 'right' });
    doc.text(formatCurrency(row.totalTax), hsnAllCols[6] + 2, hsnRowY + 2, { width: hsnAllCols[7] - hsnAllCols[6] - 4, align: 'right' });

    hsnRowY += hsnRowH;
  });

  // HSN Total Row
  strokeBorder(leftX, hsnRowY + hsnRowH, rightX, hsnRowY + hsnRowH);
  hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnRowH));

  doc.font(fontBold).fontSize(8.2);
  doc.text('Total', hsnAllCols[0], hsnRowY + 2, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center' });
  doc.text(formatCurrency(invoice.taxableSubtotal || invoice.grandTotal), hsnAllCols[1] + 2, hsnRowY + 2, {
    width: hsnAllCols[2] - hsnAllCols[1] - 4,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.cgstTotal || 0), hsnAllCols[3] + 2, hsnRowY + 2, {
    width: hsnAllCols[4] - hsnAllCols[3] - 4,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.sgstTotal || 0), hsnAllCols[5] + 2, hsnRowY + 2, {
    width: hsnAllCols[6] - hsnAllCols[5] - 4,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.taxTotal || 0), hsnAllCols[6] + 2, hsnRowY + 2, {
    width: hsnAllCols[7] - hsnAllCols[6] - 4,
    align: 'right'
  });

  hsnRowY += hsnRowH;

  // Outer border of Page 1
  strokeBorder(leftX, 17.4, leftX, hsnRowY);
  strokeBorder(rightX, 17.4, rightX, hsnRowY);

  // 13. Check if Bottom Section (Declaration, Bank, Signatures) fits on Page 1 or moves to Page 2
  const bottomSectionHeight = 152;
  const pageLimit = 805;

  let bTop = hsnRowY;
  let isPage2 = false;

  if (bTop + bottomSectionHeight > pageLimit) {
    // Break to Page 2 (like in sample Invoice_16.pdf)
    doc.addPage();
    bTop = 17.4;
    isPage2 = true;
  }

  const bBottom = bTop + bottomSectionHeight;
  const p2MidX = 298.4;

  // Outer border of bottom section box
  strokeBorder(leftX, bTop, rightX, bTop);
  strokeBorder(leftX, bBottom, rightX, bBottom);
  strokeBorder(leftX, bTop, leftX, bBottom);
  strokeBorder(rightX, bTop, rightX, bBottom);

  // Tax Amount in words
  const taxInWords = numberToWordsINR(invoice.taxTotal, 'INR ');
  doc.font(fontRegular).fontSize(9.0).fillColor('#000000');
  doc.text(`Tax Amount (in words): ${taxInWords}`, leftX + 4, bTop + 13.6);

  // Declaration (Left side: leftX to p2MidX)
  const declY = bTop + 42.1;
  doc.font(fontBold).fontSize(9.0).text('Declaration:', leftX + 4, declY);
  // Underline for Declaration matching sample
  strokeBorder(leftX + 4, declY + 12.0, leftX + 63.3, declY + 12.0);

  doc.font(fontRegular).fontSize(8.5).text(
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    leftX + 4,
    declY + 14.3,
    { width: p2MidX - leftX - 12 }
  );

  // Bank Details (Right side: p2MidX to rightX)
  const bankX = p2MidX + 8;
  const b = seller.bankDetails;
  doc.font(fontRegular).fontSize(9.0);
  doc.text(`A/c Name     : ${b.accountName}`, bankX, bTop + 6.1);
  doc.text(`A/c Number  : ${b.accountNumber}`, bankX, bTop + 23.4);
  doc.text(`Bank Name   : ${b.bankName}`, bankX, bTop + 42.1);
  doc.text(`Branch Name : ${b.branchName}`, bankX, bTop + 56.4);
  doc.text(`IFS Code      : ${b.ifscCode}`, bankX, bTop + 75.1);
  doc.text(`UPI Number  : ${b.upiNumber}`, bankX, bTop + 92.4);

  // Divider above signature
  const sigLineY = bTop + 109.5;
  strokeBorder(leftX, sigLineY, rightX, sigLineY);
  strokeBorder(p2MidX, sigLineY, p2MidX, bBottom);

  // Left Sign: Customer's Seal and Signature
  doc.font(fontRegular).fontSize(8.2).text("Customer's Seal and Signature", leftX + 4, sigLineY + 3.4);

  // Right Sign: for Tamizh Enterprises / Authorised Signatory
  doc.font(fontBold).fontSize(8.2).text(`for ${seller.companyName}`, p2MidX, sigLineY + 3.4, {
    width: rightX - p2MidX - 6,
    align: 'right'
  });
  doc.font(fontRegular).fontSize(8.2).text('Authorised Signatory', p2MidX, bBottom - 11.0, {
    width: rightX - p2MidX - 6,
    align: 'right'
  });

  // Footer text outside the border
  doc.font(fontRegular).fontSize(9.0).fillColor('#000000');
  doc.text('This is a Computer Generated Invoice', leftX, bBottom + 2.4, {
    width: totalW,
    align: 'center'
  });

  doc.end();
}

module.exports = { generateInvoicePDF };
