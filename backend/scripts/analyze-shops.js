const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../Shop-list (1).csv');
const content = fs.readFileSync(csvPath, 'utf8');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = vals[idx] !== undefined ? vals[idx].trim() : '';
    });
    rows.push(obj);
  }
  return { header, rows };
}

const { header, rows } = parseCSV(content);

console.log('Total shop rows in CSV:', rows.length);
console.log('Header columns:', header);

const categories = {};
const districts = {};
const states = {};
const cities = {};
const idSet = new Set();
const duplicateIds = [];
const phoneSet = new Map();
const duplicatePhones = [];
let withGST = 0;
let withEmail = 0;
let withLandline = 0;
let missingPincode = 0;

rows.forEach((r, idx) => {
  categories[r.Category] = (categories[r.Category] || 0) + 1;
  districts[r.District] = (districts[r.District] || 0) + 1;
  states[r.State] = (states[r.State] || 0) + 1;

  if (idSet.has(r.ID)) duplicateIds.push({ row: idx + 2, id: r.ID, name: r.Name });
  idSet.add(r.ID);

  if (r['Mobile Number']) {
    if (phoneSet.has(r['Mobile Number'])) {
      duplicatePhones.push({
        id: r.ID,
        phone: r['Mobile Number'],
        name: r.Name,
        previous: phoneSet.get(r['Mobile Number'])
      });
    } else {
      phoneSet.set(r['Mobile Number'], { id: r.ID, name: r.Name });
    }
  }

  if (r.GSTIN) withGST++;
  if (r['Email ID']) withEmail++;
  if (r.Landline) withLandline++;
  if (!r.Pincode || r.Pincode === 'Na') missingPincode++;
});

console.log('\n--- Category Breakdown ---');
console.log(categories);

console.log('\n--- District Breakdown ---');
console.log(districts);

console.log('\n--- State Breakdown ---');
console.log(states);

console.log('\n--- Data Quality Summary ---');
console.log('Unique IDs:', idSet.size, 'Duplicate IDs:', duplicateIds.length);
if (duplicateIds.length > 0) console.log('Duplicate IDs:', duplicateIds);
console.log('Duplicate Phones:', duplicatePhones.length);
if (duplicatePhones.length > 0) console.log('Duplicate Phones sample:', duplicatePhones.slice(0, 5));
console.log('With GST:', withGST);
console.log('With Email:', withEmail);
console.log('With Landline:', withLandline);
console.log('Missing/Na Pincode:', missingPincode);

// Test resolution of pincodes & areas
const pinMap = {
  '77': '600077', '56': '600056', '37': '600037', '40': '600040', '102': '600102',
  '80': '600080', '76': '600076', '47': '600047', '101': '600101', '49': '600049',
  '50': '600050', '95': '600095', '62': '600062', '17': '600017', '34': '600034',
  '24': '600024', '26': '600026', '106': '600106'
};

const areas = {};
let resolvedPins = 0;
let unresolvedPins = [];

rows.forEach((r, idx) => {
  let pin = (r.Pincode || '').replace(/[^0-9]/g, '');
  if (pin.length !== 6) {
    const match6 = r.Address.match(/\b(600\d{3})\b/);
    if (match6) {
      pin = match6[1];
    } else {
      const matchCh = r.Address.match(/(?:Ch|Chennai|chennai|Villivakkam|49|50|56|77)[-\s]*(\d{2,3})\b/i) || r.Address.match(/\b(\d{2,3})\s*$/);
      if (matchCh && pinMap[matchCh[1]]) {
        pin = pinMap[matchCh[1]];
      } else if (r.Address.toLowerCase().includes('villivakkam')) {
        pin = '600049';
      }
    }
  }

  if (pin && pin.length === 6) {
    resolvedPins++;
  } else {
    unresolvedPins.push({ row: idx + 2, id: r.ID, name: r.Name, addr: r.Address, rawPin: r.Pincode });
  }

  // Detect Area
  let detectedArea = 'Chennai';
  const lower = (r.Address + ' ' + r.Name + ' ' + (r.Division || '')).toLowerCase();
  if (lower.includes('villivakkam')) detectedArea = 'Villivakkam';
  else if (lower.includes('poonamallee') || lower.includes('poonamalle')) detectedArea = 'Poonamallee';
  else if (lower.includes('kaatupakkam')) detectedArea = 'Kaatupakkam';
  else if (lower.includes('anna nagar') || lower.includes('annanagar')) detectedArea = 'Anna Nagar';
  else if (lower.includes('padi')) detectedArea = 'Padi';
  else if (lower.includes('korattur')) detectedArea = 'Korattur';
  else if (lower.includes('thiruverkadu')) detectedArea = 'Thiruverkadu';
  else if (lower.includes('mugappair') || lower.includes('nolambur')) detectedArea = 'Mugappair';
  else if (lower.includes('vanagaram') || lower.includes('porur') || lower.includes('ayyappanthangal')) detectedArea = 'Porur / Vanagaram';
  else if (lower.includes('t.nagar') || lower.includes('t nagar')) detectedArea = 'T. Nagar';
  else if (lower.includes('nungambakkam')) detectedArea = 'Nungambakkam';
  else if (lower.includes('kodambakkam') || lower.includes('trustpuram')) detectedArea = 'Kodambakkam';
  else if (lower.includes('vadapalani')) detectedArea = 'Vadapalani';
  else if (lower.includes('arumbakkam')) detectedArea = 'Arumbakkam';
  else if (lower.includes('thirumullaivoyal') || lower.includes('avadi')) detectedArea = 'Avadi / Thirumullaivoyal';

  areas[detectedArea] = (areas[detectedArea] || 0) + 1;
});

console.log('\n--- Pincode Resolution ---');
console.log('Resolved 6-digit Pincodes:', resolvedPins, '/', rows.length);
if (unresolvedPins.length > 0) console.log('Unresolved:', unresolvedPins);

console.log('\n--- Neighborhood / Area Clusters ---');
console.log(areas);

