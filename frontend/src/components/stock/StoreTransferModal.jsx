import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, AlertCircle, FileText, CheckCircle2, IndianRupee, Store, UserCheck } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../api/client';

const StoreTransferModal = ({
  isOpen,
  onClose,
  onSuccess,
  onTransferSuccess,
  initialData = null, // e.g. from salesperson request
  prefillOrder = null,
  storesList = [],
  stores = [],
  salesmenList = [],
  salesmen = [],
  productsList = []
}) => {
  const [storeId, setStoreId] = useState('');
  const [salesmanId, setSalesmanId] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [items, setItems] = useState([
    { productId: '', quantity: 10, unitPrice: 0, discountPercent: 0, freeQuantity: 0 }
  ]);
  const [paymentType, setPaymentType] = useState('Credit');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveStores = storesList.length > 0 ? storesList : stores;
  const effectiveSalesmen = salesmenList.length > 0 ? salesmenList : salesmen;
  const effectiveData = initialData || prefillOrder;

  // Selected store details
  const selectedStore = effectiveStores.find(s => s._id === storeId);

  // Populate only when modal opens or initialData/prefillOrder changes
  useEffect(() => {
    if (!isOpen) return;

    if (effectiveData) {
      setStoreId(effectiveData.storeId?._id || effectiveData.storeId || '');
      setSalesmanId(effectiveData.salesmanId?._id || effectiveData.salesmanId || '');
      setOrderId(effectiveData._id || null);
      setPaymentType(effectiveData.paymentType || 'Credit');
      setNotes(effectiveData.deliveryNotes || effectiveData.notes || '');

      if (effectiveData.items && effectiveData.items.length > 0) {
        setItems(
          effectiveData.items.map(i => ({
            productId: i.productId?._id || i.productId,
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            discountPercent: i.discountPercent || 0,
            freeQuantity: i.freeQuantity || 0
          }))
        );
      }
    } else {
      setOrderId(null);
      if (effectiveStores.length > 0) {
        setStoreId(effectiveStores[0]._id);
      }
      setItems([{
        productId: productsList[0]?._id || '',
        quantity: 10,
        unitPrice: productsList[0]?.sellingPrice || productsList[0]?.dealerPrice || productsList[0]?.mrp || productsList[0]?.purchasePrice || 0,
        discountPercent: 0,
        freeQuantity: 0
      }]);
    }
  }, [isOpen, initialData, prefillOrder]);

  // When store changes, default salesman if store has assigned salesman
  const handleStoreChange = (sId) => {
    setStoreId(sId);
    const store = effectiveStores.find(s => s._id === sId);
    if (store && store.salesmanId && !salesmanId) {
      setSalesmanId(store.salesmanId?._id || store.salesmanId);
    }
  };

  const handleProductSelect = (index, prodId) => {
    const prod = productsList.find(p => p._id === prodId);
    const updated = [...items];
    updated[index].productId = prodId;
    if (prod) {
      // Check custom store price or dealer price
      const custom = prod.customStorePrices?.find(c => c.storeId?.toString() === storeId);
      updated[index].unitPrice = custom?.specialPrice || prod.sellingPrice || prod.dealerPrice || prod.mrp || prod.purchasePrice || 0;
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addLine = () => {
    const firstProd = productsList[0];
    setItems([
      ...items,
      {
        productId: firstProd?._id || '',
        quantity: 10,
        unitPrice: firstProd?.sellingPrice || firstProd?.dealerPrice || firstProd?.mrp || firstProd?.purchasePrice || 0,
        discountPercent: 0,
        freeQuantity: 0
      }
    ]);
  };

  const removeLine = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  items.forEach(item => {
    const prod = productsList.find(p => p._id === item.productId);
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discPct = Number(item.discountPercent) || 0;
    const gross = qty * price;
    const disc = (gross * discPct) / 100;
    const taxable = gross - disc;
    const gstRate = prod?.gstRate || 18;
    const tax = (taxable * gstRate) / 100;

    subtotal += taxable;
    discountTotal += disc;
    taxTotal += tax;
  });

  const grandTotal = subtotal + taxTotal;

  // Validation
  const validateItemsStock = () => {
    for (const item of items) {
      if (!item.productId) return 'Please choose a product for each line';
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) return 'Please enter valid quantity for all lines';

      const prod = productsList.find(p => p._id === item.productId);
      const availStock = prod?.stock?.currentStock ?? 0;
      if (qty > availStock) {
        return `Requested transfer of ${qty} units for "${prod?.name}" exceeds current warehouse stock (${availStock} units available).`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!storeId) {
      setError('Please select a destination store');
      return;
    }

    const stockErr = validateItemsStock();
    if (stockErr) {
      setError(stockErr);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId,
        salesmanId: salesmanId || null,
        orderId,
        items,
        paymentType,
        vehicleNumber,
        driverName,
        notes
      };

      const res = await api.post('/stock/transfer-to-store', payload);
      if (res.data.success) {
        if (onSuccess) {
          onSuccess(res.data.data);
        } else if (onTransferSuccess) {
          onTransferSuccess(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderId ? "Approve Salesperson Request & Dispatch Stock" : "Transfer Stock to Shop & Generate GST Invoice"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shop & Salesperson Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination Shop *</label>
            <select
              value={storeId}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              required
            >
              <option value="">Select Destination Shop...</option>
              {effectiveStores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.city}) &bull; Due: ₹{s.outstandingBalance || 0}
                </option>
              ))}
            </select>

            {selectedStore && (
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                <div>Owner: <strong className="text-slate-700">{selectedStore.ownerName}</strong> ({selectedStore.phone})</div>
                <div>Address: {selectedStore.address}, {selectedStore.city}</div>
                <div>GST: {selectedStore.gstNumber || 'Unregistered'} &bull; Credit Limit: ₹{selectedStore.creditLimit?.toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Field Sales Executive (Optional / Request Origin)
            </label>
            <select
              value={salesmanId}
              onChange={(e) => setSalesmanId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="">Direct Office / Warehouse Dispatch (No Salesman)</option>
              {effectiveSalesmen.map((sm) => (
                <option key={sm._id} value={sm._id}>
                  {sm.name} ({sm.employeeCode}) - {sm.territory}
                </option>
              ))}
            </select>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Payment Terms</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="Credit">Credit Bill (Shop Ledger)</option>
                  <option value="Cash">Cash on Delivery (Paid)</option>
                  <option value="UPI">Instant UPI</option>
                  <option value="Cheque">Post-Dated Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Vehicle / Van No.</label>
                <input
                  type="text"
                  placeholder="TN 01 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Items Table */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-900 text-xs">
              Products to Transfer from Warehouse Stock
            </label>
            <button
              type="button"
              onClick={addLine}
              className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Line
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product SKU</th>
                    <th className="py-2.5 px-3 text-center">Warehouse Stock</th>
                    <th className="py-2.5 px-3 text-right">Transfer Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => {
                    const prod = productsList.find(p => p._id === item.productId);
                    const availStock = prod?.stock?.currentStock ?? 0;
                    const isShortage = Number(item.quantity) > availStock;
                    const lineGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    const lineTax = lineGross * ((prod?.gstRate || 18) / 100);
                    const lineTotal = lineGross + lineTax;

                    return (
                      <tr key={idx} className={isShortage ? 'bg-rose-50/50' : ''}>
                        <td className="py-2 px-3 min-w-[200px]">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            <option value="">Select SKU...</option>
                            {productsList.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} ({p.sku}) &bull; Avail: {p.stock?.currentStock ?? 0}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {isShortage ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Shortage! (Only {availStock})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {availStock} {prod?.unit || 'Pcs'}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            max={availStock > 0 ? availStock : 99999}
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className={`w-20 px-2 py-1.5 border rounded-lg text-right font-bold text-xs ${
                              isShortage ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300'
                            }`}
                          />
                        </td>

                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-right font-medium text-xs"
                          />
                        </td>

                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹ {Number(lineTotal).toFixed(2)}
                        </td>

                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch / Transport Remarks</label>
            <textarea
              rows="2"
              placeholder="e.g. Delivered via Route 4 Morning Dispatch with Delivery Challan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono">₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST Tax (CGST + SGST):</span>
              <span className="font-mono">₹ {taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-extrabold text-sm text-teal-900">
              <span>Grand Total (Bill Amount):</span>
              <span className="font-mono">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Truck className="w-4 h-4" />
            {submitting ? 'Transferring Stock & Generating Bill...' : 'Transfer Stock & Generate Invoice Bill'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StoreTransferModal;
