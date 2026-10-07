import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Edit,
  Trash2,
  Tag,
  Check,
  IndianRupee,
  PackagePlus,
  RefreshCw,
  CheckCircle2,
  Eye,
  Layers,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Barcode,
  ArrowUpDown,
  Building2,
  X
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Badge, { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useManufacturer } from '../context/ManufacturerContext';
import QuickStockInwardModal from '../components/stock/QuickStockInwardModal';

const CATEGORY_OPTIONS = [
  'General',
  'FMCG & Groceries',
  'Traditional Masala & Spices',
  'Snacks & Confectionery',
  'Beverages & Tea/Coffee',
  'Sanitary & Personal Care',
  'Household & Cleaning',
  'Dairy & Bakery',
  'Edible Oils & Ghee',
  'Grains & Pulses'
];

const PACKAGING_UNITS = [
  'Pcs',
  'Box',
  'Carton',
  'Pack',
  'Kg',
  'Litre',
  'Bottle',
  'Pouch',
  'Jar',
  'Dozen'
];

const GST_RATES = [0, 5, 12, 18, 28];

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner } = useAuth();
  const { activeManufacturer, setActiveManufacturer, clearActiveManufacturer } = useManufacturer();

  // Data State
  const [products, setProducts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [manufacturers, setManufacturers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_manufacturers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(products.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

  // Modals & Active Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Stock Inward state
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [inwardProduct, setInwardProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    brand: activeManufacturer?.name || '',
    category: 'General',
    manufacturerId: activeManufacturer?._id || '',
    sku: '',
    barcode: '',
    hsnCode: '190590',
    unit: 'Pcs',
    unitQuantityPerPack: 1,
    mrp: '',
    purchasePrice: '',
    dealerPrice: '',
    sellingPrice: '',
    gstRate: 18,
    minStockAlert: 10,
    initialStock: 0,
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchManufacturers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeManufacturer]);

  // Handle URL ?action=new to open Add Product modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setEditingProduct(null);
      resetForm();
      setIsModalOpen(true);
    }
  }, [location.search, activeManufacturer, manufacturers]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const fetchManufacturers = async () => {
    try {
      const res = await api.get('/manufacturers');
      if (res.data?.success) {
        setManufacturers(res.data.data || []);
        try {
          sessionStorage.setItem('tamil_erp_manufacturers', JSON.stringify(res.data.data || []));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      if (products.length === 0) {
        setLoading(true);
      }
      let query = '';
      if (activeManufacturer?._id) {
        query += `?manufacturerId=${activeManufacturer._id}`;
      }

      const res = await api.get(`/products${query}`);
      if (res.data?.success) {
        setProducts(res.data.data || []);
        if (!activeManufacturer) {
          try {
            sessionStorage.setItem('tamil_erp_products', JSON.stringify(res.data.data || []));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: activeManufacturer?.name || (manufacturers.length > 0 ? manufacturers[0].name : 'Tamizh Enterprises'),
      category: 'General',
      manufacturerId: activeManufacturer?._id || (manufacturers.length > 0 ? manufacturers[0]._id : ''),
      sku: '',
      barcode: '',
      hsnCode: '190590',
      unit: 'Pcs',
      unitQuantityPerPack: 1,
      mrp: '',
      purchasePrice: '',
      dealerPrice: '',
      sellingPrice: '',
      gstRate: 18,
      minStockAlert: 10,
      initialStock: 0,
      description: ''
    });
    setFormError('');
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError('');
    if (location.search.includes('action=new')) {
      navigate('/products', { replace: true });
    }
  };

  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      brand: prod.brand || '',
      category: prod.category || 'General',
      manufacturerId: prod.manufacturerId?._id || prod.manufacturerId || '',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      hsnCode: prod.hsnCode || '190590',
      unit: prod.unit || 'Pcs',
      unitQuantityPerPack: prod.unitQuantityPerPack || 1,
      mrp: prod.mrp !== undefined ? prod.mrp : '',
      purchasePrice: prod.purchasePrice !== undefined ? prod.purchasePrice : '',
      dealerPrice: prod.dealerPrice !== undefined ? prod.dealerPrice : '',
      sellingPrice: prod.sellingPrice !== undefined ? prod.sellingPrice : '',
      gstRate: prod.gstRate !== undefined ? prod.gstRate : 18,
      minStockAlert: prod.minStockAlert !== undefined ? prod.minStockAlert : 10,
      initialStock: 0,
      description: prod.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!formData.mrp || Number(formData.mrp) <= 0) {
      setFormError('Please enter a valid MRP greater than 0.');
      return;
    }
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      setFormError('Please enter a valid Purchase Cost greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const pPrice = Number(formData.purchasePrice || 0);
      const mPrice = Number(formData.mrp || 0);
      const dPrice = Number(formData.dealerPrice || pPrice);
      const sPrice = Number(formData.sellingPrice || dPrice);

      const autoSku = formData.sku && formData.sku.trim()
        ? formData.sku.trim().toUpperCase()
        : `${(formData.brand || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      const payload = {
        ...formData,
        name: formData.name.trim(),
        brand: formData.brand.trim() || 'General Brand',
        category: formData.category || 'General',
        manufacturerId: formData.manufacturerId || null,
        sku: autoSku,
        barcode: formData.barcode ? formData.barcode.trim() : '',
        hsnCode: formData.hsnCode?.trim() || '190590',
        unit: formData.unit || 'Pcs',
        unitQuantityPerPack: Number(formData.unitQuantityPerPack || 1),
        mrp: mPrice,
        purchasePrice: pPrice,
        dealerPrice: dPrice,
        sellingPrice: sPrice,
        gstRate: Number(formData.gstRate || 18),
        minStockAlert: Number(formData.minStockAlert || 10),
        initialStock: Number(formData.initialStock || 0),
        description: formData.description?.trim() || ''
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.data?.success) {
          showToast(`Product "${payload.name}" updated successfully!`);
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data?.success) {
          showToast(`Product "${payload.name}" created successfully with SKU ${autoSku}!`);
        }
      }

      handleCloseModal();
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      setFormError(err.response?.data?.message || 'Error saving product. Please check values.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/products/${deletingProduct._id}`);
      if (res.data?.success) {
        showToast(`Product "${deletingProduct.name}" deleted successfully.`);
        setDeletingProduct(null);
        await fetchProducts();
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.hsnCode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(p => (p.category || 'General') === categoryFilter);
    }

    // Stock status filter
    if (stockStatusFilter === 'in_stock') {
      result = result.filter(p => (p.stock?.availableStock ?? 0) > 0 && !p.stock?.isLowStock);
    } else if (stockStatusFilter === 'low_stock') {
      result = result.filter(p => (p.stock?.availableStock ?? 0) > 0 && p.stock?.isLowStock);
    } else if (stockStatusFilter === 'out_of_stock') {
      result = result.filter(p => (p.stock?.availableStock ?? 0) <= 0);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'stock') {
        valA = a.stock?.availableStock ?? 0;
        valB = b.stock?.availableStock ?? 0;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB || '');
        return sortOrder === 'asc' ? comp : -comp;
      } else {
        const numA = Number(valA || 0);
        const numB = Number(valB || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
    });

    return result;
  }, [products, search, categoryFilter, stockStatusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredProducts.length / Number(pageSize));
  const paginatedProducts = useMemo(() => {
    if (pageSize === 'all') return filteredProducts;
    const start = (currentPage - 1) * Number(pageSize);
    return filteredProducts.slice(start, start + Number(pageSize));
  }, [filteredProducts, currentPage, pageSize]);

  // Top KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    let totalStockUnits = 0;
    let totalInventoryValueCost = 0;
    let totalInventoryValueMRP = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const avail = p.stock?.availableStock ?? 0;
      totalStockUnits += avail;
      totalInventoryValueCost += avail * (Number(p.purchasePrice) || 0);
      totalInventoryValueMRP += avail * (Number(p.mrp) || 0);
      if (avail <= 0) {
        outOfStockCount++;
      } else if (p.stock?.isLowStock) {
        lowStockCount++;
      }
    });

    return {
      totalCount,
      totalStockUnits,
      totalInventoryValueCost,
      totalInventoryValueMRP,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Categories list
  const existingCategories = useMemo(() => {
    const set = new Set(CATEGORY_OPTIONS);
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Live profit calculation for modal
  const liveMargin = useMemo(() => {
    const p = Number(formData.purchasePrice || 0);
    const m = Number(formData.mrp || 0);
    const d = Number(formData.dealerPrice || p);
    if (m > 0 && p > 0) {
      const profit = m - p;
      const marginPct = ((profit / m) * 100).toFixed(1);
      const dealerMarginPct = d > p ? (((d - p) / d) * 100).toFixed(1) : '0.0';
      return { profit, marginPct, dealerMarginPct };
    }
    return null;
  }, [formData.purchasePrice, formData.mrp, formData.dealerPrice]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & CRUD Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Manage Products & Catalog
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full SKU Master with CRUD controls, multi-tier wholesale pricing (Purchase &bull; Dealer &bull; MRP), GST rates, and real-time inventory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await fetchProducts();
              setRefreshing(false);
              showToast('Product catalog refreshed!');
            }}
            className="px-3 py-2 bg-white text-slate-700 hover:text-teal-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Refresh product list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {isOwner && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Catalog SKUs</div>
            <div className="text-lg font-bold text-slate-900">{metrics.totalCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Available Stock Units</div>
            <div className="text-lg font-bold text-slate-900">
              {metrics.totalStockUnits.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Inventory Value (Cost)</div>
            <div className="text-lg font-bold text-slate-900">
              ₹ {metrics.totalInventoryValueCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Stock Alerts</div>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span className="text-rose-600">{metrics.outOfStockCount} Out</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-amber-600 text-sm font-semibold">{metrics.lowStockCount} Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Selection Tabs if Manufacturers Exist */}
      {manufacturers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => clearActiveManufacturer()}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              !activeManufacturer
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Products (All Brands)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${!activeManufacturer ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-600'}`}>
              {products.length} SKUs
            </span>
          </button>

          {manufacturers.map((mfg) => {
            const isSelected = activeManufacturer?._id === mfg._id;
            return (
              <button
                key={mfg._id}
                type="button"
                onClick={() => setActiveManufacturer(mfg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 opacity-70" />
                <span>{mfg.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Advanced Filters Bar */}
      <Card>
        <div className="p-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products by Name, SKU, Brand, Barcode, HSN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-teal-500 focus:border-teal-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-teal-500"
              >
                <option value="">All Categories ({existingCategories.length})</option>
                {existingCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="md:col-span-2">
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-teal-500"
              >
                <option value="all">Stock: All</option>
                <option value="in_stock">In Stock (&gt; 0)</option>
                <option value="low_stock">Low Stock Alert</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 text-xs text-slate-500">
              <span className="shrink-0 font-medium">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Products Table (READ & CRUD Operations) */}
      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider select-none">
                <tr>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100/70"
                    onClick={() => {
                      if (sortField === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('name'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product Details</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Pack / Unit</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/70"
                    onClick={() => {
                      if (sortField === 'purchasePrice') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('purchasePrice'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Purchase (₹)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Dealer (₹)</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/70"
                    onClick={() => {
                      if (sortField === 'mrp') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('mrp'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>MRP (₹)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Gross Margin</th>
                  <th className="py-3 px-3 text-center">GST %</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100/70"
                    onClick={() => {
                      if (sortField === 'stock') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('stock'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Live Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Actions (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((prod) => {
                    const avail = prod.stock?.availableStock ?? 0;
                    const isLow = prod.stock?.isLowStock;
                    const isZero = avail <= 0;
                    const pPrice = Number(prod.purchasePrice) || 0;
                    const mPrice = Number(prod.mrp) || 0;
                    const dPrice = Number(prod.dealerPrice) || pPrice;
                    const grossMargin = mPrice > 0 ? (((mPrice - pPrice) / mPrice) * 100).toFixed(1) : '0';

                    return (
                      <tr key={prod._id} className="hover:bg-teal-50/30 transition-colors">
                        {/* Product Details */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{prod.name}</span>
                            {prod.sku && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                {prod.sku}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-teal-700">{prod.brand}</span>
                            <span>&bull;</span>
                            <span className="text-slate-600">{prod.category || 'General'}</span>
                            {prod.hsnCode && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono text-slate-400">HSN: {prod.hsnCode}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Pack & Unit */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-slate-800">{prod.unit || 'Pcs'}</span>
                          {prod.unitQuantityPerPack > 1 && (
                            <div className="text-[10px] text-slate-400">
                              Pack of {prod.unitQuantityPerPack}
                            </div>
                          )}
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3 px-3 text-right font-medium text-slate-700 font-mono">
                          ₹ {pPrice.toFixed(2)}
                        </td>

                        {/* Dealer Price */}
                        <td className="py-3 px-3 text-right font-medium text-slate-700 font-mono">
                          ₹ {dPrice.toFixed(2)}
                        </td>

                        {/* MRP */}
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹ {mPrice.toFixed(2)}
                        </td>

                        {/* Margin */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            Number(grossMargin) >= 20
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : Number(grossMargin) > 10
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            +{grossMargin}%
                          </span>
                        </td>

                        {/* GST % */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {prod.gstRate}%
                          </span>
                        </td>

                        {/* Stock Status */}
                        <td className="py-3 px-3 text-center">
                          {isZero ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              0 {prod.unit || 'Pcs'} (Out)
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {avail} {prod.unit || 'Pcs'} (Low)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {avail} {prod.unit || 'Pcs'}
                            </span>
                          )}
                        </td>

                        {/* Actions (CRUD) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <button
                              onClick={() => setViewingProduct(prod)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="View Product Specifications"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Inward Stock */}
                            <button
                              onClick={() => {
                                setInwardProduct(prod);
                                setIsInwardModalOpen(true);
                              }}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Add Stock Inward for this product"
                            >
                              <PackagePlus className="w-3 h-3 text-teal-600" />
                              + Stock
                            </button>

                            {isOwner && (
                              <>
                                {/* Edit Product (UPDATE) */}
                                <button
                                  onClick={() => handleEdit(prod)}
                                  className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                                  title="Edit Product Details & Pricing"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Product (DELETE) */}
                                <button
                                  onClick={() => setDeletingProduct(prod)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {search || categoryFilter || stockStatusFilter !== 'all'
                            ? 'No products matching filters'
                            : 'No Products in Catalogue'}
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          {search || categoryFilter || stockStatusFilter !== 'all'
                            ? 'Try clearing the search box or resetting your status and category filters.'
                            : 'Start by adding your first product SKU with wholesale and retail pricing.'}
                        </p>
                        {isOwner && (
                          <button
                            onClick={handleOpenAddModal}
                            className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> Add First Product
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && pageSize !== 'all' && totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-bold">{(currentPage - 1) * Number(pageSize) + 1}</span> to{' '}
              <span className="font-bold">
                {Math.min(currentPage * Number(pageSize), filteredProducts.length)}
              </span>{' '}
              of <span className="font-bold">{filteredProducts.length}</span> products
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2.5 py-1 rounded border font-semibold ${
                      currentPage === pageNum
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE / UPDATE PRODUCT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product SKU'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                placeholder="e.g. Marie Gold Biscuits 250g"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                placeholder="e.g. Britannia / ITC / Femi9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
              >
                {existingCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manufacturer / Vendor</label>
              <select
                value={formData.manufacturerId}
                onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
              >
                <option value="">(Optional) General Supplier</option>
                {manufacturers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
                placeholder="e.g. 190590"
              />
            </div>
          </div>

          {/* SKU, Barcode, Packaging */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SKU Code <span className="text-[10px] text-slate-400 font-normal">(Auto if blank)</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase focus:outline-teal-500"
                placeholder="e.g. BRIT-MAR-250G"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode (EAN / UPC)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-teal-500"
                placeholder="e.g. 8901030800000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Packaging Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500"
              >
                {PACKAGING_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Structure Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Multi-Tier Pricing Structure (INR)
              </span>
              {liveMargin && (
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Gross Margin: +{liveMargin.marginPct}% (₹ {liveMargin.profit.toFixed(2)}/unit)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purchase Cost (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500 font-mono font-bold"
                  placeholder="e.g. 25.00"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dealer Wholesale Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dealerPrice}
                  onChange={(e) => setFormData({ ...formData, dealerPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500 font-mono"
                  placeholder="e.g. 28.50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  MRP (Maximum Retail) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-teal-500 font-mono font-bold text-teal-800"
                  placeholder="e.g. 35.00"
                />
              </div>
            </div>
          </div>

          {/* GST & Stock Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-slate-800 focus:outline-teal-500"
              >
                {GST_RATES.map((rate) => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert Level</label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                placeholder="10"
              />
            </div>

            {!editingProduct && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Physical Stock <span className="text-[10px] text-teal-600 font-normal">(Opening)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500 font-bold"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500 text-xs"
              placeholder="e.g. Master box of 24 units, shelf life 9 months..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT SPECIFICATIONS MODAL */}
      <Modal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title={`Product Specifications: ${viewingProduct?.name || ''}`}
        maxWidth="max-w-xl"
      >
        {viewingProduct && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{viewingProduct.name}</h3>
                  <div className="text-slate-500 mt-0.5">
                    Brand: <span className="font-semibold text-slate-800">{viewingProduct.brand}</span> &bull; Category: {viewingProduct.category}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {viewingProduct.sku}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">HSN Code</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingProduct.hsnCode || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Barcode</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingProduct.barcode || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Packaging Unit</span>
                  <span className="font-semibold text-slate-800">{viewingProduct.unit || 'Pcs'}</span>
                </div>
              </div>
            </div>

            {/* Price & Margins Card */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-2">
              <span className="font-bold text-teal-900 block text-[11px] uppercase tracking-wider">
                Price Tiers & Profit Analysis
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Purchase Cost</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    ₹ {Number(viewingProduct.purchasePrice).toFixed(2)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Dealer Price</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    ₹ {Number(viewingProduct.dealerPrice || viewingProduct.purchasePrice).toFixed(2)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">MRP (Retail)</span>
                  <span className="font-bold text-teal-800 font-mono text-sm">
                    ₹ {Number(viewingProduct.mrp).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-teal-900">
                <span>GST Tax Slab: <strong>{viewingProduct.gstRate}%</strong></span>
                <span>
                  Gross Margin:{' '}
                  <strong>
                    {(((Number(viewingProduct.mrp) - Number(viewingProduct.purchasePrice)) / Number(viewingProduct.mrp)) * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
            </div>

            {/* Stock Level Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Live Inventory</span>
                <span className="font-bold text-slate-800 text-sm">
                  {viewingProduct.stock?.availableStock ?? 0} {viewingProduct.unit || 'Pcs'} Available
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Min Alert Level</span>
                <span className="font-bold text-slate-600">
                  {viewingProduct.minStockAlert || 10} {viewingProduct.unit || 'Pcs'}
                </span>
              </div>
            </div>

            {viewingProduct.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Notes / Description</span>
                <p className="text-slate-700">{viewingProduct.description}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {isOwner && (
                <button
                  onClick={() => {
                    const prodToEdit = viewingProduct;
                    setViewingProduct(null);
                    handleEdit(prodToEdit);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit This Product
                </button>
              )}
              <button
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Confirm Product Deletion"
        maxWidth="max-w-md"
      >
        {deletingProduct && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900">Permanently delete this product?</h4>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  You are about to delete <strong>"{deletingProduct.name}"</strong> (SKU: {deletingProduct.sku}).
                  All inventory records associated with this SKU will also be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Brand:</span>
                <span className="font-semibold text-slate-900">{deletingProduct.brand}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Stock:</span>
                <span className="font-semibold text-slate-900">
                  {deletingProduct.stock?.availableStock ?? 0} {deletingProduct.unit || 'Pcs'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>MRP:</span>
                <span className="font-semibold text-slate-900">₹ {Number(deletingProduct.mrp).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* QUICK STOCK INWARD MODAL */}
      <QuickStockInwardModal
        isOpen={isInwardModalOpen}
        onClose={() => {
          setIsInwardModalOpen(false);
          setInwardProduct(null);
        }}
        product={inwardProduct}
        manufacturer={activeManufacturer}
        onSuccess={() => {
          fetchProducts();
          showToast(`Stock updated for ${inwardProduct?.name || 'product'}!`);
        }}
      />
    </div>
  );
};

export default Products;