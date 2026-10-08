import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Store,
  FileText,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import { useManufacturer } from '../../context/ManufacturerContext';

const CATEGORIES = [
  'Select',
  'MEDICALS',
  'SUPER MARKETS',
  'PROVISION STORES',
  'GENERAL MERCHANTS',
  'DEPARTMENTAL STORES',
  'CLINICS',
  'FANCY STORES',
  'OTHERS'
];

export const TALUK_OPTIONS = [
  'Aminjikarai',
  'Ambattur'
];

export const FIRKA_OPTIONS_MAP = {
  'Ambattur': [
    'Ambattur, Oragadam, pudur, Kallikuppam, Pattravakkam, Ayyampakkam & Korattur',
    'Villivakkam - Area',
    'Padi - Area'
  ],
  'Aminjikarai': [
    'Aminjikarai, Anna Nagar & Shenoy Nagar',
    'Arumbakkam & Koyambedu - Area',
    'Villivakkam - Area'
  ]
};

export const ALL_FIRKAS = [
  'Ambattur, Oragadam, pudur, Kallikuppam, Pattravakkam, Ayyampakkam & Korattur',
  'Villivakkam - Area',
  'Padi - Area',
  'Aminjikarai, Anna Nagar & Shenoy Nagar',
  'Arumbakkam & Koyambedu - Area'
];


const parseCSVLine = (line) => {
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
};

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      const key = h.trim();
      obj[key] = vals[idx] !== undefined ? vals[idx].trim() : '';
    });
    rows.push(obj);
  }
  return rows;
};

