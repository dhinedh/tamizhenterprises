import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Eye,
  IndianRupee,
  AlertCircle,
  Truck,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Share2,
  CreditCard,
  Package,
  RotateCcw,
  Building2,
  SlidersHorizontal,
  ArrowRightLeft,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Upload,
  Pencil,
  Trash2
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useManufacturer } from '../context/ManufacturerContext';
import AddShopView from '../components/stores/AddShopView';

const CATEGORIES = [
  'MEDICALS',
  'SUPER MARKETS',
  'PROVISION STORES',
  'GENERAL MERCHANTS',
  'DEPARTMENTAL STORES',
  'CLINICS',
  'FANCY STORES',
  'OTHERS'
];

const STORE_TYPES = [
  'Supermarket',
  'Pharmacy/FMCG',
  'Kirana Store',
  'Departmental Store',
  'Provision Store',
  'General Merchant',
  'Retailer'
];

const Stores = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner, isSalesman } = useAuth();
  const { activeManufacturer } = useManufacturer();

  // Master Data
  const [stores, setStores] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_stores');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [salesmen, setSalesmen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_salesmen');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(stores.length === 0);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [overLimitOnly, setOverLimitOnly] = useState(false);

  // Toast State
  const [successToast, setSuccessToast] = useState('');

  // Edit Store State
  const [editingStore, setEditingStore] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    ownerName: '',
    category: 'SUPER MARKETS',
    storeType: 'Supermarket',
    phone: '',
    landline: '',
    email: '',
    state: 'Tamilnadu',
    district: 'CHENNAI',
    city: 'Chennai',
    area: '',
    address: '',
    pincode: '',
    gstNumber: '',
    creditLimit: 50000,
    creditPeriodDays: 15,
    salesmanId: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStores();
  }, [search, overdueOnly]);

  const fetchInitialData = async () => {
    try {
      const salesmenRes = await api.get('/salesmen');
      if (salesmenRes.data.success) {
        setSalesmen(salesmenRes.data.data);
        try {
          sessionStorage.setItem('tamil_erp_salesmen', JSON.stringify(salesmenRes.data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching salesmen:', err);
    }
  };

  const fetchStores = async () => {
    try {
      if (stores.length === 0) {
        setLoading(true);
      }
      let query = `?search=${encodeURIComponent(search)}`;
      if (overdueOnly) query += '&overdueOnly=true';
      const res = await api.get(`/stores${query}`);
      if (res.data.success) {
        setStores(res.data.data);
        if (!search && !overdueOnly) {
          try {
            sessionStorage.setItem('tamil_erp_stores', JSON.stringify(res.data.data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Store 360° Profile & Full History on dedicated page
  const openStoreDetail = (storeId) => {
    navigate(`/stores/${storeId}`);
  };

  // Edit Store Handlers
  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setEditError('');
    setEditFormData({
      name: store.name || '',
      ownerName: store.ownerName || '',
      category: store.category || 'SUPER MARKETS',
      storeType: store.storeType || 'Supermarket',
      phone: store.phone || '',
      landline: store.landline || '',
      email: store.email || '',
      state: store.state || 'Tamilnadu',
      district: store.district || store.city || 'CHENNAI',
      city: store.city || 'Chennai',
      area: store.area || '',
      address: store.address || '',
      pincode: store.pincode || '',
      gstNumber: store.gstNumber || '',
      creditLimit: store.creditLimit !== undefined ? store.creditLimit : 50000,
      creditPeriodDays: store.creditPeriodDays !== undefined ? store.creditPeriodDays : 15,
      salesmanId: store.salesmanId?._id || store.salesmanId || ''
    });
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editingStore) return;
    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await api.put(`/stores/${editingStore._id}`, editFormData);
      if (res.data.success) {
        setSuccessToast(`Shop "${editFormData.name}" updated successfully!`);
        setTimeout(() => setSuccessToast(''), 3500);
        setEditingStore(null);
        try {
          sessionStorage.removeItem('tamil_erp_stores');
        } catch (e) {}
        fetchStores();
      } else {
        setEditError(res.data.message || 'Failed to update store');
      }
    } catch (err) {
      console.error('Update store error:', err);
      setEditError(err.response?.data?.message || 'Error occurred while updating store');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteStore = async (store) => {
    const confirmMsg = `Are you sure you want to delete store "${store.name}" (${store.code})?\n\nThis will permanently remove the shop.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/stores/${store._id}`);
      if (res.data.success) {
        setSuccessToast(`Shop "${store.name}" deleted successfully!`);
        setTimeout(() => setSuccessToast(''), 3500);
        try {
          sessionStorage.removeItem('tamil_erp_stores');
        } catch (e) {}
        fetchStores();
      } else {
        alert(res.data.message || 'Failed to delete store');
      }
    } catch (err) {
      console.error('Delete store error:', err);
      alert(err.response?.data?.message || 'Error occurred while deleting store');
    }
  };

  // Actions for Store 360
  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tax-Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    }
  };

  const handleShareWhatsAppStatement = (store) => {
    const balance = Number(store.outstandingBalance || 0);
    const text = encodeURIComponent(
      `வணக்கம் / Hello ${store.name || 'Store Partner'},\n\n` +
      `🏢 *TAMIZH ENTERPRISES - ACCOUNT STATEMENT*\n` +
      `Proprietor: ${store.ownerName || ''}\n` +
      `Store Code: ${store.code}\n\n` +
      `📊 *Current Credit Summary:*\n` +
      `• Credit Limit: ₹ ${Number(store.creditLimit || 50000).toLocaleString('en-IN')}\n` +
      `• Outstanding Balance Due: *₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
      `• Payment Terms: ${store.creditPeriodDays || 21} Days Credit\n\n` +
      `🏦 *Payment Options (UPI & Bank):*\n` +
      `• UPI ID: tamizhenterprises@hdfcbank\n` +
      `• A/C: 50200012345678 | IFSC: HDFC0000123\n\n` +
      `For any billing queries, contact: +91 94432 10987\n` +
      `Thank you for your continuous partnership!`
    );
    const phone = store.phone ? store.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  const handleCopyGST = (gst) => {
    if (!gst) return;
    navigator.clipboard.writeText(gst);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Filtered Stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      // Universal stores (no manufacturerCode/Id) are accessible under all manufacturers
      // Stores with manufacturerCode match if it equals activeManufacturer.code or ID
      const matchBrand =
        !activeManufacturer ||
        !s.manufacturerCode ||
        !s.manufacturerId ||
        s.manufacturerCode?.toUpperCase() === activeManufacturer.code?.toUpperCase() ||
        s.manufacturerId?._id?.toString() === activeManufacturer._id?.toString() ||
        s.manufacturerId?.toString() === activeManufacturer._id?.toString();

      const matchCity =
        cityFilter === 'All' ||
        s.city?.toLowerCase() === cityFilter.toLowerCase() ||
        s.district?.toLowerCase() === cityFilter.toLowerCase();

      const matchArea =
        areaFilter === 'All' ||
        s.area?.toLowerCase() === areaFilter.toLowerCase();

      const matchType =
        typeFilter === 'All' ||
        s.storeType?.toLowerCase() === typeFilter.toLowerCase() ||
        s.category?.toLowerCase() === typeFilter.toLowerCase() ||
        (typeFilter === 'Pharmacy/FMCG' && (s.storeType?.toLowerCase()?.includes('pharm') || s.category?.toLowerCase()?.includes('medic') || s.category?.toLowerCase()?.includes('clinic'))) ||
        (typeFilter === 'Supermarket' && (s.storeType?.toLowerCase()?.includes('super') || s.category?.toLowerCase()?.includes('super'))) ||
        (typeFilter === 'Kirana' && (s.storeType?.toLowerCase()?.includes('kirana') || s.category?.toLowerCase()?.includes('provision') || s.category?.toLowerCase()?.includes('general'))) ||
        (typeFilter === 'Departmental' && (s.storeType?.toLowerCase()?.includes('depart') || s.category?.toLowerCase()?.includes('depart')));

      const matchOverLimit = !overLimitOnly || (s.outstandingBalance || 0) > (s.creditLimit || 50000);
      return matchBrand && matchCity && matchArea && matchType && matchOverLimit;
    });
  }, [stores, activeManufacturer, cityFilter, areaFilter, typeFilter, overLimitOnly]);

  // Unique Cities & Areas for Filter Dropdowns
  const availableCities = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => {
      if (s.city) set.add(s.city);
      if (s.district) set.add(s.district);
    });
    return Array.from(set);
  }, [stores]);

  const availableAreas = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => {
      if (s.area) set.add(s.area);
    });
    return Array.from(set).sort();
  }, [stores]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalStores = stores.length;
    const totalOutstanding = stores.reduce((sum, s) => sum + (Number(s.outstandingBalance) || 0), 0);
    const overLimitCount = stores.filter((s) => (s.outstandingBalance || 0) > (s.creditLimit || 50000)).length;
    const totalLifetimeValue = stores.reduce((sum, s) => sum + (Number(s.totalOrderValue) || 0), 0);

    return {
      totalStores,
      totalOutstanding,
      overLimitCount,
      totalLifetimeValue
    };
  }, [stores]);

  const isAddMode = location.search.includes('action=new') || location.search.includes('create=true');

  if (isAddMode) {
    return (
      <AddShopView
        onDone={() => {
          fetchStores();
          navigate('/stores', { replace: true });
        }}
        onCancel={() => navigate('/stores', { replace: true })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-teal-500/20 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Shop Master & Distribution Network
              </span>
              {activeManufacturer && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Brand Scope: {activeManufacturer.name || activeManufacturer.code}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Store className="w-6 h-6 text-teal-400" />
              Retail Shops Directory & Complete 360° Tracking
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Manage retail shops, supermarkets & grocery accounts. Click any shop to inspect complete 360° tracking, order history, GST tax invoices, payment collections, and delivery challans.
            </p>
          </div>

          {(isOwner || isSalesman) && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/stores?action=new&tab=bulk')}
                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4" /> Bulk Upload
              </button>
              <button
                type="button"
                onClick={() => navigate('/stores?action=new')}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register New Shop
              </button>
            </div>
          )}
        </div>

        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Shops</div>
            <div className="text-lg font-extrabold text-slate-900">{stats.totalStores} Shops</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Receivables</div>
            <div className="text-lg font-extrabold text-amber-700">
              ₹ {stats.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Over Credit Limit</div>
            <div className={`text-lg font-extrabold ${stats.overLimitCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.overLimitCount} Shops
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lifetime Billed</div>
            <div className="text-lg font-extrabold text-emerald-700">
              ₹ {stats.totalLifetimeValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search shops by name, code, owner, mobile, city, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* City / District Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="All">All Cities / Districts</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Area / Locality Filter */}
          {availableAreas.length > 0 && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[150px] truncate"
            >
              <option value="All">All Areas ({availableAreas.length})</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          )}

          {/* Shop Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="All">All Shop Types</option>
            <option value="Pharmacy/FMCG">Pharmacy / Medicals</option>
            <option value="Supermarket">Supermarket</option>
            <option value="Kirana">Kirana / Provision</option>
            <option value="Departmental">Departmental / Specialty</option>
            <option value="Wholesaler">Wholesaler</option>
          </select>

          {/* Outstanding Balance Toggle */}
          <button
            type="button"
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              overdueOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Receivables Only
          </button>

          {/* Over Limit Toggle */}
          <button
            type="button"
            onClick={() => setOverLimitOnly(!overLimitOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              overLimitOnly
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Over Credit Limit
          </button>
        </div>
      </div>

      {/* Stores Master Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Shop Name & Code</th>
                  <th className="py-3 px-3">Type & City</th>
                  <th className="py-3 px-3">Owner & Contact</th>
                  <th className="py-3 px-3 text-right">Credit Terms</th>
                  <th className="py-3 px-3 text-right">Outstanding Due</th>
                  <th className="py-3 px-3 text-right">Complete Tracking & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store) => {
                    const balance = Number(store.outstandingBalance || 0);
                    const limit = Number(store.creditLimit || 50000);
                    const isOver = balance > limit;
                    const isHigh = balance > limit * 0.8;

                    return (
                      <tr
                        key={store._id}
                        onClick={() => openStoreDetail(store._id)}
                        className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Name & Code */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5 flex-wrap">
                            {store.name}
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {store.code}
                            </span>
                            {store.manufacturerCode ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                                {store.manufacturerCode}
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                Retail Partner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {store.gstNumber ? `GST: ${store.gstNumber}` : 'URP (Unregistered)'}
                          </div>
                        </td>

                        {/* Type & City */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {store.city} {store.pincode ? `(${store.pincode})` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap mt-0.5">
                            <span className="font-medium text-slate-700">{store.storeType || 'Retailer'}</span>
                            {store.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                                {store.category}
                              </span>
                            )}
                            {store.area ? <span>&bull; {store.area}</span> : ''}
                          </div>
                        </td>

                        {/* Owner & Phone */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{store.ownerName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {store.phone || 'No phone'}
                          </div>
                        </td>

                        {/* Credit Terms */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-semibold text-slate-800">
                            ₹ {limit.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {store.creditPeriodDays || 21} Days Credit
                          </div>
                        </td>

                        {/* Outstanding Balance */}
                        <td className="py-3 px-3 text-right">
                          <div className={`font-bold font-mono ${isOver ? 'text-rose-600' : isHigh ? 'text-amber-700' : balance > 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                            ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          {isOver ? (
                            <span className="inline-block text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-rose-100 text-rose-800">
                              Over Limit
                            </span>
                          ) : (
                            <div className="text-[10px] text-slate-400">
                              {store.totalOrdersCount || 0} lifetime orders
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openStoreDetail(store._id)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors border border-teal-200 cursor-pointer"
                              title="View Full 360° Tracking & History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              360° History
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsAppStatement(store)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                              title="WhatsApp Statement / Reminder"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Edit Shop Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(store)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                              title="Edit Shop Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Shop Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStore(store)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                              title="Delete Shop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No retail shops found matching current search & filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ================= EDIT SHOP MODAL ================= */}
      {editingStore && (
        <Modal
          isOpen={!!editingStore}
          onClose={() => {
            setEditingStore(null);
            setEditError('');
          }}
          title={`Edit Shop: ${editingStore.name} (${editingStore.code})`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleUpdateStore} className="space-y-4 text-xs">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Row 1: Shop Name & Proprietor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Shop Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Fresh2Day Sampoorna Vinayaga"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Proprietor / Owner Name
                </label>
                <input
                  type="text"
                  value={editFormData.ownerName}
                  onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Owner / Contact Person"
                />
              </div>
            </div>

            {/* Row 2: Phone, Landline, Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Landline / Alt Phone
                </label>
                <input
                  type="text"
                  value={editFormData.landline}
                  onChange={(e) => setEditFormData({ ...editFormData, landline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Optional landline"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="shop@email.com"
                />
              </div>
            </div>

            {/* Row 3: Category, Store Type, Assigned Salesman */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Store Type
                </label>
                <select
                  value={editFormData.storeType}
                  onChange={(e) => setEditFormData({ ...editFormData, storeType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  {STORE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Salesman
                </label>
                <select
                  value={editFormData.salesmanId}
                  onChange={(e) => setEditFormData({ ...editFormData, salesmanId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- No Salesman Assigned --</option>
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code || s.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Address & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Door No, Street Name"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={editFormData.area}
                  onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Annanagar, Kilpauk"
                />
              </div>
            </div>

            {/* Row 5: City, Pincode, GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  City / District
                </label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value, district: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Chennai"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={editFormData.pincode}
                  onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="6-digit pincode"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GST Number (GSTIN)
                </label>
                <input
                  type="text"
                  value={editFormData.gstNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono uppercase focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Leave empty if Unregistered"
                />
              </div>
            </div>

            {/* Row 6: Credit Limit & Credit Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editFormData.creditLimit}
                  onChange={(e) => setEditFormData({ ...editFormData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.creditPeriodDays}
                  onChange={(e) => setEditFormData({ ...editFormData, creditPeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditingStore(null);
                  setEditError('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                {editSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Stores;
