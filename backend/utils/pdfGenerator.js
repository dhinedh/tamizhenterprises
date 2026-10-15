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

  // Precise Coordinates matching the reference invoices
  const leftX = 17.4;
  const rightX = 579.4;
  const midX = 275.0;
  const rightSubColX = 412.0;
  const totalW = rightX - leftX; // 562 pt

  // Table Column Xs
  const cols = [
    17.4,  // 0: Sl No left
    42.0,  // 1: Description left (Sl No W = 24.6)
    190.0, // 2: HSN/SAC left (Desc W = 148.0)
    235.0, // 3: Qty left (HSN W = 45.0)
    275.0, // 4: MRP left (Qty W = 40.0) -> midX aligns with Quantity & MRP border
    312.0, // 5: Rate Excl left (MRP W = 37.0)
    360.0, // 6: Rate Incl left (Rate Excl W = 48.0)
    408.0, // 7: per left (Rate Incl W = 48.0)
    435.0, // 8: GST(%) left (per W = 27.0)
    472.0, // 9: Disc left (GST% W = 37.0)
    510.0, // 10: Amount left (Disc W = 38.0)
    579.4  // 11: Amount right (Amount W = 69.4)
  ];

  const strokeBorder = (x1, y1, x2, y2) => {
    doc.lineWidth(0.75).strokeColor('#000000').moveTo(x1, y1).lineTo(x2, y2).stroke();
  };

  // 1. Top Title Bar: "Bill of Supply" (Y: 16.0 -> 38.0)
  const p1Top = 16.0;
  const titleH = 22.0;
  const titleBottom = p1Top + titleH; // 38.0

  strokeBorder(leftX, p1Top, rightX, p1Top);
  strokeBorder(leftX, titleBottom, rightX, titleBottom);
  doc.font(fontBold).fontSize(11.5).fillColor('#000000');
  doc.text('Bill of Supply', leftX, p1Top + 5.5, { width: totalW, align: 'center' });

  // 2. Top Info Box (Y: 38.0 -> 196.0, Height = 158.0 pt)
  const infoTop = titleBottom; // 38.0
  const infoBottom = 196.0;

  // Middle vertical border separating Left (Seller & Parties) and Right (Invoice & Shipping details)
  strokeBorder(midX, infoTop, midX, infoBottom);
  strokeBorder(leftX, infoBottom, rightX, infoBottom);

  // --- LEFT SIDE: 3 DISTINCT SECTIONS ---
  // Section A: Seller (Y: 38.0 -> 107.0)
  // Section B: Consignee (Ship to) (Y: 107.0 -> 151.5)
  // Section C: Buyer (Bill to) (Y: 151.5 -> 196.0)

  const sellerDividerY = 107.0;
  const consigneeDividerY = 151.5;

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

  if (logoImg) {
    try {
      doc.image(logoImg, 20.0, infoTop + 5.0, { fit: [58.0, 58.0], align: 'center', valign: 'center' });
    } catch (e) {
      doc.circle(49.0, infoTop + 34.0, 28.0).strokeColor('#cccccc').stroke();
    }
  }

  // Seller Text
  const sellerTextX = 83.0;
  const sellerTextW = midX - sellerTextX - 4.0;

  doc.font(fontBold).fontSize(10.5).fillColor('#000000');
  doc.text(seller.companyName, sellerTextX, infoTop + 3.0, { width: sellerTextW });

  doc.font(fontRegular).fontSize(7.0).fillColor('#000000');
  doc.text(seller.addressLine1, sellerTextX, infoTop + 14.5, { width: sellerTextW });
  doc.text(seller.addressLine2, sellerTextX, infoTop + 22.5, { width: sellerTextW });
  doc.text(
    `${seller.city}, ${seller.state} - ${seller.pincode}`,
    sellerTextX,
    infoTop + 30.5,
    { width: sellerTextW }
  );

  doc.font(fontBold).fontSize(7.0).text('GSTIN/UIN : ', sellerTextX, infoTop + 39.0, { continued: true });
  doc.font(fontBold).text(seller.gstin);

  doc.font(fontBold).text('Contact : ', sellerTextX, infoTop + 47.5, { continued: true });
  doc.font(fontRegular).text(seller.contact);

  doc.font(fontBold).text('Email : ', sellerTextX, infoTop + 55.5);
  doc.font(fontRegular).text(seller.email, sellerTextX, infoTop + 63.5, { width: sellerTextW });

  // Section B: Consignee (Ship to)
  const partyTextX = 20.0;
  const partyTextW = midX - partyTextX - 4.0;

  doc.font(fontRegular).fontSize(7.0).fillColor('#333333');
  doc.text('Consignee (Ship to):', partyTextX, sellerDividerY + 2.5);

  doc.font(fontBold).fontSize(8.0).fillColor('#000000');
  doc.text(partyName, partyTextX, sellerDividerY + 11.5, { width: partyTextW, ellipsis: true });

  doc.font(fontRegular).fontSize(6.8);
  doc.text(partyAddress || '-', partyTextX, sellerDividerY + 20.5, { width: partyTextW, height: 13, ellipsis: true });
  doc.text(`Mobile: ${partyPhone || '-'}`, partyTextX, sellerDividerY + 29.5);
  doc.text(`State : ${partyState}, District: ${partyDistrict}`, partyTextX, sellerDividerY + 36.5);

  // Section C: Buyer (Bill to)
  doc.font(fontRegular).fontSize(7.0).fillColor('#333333');
  doc.text('Buyer (Bill to):', partyTextX, consigneeDividerY + 2.5);

  doc.font(fontBold).fontSize(8.0).fillColor('#000000');
  doc.text(partyName, partyTextX, consigneeDividerY + 11.5, { width: partyTextW, ellipsis: true });

  doc.font(fontRegular).fontSize(6.8);
  doc.text(partyAddress || '-', partyTextX, consigneeDividerY + 20.5, { width: partyTextW, height: 13, ellipsis: true });
  doc.text(`Mobile: ${partyPhone || '-'}`, partyTextX, consigneeDividerY + 29.5);
  doc.text(`State : ${partyState}, District: ${partyDistrict}`, partyTextX, consigneeDividerY + 36.5);

  // --- RIGHT SIDE: 7 ROWS ---
  const rightGridLines = [57.0, 75.0, 93.0, 111.0, 129.0, 147.0];
  rightGridLines.forEach((y) => strokeBorder(midX, y, rightX, y));

  // Vertical divider between right sub-columns (Y: infoTop to 147.0 only, doesn't cross Terms of Delivery!)
  strokeBorder(rightSubColX, infoTop, rightSubColX, 147.0);

  const colR1_X = midX + 5.0;
  const colR2_X = rightSubColX + 5.0;

  let displayInvNo = String(invoice.invoiceNumber || '18');
  if (displayInvNo.includes('-')) {
    const parts = displayInvNo.split('-');
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) displayInvNo = lastPart;
  }

  // Row 1 (38.0 -> 57.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice #', colR1_X, infoTop + 2.5);
  doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(displayInvNo, colR1_X, infoTop + 10.5);

  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Invoice Date:', colR2_X, infoTop + 2.5);
  doc.font(fontBold).fontSize(8.5).fillColor('#000000').text(formatDate(invoice.invoiceDate), colR2_X, infoTop + 10.5);

  // Row 2 (57.0 -> 75.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note', colR1_X, 59.0);
  if (invoice.deliveryChallanNo) {
    doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.deliveryChallanNo, colR1_X, 66.5);
  }

  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Mode/Terms of Payment', colR2_X, 59.0);
  doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(invoice.saleType || 'Credit', colR2_X, 66.5);

  // Row 3 (75.0 -> 93.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Reference No. & Date', colR1_X, 77.0);
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Other References', colR2_X, 77.0);

  // Row 4 (93.0 -> 111.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text("Buyer's Order No.", colR1_X, 95.0);
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dated', colR2_X, 95.0);

  // Row 5 (111.0 -> 129.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatch Doc No.', colR1_X, 113.0);
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Delivery Note Date', colR2_X, 113.0);

  // Row 6 (129.0 -> 147.0)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Dispatched through', colR1_X, 131.0);
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Destination', colR2_X, 131.0);

  // Row 7 (147.0 -> 196.0): Terms of Delivery (spans across entire right width)
  doc.font(fontRegular).fontSize(7.0).fillColor('#555555').text('Terms of Delivery', colR1_X, 149.5);

  // 3. Products Table Header (Y: 196.0 -> 218.0, Height = 22.0 pt)
  const thTop = infoBottom; // 196.0
  const thBottom = thTop + 22.0; // 218.0

  strokeBorder(leftX, thTop, rightX, thTop);
  strokeBorder(leftX, thBottom, rightX, thBottom);
  cols.forEach((cx) => strokeBorder(cx, thTop, cx, thBottom));

  doc.font(fontRegular).fontSize(7.0).fillColor('#000000');
  doc.text('Sl\nNo.', cols[0], thTop + 3.0, { width: cols[1] - cols[0], align: 'center' });
  doc.text('Description of Goods', cols[1] + 3.0, thTop + 6.5, { width: cols[2] - cols[1] - 6.0, align: 'left' });
  doc.text('HSN/SAC', cols[2], thTop + 6.5, { width: cols[3] - cols[2], align: 'center' });
  doc.text('Quantity', cols[3], thTop + 6.5, { width: cols[4] - cols[3], align: 'center' });
  doc.text('MRP', cols[4] + 2.0, thTop + 6.5, { width: cols[5] - cols[4] - 4.0, align: 'right' });
  doc.text('Rate (Excl.\nTax)', cols[5] + 2.0, thTop + 3.0, { width: cols[6] - cols[5] - 4.0, align: 'right' });
  doc.text('Rate (Incl.\nTax)', cols[6] + 2.0, thTop + 3.0, { width: cols[7] - cols[6] - 4.0, align: 'right' });
  doc.text('per', cols[7], thTop + 6.5, { width: cols[8] - cols[7], align: 'center' });
  doc.text('GST(%)', cols[8], thTop + 6.5, { width: cols[9] - cols[8], align: 'center' });
  doc.text('Disc', cols[9] + 2.0, thTop + 6.5, { width: cols[10] - cols[9] - 4.0, align: 'right' });
  doc.text('Amount', cols[10] + 2.0, thTop + 6.5, { width: cols[11] - cols[10] - 5.0, align: 'right' });

  // 4. Calculate Dynamic Bottom Layout based on Products & HSN
  const items = invoice.items || [];
  const bBottom = 800.0;
  const sigLineY = 730.0;
  const bTop = 688.0;

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
  const hsnRowH = 13.0;
  const hsnHeaderH = 24.0; // 13.0 + 11.0
  const hsnTotalRowH = 13.0;
  const hsnTableHeight = hsnHeaderH + (numHsn * hsnRowH) + hsnTotalRowH;
  const hsnTableTop = bTop - hsnTableHeight; // e.g. 688.0 - 50.0 = 638.0

  const wordsRowH = 22.0;
  const wordsRowTop = hsnTableTop - wordsRowH; // e.g. 638.0 - 22.0 = 616.0

  const totalRowH = 16.0;
  const totalRowTop = wordsRowTop - totalRowH; // e.g. 616.0 - 16.0 = 600.0

  const qtyRowH = 16.0;
  const qtyRowTop = totalRowTop - qtyRowH; // e.g. 600.0 - 16.0 = 584.0

  // 5. Render Product Line Items within [thBottom -> qtyRowTop]
  // In reference invoices, items have normal compact height (~24-26 pt) and the remaining table space
  // extends with empty vertical grid lines down to qtyRowTop.
  // If many items are added (e.g. > 10), row height adjusts dynamically to fit cleanly on page!
  const availableTableH = qtyRowTop - thBottom; // 584 - 218 = 366 pt
  const numItems = Math.max(1, items.length);

  // If items fit with standard height (25 pt), use standard height; otherwise scale smoothly down to min 15 pt
  const standardRowH = 25.0;
  const itemRowH = (numItems * standardRowH <= availableTableH)
    ? standardRowH
    : Math.max(15.0, availableTableH / numItems);

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

    // Font size & line height for clean vertical alignment
    const fontSize = thisRowH >= 22.0 ? 7.5 : 6.8;
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
      align: 'center'
    });

    // Description
    doc.font(fontBold).text(descText, cols[1] + 3.0, yDesc, {
      width: descW,
      align: 'left',
      height: thisRowH - 3.0,
      ellipsis: true
    });

    // HSN/SAC
    doc.font(fontRegular).text(item.hsnCode || '96190010', cols[2], yText, {
      width: cols[3] - cols[2],
      align: 'center'
    });

    // Quantity
    doc.text(`${qty} ${unitStr}`, cols[3], yText, {
      width: cols[4] - cols[3],
      align: 'center'
    });

    // MRP
    doc.text(mrp.toFixed(2), cols[4] + 2.0, yText, {
      width: cols[5] - cols[4] - 4.0,
      align: 'right'
    });

    // Rate (Excl. Tax)
    doc.text(unitPrice.toFixed(2), cols[5] + 2.0, yText, {
      width: cols[6] - cols[5] - 4.0,
      align: 'right'
    });

    // Rate (Incl. Tax)
    doc.text(rateIncl.toFixed(2), cols[6] + 2.0, yText, {
      width: cols[7] - cols[6] - 4.0,
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

    // Disc (stacked 2 lines: e.g. "0.00" on line 1, "(0%)" on line 2)
    const discStr1 = discAmount > 0 ? discAmount.toFixed(2) : '0.00';
    const discStr2 = discAmount > 0 ? `(${discPct}%)` : '(0%)';
    if (thisRowH >= 22.0) {
      doc.text(discStr1, cols[9] + 1.0, rowTop + 3.0, {
        width: cols[10] - cols[9] - 3.0,
        align: 'right'
      });
      doc.text(discStr2, cols[9] + 1.0, rowTop + 12.0, {
        width: cols[10] - cols[9] - 3.0,
        align: 'right'
      });
    } else {
      doc.text(discStr1, cols[9] + 1.0, yText, {
        width: cols[10] - cols[9] - 3.0,
        align: 'right'
      });
    }

    // Amount
    doc.text(formatCurrency(lineTotal), cols[10] + 2.0, yText, {
      width: cols[11] - cols[10] - 5.0,
      align: 'right'
    });

    // Column dividers for this row
    cols.forEach((cx) => strokeBorder(cx, rowTop, cx, rowBottom));
    // Horizontal row divider below item
    strokeBorder(leftX, rowBottom, rightX, rowBottom);

    currentY = rowBottom;
  });

  // If items didn't fill down to qtyRowTop, continue column dividers through the empty whitespace!
  if (currentY < qtyRowTop) {
    cols.forEach((cx) => strokeBorder(cx, currentY, cx, qtyRowTop));
  }

  // 6. Subtotal Quantity Row (at qtyRowTop)
  strokeBorder(leftX, qtyRowTop, rightX, qtyRowTop);
  strokeBorder(leftX, totalRowTop, rightX, totalRowTop);
  cols.forEach((cx) => strokeBorder(cx, qtyRowTop, cx, totalRowTop));

  doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(`${totalQty} Packs`, cols[3], qtyRowTop + 4.0, {
    width: cols[4] - cols[3],
    align: 'center'
  });

  doc.text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 2.0, qtyRowTop + 4.0, {
    width: cols[11] - cols[10] - 5.0,
    align: 'right'
  });

  // 7. "Total" Row (at totalRowTop)
  strokeBorder(leftX, totalRowTop, rightX, totalRowTop);
  strokeBorder(leftX, wordsRowTop, rightX, wordsRowTop);
  cols.forEach((cx) => strokeBorder(cx, totalRowTop, cx, wordsRowTop));

  doc.font(fontBoldOblique).fontSize(7.5).fillColor('#000000').text('Total', cols[1], totalRowTop + 4.0, {
    width: cols[2] - cols[1] - 4.0,
    align: 'right'
  });

  doc.font(fontBold).fontSize(7.5).fillColor('#000000').text(`₹ ${formatCurrency(invoice.grandTotal)}`, cols[10] + 2.0, totalRowTop + 4.0, {
    width: cols[11] - cols[10] - 5.0,
    align: 'right'
  });

  // 8. Amount Chargeable (in words) & E. & O.E Row (at wordsRowTop)
  strokeBorder(leftX, wordsRowTop, rightX, wordsRowTop);
  strokeBorder(leftX, hsnTableTop, rightX, hsnTableTop);

  doc.font(fontRegular).fontSize(7.0).fillColor('#333333').text('Amount Chargeable (in words)', leftX + 4.0, wordsRowTop + 2.5);
  doc.font('Times-Roman').fontSize(9.0).fillColor('#000000').text('E. & O.E', rightX - 60.0, wordsRowTop + 2.5, { width: 56.0, align: 'right' });

  const amountInWords = numberToWordsINR(invoice.grandTotal, 'INR ');
  doc.font(fontBold).fontSize(8.0).fillColor('#000000').text(amountInWords, leftX + 4.0, wordsRowTop + 11.5);

  // 9. HSN/SAC Tax Breakdown Table (at hsnTableTop -> bTop)
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
    255.0, // CGST Amount left
    331.9, // SGST Rate left
    386.8, // SGST Amount left
    463.7, // Total Tax Amount left
    579.4  // Right edge
  ];

  const hsnH1 = 13.0;
  const hsnH2 = 11.0;
  const subH_Top = hsnTableTop + hsnH1;
  const hsnRowsTop = subH_Top + hsnH2;

  // Header 1 (Top half)
  strokeBorder(leftX, hsnTableTop, rightX, hsnTableTop);
  strokeBorder(leftX, subH_Top, rightX, subH_Top);
  hsnMainCols.forEach((cx) => strokeBorder(cx, hsnTableTop, cx, subH_Top));

  doc.font(fontRegular).fontSize(7.0).fillColor('#000000');
  doc.text('HSN/SAC', hsnMainCols[0], hsnTableTop + 3.0, { width: hsnMainCols[1] - hsnMainCols[0], align: 'center' });
  doc.text('Taxable\nValue', hsnMainCols[1], hsnTableTop + 1.5, { width: hsnMainCols[2] - hsnMainCols[1], align: 'center' });
  doc.text('CGST', hsnMainCols[2], hsnTableTop + 3.0, { width: hsnMainCols[3] - hsnMainCols[2], align: 'center' });
  doc.text('SGST', hsnMainCols[3], hsnTableTop + 3.0, { width: hsnMainCols[4] - hsnMainCols[3], align: 'center' });
  doc.text('Total\nTax Amount', hsnMainCols[4], hsnTableTop + 1.5, { width: hsnMainCols[5] - hsnMainCols[4], align: 'center' });

  // Sub-header 2 (Bottom half: Rate and Amount)
  strokeBorder(leftX, hsnRowsTop, rightX, hsnRowsTop);
  hsnAllCols.forEach((cx) => strokeBorder(cx, subH_Top, cx, hsnRowsTop));

  doc.text('Rate', hsnAllCols[2], subH_Top + 2.0, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center' });
  doc.text('Amount', hsnAllCols[3], subH_Top + 2.0, { width: hsnAllCols[4] - hsnAllCols[3], align: 'center' });
  doc.text('Rate', hsnAllCols[4], subH_Top + 2.0, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center' });
  doc.text('Amount', hsnAllCols[5], subH_Top + 2.0, { width: hsnAllCols[6] - hsnAllCols[5], align: 'center' });

  let hsnRowY = hsnRowsTop;

  hsnCodes.forEach((hsn) => {
    const row = hsnMap[hsn];
    strokeBorder(leftX, hsnRowY + hsnRowH, rightX, hsnRowY + hsnRowH);
    hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnRowH));

    doc.font(fontRegular).fontSize(7.0);
    doc.text(hsn, hsnAllCols[0], hsnRowY + 2.5, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center' });
    doc.text(formatCurrency(row.taxable), hsnAllCols[1] + 2.0, hsnRowY + 2.5, { width: hsnAllCols[2] - hsnAllCols[1] - 4.0, align: 'right' });
    doc.text(`${row.cgstRate}%`, hsnAllCols[2], hsnRowY + 2.5, { width: hsnAllCols[3] - hsnAllCols[2], align: 'center' });
    doc.text(formatCurrency(row.cgstAmount), hsnAllCols[3] + 2.0, hsnRowY + 2.5, { width: hsnAllCols[4] - hsnAllCols[3] - 4.0, align: 'right' });
    doc.text(`${row.sgstRate}%`, hsnAllCols[4], hsnRowY + 2.5, { width: hsnAllCols[5] - hsnAllCols[4], align: 'center' });
    doc.text(formatCurrency(row.sgstAmount), hsnAllCols[5] + 2.0, hsnRowY + 2.5, { width: hsnAllCols[6] - hsnAllCols[5] - 4.0, align: 'right' });
    doc.text(formatCurrency(row.totalTax), hsnAllCols[6] + 2.0, hsnRowY + 2.5, { width: hsnAllCols[7] - hsnAllCols[6] - 4.0, align: 'right' });

    hsnRowY += hsnRowH;
  });

  // HSN Total Row
  strokeBorder(leftX, hsnRowY + hsnTotalRowH, rightX, hsnRowY + hsnTotalRowH);
  hsnAllCols.forEach((cx) => strokeBorder(cx, hsnRowY, cx, hsnRowY + hsnTotalRowH));

  doc.font(fontBold).fontSize(7.0);
  doc.text('Total', hsnAllCols[0], hsnRowY + 2.5, { width: hsnAllCols[1] - hsnAllCols[0], align: 'center' });
  doc.text(formatCurrency(invoice.taxableSubtotal || invoice.grandTotal), hsnAllCols[1] + 2.0, hsnRowY + 2.5, {
    width: hsnAllCols[2] - hsnAllCols[1] - 4.0,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.cgstTotal || 0), hsnAllCols[3] + 2.0, hsnRowY + 2.5, {
    width: hsnAllCols[4] - hsnAllCols[3] - 4.0,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.sgstTotal || 0), hsnAllCols[5] + 2.0, hsnRowY + 2.5, {
    width: hsnAllCols[6] - hsnAllCols[5] - 4.0,
    align: 'right'
  });
  doc.text(formatCurrency(invoice.taxTotal || 0), hsnAllCols[6] + 2.0, hsnRowY + 2.5, {
    width: hsnAllCols[7] - hsnAllCols[6] - 4.0,
    align: 'right'
  });

  // 10. Bottom Section Box (Declaration, Bank, Signatures)
  const p2MidX = 295.0;

  strokeBorder(leftX, bTop, rightX, bTop);
  strokeBorder(leftX, bBottom, rightX, bBottom);
  strokeBorder(leftX, bTop, leftX, bBottom);
  strokeBorder(rightX, bTop, rightX, bBottom);

  // Tax Amount in words (Prints "Nil" when tax is 0, matching reference images)
  const hasTax = Number(invoice.taxTotal || 0) > 0;
  const taxInWords = hasTax ? numberToWordsINR(invoice.taxTotal, 'INR ') : 'Nil';

  doc.font(fontRegular).fontSize(7.5).fillColor('#000000');
  doc.text('Tax Amount (in words): ', leftX + 4.0, bTop + 4.0, { continued: true });
  doc.font(fontBold).text(taxInWords);

  // Declaration (Left side: leftX to p2MidX)
  const declY = bTop + 16.5;
  doc.font(fontBold).fontSize(7.5).text('Declaration:', leftX + 4.0, declY);
  strokeBorder(leftX + 4.0, declY + 9.5, leftX + 54.0, declY + 9.5);

  doc.font(fontRegular).fontSize(7.0).text(
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    leftX + 4.0,
    declY + 12.0,
    { width: p2MidX - leftX - 12.0, lineGap: 1.5 }
  );

  // Bank Details (Right side: p2MidX to rightX)
  const bankX = p2MidX + 8.0;
  const b = seller.bankDetails;
  doc.font(fontRegular).fontSize(7.2);
  doc.text(`A/c Name           : ${b.accountName}`, bankX, bTop + 14.0);
  doc.text(`A/c Number         : ${b.accountNumber}`, bankX, bTop + 24.0);
  doc.text(`Bank Name          : ${b.bankName}`, bankX, bTop + 34.0);
  doc.text(`Branch Name        : ${b.branchName}`, bankX, bTop + 44.0);
  doc.text(`IFS Code           : ${b.ifscCode}`, bankX, bTop + 54.0);
  doc.text(`UPI Number         : ${b.upiNumber}`, bankX, bTop + 64.0);

  // Divider above signature
  strokeBorder(leftX, sigLineY, rightX, sigLineY);
  strokeBorder(p2MidX, sigLineY, p2MidX, bBottom);

  // Left Sign: Customer's Seal and Signature
  doc.font(fontRegular).fontSize(7.0).text("Customer's Seal and Signature", leftX + 4.0, sigLineY + 4.0);

  // Right Sign: for Tamizh Enterprises / Authorised Signatory
  doc.font(fontRegular).fontSize(7.0).text('for ', p2MidX, sigLineY + 4.0, {
    continued: true,
    width: rightX - p2MidX - 6.0,
    align: 'right'
  });
  doc.font(fontBold).text(seller.companyName);

  doc.font(fontRegular).fontSize(7.0).text('Authorised Signatory', p2MidX, bBottom - 10.0, {
    width: rightX - p2MidX - 6.0,
    align: 'right'
  });

  // Complete outer borders from top to bottom
  strokeBorder(leftX, p1Top, leftX, bBottom);
  strokeBorder(rightX, p1Top, rightX, bBottom);

  // Footer text outside the border at the very bottom
  doc.font(fontRegular).fontSize(7.5).fillColor('#000000');
  doc.text('This is a Computer Generated Invoice', leftX, bBottom + 4.0, {
    width: totalW,
    align: 'center'
  });

  doc.end();
}

module.exports = { generateInvoicePDF };
