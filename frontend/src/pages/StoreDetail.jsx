import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  IndianRupee,
  AlertCircle,
  Truck,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  CreditCard,
  Package,
  RotateCcw,
  Building2,
  ArrowRightLeft,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  ShieldCheck,
  Percent,
  TrendingUp,
  Receipt,
  Pencil,
  Trash2
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner, isSalesman } = useAuth();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'invoices' | 'payments' | 'deliveries' | 'returns'

  // Expandable Order Row in Orders Tab
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Selected Invoice for Full View Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Toast Feedback
  const [copiedToast, setCopiedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Edit Credit / Store Details Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    gstNumber: '',
    creditLimit: 50000,
    creditPeriodDays: 21,
    storeType: 'Supermarket'
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchStoreDetail();
  }, [id]);

  const fetchStoreDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/stores/${id}`);
      if (res.data.success) {
        setStore(res.data.data);
        setEditFormData({
          name: res.data.data.name || '',
          ownerName: res.data.data.ownerName || '',
          phone: res.data.data.phone || '',
          address: res.data.data.address || '',
          area: res.data.data.area || '',
          city: res.data.data.city || '',
          pincode: res.data.data.pincode || '',
          gstNumber: res.data.data.gstNumber || '',
          creditLimit: res.data.data.creditLimit || 50000,
          creditPeriodDays: res.data.data.creditPeriodDays || 21,
          storeType: res.data.data.storeType || 'Supermarket'
        });
      } else {
        setError('Store not found');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching store tracking history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await api.put(`/stores/${id}`, editFormData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setToastMessage('Store settings updated successfully');
        setTimeout(() => setToastMessage(''), 4000);
        fetchStoreDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating store');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm(`Are you sure you want to delete store "${store.name}" (${store.code})?\n\nThis will permanently remove the shop.`)) {
      return;
    }
    try {
      const res = await api.delete(`/stores/${id}`);
      if (res.data.success) {
        try {
          sessionStorage.removeItem('tamil_erp_stores');
        } catch (e) {}
        navigate('/stores');
      } else {
        alert(res.data.message || 'Failed to delete store');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting store');
    }
  };

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

  const handleShareWhatsAppStatement = () => {
    if (!store) return;
    const balance = Number(store.outstandingBalance || 0);
    const text = encodeURIComponent(
      `வணக்கம் / Hello ${store.name || 'Store Partner'},\n\n` +
      `🏢 *TAMIZH ENTERPRISES - COMPLETE ACCOUNT STATEMENT*\n` +
      `Proprietor: ${store.ownerName || ''}\n` +
      `Store Code: ${store.code}\n\n` +
      `📊 *Credit & Outstanding Status:*\n` +
      `• Credit Limit: ₹ ${Number(store.creditLimit || 50000).toLocaleString('en-IN')}\n` +
      `• Outstanding Balance Due: *₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
      `• Payment Terms: ${store.creditPeriodDays || 21} Days Credit\n` +
      `• Lifetime Orders: ${store.totalOrdersCount || 0} orders (₹ ${Number(store.totalOrderValue || 0).toLocaleString('en-IN')})\n\n` +
      `🏦 *Payment Options (UPI & Bank):*\n` +
      `• UPI ID: tamizhenterprises@hdfcbank\n` +
      `• Bank: HDFC Bank, Madurai Main Branch\n` +
      `• A/C: 50200012345678 | IFSC: HDFC0000123\n\n` +
      `For any invoice queries, helpline: +91 94432 10987\n` +
      `Thank you for your continuous business with Tamizh Enterprises Central Depot!`
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

  // Calculations for financial status
  const financialMetrics = useMemo(() => {
    if (!store) return null;
    const limit = Number(store.creditLimit) || 50000;
    const balance = Number(store.outstandingBalance) || 0;
    const availableCredit = Math.max(0, limit - balance);
    const utilizationPct = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;
    const isOverLimit = balance > limit;

    const totalOrders = store.orders?.length || 0;
    const totalOrderAmount = (store.orders || []).reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    const totalPaymentsAmount = (store.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalInvoicesAmount = (store.invoices || []).reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);

    return {
      limit,
      balance,
      availableCredit,
      utilizationPct,
      isOverLimit,
      totalOrders,
      totalOrderAmount,
      totalPaymentsAmount,
      totalInvoicesAmount
    };
  }, [store]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-teal-600 gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Loading Shop 360° Tracking Dossier...
        </span>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{error || 'Shop Not Found'}</h3>
        <p className="text-xs text-slate-500">
          The requested retail shop could not be loaded or may have been removed.
        </p>
        <button
          onClick={() => navigate('/stores')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shops Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigate('/stores')}
            className="flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-semibold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shops Directory
          </button>
          <span>/</span>
          <span className="text-slate-400">Shop Profile</span>
          <span>/</span>
          <strong className="text-slate-800">{store.name}</strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsAppStatement}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp Statement
          </button>
          <button
            onClick={() => navigate('/store-transfers')}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer & Bill Stock
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-600" /> Edit Shop
          </button>
          <button
            onClick={handleDeleteStore}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors border border-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete Shop
          </button>
        </div>
      </div>

      {/* Main Executive Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-teal-500/20 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {store.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {store.storeType || 'Supermarket'}
              </span>
              {financialMetrics?.isOverLimit && (
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ⚠️ Credit Over-Limit
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Store className="w-7 h-7 text-teal-400" />
              {store.name}
            </h1>

            <div className="text-slate-300 text-xs flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {store.address}, {store.area ? `${store.area}, ` : ''}{store.city}, {store.state || 'Tamil Nadu'} - {store.pincode || '625001'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5 font-mono">
                GSTIN: <strong className="text-teal-200">{store.gstNumber || 'URP (Unregistered)'}</strong>
                {store.gstNumber && (
                  <button
                    onClick={() => handleCopyGST(store.gstNumber)}
                    className="p-1 hover:text-white rounded"
                    title="Copy GSTIN"
                  >
                    {copiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </span>
            </div>
          </div>

          {/* Quick Contact Capsule */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-col gap-1 text-xs shadow-inner min-w-[200px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Proprietor Contact</span>
            <div className="font-bold text-white text-sm">{store.ownerName}</div>
            <div className="text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              {store.phone || 'No mobile'}
            </div>
          </div>
        </div>

        {/* Ambient Light */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Financial Health Barometer & Standing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Outstanding Due */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Outstanding Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${financialMetrics?.isOverLimit ? 'text-rose-600' : 'text-amber-700'}`}>
            ₹ {financialMetrics?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Payment Terms: <strong className="text-slate-800">{store.creditPeriodDays || 21} Days Credit</strong>
          </div>
        </div>

        {/* Card 2: Credit Limit & Utilization */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Credit Limit</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹ {financialMetrics?.limit.toLocaleString('en-IN')}
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Credit Used:</span>
              <strong className={financialMetrics?.isOverLimit ? 'text-rose-600' : 'text-slate-800'}>
                {financialMetrics?.utilizationPct}%
              </strong>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  financialMetrics?.isOverLimit
                    ? 'bg-rose-600'
                    : financialMetrics?.utilizationPct > 80
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(100, financialMetrics?.utilizationPct || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Available Credit Buffer */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Remaining Buffer</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹ {financialMetrics?.availableCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Available headroom for new stock orders
          </div>
        </div>

        {/* Card 4: Lifetime Billed Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Lifetime Billed</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹ {Number(store.totalOrderValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Across <strong className="text-slate-800">{store.totalOrdersCount || 0} orders</strong> placed
          </div>
        </div>
      </div>

      {/* Complete Multi-Tab Tracking & History */}
      <Card>
        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Shop Orders ({store.orders?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            GST Tax Invoices & Challans ({store.invoices?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            Payment Receipts ({store.payments?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliveries')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'deliveries'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            Dispatch & Logistics ({store.deliveries?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'returns'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Returns & Credit Notes ({store.returns?.length || 0})
          </button>
        </div>

        {/* ================= TAB 1: STORE ORDERS ================= */}
        {activeTab === 'orders' && (
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Order Date</th>
                    <th className="py-3 px-3">Items Count</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-right">GST Tax</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-center">Fulfillment</th>
                    <th className="py-3 px-3 text-right">Terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {store.orders?.length > 0 ? (
                    store.orders.map((ord) => {
                      const isExpanded = expandedOrderId === ord._id;
                      return (
                        <React.Fragment key={ord._id}>
                          <tr
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord._id)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-teal-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                              {ord.orderNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {new Date(ord.orderDate).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3 px-3 font-medium">
                              {ord.items?.length || 0} product lines
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              ₹ {Number(ord.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-500">
                              ₹ {Number(ord.taxTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              ₹ {Number(ord.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <StatusBadge status={ord.status} />
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-500">
                              {ord.paymentType || 'Credit'}
                            </td>
                          </tr>

                          {/* Expanded Items Preview */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90">
                              <td colSpan="8" className="p-3">
                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                    Ordered Products in {ord.orderNumber}:
                                  </div>
                                  <div className="space-y-1">
                                    {ord.items?.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-[11px] p-1.5 rounded bg-slate-50">
                                        <span className="font-medium text-slate-800">
                                          {item.productName || item.name} {item.sku ? `[${item.sku}]` : ''}
                                        </span>
                                        <span className="font-mono text-teal-800 font-bold">
                                          {item.quantity} units @ ₹{item.unitPrice} = ₹{Number(item.total).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {ord.deliveryNotes && (
                                    <div className="text-[10px] text-slate-500 pt-1">
                                      Notes: {ord.deliveryNotes}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No orders recorded for this store yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GST INVOICES & CHALLANS ================= */}
        {activeTab === 'invoices' && (
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Invoice Number</th>
                    <th className="py-3 px-3">Challan / E-Way</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Taxable Subtotal</th>
                    <th className="py-3 px-3 text-right">GST Tax</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {store.invoices?.length > 0 ? (
                    store.invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-teal-700">
                          {inv.deliveryChallanNo || '-'}
                          {inv.eWayBillNo && (
                            <div className="text-[10px] text-slate-400">EWB: {inv.eWayBillNo}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          ₹ {Number(inv.taxableSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          ₹ {Number(inv.taxTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ₹ {Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition-colors"
                              title="Inspect Full Invoice"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        No GST tax invoices issued for this store yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PAYMENTS RECEIPTS ================= */}
        {activeTab === 'payments' && (
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Receipt Number</th>
                    <th className="py-3 px-3">Payment Date</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Transaction / UTR #</th>
                    <th className="py-3 px-3">Recorded By</th>
                    <th className="py-3 px-3 text-right">Amount Cleared</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {store.payments?.length > 0 ? (
                    store.payments.map((pmt) => (
                      <tr key={pmt._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {pmt.paymentNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(pmt.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {pmt.paymentMode}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {pmt.referenceNumber || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {pmt.collectedBy || 'Sales Agent'}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                          + ₹ {Number(pmt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {pmt.status || 'Success'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No payment receipts logged on this store account yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: DISPATCH & LOGISTICS ================= */}
        {activeTab === 'deliveries' && (
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Delivery Challan</th>
                    <th className="py-3 px-3">Vehicle Details</th>
                    <th className="py-3 px-3">Driver Contact</th>
                    <th className="py-3 px-3">Dispatch Date</th>
                    <th className="py-3 px-3">Estimated / Arrival</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {store.deliveries?.length > 0 ? (
                    store.deliveries.map((del) => (
                      <tr key={del._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {del.deliveryNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-teal-800">{del.vehicleNumber}</div>
                          <div className="text-[10px] text-slate-400">{del.vehicleType || 'Van'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{del.driverName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{del.driverPhone}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(del.dispatchDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {del.actualDeliveryDate
                            ? new Date(del.actualDeliveryDate).toLocaleDateString('en-IN')
                            : del.estimatedDeliveryDate
                            ? new Date(del.estimatedDeliveryDate).toLocaleDateString('en-IN')
                            : 'Same Day Delivery'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={del.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No delivery dispatches recorded on this store account yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: RETURNS & CLAIMS ================= */}
        {activeTab === 'returns' && (
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Return Number</th>
                    <th className="py-3 px-3">Credit Note #</th>
                    <th className="py-3 px-3">Return Date</th>
                    <th className="py-3 px-3">Items / Reason</th>
                    <th className="py-3 px-3 text-right">Credit Value</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {store.returns?.length > 0 ? (
                    store.returns.map((ret) => (
                      <tr key={ret._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {ret.returnNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-teal-700 font-bold">
                          {ret.creditNoteNumber || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(ret.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{ret.items?.length || 0} product items</div>
                          <div className="text-[10px] text-slate-400">{ret.items?.[0]?.reason || 'Expiry / Damage Claim'}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹ {Number(ret.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={ret.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No expiry or damage claims recorded for this store.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* ================= EDIT STORE MODAL ================= */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Shop Settings: ${store.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleUpdateStore} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop Trade Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proprietor Name</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={editFormData.ownerName}
                  onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.creditLimit}
                  onChange={(e) => setEditFormData({ ...editFormData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.creditPeriodDays}
                  onChange={(e) => setEditFormData({ ...editFormData, creditPeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Madurai"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={editFormData.gstNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {editSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= INVOICE INSPECT MODAL ================= */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <div className="font-extrabold text-teal-800 text-sm">TAMIZH ENTERPRISES</div>
                <div className="text-slate-500 text-[11px]">124, Goods Shed Road, Madurai - 625001</div>
                <div className="text-slate-600 font-mono text-[10px]">GSTIN: 33AABCT9988C1Z4</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-slate-900">{selectedInvoice.invoiceNumber}</div>
                <div className="text-slate-500">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</div>
                <div className="text-[10px] text-teal-700 font-mono">Challan: {selectedInvoice.deliveryChallanNo || '-'}</div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Taxable</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-slate-800">{it.name}</td>
                      <td className="p-2 text-right font-bold">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">₹{it.unitPrice}</td>
                      <td className="p-2 text-right font-mono">₹{Number(it.taxableValue).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-slate-900 font-mono">₹{Number(it.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">
                Tax Total: ₹{Number(selectedInvoice.taxTotal || 0).toFixed(2)}
              </div>
              <div className="text-right font-bold text-sm text-teal-900">
                Grand Total: ₹{Number(selectedInvoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StoreDetail;
