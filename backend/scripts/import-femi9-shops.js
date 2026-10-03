const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Store = require('../models/Store');
const Manufacturer = require('../models/Manufacturer');

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

const pinMap = {
  '77': '600077', '56': '600056', '37': '600037', '40': '600040', '102': '600102',
  '80': '600080', '76': '600076', '47': '600047', '101': '600101', '49': '600049',
  '50': '600050', '95': '600095', '62': '600062', '17': '600017', '34': '600034',
  '24': '600024', '26': '600026', '106': '600106'
};

function resolvePincode(rawPin, address) {
  let pin = (rawPin || '').replace(/[^0-9]/g, '');
  if (pin.length === 6) return pin;

  const match6 = (address || '').match(/\b(600\d{3})\b/);
  if (match6) return match6[1];

  const matchCh = (address || '').match(/(?:Ch|Chennai|chennai|Villivakkam|49|50|56|77)[-\s]*(\d{2,3})\b/i) || (address || '').match(/\b(\d{2,3})\s*$/);
  if (matchCh && pinMap[matchCh[1]]) {
    return pinMap[matchCh[1]];
  }

  if ((address || '').toLowerCase().includes('villivakkam')) {
    return '600049';
  }

  return '600001';
}

function resolveArea(name, address, division) {
  const lower = ((address || '') + ' ' + (name || '') + ' ' + (division || '')).toLowerCase();
  if (lower.includes('villivakkam')) return 'Villivakkam';
  if (lower.includes('poonamallee') || lower.includes('poonamalle')) return 'Poonamallee';
  if (lower.includes('kaatupakkam')) return 'Kaatupakkam';
  if (lower.includes('anna nagar') || lower.includes('annanagar')) return 'Anna Nagar';
  if (lower.includes('padi')) return 'Padi';
  if (lower.includes('korattur')) return 'Korattur';
  if (lower.includes('thiruverkadu')) return 'Thiruverkadu';
  if (lower.includes('mugappair') || lower.includes('nolambur')) return 'Mugappair';
  if (lower.includes('vanagaram') || lower.includes('porur') || lower.includes('ayyappanthangal')) return 'Porur / Vanagaram';
  if (lower.includes('t.nagar') || lower.includes('t nagar')) return 'T. Nagar';
  if (lower.includes('nungambakkam')) return 'Nungambakkam';
  if (lower.includes('kodambakkam') || lower.includes('trustpuram')) return 'Kodambakkam';
  if (lower.includes('vadapalani')) return 'Vadapalani';
  if (lower.includes('arumbakkam')) return 'Arumbakkam';
  if (lower.includes('thirumullaivoyal') || lower.includes('avadi')) return 'Avadi / Thirumullaivoyal';
  return 'Chennai Central';
}

function mapStoreType(category) {
  const cat = (category || '').toUpperCase();
  if (cat.includes('MEDICAL')) return 'Pharmacy/FMCG';
  if (cat.includes('SUPER MARKET') || cat.includes('HYPER MARKET')) return 'Supermarket';
  if (cat.includes('GROCERY') || cat.includes('GENERAL STORE')) return 'Kirana';
  return 'Departmental';
}

function cleanPhone(rawCountry, rawMobile) {
  const digits = (rawMobile || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length > 10 && digits.startsWith('91')) {
    const main10 = digits.slice(-10);
    return `+91 ${main10.slice(0, 5)} ${main10.slice(5)}`;
  }
  return rawMobile ? `+91 ${rawMobile}` : '+91 90000 00000';
}

async function importShops() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Locate Femi9 Manufacturer
    let femi9 = await Manufacturer.findOne({
      $or: [
        { code: 'FEMI9' },
        { name: { $regex: /femi9/i } }
      ]
    });

    if (!femi9) {
      console.log('Creating Femi9 Healthcare Pvt Ltd manufacturer...');
      femi9 = await Manufacturer.create({
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
        categories: ['Sanitary Hygiene', 'Personal Care', 'Anion Care'],
        status: 'Active'
      });
    }

    console.log(`Femi9 Manufacturer Found/Ready: "${femi9.name}" [${femi9.code}] (ID: ${femi9._id})`);

    // 2. Read and Parse CSV
    const csvPath = path.join(__dirname, '../Shop-list (1).csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const { rows } = parseCSV(csvContent);
    console.log(`Read ${rows.length} shop rows from CSV.`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rows) {
      const code = r.ID.trim().toUpperCase();
      const rawName = r.Name.replace(/\s+/g, ' ').trim();
      const category = r.Category.trim();
      const storeType = mapStoreType(category);
      const address = r.Address.replace(/\s+/g, ' ').trim();
      const pincode = resolvePincode(r.Pincode, address);
      const area = resolveArea(rawName, address, r.Division);
      const phone = cleanPhone(r['Country Code'], r['Mobile Number']);
      const landline = (r.Landline || '').trim();
      const email = (r['Email ID'] || '').trim().toLowerCase();
      const gstNumber = (r.GSTIN || '').trim().toUpperCase();
      const district = (r.District || 'CHENNAI').trim();

      // Determine appropriate credit limit
      let creditLimit = 50000;
      if (storeType === 'Supermarket') creditLimit = 100000;
      else if (storeType === 'Kirana') creditLimit = 35000;
      else if (storeType === 'Departmental') creditLimit = 40000;

      const storePayload = {
        name: rawName,
        code: code,
        femi9RetailerId: code,
        manufacturerId: femi9._id,
        manufacturerCode: 'FEMI9',
        category: category,
        storeType: storeType,
        phone: phone,
        landline: landline,
        email: email,
        address: address,
        area: area,
        city: 'Chennai',
        district: district,
        state: 'Tamil Nadu',
        pincode: pincode,
        gstNumber: gstNumber,
        creditLimit: creditLimit,
        creditPeriodDays: 15,
        status: 'Active',
        notes: `Imported from Femi9 Authorized Retailer Network. Category: ${category}, District: ${district}`
      };

      const existing = await Store.findOne({ code: code });
      if (existing) {
        await Store.updateOne({ _id: existing._id }, { $set: storePayload });
        updatedCount++;
      } else {
        await Store.create(storePayload);
        createdCount++;
      }
    }

    console.log(`\nImport Completed Successfully!`);
    console.log(`- Total Records Processed: ${rows.length}`);
    console.log(`- Newly Created Stores: ${createdCount}`);
    console.log(`- Updated Existing Stores: ${updatedCount}`);

    const totalFemi9InDb = await Store.countDocuments({ manufacturerId: femi9._id });
    console.log(`- Total Femi9 Stores Now in Database: ${totalFemi9InDb}`);

    process.exit(0);
  } catch (error) {
    console.error('Error importing Femi9 shops:', error);
    process.exit(1);
  }
}

importShops();
