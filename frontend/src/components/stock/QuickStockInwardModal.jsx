import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, PackagePlus, CheckCircle2, IndianRupee, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../api/client';

const QuickStockInwardModal = ({
  isOpen,
  onClose,
  onSuccess,
  onInwardSuccess,
  product = null,
  prefillProduct = null,
  manufacturer = null,
  prefillManufacturer = null,
  productList = []
}) => {
  const activeProduct = product || prefillProduct;
  const activeMfg = manufacturer || prefillManufacturer;
  const handleSuccessCallback = onSuccess || onInwardSuccess;

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(50);
  const [unitPrice, setUnitPrice] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNumber, setBillNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [updateProductPrice, setUpdateProductPrice] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Available products to choose from
  const filteredProducts = React.useMemo(() => {
    let list = Array.isArray(productList) ? [...productList] : [];

    // If a specific active product is passed and not in list, add it
    if (activeProduct && !list.some(p => String(p._id) === String(activeProduct._id))) {
      list.unshift(activeProduct);
    }

    if (!activeMfg || list.length === 0) return list;

    const mfgId = String(activeMfg._id || activeMfg);
    const hasMfgField = list.some(p => p.manufacturerId);

    if (!hasMfgField) {
      // Products don't have manufacturerId field, assume already scoped to this brand
      return list;
    }

    return list.filter(p => {
      const pMfgId = String(p.manufacturerId?._id || p.manufacturerId || '');
      return pMfgId === mfgId;
    });
  }, [productList, activeMfg, activeProduct]);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      return;
    }

    setError('');
    setDate(new Date().toISOString().split('T')[0]);
    setBillNumber('');
    setNotes('');

    const target = activeProduct || (filteredProducts.length > 0 ? filteredProducts[0] : null);

    if (target) {
      setSelectedProductId(target._id);
      setSelectedProduct(target);
      setUnitPrice(Number(target.purchasePrice || 0));
      setBatchNumber(target.stock?.batchNumber || `BATCH-${new Date().getFullYear()}`);
    } else {
      setSelectedProductId('');
      setSelectedProduct(null);
      setUnitPrice(0);
      setBatchNumber(`BATCH-${new Date().getFullYear()}`);
    }
  }, [isOpen, activeProduct, activeMfg, filteredProducts]);

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const found = filteredProducts.find(p => String(p._id) === String(prodId)) ||
      (activeProduct && String(activeProduct._id) === String(prodId) ? activeProduct : null);
    setSelectedProduct(found || null);
    if (found) {
      setUnitPrice(Number(found.purchasePrice || 0));
      if (found.stock?.batchNumber) {
        setBatchNumber(found.stock.batchNumber);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) {
      setError('Please select a product SKU');
      return;
    }

    if (Number(quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: selectedProductId,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        date,
        billNumber: billNumber || `INW-${Date.now().toString().slice(-6)}`,
        batchNumber: batchNumber || 'BATCH-' + new Date().getFullYear(),
        updateProductPrice,
        notes: notes || `Direct stock inward from ${activeMfg?.name || selectedProduct?.brand || 'Manufacturer'}`
      };

      const res = await api.post('/stock/inward', payload);
      if (res.data.success) {
        if (handleSuccessCallback) {
          handleSuccessCallback(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating stock');
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = activeMfg?.name
    ? `Update Stock & Inward: ${activeMfg.name}`
    : (selectedProduct?.name ? `Update Stock: ${selectedProduct.name}` : "Update Product Stock (Inward)");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Product SKU & Name *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          >
            <option value="">Select product to update stock...</option>
            {filteredProducts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku}) &bull; Current Stock: {p.stock?.currentStock ?? 0} {p.unit || 'Pcs'}
              </option>
            ))}
          </select>

          {/* Active Product Details Card */}
          {selectedProduct && (
            <div className="mt-2.5 p-3 bg-teal-50/80 border border-teal-200/90 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 text-sm">{selectedProduct.name}</div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-2">
                  <span>SKU: <strong className="text-slate-800">{selectedProduct.sku}</strong></span>
                  {selectedProduct.hsnCode && <span>&bull; HSN: {selectedProduct.hsnCode}</span>}
                  {selectedProduct.brand && <span>&bull; Brand: {selectedProduct.brand}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Physical Stock</span>
                <span className="text-xs font-bold text-teal-800 bg-white px-2.5 py-1 rounded-md border border-teal-200 shadow-2xs inline-block mt-0.5">
                  {selectedProduct.stock?.currentStock ?? 0} {selectedProduct.unit || 'Pcs'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Date, Quantity, Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Inward Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Add Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
            />
            <div className="flex gap-1 mt-1">
              {[10, 50, 100].map(add => (
                <button
                  type="button"
                  key={add}
                  onClick={() => setQuantity(prev => (Number(prev) || 0) + add)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                >
                  +{add}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purchase Rate (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Total Cost preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <span className="text-slate-600 font-medium">
            Total Purchase Cost ({quantity} &times; ₹{unitPrice}):
          </span>
          <span className="text-base font-bold text-teal-700 font-mono">
            ₹ {(Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Invoice / Batch */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Manufacturer Invoice / Bill No.</label>
            <input
              type="text"
              placeholder="e.g. INV-MFG-9021"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch Number</label>
            <input
              type="text"
              placeholder="e.g. BATCH-2026-A"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Update master price checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="quickUpdateMasterPrice"
            checked={updateProductPrice}
            onChange={(e) => setUpdateProductPrice(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="quickUpdateMasterPrice" className="text-slate-700 font-medium cursor-pointer">
            Update master product cost to ₹{unitPrice}
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Inward Notes</label>
          <input
            type="text"
            placeholder="e.g. Factory stock delivery received at Warehouse Bay 1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <PackagePlus className="w-4 h-4" />
            {submitting ? 'Updating Stock...' : 'Confirm Stock Inward'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickStockInwardModal;
