const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { numberToWordsINR } = require('./numberToWords');

// Company Default Profile matching reference invoices exactly
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

  doc.on('error', (err) => {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF Generation failed', error: err.message });
    }
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
  const partyPhone = party?.phone || '';
  const partyDistrict = (party?.city || party?.district || 'CHENNAI').toUpperCase();
  const partyState = party?.state || '';

  // Precise Coordinates matching the reference invoices exactly from user's file
  // Precise Coordinates matching the reference invoices exactly from user's file
  const leftX = 17.6;
  const rightX = 578.6;
  const midX = 297.8;
  const rightSubColX = 431.3;
  const totalW = rightX - leftX; // 561.0 pt

  // Table Column Xs matching user reference PDF exactly
  const cols = [
    17.6,  // 0: Sl No left
    44.3,  // 1: Description of Goods left
    209.3, // 2: HSN/SAC left
    254.3, // 3: Quantity left
    294.8, // 4: MRP left
    324.8, // 5: Rate (Excl. Tax) left
    378.8, // 6: Rate (Incl. Tax) left
    430.5, // 7: per left
    458.3, // 8: GST(%) left
    496.5, // 9: Disc left
    526.0, // 10: Amount left
    578.6  // 11: Right edge
  ];

  const strokeBorder = (x1, y1, x2, y2) => {
    doc.lineWidth(0.75).strokeColor('#000000').moveTo(x1, y1).lineTo(x2, y2).stroke();
  };

  // 1. Top Title Bar: "Bill of Supply" (Y: 17.6 -> 39.8, Height = 22.2 pt)
  const p1Top = 17.6;
  const titleH = 22.2;
  const titleBottom = p1Top + titleH; // 39.8

  strokeBorder(leftX, p1Top, rightX, p1Top);
  strokeBorder(leftX, titleBottom, rightX, titleBottom);
  doc.font(fontBold).fontSize(11.5).fillColor('#000000');
  doc.text('Bill of Supply', leftX, p1Top + 5.5, { width: totalW, align: 'center' });

  // 2. Dynamic Info & Products Table Layout based on number of items
  const items = invoice.items || [];
  const numItems = Math.max(1, items.length);

  // If 1-4 items: use the exact reference PDF geometry (info bottom at 296.3)
  // If > 4 items: dynamically compress info section and heights to keep everything on one page cleanly
  const isCompact = numItems > 4;

  const infoTop = titleBottom; // 39.8
  const infoBottom = isCompact ? 200.0 : 296.3;

  // Middle vertical border separating Left (Seller & Parties) and Right (Invoice & Shipping details)
  strokeBorder(midX, infoTop, midX, infoBottom);
  strokeBorder(leftX, infoBottom, rightX, infoBottom);

  // --- LEFT SIDE: 3 DISTINCT SECTIONS ---
  // When not compact: Seller (39.8 -> 153.0), Consignee (153.0 -> 225.0), Buyer (225.0 -> 296.3)
  const sellerDividerY = isCompact ? 107.0 : 153.0;
  const consigneeDividerY = isCompact ? 153.5 : 225.0;

  strokeBorder(leftX, sellerDividerY, midX, sellerDividerY);
  strokeBorder(leftX, consigneeDividerY, midX, consigneeDividerY);

  // Logo & Seller details
  let logoImg = null;
  if (owner?.logo && typeof owner.logo === 'string' && owner.logo.includes('base64,')) {
    try {
      logoImg = Buffer.from(owner.logo.split('base64,')[1], 'base64');
    } catch (e) {}
  }
  if (!logoImg) {
    const defaultLogoPng = path.join(__dirname, '../assets/logo.png');
    const defaultLogoJpg = path.join(__dirname, '../assets/logo.jpg');
    if (fs.existsSync(defaultLogoPng)) logoImg = defaultLogoPng;
    else if (fs.existsSync(defaultLogoJpg)) logoImg = defaultLogoJpg;
  }

  const logoH = isCompact ? 54.0 : 65.0;
  if (logoImg) {
    try {
      doc.image(logoImg, 22.0, infoTop + (isCompact ? 4.0 : 10.0), { fit: [logoH, logoH], align: 'center', valign: 'center' });
    } catch (e) {
      doc.circle(49.0, infoTop + 34.0, 28.0).strokeColor('#cccccc').stroke();
    }
  }

  // Seller Text
  const sellerTextX = 94.0;
  const sellerTextW = midX - sellerTextX - 4.0;
  const sTop = isCompact ? (infoTop + 2.5) : 48.0;
  const sLineH = isCompact ? 8.5 : 11.0;

  doc.font(fontBold).fontSize(isCompact ? 9.5 : 10.5).fillColor('#000000');
  doc.text(seller.companyName, sellerTextX, sTop, { width: sellerTextW });

  doc.font(fontRegular).fontSize(7.0).fillColor('#000000');
  doc.text(seller.addressLine1, sellerTextX, sTop + sLineH + 2.0, { width: sellerTextW });
  doc.text(seller.addressLine2, sellerTextX, sTop + (sLineH * 2) + 2.0, { width: sellerTextW });
  doc.text(
    `${seller.city}, ${seller.state} - ${seller.pincode}`,
    sellerTextX,
    sTop + (sLineH * 3) + 2.0,
    { width: sellerTextW }
  );

  doc.font(fontBold).fontSize(7.0).text('GSTIN/UIN : ', sellerTextX, sTop + (sLineH * 4) + 2.0, { continued: true });
  doc.font(fontBold).text(seller.gstin);

  doc.font(fontBold).text('Contact : ', sellerTextX, sTop + (sLineH * 5) + 2.0, { continued: true });
  doc.font(fontRegular).text(seller.contact);

  doc.font(fontBold).text('Email : ', sellerTextX, sTop + (sLineH * 6) + 2.0);
  doc.font(fontRegular).text(seller.email, sellerTextX, sTop + (sLineH * 7) + 2.0, { width: sellerTextW });

  // Section B: Consignee (Ship to)
  const partyTextX = 20.0;
  const partyTextW = midX - partyTextX - 4.0;
  const cTop = sellerDividerY + (isCompact ? 2.5 : 4.0);
  const cLineH = isCompact ? 9.0 : 12.0;

  doc.font(fontRegular).fontSize(7.0).fillColor('#333333');
  doc.text('Consignee (Ship to):', partyTextX, cTop);

  doc.font(fontBold).fontSize(8.0).fillColor('#000000');
  doc.text(partyName, partyTextX, cTop + cLineH, { width: partyTextW, ellipsis: true });

  doc.font(fontRegular).fontSize(7.0);
  doc.text(partyAddress || '-', partyTextX, cTop + (cLineH * 2), { width: partyTextW, height: 13, ellipsis: true });
  doc.text(`Mobile: ${partyPhone || '-'}`, partyTextX, cTop + (cLineH * 3));
  doc.text(`State : ${partyState}, District: ${partyDistrict}`, partyTextX, cTop + (cLineH * 4));

  // Section C: Buyer (Bill to)
  const bPartyTop = consigneeDividerY + (isCompact ? 2.5 : 4.0);
  doc.font(fontRegular).fontSize(7.0).fillColor('#333333');
  doc.text('Buyer (Bill to):', partyTextX, bPartyTop);

  doc.font(fontBold).fontSize(8.0).fillColor('#000000');
  doc.text(partyName, partyTextX, bPartyTop + cLineH, { width: partyTextW, ellipsis: true });

  doc.font(fontRegular).fontSize(7.0);
  doc.text(partyAddress || '-', partyTextX, bPartyTop + (cLineH * 2), { width: partyTextW, height: 13, ellipsis: true });
  doc.text(`Mobile: ${partyPhone || '-'}`, partyTextX, bPartyTop + (cLineH * 3));
  doc.text(`State : ${partyState}, District: ${partyDistrict}`, partyTextX, bPartyTop + (cLineH * 4));

  // --- RIGHT SIDE: 7 ROWS ---
  // In reference PDF: 75.0, 94.5, 114.0, 133.5, 153.0, 173.3
  const rightGridLines = isCompact
    ? [57.0, 75.0, 93.0, 111.0, 129.0, 147.0]
    : [75.0, 94.5, 114.0, 133.5, 153.0, 173.3];
  rightGridLines.forEach((y) => strokeBorder(midX, y, rightX, y));

  // Vertical divider between right sub-columns (doesn't cross Terms of Delivery!)
  const rSubColBottom = isCompact ? 147.0 : 173.3;
  strokeBorder(rightSubColX, infoTop, rightSubColX, rSubColBottom);

  const colR1_X = midX + 5.0;
  const colR2_X = rightSubColX + 5.0;

  let displayInvNo = String(invoice.invoiceNumber || '18');
  if (displayInvNo.includes('-')) {
    const parts = displayInvNo.split('-');
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) displayInvNo = lastPart;
  }

  if (!isCompact) {
    // Row 1 (39.8 -> 75.0)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice #', colR1_X, infoTop + 4.0);
    doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(displayInvNo, colR1_X, infoTop + 14.0);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice Date:', colR2_X, infoTop + 4.0);
    doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(formatDate(invoice.invoiceDate), colR2_X, infoTop + 14.0);

    // Row 2 (75.0 -> 94.5)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note', colR1_X, 77.0);
    if (invoice.deliveryChallanNo) {
      doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.deliveryChallanNo, colR1_X, 85.0);
    }
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Mode/Terms of Payment', colR2_X, 77.0);
    doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.saleType || 'Credit', colR2_X, 85.0);

    // Row 3 (94.5 -> 114.0)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Reference No. & Date', colR1_X, 97.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Other References', colR2_X, 97.0);

    // Row 4 (114.0 -> 133.5)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text("Buyer's Order No.", colR1_X, 116.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dated', colR2_X, 116.0);

    // Row 5 (133.5 -> 153.0)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatch Doc No.', colR1_X, 135.5);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note Date', colR2_X, 135.5);

    // Row 6 (153.0 -> 173.3)
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatched through', colR1_X, 155.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Destination', colR2_X, 155.0);

    // Row 7 (173.3 -> 296.3): Terms of Delivery
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Terms of Delivery', colR1_X, 175.5);
  } else {
    // Compact Right Side Rows
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice #', colR1_X, infoTop + 2.5);
    doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(displayInvNo, colR1_X, infoTop + 10.5);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice Date:', colR2_X, infoTop + 2.5);
    doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(formatDate(invoice.invoiceDate), colR2_X, infoTop + 10.5);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note', colR1_X, 59.0);
    if (invoice.deliveryChallanNo) {
      doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.deliveryChallanNo, colR1_X, 66.5);
    }
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Mode/Terms of Payment', colR2_X, 59.0);
    doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.saleType || 'Credit', colR2_X, 66.5);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Reference No. & Date', colR1_X, 77.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Other References', colR2_X, 77.0);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text("Buyer's Order No.", colR1_X, 95.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dated', colR2_X, 95.0);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatch Doc No.', colR1_X, 113.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note Date', colR2_X, 113.0);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatched through', colR1_X, 131.0);
    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Destination', colR2_X, 131.0);

    doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Terms of Delivery', colR1_X, 149.5);
  }

  // 3. Products Table Header (34.5 pt height matching reference PDF)
  const thTop = infoBottom;
  const thH = isCompact ? 22.0 : 34.5;
  const thBottom = thTop + thH;

  strokeBorder(leftX, thTop, rightX, thTop);
  strokeBorder(leftX, thBottom, rightX, thBottom);
  cols.forEach((cx) => strokeBorder(cx, thTop, cx, thBottom));

  doc.font(fontRegular).fontSize(7.5).fillColor('#000000');
  const hTextY = thTop + (isCompact ? 6.5 : 12.0);
  const hDoubleY = thTop + (isCompact ? 3.0 : 8.0);

  doc.text('Sl\nNo.', cols[0], hDoubleY, { width: cols[1] - cols[0], align: 'center' });
  doc.text('Description of Goods', cols[1] + 3.0, hTextY, { width: cols[2] - cols[1] - 6.0, align: 'left' });
  doc.text('HSN/SAC', cols[2], hTextY, { width: cols[3] - cols[2], align: 'center' });
  doc.text('Quantity', cols[3], hTextY, { width: cols[4] - cols[3], align: 'center' });
  doc.text('MRP', cols[4] + 1.0, hTextY, { width: cols[5] - cols[4] - 2.0, align: 'right' });
  doc.text('Rate (Excl.\nTax)', cols[5] + 1.0, hDoubleY, { width: cols[6] - cols[5] - 2.0, align: 'right' });
  doc.text('Rate (Incl.\nTax)', cols[6] + 1.0, hDoubleY, { width: cols[7] - cols[6] - 2.0, align: 'right' });
  doc.text('per', cols[7], hTextY, { width: cols[8] - cols[7], align: 'center' });
  doc.text('GST(%)', cols[8], hTextY, { width: cols[9] - cols[8], align: 'center' });
  doc.text('Disc', cols[9] + 1.0, hTextY, { width: cols[10] - cols[9] - 2.0, align: 'right' });
  doc.text('Amount', cols[10] + 1.0, hTextY, { width: cols[11] - cols[10] - 3.0, align: 'right' });

  // 4. Calculate Dynamic Layout based on Products & HSN
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

  const hsnCodes = Object.keys(hsnMap);
  const numHsn = Math.max(1, hsnCodes.length);
  const hsnRowH = isCompact ? 13.0 : 17.0;
  const hsnHeaderH = isCompact ? 24.0 : 30.0;
  const hsnTotalRowH = isCompact ? 13.0 : 17.0;
  const hsnTableHeight = hsnHeaderH + (numHsn * hsnRowH) + hsnTotalRowH;

  const qtyRowH = isCompact ? 20.0 : 32.2;
  const totalRowH = isCompact ? 16.0 : 18.0;
  const wordsRowH = isCompact ? 22.0 : 37.5;
  const bankAndDeclH = isCompact ? 75.0 : 111.8;
  const sigH = isCompact ? 42.0 : 53.6;
  const totalBottomH = qtyRowH + totalRowH + wordsRowH + hsnTableHeight + bankAndDeclH + sigH;

  // Maximum printable bottom on standard A4 page before footer text
  const maxBottomY = 762.4;
  const maxAvailableForItems = Math.max(80.0, maxBottomY - (thBottom + totalBottomH));
  const standardRowH = isCompact ? 22.0 : 30.8;
  const itemRowH = (items.length * standardRowH <= maxAvailableForItems)
    ? standardRowH
    : Math.max(14.0, maxAvailableForItems / items.length);

  // 5. Render Product Line Items starting directly at thBottom
  let totalQty = 0;
  let currentY = thBottom;

  items.forEach((item, idx) => {
    const rowTop = currentY;
    const rowBottom = currentY + itemRowH;
    const thisRowH = itemRowH;

    const qty = Number(item.quantity || 0);
    totalQty += qty;
    const unitStr = item.unit || 'Packs';
    const mrp = Number(item.mrp || item.productId?.mrp || item.unitPrice || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const gstRate = Number(item.gstRate || 0);
    const rateIncl = unitPrice * (1 + gstRate / 100);
    const discAmount = Number(item.discountAmount || 0);
    const discPct = Number(item.discountPercent || 0);
    const lineTotal = Number(item.total || qty * unitPrice);

    // Font size
    const fontSize = thisRowH >= 25.0 ? 7.2 : (thisRowH >= 20.0 ? 7.0 : 6.6);
    doc.fontSize(fontSize);

    const singleLineH = 9.0;
    const yText = rowTop + Math.max(2.0, (thisRowH - singleLineH) / 2);

    // Description text measurement & vertical centering
    const descText = item.name || item.productId?.name || 'Product';
    const descW = cols[2] - cols[1] - 6.0;
    doc.font(fontBold);
    const descMeasuredH = doc.heightOfString(descText, { width: descW });
    const yDesc = rowTop + Math.max(2.0, (thisRowH - Math.min(descMeasuredH, thisRowH - 4.0)) / 2);

    // Sl No
    doc.font(fontRegular).text(String(idx + 1), cols[0], yText, {
      width: cols[1] - cols[0],
      align: 'center',
      lineBreak: false
    });

    // Description
    doc.font(fontBold).text(descText, cols[1] + 3.0, yDesc, {
      width: descW,
      align: 'left',
      height: thisRowH - 3.0,
      ellipsis: true,
      lineGap: 1.5
    });

    // HSN/SAC
    doc.font(fontRegular).text(item.hsnCode || '96190010', cols[2], yText, {
      width: cols[3] - cols[2],
      align: 'center',
      lineBreak: false
    });

    // Quantity
    doc.text(`${qty} ${unitStr}`, cols[3], yText, {
      width: cols[4] - cols[3],
      align: 'center',
      lineBreak: false
    });

    // MRP
    doc.text(mrp.toFixed(2), cols[4] + 1.0, yText, {
      width: cols[5] - cols[4] - 2.0,
      align: 'right',
      lineBreak: false
    });

    // Rate (Excl. Tax)
    doc.text(unitPrice.toFixed(2), cols[5] + 1.0, yText, {
      width: cols[6] - cols[5] - 2.0,
      align: 'right',
      lineBreak: false
    });

    // Rate (Incl. Tax)
    doc.text(rateIncl.toFixed(2), cols[6] + 1.0, yText, {
      width: cols[7] - cols[6] - 2.0,
      align: 'right',
      lineBreak: false
    });

    // per
    doc.text(unitStr, cols[7], yText, {
      width: cols[8] - cols[7],
      align: 'center',
      lineBreak: false
    });

    // GST(%)
    doc.text(`${gstRate}%`, cols[8], yText, {
      width: cols[9] - cols[8],
      align: 'center',
      lineBreak: false
    });

    // Disc (stacked 2 lines: e.g. "0.00" on line 1, "(0%)" on line 2)
    const discStr1 = discAmount > 0 ? discAmount.toFixed(2) : '0.00';
    const discStr2 = discAmount > 0 ? `(${discPct}%)` : '(0%)';
    if (thisRowH >= 24.0) {
      doc.text(discStr1, cols[9] + 1.0, rowTop + 6.0, {
        width: cols[10] - cols[9] - 2.0,
        align: 'right',
        lineBreak: false
      });
      doc.text(discStr2, cols[9] + 1.0, rowTop + 16.0, {
        width: cols[10] - cols[9] - 2.0,
        align: 'right',
        lineBreak: false
      });
    } else {
      doc.text(discStr1, cols[9] + 1.0, yText, {
        width: cols[10] - cols[9] - 2.0,
        align: 'right',
        lineBreak: false
      });
    }

    // Amount
    doc.text(formatCurrency(lineTotal), cols[10] + 1.0, yText, {
      width: cols[11] - cols[10] - 3.0,
      align: 'right',
      lineBreak: false
    });

    // Column dividers for this row
    cols.forEach((cx) => strokeBorder(cx, rowTop, cx, rowBottom));
    // Horizontal row divider below item
    strokeBorder(leftX, rowBottom, rightX, rowBottom);

    currentY = rowBottom;
  });

  // Dynamic chain of sections immediately following the items - ZERO UNWANTED GAP!
  const qtyRowTop = currentY;
  const totalRowTop = qtyRowTop + qtyRowH;
  const wordsRowTop = totalRowTop + totalRowH;
  const hsnTableTop = wordsRowTop + wordsRowH;
  const bTop = hsnTableTop + hsnTableHeight;
  const sigLineY = bTop + bankAndDeclH;
  const bBottom = sigLineY + sigH;

  // 6. Subtotal Quantity Row (immediately after items)
  strokeBorder(leftX, qtyRowTop, rightX, qtyRowTop);
  strokeBorder(leftX, totalRowTop, rightX, totalRowTop);
  cols.forEach((cx) => strokeBorder(cx, qtyRowTop, cx, totalRowTop));

  const qtySubY1 = qtyRowH >= 25.0 ? (qtyRowTop + 6.0) : (qtyRowTop + 2.0);
  const qtySubY2 = qtyRowH >= 25.0 ? (qtyRowTop + 17.0) : (qtyRowTop + 10.5);

  doc.font(fontBold).fontSize(isCompact ? 7.5 : 8.5).fillColor('#000000').text(String(totalQty), cols[3], qtySubY1, {
    width: cols[4] - cols[3] - 2.0,
    align: 'right',
    lineBreak: false
  });
  doc.font(fontBold).fontSize(7.0).fillColor('#000000').text(items[0]?.unit || 'Packs', cols[3], qtySubY2, {
    width: cols[4] - cols[3] - 2.0,
    align: 'right',
    lineBreak: false
  });

  doc.font(fontBold).fontSize(isCompact ? 7.0 : 7.2).fillColor('#000000').text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 1.0, qtyRowTop + (qtyRowH - 9.0) / 2, {
    width: cols[11] - cols[10] - 2.0,
    align: 'right',
    lineBreak: false
  });

  // 7. "Total" Row (immediately after subtotal)
  strokeBorder(leftX, totalRowTop, rightX, totalRowTop);
  strokeBorder(leftX, wordsRowTop, rightX, wordsRowTop);
  cols.forEach((cx) => strokeBorder(cx, totalRowTop, cx, wordsRowTop));

  doc.font(fontBoldOblique).fontSize(8.0).fillColor('#000000').text('Total', cols[1], totalRowTop + (totalRowH - 9.0) / 2, {
    width: cols[2] - cols[1] - 4.0,
    align: 'right',
    lineBreak: false
  });

  doc.font(fontBold).fontSize(isCompact ? 7.0 : 7.2).fillColor('#000000').text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 1.0, totalRowTop + (totalRowH - 9.0) / 2, {
    width: cols[11] - cols[10] - 2.0,
    align: 'right',
    lineBreak: false
  });

  // 8. Amount Chargeable (in words) & E. & O.E Row (immediately after Total)
  strokeBorder(leftX, wordsRowTop, rightX, wordsRowTop);
  strokeBorder(leftX, hsnTableTop, rightX, hsnTableTop);

  doc.font(fontRegular).fontSize(7.0).fillColor('#333333').text('Amount Chargeable (in words)', leftX + 4.0, wordsRowTop + 3.0);
  doc.font(fontRegular).fontSize(8.0).fillColor('#000000').text('E. & O.E', rightX - 60.0, wordsRowTop + 3.0, { width: 56.0, align: 'right' });

  const amountInWords = numberToWordsINR(invoice.grandTotal, 'INR ');
  const wordsY = wordsRowH >= 30.0 ? (wordsRowTop + 16.0) : (wordsRowTop + 11.5);
  doc.font(fontBold).fontSize(8.0).fillColor('#000000').text(amountInWords, leftX + 4.0, wordsY, { lineBreak: false });

  // 9. HSN/SAC Tax Breakdown Table (immediately after Amount Chargeable)
  const hsnMainCols = [
    17.6,  // 0: HSN/SAC left
    106.5, // 1: Taxable Value left
    195.0, // 2: CGST left
    329.3, // 3: SGST left
    462.8, // 4: Total Tax Amount left
    578.6  // 5: Right edge
  ];

  const hsnAllCols = [
    17.6,  // HSN/SAC left
    106.5, // Taxable Value left
    195.0, // CGST Rate left
    247.5, // CGST Amount left
    329.3, // SGST Rate left
    381.0, // SGST Amount left
    462.8, // Total Tax Amount left
    578.6  // Right edge
  ];

  const hsnH1 = isCompact ? 13.0 : 17.0;
  const hsnH2 = isCompact ? 11.0 : 13.0;
  const subH_Top = hsnTableTop + hsnH1;
  const hsnRowsTop = subH_Top + hsnH2;

  // Header 1 (Top half)
  strokeBorder(leftX, hsnTableTop, rightX, hsnTableTop);
  strokeBorder(leftX, subH_Top, rightX, subH_Top);
  hsnMainCols.forEach((cx) => strokeBorder(cx, hsnTableTop, cx, subH_Top));

  doc.font(fontRegular).fontSize(7.0).fillColor('#000000');
  const hsnTopTextY = hsnTableTop + (isCompact ? 3.0 : 4.5);
  doc.text('HSN/SAC', hsnMainCols[0], hsnTopTextY, { width: hsnMainCols[1] - hsnMainCols[0], align: 'center' });
  doc.text('Taxable\nValue', hsnMainCols[1], hsnTableTop + (isCompact ? 1.5 : 2.5), { width: hsnMainCols[2] - hsnMainCols[1], align: 'center' });
  doc.text('CGST', hsnMainCols[2], hsnTopTextY, { width: hsnMainCols[3] - hsnMainCols[2], align: 'center' });
  doc.text('SGST', hsnMainCols[3], hsnTopTextY, { width: hsnMainCols[4] - hsnMainCols[3], align: 'center' });
  doc.text('Total\nTax Amount', hsnMainCols[4], hsnTableTop + (isCompact ? 1.5 : 2.5), { width: hsnMainCols[5] - hsnMainCols[4], align: 'center' });

  // Sub-header 2 (Bottom half: Rate and Amount)
  strokeBorder(leftX, hsnRowsTop, rightX, hsnRowsTop);
  hsnAllCols.forEach((cx) => strokeBorder(cx, subH_Top, cx, hsnRowsTop));

  const hsnSubTextY = subH_Top + (isCompact ? 2.0 : 2.5);
  doc.text('Rate', hsnAllCols[2], hsnSubTextY, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center' });
  doc.text('Amount', hsnAllCols[3], hsnSubTextY, { width: hsnAllCols[4] - hsnAllCols[3], align: 'center' });
  doc.text('Rate', hsnAllCols[4], hsnSubTextY, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center' });
  doc.text('Amount', hsnAllCols[5], hsnSubTextY, { width: hsnAllCols[6] - hsnAllCols[5], align: 'center' });

  let hsnRowY = hsnRowsTop;

  hsnCodes.forEach((hsn) => {
    const row = hsnMap[hsn];
    strokeBorder(leftX, hsnRowY + hsnRowH, rightX, hsnRowY + hsnRowH);
    hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnRowH));

    const yRowText = hsnRowY + (hsnRowH - 9.0) / 2;
    doc.font(fontRegular).fontSize(7.0);
    doc.text(hsn, hsnAllCols[0], yRowText, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center', lineBreak: false });
    doc.text(formatCurrency(row.taxable), hsnAllCols[1] + 2.0, yRowText, { width: hsnAllCols[2] - hsnAllCols[1] - 4.0, align: 'right', lineBreak: false });
    doc.text(`${row.cgstRate}%`, hsnAllCols[2], yRowText, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center', lineBreak: false });
    doc.text(formatCurrency(row.cgstAmount), hsnAllCols[3] + 2.0, yRowText, { width: hsnAllCols[4] - hsnAllCols[3] - 4.0, align: 'right', lineBreak: false });
    doc.text(`${row.sgstRate}%`, hsnAllCols[4], yRowText, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center', lineBreak: false });
    doc.text(formatCurrency(row.sgstAmount), hsnAllCols[5] + 2.0, yRowText, { width: hsnAllCols[6] - hsnAllCols[5] - 4.0, align: 'right', lineBreak: false });
    doc.text(formatCurrency(row.totalTax), hsnAllCols[6] + 2.0, yRowText, { width: hsnAllCols[7] - hsnAllCols[6] - 4.0, align: 'right', lineBreak: false });

    hsnRowY += hsnRowH;
  });

  // HSN Total Row
  strokeBorder(leftX, hsnRowY + hsnTotalRowH, rightX, hsnRowY + hsnTotalRowH);
  hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnTotalRowH));

  const yHsnTotalText = hsnRowY + (hsnTotalRowH - 9.0) / 2;
  doc.font(fontBold).fontSize(7.0);
  doc.text('Total', hsnAllCols[0], yHsnTotalText, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center', lineBreak: false });
  doc.text(formatCurrency(invoice.taxableSubtotal || invoice.grandTotal), hsnAllCols[1] + 2.0, yHsnTotalText, {
    width: hsnAllCols[2] - hsnAllCols[1] - 4.0,
    align: 'right',
    lineBreak: false
  });
  doc.text(formatCurrency(invoice.cgstTotal || 0), hsnAllCols[3] + 2.0, yHsnTotalText, {
    width: hsnAllCols[4] - hsnAllCols[3] - 4.0,
    align: 'right',
    lineBreak: false
  });
  doc.text(formatCurrency(invoice.sgstTotal || 0), hsnAllCols[5] + 2.0, yHsnTotalText, {
    width: hsnAllCols[6] - hsnAllCols[5] - 4.0,
    align: 'right',
    lineBreak: false
  });
  doc.text(formatCurrency(invoice.taxTotal || 0), hsnAllCols[6] + 2.0, yHsnTotalText, {
    width: hsnAllCols[7] - hsnAllCols[6] - 4.0,
    align: 'right',
    lineBreak: false
  });

  // 10. Bottom Section Box (Declaration, Bank, Signatures)
  const p2MidX = 297.8;

  strokeBorder(leftX, bTop, rightX, bTop);
  strokeBorder(leftX, bBottom, rightX, bBottom);
  strokeBorder(leftX, bTop, leftX, bBottom);
  strokeBorder(rightX, bTop, rightX, bBottom);

  // Tax Amount in words (Prints "Nil" when tax is 0, matching reference images)
  const hasTax = Number(invoice.taxTotal || 0) > 0;
  const taxInWords = hasTax ? numberToWordsINR(invoice.taxTotal, 'INR ') : 'Nil';

  doc.font(fontRegular).fontSize(7.5).fillColor('#000000');
  doc.text('Tax Amount (in words): ', leftX + 4.0, bTop + (isCompact ? 4.0 : 6.0), { continued: true });
  doc.font(fontBold).text(taxInWords);

  // Declaration (Left side: leftX to p2MidX)
  const declY = bTop + (isCompact ? 16.5 : 24.0);
  doc.font(fontBold).fontSize(7.5).text('Declaration:', leftX + 4.0, declY);
  strokeBorder(leftX + 4.0, declY + 9.5, leftX + 54.0, declY + 9.5);

  doc.font(fontRegular).fontSize(7.0).text(
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    leftX + 4.0,
    declY + 14.0,
    { width: p2MidX - leftX - 12.0, lineGap: 2.0 }
  );

  // Bank Details (Right side: p2MidX to rightX)
  const bankX = p2MidX + 8.0;
  const b = seller.bankDetails;
  doc.font(fontRegular).fontSize(7.2);
  const bLineGap = isCompact ? 10.0 : 16.0;
  const bStart = bTop + (isCompact ? 14.0 : 18.0);
  const bankLabels = ['A/c Name', 'A/c Number', 'Bank Name', 'Branch Name', 'IFS Code', 'UPI Number'];
  const bankValues = [
    `: ${b.accountName}`,
    `: ${b.accountNumber}`,
    `: ${b.bankName}`,
    `: ${b.branchName}`,
    `: ${b.ifscCode}`,
    `: ${b.upiNumber}`
  ];
  const bValX = bankX + 64.0;
  bankLabels.forEach((lbl, idx) => {
    const yPos = bStart + (bLineGap * idx);
    doc.text(lbl, bankX, yPos, { lineBreak: false });
    doc.text(bankValues[idx], bValX, yPos, { lineBreak: false });
  });

  // Divider above signature
  strokeBorder(leftX, sigLineY, rightX, sigLineY);
  strokeBorder(p2MidX, sigLineY, p2MidX, bBottom);

  // Left Sign: Customer's Seal and Signature
  doc.font(fontRegular).fontSize(7.0).text("Customer's Seal and Signature", leftX + 4.0, sigLineY + (isCompact ? 4.0 : 6.0));

  // Right Sign: for Tamizh Enterprises / Authorised Signatory
  doc.font(fontRegular).fontSize(7.0);
  const forPrefixW = doc.widthOfString('for ');
  doc.font(fontBold).fontSize(7.0);
  const companyNameW = doc.widthOfString(seller.companyName);
  const sigTextTotalW = forPrefixW + companyNameW;
  const sigTextStartX = rightX - 6.0 - sigTextTotalW;

  const sigTopY = sigLineY + (isCompact ? 4.0 : 6.0);
  doc.font(fontRegular).fontSize(7.0).text('for ', sigTextStartX, sigTopY, { lineBreak: false });
  doc.font(fontBold).fontSize(7.0).text(seller.companyName, sigTextStartX + forPrefixW, sigTopY, { lineBreak: false });

  doc.font(fontRegular).fontSize(7.0).text('Authorised Signatory', p2MidX, bBottom - (isCompact ? 10.0 : 14.0), {
    width: rightX - p2MidX - 6.0,
    align: 'right',
    lineBreak: false
  });

  // Complete outer borders from top to bottom
  strokeBorder(leftX, p1Top, leftX, bBottom);
  strokeBorder(rightX, p1Top, rightX, bBottom);

  // Footer text outside the border at the bottom
  doc.font(fontRegular).fontSize(7.5).fillColor('#000000');
  doc.text('This is a Computer Generated Invoice', leftX, bBottom + 4.0, {
    width: totalW,
    align: 'center'
  });

  doc.end();
}

module.exports = { generateInvoicePDF };
