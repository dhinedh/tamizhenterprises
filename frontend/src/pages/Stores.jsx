import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Stores = () => {
  const navigate = useNavigate();
  const { isOwner, isSalesman } = useAuth();

  // Master Data
  const [stores, setStores] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [overLimitOnly, setOverLimitOnly] = useState(false);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Create Store Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    storeType: 'Supermarket',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '',
    gstNumber: '',
    salesmanId: '',
    creditLimit: 50000,
    creditPeriodDays: 21
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
      }
    } catch (err) {
      console.error('Error fetching salesmen:', err);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (overdueOnly) query += '&overdueOnly=true';
      const res = await api.get(`/stores${query}`);
      if (res.data.success) {
        setStores(res.data.data);
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

  // Create New Store Handler
  const handleCreateStore = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salesmanId: formData.salesmanId || null
      };
      const res = await api.post('/stores', payload);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        resetForm();
        setSuccessToast(`Shop "${res.data.data.name}" registered successfully!`);
        setTimeout(() => setSuccessToast(''), 5000);
        fetchStores();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating store');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      storeType: 'Supermarket',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      area: '',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '',
      gstNumber: '',
      salesmanId: salesmen[0]?._id || '',
      creditLimit: 50000,
      creditPeriodDays: 21
    });
    setFormError('');
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
      `🏢 *TAMIL ENTERPRISES - ACCOUNT STATEMENT*\n` +
      `Proprietor: ${store.ownerName || ''}\n` +
      `Store Code: ${store.code}\n\n` +
      `📊 *Current Credit Summary:*\n` +
      `• Credit Limit: ₹ ${Number(store.creditLimit || 50000).toLocaleString('en-IN')}\n` +
      `• Outstanding Balance Due: *₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
      `• Payment Terms: ${store.creditPeriodDays || 21} Days Credit\n\n` +
      `🏦 *Payment Options (UPI & Bank):*\n` +
      `• UPI ID: tamilenterprises@hdfcbank\n` +
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
      const matchCity = cityFilter === 'All' || s.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchType = typeFilter === 'All' || s.storeType?.toLowerCase() === typeFilter.toLowerCase();
      const matchOverLimit = !overLimitOnly || (s.outstandingBalance || 0) > (s.creditLimit || 50000);
      return matchCity && matchType && matchOverLimit;
    });
  }, [stores, cityFilter, typeFilter, overLimitOnly]);

  // Unique Cities & Types for Filter Dropdowns
  const availableCities = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
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
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Shop Master & Distribution Network
              </span>
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
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Register New Shop
            </button>
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
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="All">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Shop Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="All">All Shop Types</option>
            <option value="Supermarket">Supermarket</option>
            <option value="Kirana">Kirana / Provision</option>
            <option value="Departmental">Departmental Shop</option>
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
                  <th className="py-3 px-3 text-right">Complete Tracking</th>
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
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                            {store.name}
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {store.code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {store.gstNumber ? `GST: ${store.gstNumber}` : 'URP (Unregistered)'}
                          </div>
                        </td>

                        {/* Type & City */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {store.city}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {store.storeType || 'Retailer'} {store.area ? `&bull; ${store.area}` : ''}
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
                              onClick={() => openStoreDetail(store._id)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors border border-teal-200"
                              title="View Full 360° Tracking & History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              360° History
                            </button>
                            <button
                              onClick={() => handleShareWhatsAppStatement(store)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              title="WhatsApp Statement / Reminder"
                            >
                              <Share2 className="w-3.5 h-3.5" />
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

      {/* ================= REGISTER NEW STORE MODAL ================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Retail Shop / Supermarket"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateStore} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Shop Name & Shop Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Shop Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meenakshi Supermarket"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop Type</label>
                <select
                  value={formData.storeType}
                  onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
                >
                  <option value="Supermarket">Supermarket</option>
                  <option value="Kirana">Kirana / Provision</option>
                  <option value="Departmental">Departmental Shop</option>
                  <option value="Wholesaler">Semi-Wholesaler</option>
                  <option value="Pharmacy/FMCG">Pharmacy / FMCG</option>
                </select>
              </div>
            </div>

            {/* Proprietor & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Owner / Proprietor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mr. S. Kannan"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile / WhatsApp Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 94430 00112"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Address, City, State, Area, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Madurai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  placeholder="Goripalayam"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="33AABCT9988C1Z4"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono uppercase focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Street Address <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Door No, Main Road, Landmark"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Credit Standing & Salesman */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.creditPeriodDays}
                  onChange={(e) => setFormData({ ...formData, creditPeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Salesman</label>
                <select
                  value={formData.salesmanId || ''}
                  onChange={(e) => setFormData({ ...formData, salesmanId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
                >
                  <option value="">Direct / Unassigned</option>
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.territory || s.city || 'Sales'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Registering Shop...' : 'Register Shop in ERP'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Stores;
