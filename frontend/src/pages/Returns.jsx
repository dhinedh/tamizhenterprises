import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, CheckCircle2, Search, AlertCircle, FileText } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Returns = () => {
  const { isOwner } = useAuth();
  const [returns, setReturns] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Intake Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    storeId: '',
    productId: '',
    quantity: 5,
    unitPrice: 30,
    reason: 'Damaged',
    condition: 'Damaged/Scrap',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchStores();
    fetchProducts();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/returns');
      if (res.data.success) {
        setReturns(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.data.success) {
        setStores(res.data.data);
        if (res.data.data.length > 0) {
          setFormData(prev => ({ ...prev, storeId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            productId: res.data.data[0]._id,
            unitPrice: res.data.data[0].dealerPrice || 30
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductChange = (productId) => {
    const prod = products.find(p => p._id === productId);
    setFormData({
      ...formData,
      productId,
      unitPrice: prod?.dealerPrice || 30
    });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const prod = products.find(p => p._id === formData.productId);
      const res = await api.post('/returns', {
        returnType: 'Store_Return',
        storeId: formData.storeId,
        items: [{
          productId: formData.productId,
          productName: prod?.name || 'Item',
          quantity: formData.quantity,
          unitPrice: formData.unitPrice,
          reason: formData.reason,
          condition: formData.condition
        }],
        notes: formData.notes
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchReturns();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReturn = async (id) => {
    try {
      const res = await api.post(`/returns/${id}/approve`);
      if (res.data.success) {
        alert('Return approved! Credit Note issued and inventory adjusted.');
        fetchReturns();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Returns Management & Credit Notes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shop returns intake &bull; Damaged/expired scrap quarantine &bull; GST Credit Notes generation
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Intake Shop Return
        </button>
      </div>

      {/* Returns List */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Return #</th>
                  <th className="py-3 px-3">Credit Note #</th>
                  <th className="py-3 px-3">Customer Shop</th>
                  <th className="py-3 px-3">Items & Reason</th>
                  <th className="py-3 px-3 text-right">Credit Value</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  {isOwner && <th className="py-3 px-3 text-right">Approval Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {returns.length > 0 ? (
                  returns.map((ret) => (
                    <tr key={ret._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ret.returnNumber}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-800">
                        {ret.creditNoteNumber || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {ret.storeId?.name || 'Direct Return'}
                        <div className="text-[10px] text-slate-400 font-normal">{ret.storeId?.city}</div>
                      </td>
                      <td className="py-3 px-3">
                        {ret.items?.map((item, idx) => (
                          <div key={idx} className="text-slate-800">
                            <span className="font-semibold">{item.quantity}x {item.productName}</span>
                            <span className="text-[10px] text-rose-600 block">Reason: {item.reason} ({item.condition})</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-700">
                        - ₹ {Number(ret.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={ret.status} />
                      </td>
                      {isOwner && (
                        <td className="py-3 px-3 text-right">
                          {ret.status === 'Pending' ? (
                            <button
                              onClick={() => handleApproveReturn(ret._id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] shadow-xs"
                            >
                              Approve & Issue Credit
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Credit Issued
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No returns recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Intake Return Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Intake Shop Product Return">
        <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Shop *</label>
            <select
              required
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Returned *</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity Returned *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Return Reason *</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Damaged">Damaged in Transit / Crushed</option>
                <option value="Expired">Near Expiry / Expired Batch</option>
                <option value="Wrong Item">Wrong Item Dispatched</option>
                <option value="Excess Stock">Excess Stock Return</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Condition Disposition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Damaged/Scrap">Damaged (Move to Scrap Quarantine)</option>
                <option value="Resellable">Good Condition (Return to Available Stock)</option>
                <option value="Return to Manufacturer">Return to Manufacturer (Claim Back)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Inspection Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Returned by driver after store inspection at delivery"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Record Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Returns;
