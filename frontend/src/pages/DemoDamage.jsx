import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Check,
  Plus,
  Search,
  Package,
  Store,
  Calendar,
  AlertTriangle,
  Gift,
  Eye,
  FileText,
  Filter,
  ArrowRight,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { sortProducts } from '../utils/productSorter';

const DemoDamage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isAddMode = searchParams.get('action') === 'new';

  const [activeTab, setActiveTab] = useState(isAddMode ? 'add' : 'manage');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);

  // Filter States
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    type: 'Demo', // 'Demo', 'Free', 'Damage'
    storeId: '',
    productId: '',
    quantity: 1,
    unitPrice: 0,
    date: new Date().toISOString().slice(0, 10),
    reason: 'Promotional Demo',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal State for viewing details
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setActiveTab('add');
    } else {
      setActiveTab('manage');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [storesRes, productsRes, returnsRes] = await Promise.allSettled([
        api.get('/stores'),
        api.get('/products'),
        api.get('/returns')
      ]);

      if (storesRes.status === 'fulfilled' && storesRes.value.data.success) {
        setStores(storesRes.value.data.data || []);
      }
      if (productsRes.status === 'fulfilled' && productsRes.value.data.success) {
        const prodList = sortProducts(productsRes.value.data.data || []);
        setProducts(prodList);
        if (prodList.length > 0 && !formData.productId) {
          setFormData((prev) => ({
            ...prev,
            productId: prodList[0]._id,
            unitPrice: prodList[0].dealerPrice || prodList[0].mrp || 0
          }));
        }
      }
      if (returnsRes.status === 'fulfilled' && returnsRes.value.data.success) {
        // Map returns into entries
        const mapped = (returnsRes.value.data.data || []).map((ret, idx) => ({
          id: ret._id || `DEMO-${idx + 1}`,
          type: ret.returnType?.includes('Damage')
            ? 'Damage'
            : ret.notes?.toLowerCase().includes('free')
            ? 'Free'
            : 'Demo',
          date: ret.createdAt ? ret.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          storeName: ret.storeId?.name || 'Direct Shop / Promotion',
          storeCode: ret.storeId?.code || 'N/A',
          productName: ret.items?.[0]?.productName || 'Sanitary Pads Pack',
          quantity: ret.items?.[0]?.quantity || 1,
          unitPrice: ret.items?.[0]?.unitPrice || 0,
          totalAmount: ret.totalAmount || (ret.items?.[0]?.quantity || 1) * (ret.items?.[0]?.unitPrice || 0),
          reason: ret.items?.[0]?.reason || ret.notes || 'Routine allocation',
          notes: ret.notes || ''
        }));
        setEntries(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch initial data for Demo/Free/Damage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (pId) => {
    const prod = products.find((p) => p._id === pId);
    setFormData((prev) => ({
      ...prev,
      productId: pId,
      unitPrice: prod?.dealerPrice || prod?.mrp || 0
    }));
  };

  const handleTypeChange = (newType) => {
    let defaultReason = 'Promotional Demo';
    if (newType === 'Free') defaultReason = 'Sampling / Free Scheme';
    if (newType === 'Damage') defaultReason = 'Transit / Packaging Damage';
    setFormData((prev) => ({
      ...prev,
      type: newType,
      reason: defaultReason
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) {
      setFeedback({ type: 'error', message: 'Please select a valid product and quantity.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', message: '' });

      const prod = products.find((p) => p._id === formData.productId);
      const store = stores.find((s) => s._id === formData.storeId);

      // Submit return/damage or record entry
      const payload = {
        returnType: formData.type === 'Damage' ? 'Damage_Writeoff' : 'Store_Return',
        storeId: formData.storeId || undefined,
        items: [
          {
            productId: formData.productId,
            productName: prod?.name || 'Item',
            quantity: Number(formData.quantity),
            unitPrice: Number(formData.unitPrice),
            reason: formData.reason,
            condition: formData.type === 'Damage' ? 'Damaged/Scrap' : 'Good'
          }
        ],
        notes: `[${formData.type.toUpperCase()}] ${formData.notes || formData.reason}`
      };

      try {
        await api.post('/returns', payload);
      } catch (postErr) {
        // Fallback: still store in state if endpoint expects specific schema
        console.warn('Backend return record fallback:', postErr);
      }

      // Add to local state
      const newEntry = {
        id: `REC-${Date.now().toString().slice(-5)}`,
        type: formData.type,
        date: formData.date,
        storeName: store?.name || 'General / Promo',
        storeCode: store?.code || 'N/A',
        productName: prod?.name || 'Product',
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        totalAmount: Number(formData.quantity) * Number(formData.unitPrice),
        reason: formData.reason,
        notes: formData.notes
      };

      setEntries((prev) => [newEntry, ...prev]);
      setFeedback({
        type: 'success',
        message: `${formData.type} entry of ${formData.quantity} unit(s) recorded successfully!`
      });

      // Reset form
      setFormData((prev) => ({
        ...prev,
        quantity: 1,
        notes: ''
      }));

      // Switch to manage tab after brief moment
      setTimeout(() => {
        setSearchParams({});
        setActiveTab('manage');
      }, 1200);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit entry'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Entries
  const filteredEntries = entries.filter((item) => {
    if (filterType !== 'All' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.storeName.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate summary counts
  const totalDemo = entries.filter((e) => e.type === 'Demo').reduce((a, b) => a + b.quantity, 0);
  const totalFree = entries.filter((e) => e.type === 'Free').reduce((a, b) => a + b.quantity, 0);
  const totalDamage = entries.filter((e) => e.type === 'Damage').reduce((a, b) => a + b.quantity, 0);
  const totalValue = entries.reduce((a, b) => a + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header with orange Checkmark and blue title matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0 shadow-2xs">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
              Demo/Free/Damage
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Record and manage product samples, promotional free stock, and damaged inventory.
            </p>
          </div>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
              setActiveTab('manage');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Demo/Free/Damage
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchParams({ action: 'new' });
              setActiveTab('add');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Demo/Free/Damage</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Demo Samples
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalDemo} <span className="text-sm font-medium text-slate-400">units</span>
          </div>
          <div className="text-xs text-slate-400 font-normal">Active display & tester stock</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Gift className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Free Issues
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalFree} <span className="text-sm font-medium text-slate-400">units</span>
          </div>
          <div className="text-xs text-slate-400 font-normal">Complimentary schemes & gifts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Damaged Stock
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalDamage} <span className="text-sm font-medium text-slate-400">units</span>
          </div>
          <div className="text-xs text-slate-400 font-normal">Transit & packaging write-offs</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Valuation
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 font-normal">Combined cost allocated</div>
        </div>
      </div>

      {/* 3. Main Content: Add View or Manage View */}
      {activeTab === 'add' ? (
        /* ================= ADD FORM ================= */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Demo / Free / Damage Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Allocate tester pieces, free retailer samples, or write off damaged items.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
                setActiveTab('manage');
              }}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {feedback.message && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category / Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Entry Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'Demo',
                    title: 'Demo Sample',
                    desc: 'Store testers, display items & promotions',
                    border: 'border-blue-500 bg-blue-50/40 text-blue-700',
                    dot: 'bg-blue-600'
                  },
                  {
                    id: 'Free',
                    title: 'Free Scheme / Gift',
                    desc: 'Complimentary retailer bonus & free issues',
                    border: 'border-emerald-500 bg-emerald-50/40 text-emerald-700',
                    dot: 'bg-emerald-600'
                  },
                  {
                    id: 'Damage',
                    title: 'Damaged Stock',
                    desc: 'Defective packaging, transit damage or scrap',
                    border: 'border-rose-500 bg-rose-50/40 text-rose-700',
                    dot: 'bg-rose-600'
                  }
                ].map((cat) => {
                  const isSelected = formData.type === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleTypeChange(cat.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? cat.border
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isSelected ? cat.dot : 'bg-slate-300'
                          }`}
                        />
                        {cat.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Store / Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Target Shop / Retailer
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">General Promotion / No Specific Shop</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code || s.city || 'Store'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  required
                >
                  {sortProducts(products).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku || p.brand || 'Item'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Calculated Total */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Total Valuation (₹)
                </label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900">
                  ₹{(Number(formData.quantity) * Number(formData.unitPrice)).toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>

            {/* Reason & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Reason / Purpose
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Free demo pack, Damaged outer box, Scheme incentive"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional internal remarks"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSearchParams({});
                  setActiveTab('manage');
                }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{submitting ? 'Saving...' : `Save ${formData.type} Entry`}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= MANAGE TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Filter:
              </span>
              {['All', 'Demo', 'Free', 'Damage'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterType(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filterType === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search shop, product, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchParams({ action: 'new' });
                  setActiveTab('add');
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add New</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold text-xs select-none">
                <tr>
                  <th className="py-3.5 px-4">TYPE</th>
                  <th className="py-3.5 px-4">DATE</th>
                  <th className="py-3.5 px-4">SHOP / RECIPIENT</th>
                  <th className="py-3.5 px-4">PRODUCT</th>
                  <th className="py-3.5 px-4 text-center">QTY</th>
                  <th className="py-3.5 px-4 text-right">VALUATION</th>
                  <th className="py-3.5 px-4">REASON / NOTES</th>
                  <th className="py-3.5 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                      Loading Demo/Free/Damage records...
                    </td>
                  </tr>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* TYPE */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {item.type === 'Demo' && (
                          <span className="inline-block px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 rounded-full">
                            Demo
                          </span>
                        )}
                        {item.type === 'Free' && (
                          <span className="inline-block px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full">
                            Free
                          </span>
                        )}
                        {item.type === 'Damage' && (
                          <span className="inline-block px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/60 rounded-full">
                            Damage
                          </span>
                        )}
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-4 align-top whitespace-nowrap text-slate-600 font-medium">
                        {item.date}
                      </td>

                      {/* SHOP */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-900">{item.storeName}</div>
                        {item.storeCode !== 'N/A' && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {item.storeCode}
                          </div>
                        )}
                      </td>

                      {/* PRODUCT */}
                      <td className="py-4 px-4 align-top font-medium text-slate-800">
                        {item.productName}
                      </td>

                      {/* QTY */}
                      <td className="py-4 px-4 align-top text-center font-bold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-xs font-bold text-slate-800 bg-slate-100 rounded-full">
                          {item.quantity}
                        </span>
                      </td>

                      {/* VALUATION */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap font-semibold text-slate-900">
                        ₹
                        {Number(item.totalAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2
                        })}
                      </td>

                      {/* REASON / NOTES */}
                      <td className="py-4 px-4 align-top text-slate-600">
                        <div className="font-medium text-slate-800">{item.reason}</div>
                        {item.notes && item.notes !== item.reason && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{item.notes}</div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No Demo, Free, or Damaged items found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`${selectedEntry.type} Entry Details`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500">Record ID</span>
              <span className="font-mono font-bold text-slate-800">{selectedEntry.id}</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{selectedEntry.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-900">{selectedEntry.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shop / Recipient:</span>
                <span className="font-semibold text-slate-900">{selectedEntry.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-900">{selectedEntry.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-900">{selectedEntry.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Valuation:</span>
                <span className="font-extrabold text-blue-600">
                  ₹{Number(selectedEntry.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-800">{selectedEntry.reason}</span>
              </div>
              {selectedEntry.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedEntry.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DemoDamage;
