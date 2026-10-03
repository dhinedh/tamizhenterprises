import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Plus, Search, Filter, AlertCircle, Edit, Trash2, Tag, Check, IndianRupee, PackagePlus, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Badge, { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useManufacturer } from '../context/ManufacturerContext';
import QuickStockInwardModal from '../components/stock/QuickStockInwardModal';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner } = useAuth();
  const { activeManufacturer } = useManufacturer();
  const [products, setProducts] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Quick Stock Inward state
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [inwardProduct, setInwardProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    brand: activeManufacturer?.name || '',
    manufacturerId: activeManufacturer?._id || '',
    sku: '',
    barcode: '',
    hsnCode: '',
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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManufacturers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockFilter, activeManufacturer]);

  const fetchManufacturers = async () => {
    try {
      const res = await api.get('/manufacturers');
      if (res.data.success) {
        setManufacturers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = `?search=${search}`;
      if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;
      if (lowStockFilter) query += `&lowStock=true`;
      if (activeManufacturer?._id) query += `&manufacturerId=${activeManufacturer._id}`;

      const res = await api.get(`/products${query}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setEditingProduct(null);
      resetForm();
      setIsModalOpen(true);
    }
  }, [location.search, activeManufacturer]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    if (location.search.includes('action=new')) {
      navigate('/products', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const pPrice = Number(formData.purchasePrice || 0);
      const mPrice = Number(formData.mrp || 0);
      const autoSku = (formData.sku && formData.sku.trim())
        ? formData.sku.trim().toUpperCase()
        : `${(formData.brand || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      const payload = {
        ...formData,
        sku: autoSku,
        hsnCode: formData.hsnCode?.trim() || '190590',
        category: 'General',
        dealerPrice: Number(formData.dealerPrice || pPrice || mPrice || 0),
        sellingPrice: Number(formData.sellingPrice || formData.dealerPrice || mPrice || pPrice || 0)
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      handleCloseModal();
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      manufacturerId: prod.manufacturerId?._id || prod.manufacturerId,
      sku: prod.sku,
      barcode: prod.barcode || '',
      hsnCode: prod.hsnCode,
      unit: prod.unit || 'Box',
      unitQuantityPerPack: prod.unitQuantityPerPack || 24,
      mrp: prod.mrp,
      purchasePrice: prod.purchasePrice,
      dealerPrice: prod.dealerPrice,
      sellingPrice: prod.sellingPrice,
      gstRate: prod.gstRate || 18,
      minStockAlert: prod.minStockAlert || 20,
      initialStock: 0,
      description: prod.description || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: activeManufacturer?.name || '',
      manufacturerId: activeManufacturer?._id || manufacturers[0]?._id || '',
      sku: '',
      barcode: '',
      hsnCode: '',
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
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalogue & Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified SKU inventory with multi-tier pricing (Purchase &bull; Dealer &bull; MRP) and GST slabs
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product SKU
          </button>
        )}
      </div>

      {/* Manufacturer Brand Tabs for Both Manufacturers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => clearActiveManufacturer()}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            !activeManufacturer
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>All Products (Both Brands)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${!activeManufacturer ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-600'}`}>
            {manufacturers.reduce((acc, m) => acc + (m.productsCount || 0), 0) || products.length} SKUs
          </span>
        </button>

        {manufacturers.map((mfg) => {
          const isSelected = activeManufacturer?._id === mfg._id || activeManufacturer?.code === mfg.code;
          const isFemi9 = mfg.code === 'FEMI9' || mfg.name?.toLowerCase().includes('femi9');
          const isMansara = mfg.code === 'MANSARA' || mfg.name?.toLowerCase().includes('mansara');
          const stockQty = mfg.totalPhysicalStock ?? mfg.totalAvailableStock ?? 0;

          return (
            <button
              key={mfg._id}
              type="button"
              onClick={() => setActiveManufacturer(mfg)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? isFemi9
                    ? 'bg-pink-600 text-white shadow-xs'
                    : isMansara
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-teal-600 text-white shadow-xs'
                  : isFemi9
                  ? 'bg-pink-50/70 text-pink-900 border border-pink-200 hover:bg-pink-100/60'
                  : isMansara
                  ? 'bg-amber-50/70 text-amber-900 border border-amber-200 hover:bg-amber-100/60'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{mfg.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isSelected ? 'bg-black/20 text-white' : 'bg-white/80 text-slate-800 border border-slate-200/60'
              }`}>
                {Number(stockQty).toLocaleString('en-IN')} units ({mfg.productsCount || 0} SKUs)
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product name, brand, SKU or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Quick Search */}

        <button
          type="button"
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            lowStockFilter
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Low Stock Alerts Only
        </button>

        <button
          type="button"
          onClick={async () => {
            setRefreshing(true);
            await fetchProducts();
            setRefreshing(false);
          }}
          className="px-3 py-2 bg-white text-slate-700 hover:text-teal-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          title="Refresh real-time stock levels"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stock
        </button>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Product Name & Brand</th>
                  <th className="py-3 px-3 text-right">Purchase (Cost)</th>
                  <th className="py-3 px-3 text-right">MRP (Retail)</th>
                  <th className="py-3 px-3 text-center">GST %</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  {isOwner && <th className="py-3 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.length > 0 ? (
                  products.map((prod) => {
                    const avail = prod.stock?.availableStock ?? 0;
                    const isLow = prod.stock?.isLowStock;
                    const isZero = avail === 0;

                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] text-teal-700 font-medium">Brand: {prod.brand} &bull; Mfg: {prod.manufacturerId?.name}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          ₹ {Number(prod.purchasePrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">
                          ₹ {Number(prod.mrp).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">
                          {prod.gstRate}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isZero ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low: {avail} {prod.unit}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {avail} {prod.unit}
                            </span>
                          )}
                        </td>
                        {isOwner && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setInwardProduct(prod);
                                  setIsInwardModalOpen(true);
                                }}
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                                title="Quick stock update for this product"
                              >
                                <PackagePlus className="w-3.5 h-3.5 text-teal-600" />
                                + Stock
                              </button>
                              <button
                                onClick={() => handleEdit(prod)}
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                title="Edit Pricing & Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isOwner ? 6 : 5} className="py-8 text-center text-slate-400">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product Master'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="e.g. Product Name / Item Description"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="e.g. Brand Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
              <select
                required
                value={formData.manufacturerId}
                onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Packaging Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Pcs">Pcs</option>
                <option value="Box">Box</option>
                <option value="Carton">Carton</option>
                <option value="Pack">Pack</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
                <option value="Bottle">Bottle</option>
                <option value="Pouch">Pouch</option>
              </select>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Pricing Structure (INR)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Purchase Cost (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  placeholder="e.g. 25.00"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">MRP (Retail ₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  placeholder="e.g. 35.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Staples / Tea)</option>
                <option value={12}>12% (Snacks / Processed)</option>
                <option value={18}>18% (Confectionery / FMCG Standard)</option>
                <option value={28}>28% (Luxury / Aerated)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert Level</label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            {!editingProduct && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Stock Opening</label>
                <input
                  type="number"
                  value={formData.initialStock}
                  onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 cursor-pointer transition-colors"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Inward Modal */}
      <QuickStockInwardModal
        isOpen={isInwardModalOpen}
        onClose={() => {
          setIsInwardModalOpen(false);
          setInwardProduct(null);
        }}
        product={inwardProduct}
        productList={products}
        onSuccess={(result) => {
          fetchProducts();
          setToastMessage(`Stock updated successfully! New available stock for ${inwardProduct?.name || 'product'}: ${result.stock?.currentStock ?? 'updated'}`);
          setTimeout(() => setToastMessage(''), 5000);
        }}
      />

      {/* Real-time sync Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-semibold">{toastMessage}</div>
        </div>
      )}
    </div>
  );
};

export default Products;