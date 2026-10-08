import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Calendar,
  IndianRupee,
  PackagePlus,
  Receipt,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowDownToLine,
  Building2,
  Filter,
  Layers,
  History,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useManufacturer } from '../context/ManufacturerContext';
import { sortProducts } from '../utils/productSorter';

const Purchases = () => {
  const { activeManufacturer } = useManufacturer();
  const [inwardEntries, setInwardEntries] = useState([]);
  const [summary, setSummary] = useState({ totalInwardQty: 0, totalInwardValuation: 0 });
  const [products, setProducts] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Direct Stock Inward Modal State
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    manufacturerId: activeManufacturer?._id || '',
    productId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 50,
    unitPrice: 0,
    billNumber: '',
    batchNumber: '',
    warehouseLocation: 'Main Warehouse - Bay 1',
    updateProductPrice: true,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchInwardHistory();
    fetchManufacturers();
    fetchProducts();
  }, [activeManufacturer]);

  useEffect(() => {
    if (activeManufacturer?._id) {
      setFormData(prev => ({ ...prev, manufacturerId: activeManufacturer._id }));
    }
  }, [activeManufacturer]);

  const fetchInwardHistory = async () => {
    try {
      setLoading(true);
      let query = `?limit=100`;
      if (activeManufacturer?._id) query += `&manufacturerId=${activeManufacturer._id}`;
      const res = await api.get(`/stock/inward${query}`);
      if (res.data.success) {
        setInwardEntries(res.data.data || []);
        setSummary(res.data.summary || { totalInwardQty: 0, totalInwardValuation: 0 });
      }
    } catch (err) {
      console.error('Failed to load inward entries:', err);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(sortProducts(res.data.data || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products by selected manufacturer
  const targetMfgId = formData.manufacturerId || activeManufacturer?._id;
  const filteredProducts = sortProducts(
    targetMfgId
      ? products.filter(p => {
          const pMfgId = p.manufacturerId?._id ? p.manufacturerId._id.toString() : p.manufacturerId ? p.manufacturerId.toString() : '';
          return pMfgId === targetMfgId.toString();
        })
      : products
  );

  const handleProductChange = (prodId) => {
    const prod = products.find(p => p._id === prodId);
    setSelectedProductDetails(prod || null);
    setFormData(prev => ({
      ...prev,
      productId: prodId,
      unitPrice: prod?.purchasePrice || prev.unitPrice || 0,
      manufacturerId: prod?.manufacturerId?._id || prod?.manufacturerId || prev.manufacturerId
    }));
  };

  const handleOpenModal = (preselectedProduct = null) => {
    const defaultProd = preselectedProduct || (filteredProducts.length > 0 ? filteredProducts[0] : null);
    setSelectedProductDetails(defaultProd);
    setFormData({
      manufacturerId: defaultProd?.manufacturerId?._id || defaultProd?.manufacturerId || activeManufacturer?._id || '',
      productId: defaultProd?._id || '',
      date: new Date().toISOString().split('T')[0],
      quantity: 50,
      unitPrice: defaultProd?.purchasePrice || 0,
      billNumber: '',
      batchNumber: '',
      warehouseLocation: 'Main Warehouse - Bay 1',
      updateProductPrice: true,
      notes: ''
    });
    setIsInwardModalOpen(true);
  };

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) {
      alert('Please select a product');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    if (Number(formData.unitPrice) < 0) {
      alert('Please enter a valid purchase price');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/stock/inward', formData);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(''), 5000);
        setIsInwardModalOpen(false);
        fetchInwardHistory();
        fetchProducts(); // Refresh updated purchase price
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCalculatedCost = Math.round((Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0) * 100) / 100;

  const displayEntries = inwardEntries.filter(entry => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.productId?.name?.toLowerCase().includes(q) ||
      entry.productId?.sku?.toLowerCase().includes(q) ||
      entry.billNumber?.toLowerCase().includes(q) ||
      entry.batchNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Direct Stock Update & Inward Entry
            </h1>
            {activeManufacturer && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                {activeManufacturer.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directly update warehouse stock without POs &bull; Enter Price, Date, Quantity &bull; Instant valuation and physical stock balance
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <PackagePlus className="w-4 h-4" /> + Direct Stock Inward Entry
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Received Units</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {summary.totalInwardQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Directly received into warehouse</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Inward Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ₹ {summary.totalInwardValuation.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative purchase cost</p>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inward Entries Log</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {inwardEntries.length} <span className="text-xs font-normal text-slate-500">records</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Audit verified stock additions</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Brand Filter</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {activeManufacturer ? activeManufacturer.name : 'All Manufacturers'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeManufacturer ? `${filteredProducts.length} Brand SKUs available` : 'Showing all principal brands'}
          </p>
        </Card>
      </div>

      {/* Inward History Table Card */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by product, SKU, bill #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Showing <strong>{displayEntries.length}</strong> inward entries</span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Product / SKU</th>
                  <th className="py-3 px-3">Manufacturer</th>
                  <th className="py-3 px-3 text-right">Inward Qty</th>
                  <th className="py-3 px-3 text-right">Purchase Rate (₹)</th>
                  <th className="py-3 px-3 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-3">Bill / Ref #</th>
                  <th className="py-3 px-3">Updated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayEntries.length > 0 ? (
                  displayEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(entry.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{entry.productId?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {entry.productId?.sku}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {entry.productId?.manufacturerId?.name || entry.productId?.brand || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownToLine className="w-3 h-3" />
                          +{entry.quantity}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Bal: {entry.balanceAfter} units
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-800">
                        ₹ {Number(entry.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(entry.totalAmount || ((entry.quantity || 0) * (entry.unitPrice || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3">
                        {entry.billNumber ? (
                          <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {entry.billNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">{entry.referenceId || 'Direct'}</span>
                        )}
                        {entry.batchNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">Batch: {entry.batchNumber}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div className="text-xs font-medium">{entry.performedBy || 'Admin'}</div>
                        {entry.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={entry.notes}>
                            {entry.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="w-8 h-8 text-slate-300" />
                        <span className="font-medium text-xs">No direct stock inward entries found.</span>
                        <button
                          onClick={() => handleOpenModal()}
                          className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
                        >
                          + Add first stock inward entry
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Direct Stock Inward Modal */}
      <Modal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        title="Direct Stock Update & Inward Entry"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleInwardSubmit} className="space-y-4 text-xs">
          {/* Top Brand & Product Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Manufacturer Selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Manufacturer / Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.manufacturerId}
                onChange={(e) => {
                  const mfgId = e.target.value;
                  setFormData(prev => ({ ...prev, manufacturerId: mfgId, productId: '' }));
                  setSelectedProductDetails(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs"
                required
              >
                <option value="">Select Manufacturer...</option>
                {manufacturers.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Product SKU / Item <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs font-medium"
                required
              >
                <option value="">Select Product...</option>
                {filteredProducts.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) &bull; Current Purchase: ₹{p.purchasePrice}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Product Quick Info Card */}
          {selectedProductDetails && (
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-teal-900">{selectedProductDetails.name}</span>
                <div className="text-teal-700 text-[11px]">
                  SKU: {selectedProductDetails.sku} &bull; Category: {selectedProductDetails.category}
                </div>
              </div>
              <div className="text-right">
                <div className="text-teal-900 font-bold">MRP: ₹{selectedProductDetails.mrp}</div>
                <div className="text-[11px] text-teal-700">Selling Price: ₹{selectedProductDetails.sellingPrice}</div>
              </div>
            </div>
          )}

          {/* Key Inward Inputs: Date, Quantity, Price */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Inward Details (Price, Date & Quantity)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Inward / Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs font-medium"
                  required
                />
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quantity Received (Units) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 0) }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs font-bold text-slate-900"
                  required
                />
                {/* Quick Add Buttons */}
                <div className="flex gap-1 mt-1.5">
                  {[10, 25, 50, 100].map(add => (
                    <button
                      type="button"
                      key={add}
                      onClick={() => setFormData(prev => ({ ...prev, quantity: (Number(prev.quantity) || 0) + add }))}
                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold"
                    >
                      +{add}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Price Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Purchase Rate / Unit (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs font-bold text-slate-900"
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Cost price from manufacturer</div>
              </div>
            </div>

            {/* Total Calculated Valuation Banner */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Total Purchase Valuation:</span>
                <span className="text-[11px] text-slate-400 ml-1.5">({formData.quantity} units &times; ₹{formData.unitPrice})</span>
              </div>
              <div className="text-lg font-bold text-teal-700">
                ₹ {totalCalculatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Reference & Warehouse Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Supplier Bill / Invoice / DC No.
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-891"
                value={formData.billNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Batch Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. BATCH-OCT26-01"
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>
          </div>

          {/* Warehouse Location & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Warehouse Location / Bay
              </label>
              <input
                type="text"
                value={formData.warehouseLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="updateProductPrice"
                checked={formData.updateProductPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, updateProductPrice: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="updateProductPrice" className="text-slate-700 font-medium text-xs cursor-pointer">
                Update master product purchase price to ₹{formData.unitPrice}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh stock received directly via transport truck"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsInwardModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Updating Stock...' : 'Confirm & Inward Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;