const AddShopView = ({ onDone, onCancel }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeManufacturer } = useManufacturer();

  const initialTab = searchParams.get('tab') === 'bulk' ? 'bulk' : 'single';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Single Form State (matching Screenshots 1, 2, 3)
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    state: 'Tamilnadu',
    district: 'CHENNAI',
    division: 'CHENNAI CENTRAL B',
    taluk: '',
    firka: '',
    pincode: '',
    countryCode: 'India (+91)',
    phone: '',
    landline: '',
    email: '',
    address: '',
    gstNumber: ''
  });

  const [savingSingle, setSavingSingle] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkReport, setBulkReport] = useState(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'bulk') {
      setActiveTab('bulk');
    } else {
      setActiveTab('single');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ action: 'new', tab });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const availableFirkas = React.useMemo(() => {
    if (formData.taluk && FIRKA_OPTIONS_MAP[formData.taluk]) {
      return FIRKA_OPTIONS_MAP[formData.taluk];
    }
    return ALL_FIRKAS;
  }, [formData.taluk]);

  const handleTalukChange = (e) => {
    const newTaluk = e.target.value;
    setFormData((prev) => {
      const allowedFirkas = newTaluk ? (FIRKA_OPTIONS_MAP[newTaluk] || []) : ALL_FIRKAS;
      const keepFirka = allowedFirkas.includes(prev.firka) ? prev.firka : '';
      return {
        ...prev,
        taluk: newTaluk,
        firka: keepFirka
      };
    });
  };

  const handleFirkaChange = (e) => {
    const newFirka = e.target.value;
    setFormData((prev) => {
      let autoTaluk = prev.taluk;
      if (!autoTaluk) {
        if (FIRKA_OPTIONS_MAP['Ambattur']?.includes(newFirka)) {
          autoTaluk = 'Ambattur';
        } else if (FIRKA_OPTIONS_MAP['Aminjikarai']?.includes(newFirka)) {
          autoTaluk = 'Aminjikarai';
        }
      }
      return {
        ...prev,
        firka: newFirka,
        taluk: autoTaluk
      };
    });
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Shop Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Mobile Number is required');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Address is required');
      return;
    }

    setSavingSingle(true);
    try {
      const resolvedCategory = formData.category && formData.category !== 'Select' ? formData.category : 'SUPER MARKETS';
      const resolvedStoreType =
        resolvedCategory === 'MEDICALS' ? 'Pharmacy/FMCG' :
        resolvedCategory === 'SUPER MARKETS' ? 'Supermarket' :
        resolvedCategory === 'PROVISION STORES' ? 'Kirana' :
        resolvedCategory === 'DEPARTMENTAL STORES' ? 'Departmental' : 'Supermarket';

      const payload = {
        name: formData.name.trim(),
        category: resolvedCategory,
        storeType: resolvedStoreType,
        state: formData.state.trim() || 'Tamilnadu',
        district: formData.district.trim() || 'CHENNAI',
        city: formData.district.trim() || 'Chennai',
        division: formData.division.trim() || 'CHENNAI CENTRAL B',
        taluk: formData.taluk.trim(),
        firka: formData.firka.trim(),
        area: formData.firka.trim() || formData.taluk.trim() || '',
        pincode: formData.pincode.trim(),
        countryCode: '+91',
        phone: formData.phone.trim(),
        landline: formData.landline.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase(),
        manufacturerId: activeManufacturer?._id || null,
        manufacturerCode: activeManufacturer?.code || ''
      };

      const res = await api.post('/stores', payload);
      if (res.data.success) {
        try {
          sessionStorage.removeItem('tamil_erp_stores');
        } catch (e) {}
        setSuccessMsg(`Shop "${formData.name}" added successfully!`);
        setTimeout(() => {
          if (onDone) onDone();
          else navigate('/stores');
        }, 1200);
      } else {
        setErrorMsg(res.data.message || 'Failed to add shop');
      }
    } catch (err) {
      console.error('Add store error:', err);
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving shop');
    } finally {
      setSavingSingle(false);
    }
  };

  // ================= BULK UPLOAD HANDLERS =================
  const downloadTemplate = () => {
    const headers = [
      'Category',
      'Name',
      'State',
      'District',
      'Division',
      'Taluk',
      'FirkaArea',
      'Pincode',
      'CountryCode',
      'MobileNumber',
      'LandlineNumber',
      'EmailID',
      'Address',
      'GSTNumber'
    ];

    const sampleRow1 = [
      'MEDICALS',
      'Sri Balaji & Pharma',
      'Tamilnadu',
      'CHENNAI',
      'CHENNAI CENTRAL B',
      'Ambattur',
      'Ambattur',
      '600053',
      '+91',
      '9841433607',
      '044-26581234',
      'balaji@pharma.com',
      '"10-A, Hospital Road, Cholapuram, Ambattur"',
      '33AGVPT5588R1ZW'
    ];

    const sampleRow2 = [
      'SUPER MARKETS',
      'Nilgris Chandrika Home Needs',
      'Tamilnadu',
      'CHENNAI',
      'CHENNAI CENTRAL B',
      'Egmore',
      'Kilpauk',
      '600010',
      '+91',
      '9840123456',
      '',
      'nilgris@chandrika.com',
      '"12, Main Road, Kilpauk, Chennai"',
      '33AABCN1234F1Z5'
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Shop_Bulk_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    setBulkFile(file);
    setBulkReport(null);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setErrorMsg('The CSV file appears to be empty or missing rows.');
          setBulkData([]);
          return;
        }

        // Map column variations
        const mapped = parsed.map((row, idx) => {
          const name = row['Name'] || row['name'] || row['Shop Name'] || row['ShopName'] || '';
          const phone =
            row['MobileNumber'] ||
            row['Mobile Number'] ||
            row['Phone'] ||
            row['phone'] ||
            row['Mobile'] ||
            '';
          const category = row['Category'] || row['category'] || '';
          const state = row['State'] || row['state'] || 'Tamilnadu';
          const district = row['District'] || row['district'] || 'CHENNAI';
          const division = row['Division'] || row['division'] || 'CHENNAI CENTRAL B';
          const taluk = row['Taluk'] || row['taluk'] || '';
          const firka = row['FirkaArea'] || row['Firka'] || row['Area'] || row['area'] || '';
          const pincode = row['Pincode'] || row['pincode'] || '';
          const landline = row['LandlineNumber'] || row['Landline'] || '';
          const email = row['EmailID'] || row['Email'] || '';
          const address = row['Address'] || row['address'] || '';
          const gstNumber = row['GSTNumber'] || row['GSTIN'] || row['GST'] || '';

          const isValid = Boolean(name.trim() && phone.trim());

          const resolvedCat = category || 'SUPER MARKETS';
          const resolvedType =
            resolvedCat === 'MEDICALS' ? 'Pharmacy/FMCG' :
            resolvedCat === 'SUPER MARKETS' ? 'Supermarket' :
            resolvedCat === 'PROVISION STORES' ? 'Kirana' :
            resolvedCat === 'DEPARTMENTAL STORES' ? 'Departmental' : 'Supermarket';

          return {
            rowNum: idx + 1,
            name,
            phone,
            category: resolvedCat,
            storeType: resolvedType,
            state,
            district,
            city: district || 'Chennai',
            division,
            taluk,
            firka,
            area: firka || taluk || '',
            pincode,
            countryCode: '+91',
            landline,
            email,
            address,
            gstNumber,
            manufacturerId: activeManufacturer?._id || null,
            manufacturerCode: activeManufacturer?.code || '',
            isValid,
            error: !name.trim()
              ? 'Missing Name'
              : !phone.trim()
              ? 'Missing Mobile'
              : null
          };
        });

        setBulkData(mapped);
      } catch (err) {
        console.error('CSV parse error:', err);
        setErrorMsg('Failed to parse CSV file. Please make sure it is a valid format.');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) return;

    const validRows = bulkData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('No valid rows found in the CSV. Every shop must have a Name and Mobile Number.');
      return;
    }

    setUploadingBulk(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/stores/bulk', { stores: validRows });
      if (res.data.success) {
        try {
          sessionStorage.removeItem('tamil_erp_stores');
        } catch (e) {}
        setBulkReport({
          total: bulkData.length,
          uploaded: res.data.count,
          errors: res.data.errors || []
        });
        setSuccessMsg(`Successfully registered ${res.data.count} shops in bulk!`);
        setTimeout(() => {
          if (onDone) onDone();
          else navigate('/stores');
        }, 2000);
      } else {
        setErrorMsg(res.data.message || 'Bulk upload failed');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Error occurred during bulk upload');
    } finally {
      setUploadingBulk(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header (Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
              Add Shop (Retailers)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Register a single retail shop or upload a CSV dataset in bulk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCancel ? onCancel() : navigate('/stores')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Single vs Bulk Upload */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl max-w-sm">
          <button
            type="button"
            onClick={() => handleTabChange('single')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Shop Registration
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('bulk')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= TAB 1: SINGLE SHOP REGISTRATION (Screenshots 1, 2, 3) ================= */}
        {activeTab === 'single' && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 sm:p-8">
            <form onSubmit={handleSingleSubmit} className="space-y-5">
              {/* Category* */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category<span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat === 'Select' ? '' : cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name* */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* STATE* */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  STATE<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* DISTRICT* */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  DISTRICT<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* DIVISION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  DIVISION
                </label>
                <input
                  type="text"
                  name="division"
                  value={formData.division}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* TALUK */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5 tracking-wide">
                  TALUK
                </label>
                <select
                  name="taluk"
                  value={formData.taluk}
                  onChange={handleTalukChange}
                  style={{
                    backgroundColor: '#fef9a7',
                    borderColor: '#60a5fa',
                    color: '#0f172a'
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#fef9a7] border-[1.5px] border-[#60a5fa] rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 cursor-pointer shadow-sm transition-all"
                >
                  <option value="" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Select TALUK
                  </option>
                  <option value="Aminjikarai" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Aminjikarai
                  </option>
                  <option value="Ambattur" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Ambattur
                  </option>
                  {formData.taluk && !['', 'Aminjikarai', 'Ambattur'].includes(formData.taluk) && (
                    <option value={formData.taluk} style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                      {formData.taluk}
                    </option>
                  )}
                </select>
              </div>

              {/* FIRKA (AREA) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5 tracking-wide">
                  FIRKA (AREA)
                </label>
                <select
                  name="firka"
                  value={formData.firka}
                  onChange={handleFirkaChange}
                  style={{
                    backgroundColor: '#fef9a7',
                    borderColor: '#60a5fa',
                    color: '#0f172a'
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#fef9a7] border-[1.5px] border-[#60a5fa] rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 cursor-pointer shadow-sm transition-all"
                >
                  <option value="" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Select FIRKA (AREA)
                  </option>
                  {availableFirkas.map((f) => (
                    <option key={f} value={f} style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                      {f}
                    </option>
                  ))}
                  {formData.firka && !availableFirkas.includes(formData.firka) && (
                    <option value={formData.firka} style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                      {formData.firka}
                    </option>
                  )}
                </select>
              </div>

              {/* Pincode* */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Pincode<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Country Code* and Mobile Number* (Screenshot 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Country Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="India (+91)"
                    className="w-full px-3.5 py-2.5 bg-[#e9ecef] border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm cursor-not-allowed select-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mobile Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleSingleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Landline Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Landline Number
                </label>
                <input
                  type="tel"
                  name="landline"
                  value={formData.landline}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Email ID (Screenshot 3) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email ID
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Address* */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Address<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Submit Button (Screenshot 3: + Add) */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingSingle}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingSingle ? 'Adding...' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 2: BULK UPLOAD OPTION ================= */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            {/* Step 1 & Instructions Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>CSV / Excel Bulk Shop Registration</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download the official template, populate your retailer list, and upload below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="mt-6 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/20 rounded-xl p-8 text-center transition-all cursor-pointer relative"
              >
                <input
                  type="file"
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {bulkFile ? bulkFile.name : 'Click to browse or drag & drop CSV file here'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Supports .csv file format with up to 1,000 shops per batch
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Parsed Preview & Actions */}
            {bulkData.length > 0 && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      File Preview ({bulkData.length} records found)
                    </h3>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="text-emerald-700 font-semibold">
                        ✓ {bulkData.filter((r) => r.isValid).length} Ready to Import
                      </span>
                      {bulkData.filter((r) => !r.isValid).length > 0 && (
                        <span className="text-red-600 font-semibold">
                          ⚠ {bulkData.filter((r) => !r.isValid).length} Incomplete (Missing Name/Phone)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFile(null);
                        setBulkData([]);
                      }}
                      className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkUpload}
                      disabled={uploadingBulk || bulkData.filter((r) => r.isValid).length === 0}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingBulk
                          ? 'Importing...'
                          : `Import ${bulkData.filter((r) => r.isValid).length} Shops to ERP`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Shop Name</th>
                        <th className="py-2.5 px-3">Mobile Number</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3">Division</th>
                        <th className="py-2.5 px-3">Area / Firka</th>
                        <th className="py-2.5 px-3">GSTIN</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkData.slice(0, 100).map((r, idx) => (
                        <tr
                          key={idx}
                          className={r.isValid ? 'hover:bg-slate-50/60' : 'bg-red-50/40'}
                        >
                          <td className="py-2 px-3 text-center font-mono text-slate-400">
                            {r.rowNum}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-700">
                            {r.category || '-'}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {r.name || <span className="text-red-500 italic">Missing</span>}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {r.phone || <span className="text-red-500 italic">Missing</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{r.district || 'CHENNAI'}</td>
                          <td className="py-2 px-3 text-slate-600">{r.division || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{r.firka || '-'}</td>
                          <td className="py-2 px-3 font-mono text-slate-600 uppercase">
                            {r.gstNumber || '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {r.isValid ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-sm text-[10px]">
                                Valid
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-sm text-[10px]">
                                {r.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bulkData.length > 100 && (
                  <p className="text-xs text-slate-400 italic text-center">
                    Showing first 100 of {bulkData.length} records
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddShopView;
