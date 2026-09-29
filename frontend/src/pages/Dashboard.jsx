import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  Package,
  Store,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Boxes,
  Users,
  CheckCircle2,
  FileText,
  Building2,
  Search,
  Sparkles,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Filter,
  PackagePlus,
  Plus,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useManufacturer } from '../context/ManufacturerContext';
import Card, { MetricCard } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import ManufacturerCard from '../components/dashboard/ManufacturerCard';
import QuickStockInwardModal from '../components/stock/QuickStockInwardModal';

const COLORS = ['#0f766e', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'];

const Dashboard = () => {
  const { user, isOwner, isSalesman, isStore } = useAuth();
  const { activeManufacturer, setActiveManufacturer, clearActiveManufacturer } = useManufacturer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfgFilter, setMfgFilter] = useState('ALL');
  const [mfgSearch, setMfgSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [selectedProductForInward, setSelectedProductForInward] = useState(null);
  const [selectedMfgForInward, setSelectedMfgForInward] = useState(null);

  const [isAddMfgModalOpen, setIsAddMfgModalOpen] = useState(false);
  const [submittingMfg, setSubmittingMfg] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [mfgFormData, setMfgFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '',
    gstNumber: '',
    creditPeriodDays: 30,
    paymentTerms: '30 Days Credit',
    categories: ''
  });

  // Dynamic products list to be registered under this manufacturer
  const [mfgProducts, setMfgProducts] = useState([]);

  const openAddMfgModal = () => {
    if (mfgProducts.length === 0) {
      setMfgProducts([
        {
          name: '',
          sku: '',
          unit: 'Pcs',
          purchasePrice: '',
          mrp: '',
          initialStock: 0,
          gstRate: 18
        }
      ]);
    }
    setIsAddMfgModalOpen(true);
  };

  const handleAddProductRow = () => {
    setMfgProducts(prev => [
      ...prev,
      {
        name: '',
        sku: '',
        unit: 'Pcs',
        purchasePrice: '',
        mrp: '',
        initialStock: 0,
        gstRate: 18
      }
    ]);
  };

  const handleRemoveProductRow = (index) => {
    setMfgProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index, field, value) => {
    setMfgProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'name' && mfgFormData.code && !updated[index].sku) {
        const cleanName = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
        if (cleanName) {
          updated[index].sku = `${mfgFormData.code.toUpperCase()}-${cleanName}`;
        }
      }
      return updated;
    });
  };

  const handleCreateManufacturer = async (e) => {
    e.preventDefault();
    try {
      setSubmittingMfg(true);
      const payload = {
        ...mfgFormData,
        categories: mfgFormData.categories
          ? (typeof mfgFormData.categories === 'string'
              ? mfgFormData.categories.split(',').map(c => c.trim()).filter(Boolean)
              : mfgFormData.categories)
          : [],
        products: mfgProducts.filter(p => p.name.trim())
      };
      const res = await api.post('/manufacturers', payload);
      if (res.data.success) {
        setIsAddMfgModalOpen(false);
        const createdCount = payload.products.length;
        setSuccessToast(`Brand "${res.data.data?.name || payload.name}" registered with ${createdCount} product(s)! Reflected across all catalog, stock, and order views.`);
        setTimeout(() => setSuccessToast(''), 6000);
        setMfgFormData({
          name: '',
          code: '',
          contactPerson: '',
          phone: '',
          email: '',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '',
          gstNumber: '',
          creditPeriodDays: 30,
          paymentTerms: '30 Days Credit',
          categories: ''
        });
        setMfgProducts([]);
        await fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create manufacturer');
    } finally {
      setSubmittingMfg(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);

        // Keep activeManufacturer synced with fresh stats data
        if (activeManufacturer) {
          const freshMfg = res.data.data.manufacturerCards?.find(
            m => m._id === activeManufacturer._id || m.code === activeManufacturer.code
          );
          if (freshMfg) {
            setActiveManufacturer(freshMfg);
          } else {
            clearActiveManufacturer();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const lowStockAlerts = data?.lowStockAlerts || [];
  const topProducts = data?.topProducts || [];
  const topStores = data?.topStores || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const manufacturerCards = data?.manufacturerCards || [];

  // Filtered manufacturers for the main hub
  const filteredManufacturers = manufacturerCards.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(mfgSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(mfgSearch.toLowerCase()) ||
      (m.categories && m.categories.some(c => c.toLowerCase().includes(mfgSearch.toLowerCase())));

    if (!matchesSearch) return false;

    if (mfgFilter === 'ALL') return true;
    if (mfgFilter === 'LOW_STOCK') return (m.lowStockCount || 0) > 0;
    return m.code === mfgFilter;
  });

  const filterTabs = manufacturerCards.length > 0 ? [
    { key: 'ALL', label: 'All Brands', count: manufacturerCards.length },
    ...manufacturerCards.map(m => ({
      key: m.code,
      label: m.name,
      count: m.productsCount || 0
    })),
    ...(manufacturerCards.some(m => (m.lowStockCount || 0) > 0)
      ? [{ key: 'LOW_STOCK', label: 'Stock Alerts', count: manufacturerCards.filter(m => (m.lowStockCount || 0) > 0).length }]
      : [])
  ] : [];

  // =========================================================================
  // VIEW 1: ACTIVE MANUFACTURER WORKSPACE (Sidebar is Visible on the Left)
  // =========================================================================
  if (activeManufacturer) {
    // Current fresh active manufacturer data
    const mfg = manufacturerCards.find(m => m.code === activeManufacturer.code) || activeManufacturer;
    const isFemi9 = mfg.code === 'FEMI9';
    const isMansara = mfg.code === 'MANSARA';

    const products = mfg.products || [];
    const filteredProducts = products.filter(p =>
      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
    );
    const purchases = mfg.recentPurchases || [];

    return (
      <div className="space-y-6">
        {/* Brand Header Banner */}
        <div
          className={`p-6 rounded-2xl text-white shadow-lg border relative overflow-hidden ${
            isFemi9
              ? 'bg-gradient-to-r from-slate-900 via-pink-950 to-slate-900 border-pink-500/40'
              : isMansara
              ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-amber-500/40'
              : 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-teal-500/40'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border flex-shrink-0 shadow-inner ${
                  isFemi9
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : isMansara
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}
              >
                {mfg.code ? mfg.code.substring(0, 3) : <Building2 className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {mfg.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-white/10 text-white border border-white/20">
                    {mfg.code}
                  </span>
                  {isFemi9 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/30 text-pink-200 border border-pink-400/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Feminine Hygiene Partner
                    </span>
                  )}
                  {isMansara && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Traditional Agro & Spices
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5">
                  {mfg.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" /> {mfg.city}, {mfg.state || 'Tamil Nadu'}
                    </span>
                  )}
                  {mfg.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-400" /> {mfg.phone}
                    </span>
                  )}
                  {mfg.gstNumber && (
                    <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                      GSTIN: {mfg.gstNumber}
                    </span>
                  )}
                  <span className="text-amber-300 font-medium">
                    Credit Terms: {mfg.creditPeriodDays || 21} Days
                  </span>
                </div>
              </div>
            </div>

            {/* Switch Brand & Quick PO */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={clearActiveManufacturer}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15"
                title="Return to main dashboard with all brands"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Switch Manufacturer
              </button>
              <Link
                to={`/purchases?manufacturerId=${mfg._id}`}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Boxes className="w-4 h-4" /> Issue New PO
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">SKU Catalogue</div>
              <div className="text-xl font-bold text-white mt-0.5">{mfg.productsCount || 0} Products</div>
              <div className="text-[11px] text-teal-300 mt-0.5">{mfg.totalPhysicalStock || 0} units physical</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">Stock Valuation</div>
              <div className="text-xl font-bold text-emerald-300 mt-0.5">
                ₹ {Number(mfg.stockValuation || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">Cost in warehouse</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">Total Purchased</div>
              <div className="text-xl font-bold text-white mt-0.5">
                ₹ {Number(mfg.totalPurchased || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">{purchases.length} Purchase Orders</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">Outstanding Payable</div>
              <div className="text-xl font-bold text-amber-300 mt-0.5">
                ₹ {Number(mfg.currentOutstanding || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-200 mt-0.5">Payment Due Status</div>
            </div>
          </div>
        </div>

        {/* Brand Specific Shortcuts Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/products"
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Manage Catalogue</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{mfg.productsCount || 0} {mfg.code} SKUs</div>
            </div>
            <Package className="w-5 h-5 text-teal-600" />
          </Link>

          <Link
            to="/stock"
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Warehouse Bay Stock</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{mfg.totalAvailableStock || 0} Available</div>
            </div>
            <Boxes className="w-5 h-5 text-teal-600" />
          </Link>

          <button
            onClick={() => {
              setSelectedMfgForInward(mfg);
              setSelectedProductForInward(null);
              setIsInwardModalOpen(true);
            }}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Direct Stock Inward</div>
              <div className="text-sm font-bold text-teal-700 mt-0.5">+ Update Stock</div>
            </div>
            <PackagePlus className="w-5 h-5 text-teal-600" />
          </button>

          <Link
            to="/payments"
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Ledger & Settlement</div>
              <div className="text-sm font-bold text-amber-700 mt-0.5">₹ {Number(mfg.currentOutstanding || 0).toLocaleString('en-IN')}</div>
            </div>
            <CreditCard className="w-5 h-5 text-amber-600" />
          </Link>
        </div>

        {/* Live Products & Stock Table for this manufacturer */}
        <Card
          title={`${mfg.name} – Live Products & Stock Allocation`}
          subtitle="Showing all SKUs manufactured by this company with live warehouse inventory, pricing, and stock status."
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter SKUs..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-48"
                />
              </div>
              <Link
                to="/products"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                Full Catalog &rarr;
              </Link>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">SKU & Product Name</th>
                  <th className="py-3 px-3 text-right">Physical Stock</th>
                  <th className="py-3 px-3 text-right">Available Stock</th>
                  <th className="py-3 px-3 text-right">Purchase Price</th>
                  <th className="py-3 px-3 text-right">MRP</th>
                  <th className="py-3 px-3 text-center">Stock Status</th>
                  <th className="py-3 px-3 text-center">Warehouse Bay</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = p.stock || {};
                  const avail = stock.availableStock ?? 0;
                  const current = stock.currentStock ?? 0;
                  const isLow = avail <= (p.minStockAlert || 20);
                  const isOut = avail === 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          SKU: {p.sku} &bull; HSN: {p.hsnCode}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-900">
                        {current} <span className="text-slate-400 text-[10px]">{p.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {avail}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">{p.unit}</span>
                        {stock.reservedStock > 0 && (
                          <div className="text-[10px] text-slate-400">({stock.reservedStock} res.)</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">
                        ₹{Number(p.purchasePrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-mono">
                        ₹{Number(p.mrp || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium text-[10px]">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {stock.warehouseLocation ? stock.warehouseLocation.replace('Warehouse Main - ', '') : 'Bay Default'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForInward(p);
                            setSelectedMfgForInward(mfg);
                            setIsInwardModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Direct inward stock for this SKU"
                        >
                          <PackagePlus className="w-3 h-3" /> + Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Purchases from this manufacturer */}
        <Card
          title={`Procurement PO History (${mfg.code})`}
          subtitle="Recent purchase orders placed with this manufacturer and goods receipt status."
          action={
            <Link
              to={`/purchases?manufacturerId=${mfg._id}`}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              View All POs &rarr;
            </Link>
          }
        >
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No recent purchase orders recorded for {mfg.name}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">PO Number</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-center">Receipt Status</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 font-bold font-mono text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹ {Number(po.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          po.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {po.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick Stock Inward Modal for Brand Workspace */}
        <QuickStockInwardModal
          isOpen={isInwardModalOpen}
          onClose={() => {
            setIsInwardModalOpen(false);
            setSelectedProductForInward(null);
            setSelectedMfgForInward(null);
          }}
          product={selectedProductForInward}
          manufacturer={selectedMfgForInward || mfg}
          productList={products}
          onSuccess={async (result) => {
            await fetchStats();
            const prodName = result?.product?.name || selectedProductForInward?.name || 'product';
            const qty = result?.quantity || '';
            setSuccessToast(`Stock updated successfully! Added ${qty} units to ${prodName}.`);
            setTimeout(() => setSuccessToast(''), 5000);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MANUFACTURER SELECTION PORTAL (Initial Full-Width Mode - No Sidebar)
  // =========================================================================
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Success Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Welcome & Multi-Brand Hub Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 tracking-wider uppercase">
                Tamil Enterprises Distribution ERP
              </span>
              <span className="text-xs text-slate-400">Madurai Central Warehouse Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Select Manufacturer / Brand
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Tamil Enterprises purchases and stocks goods from multiple principal manufacturers. Select or register a manufacturer below to open their dedicated workspace with live inventory, SKUs, and purchase history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <div className="text-2xl font-bold text-teal-300">{manufacturerCards.length}</div>
              <div className="text-[11px] font-medium text-slate-300 mt-0.5">Manufacturers</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <div className="text-2xl font-bold text-emerald-300">{kpis.activeStoresCount ?? 0}</div>
              <div className="text-[11px] font-medium text-slate-300 mt-0.5">Retail Shops</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Financial Metrics Glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Sales"
          value={`₹ ${Number(kpis.todaySales || 0).toLocaleString('en-IN')}`}
          subtitle={`Month: ₹ ${Number(kpis.monthlySales || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="teal"
        />

        <MetricCard
          title="Stock Valuation"
          value={`₹ ${Number(kpis.stockValuePurchase || 0).toLocaleString('en-IN')}`}
          subtitle={`Sales Value: ₹ ${Number(kpis.stockValueSelling || 0).toLocaleString('en-IN')}`}
          icon={Package}
          color="blue"
        />

        <MetricCard
          title="Shop Receivables"
          value={`₹ ${Number(kpis.totalOutstandingReceivables || 0).toLocaleString('en-IN')}`}
          subtitle={`Active Shops: ${kpis.activeStoresCount || 0}`}
          icon={Store}
          color="amber"
        />

        <MetricCard
          title="Gross Margin"
          value={`${kpis.profitMarginPercent || 18.5}%`}
          subtitle={`Est. Profit: ₹ ${Number(kpis.estimatedGrossProfit || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Manufacturer Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Manufacturers & Principal Brands
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage principal brands and manufacturers or enter their dedicated workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={mfgSearch}
                onChange={(e) => setMfgSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 shadow-2xs"
              />
            </div>

            <button
              onClick={openAddMfgModal}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Manufacturer
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        {filterTabs.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setMfgFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  mfgFilter === tab.key
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    mfgFilter === tab.key ? 'bg-teal-800 text-teal-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Manufacturer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredManufacturers.map((mfg) => (
            <ManufacturerCard
              key={mfg._id}
              manufacturer={mfg}
              onClick={() => {
                setActiveManufacturer(mfg);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))}
        </div>

        {filteredManufacturers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {manufacturerCards.length === 0 ? 'No Manufacturers Registered Yet' : `No manufacturers found matching "${mfgSearch}"`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {manufacturerCards.length === 0
                ? 'All mock manufacturers have been cleared. Click below to add your first principal brand or manufacturer manually.'
                : 'Try adjusting your search query or filter.'}
            </p>
            {manufacturerCards.length === 0 && (
              <button
                onClick={openAddMfgModal}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Manufacturer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Global Distribution Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
        <Card
          className="lg:col-span-2"
          title="6-Month Distribution Revenue Flow"
          subtitle="Monthly purchase inward vs wholesale revenue"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹ ${Number(val).toLocaleString('en-IN')}`]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="sales" name="Sales Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Inventory by Category"
          subtitle="Breadth across all principal brands"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Add Manufacturer Modal */}
      <Modal
        isOpen={isAddMfgModalOpen}
        onClose={() => setIsAddMfgModalOpen(false)}
        title="Register New Principal Brand / Manufacturer"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateManufacturer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Manufacturer Name *</label>
              <input
                type="text"
                required
                value={mfgFormData.name}
                onChange={(e) => setMfgFormData({ ...mfgFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Acme Enterprises Pvt Ltd"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand Code (Short, Unique) *</label>
              <input
                type="text"
                required
                value={mfgFormData.code}
                onChange={(e) => setMfgFormData({ ...mfgFormData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase font-mono font-bold"
                placeholder="e.g. ACME"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={mfgFormData.contactPerson}
                onChange={(e) => setMfgFormData({ ...mfgFormData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Zonal Manager"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={mfgFormData.phone}
                onChange={(e) => setMfgFormData({ ...mfgFormData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="+91 98400 12345"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={mfgFormData.email}
                onChange={(e) => setMfgFormData({ ...mfgFormData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="sales@manufacturer.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={mfgFormData.city}
                onChange={(e) => setMfgFormData({ ...mfgFormData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Madurai / Chennai"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={mfgFormData.state}
                onChange={(e) => setMfgFormData({ ...mfgFormData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Tamil Nadu"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={mfgFormData.gstNumber}
                onChange={(e) => setMfgFormData({ ...mfgFormData, gstNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase font-mono"
                placeholder="33AAAAA0000A1Z5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
              <input
                type="number"
                value={mfgFormData.creditPeriodDays}
                onChange={(e) => setMfgFormData({ ...mfgFormData, creditPeriodDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Categories (Comma separated)</label>
              <input
                type="text"
                value={mfgFormData.categories}
                onChange={(e) => setMfgFormData({ ...mfgFormData, categories: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Sanitary Hygiene, Personal Care"
              />
            </div>
          </div>

          {/* Products & SKUs Supplied by this Manufacturer */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-teal-600" />
                  Products & SKUs Supplied by this Brand
                </h4>
                <p className="text-[11px] text-slate-500">
                  Add the items and products this manufacturer will share / supply.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddProductRow}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product / SKU
              </button>
            </div>

            {mfgProducts.length > 0 ? (
              <div className="space-y-3">
                {mfgProducts.map((prod, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Product #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={prod.name}
                          onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Product Name / Item Description"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">SKU Code</label>
                        <input
                          type="text"
                          value={prod.sku}
                          onChange={(e) => handleProductChange(idx, 'sku', e.target.value.toUpperCase())}
                          placeholder={mfgFormData.code ? `${mfgFormData.code}-SKU-1` : 'Auto-generated'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono uppercase text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Unit</label>
                        <select
                          value={prod.unit}
                          onChange={(e) => handleProductChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Pack">Pack</option>
                          <option value="Box">Box</option>
                          <option value="Carton">Carton</option>
                          <option value="Bottle">Bottle</option>
                          <option value="Pouch">Pouch</option>
                          <option value="Kg">Kg</option>
                          <option value="Litre">Litre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Purchase Cost (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={prod.purchasePrice}
                          onChange={(e) => handleProductChange(idx, 'purchasePrice', e.target.value)}
                          placeholder="e.g. 95"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">MRP (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={prod.mrp}
                          onChange={(e) => handleProductChange(idx, 'mrp', e.target.value)}
                          placeholder="e.g. 140"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Initial Stock (Qty)</label>
                        <input
                          type="number"
                          min="0"
                          value={prod.initialStock}
                          onChange={(e) => handleProductChange(idx, 'initialStock', e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">GST Rate (%)</label>
                        <select
                          value={prod.gstRate}
                          onChange={(e) => handleProductChange(idx, 'gstRate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/60">
                <p className="text-xs text-slate-500">
                  You can specify the products this manufacturer shares / supplies right now or add them later in Products & SKUs.
                </p>
                <button
                  type="button"
                  onClick={handleAddProductRow}
                  className="mt-2.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product / SKU
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddMfgModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingMfg}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submittingMfg ? 'Saving...' : mfgProducts.length > 0 ? `Register Manufacturer (${mfgProducts.length} Products)` : 'Register Manufacturer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
