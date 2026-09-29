import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, Gift, Percent, Calendar } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Schemes = () => {
  const { isOwner } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    type: 'BUY_X_GET_Y',
    minQuantity: 10,
    freeQuantity: 1,
    discountPercent: 0,
    applicableProducts: []
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchemes();
    fetchProducts();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schemes');
      if (res.data.success) {
        setSchemes(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/schemes', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          code: '',
          description: '',
          type: 'BUY_X_GET_Y',
          minQuantity: 10,
          freeQuantity: 1,
          discountPercent: 0,
          applicableProducts: []
        });
        fetchSchemes();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error launching scheme');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Promotional & Trade Discount Schemes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Buy-X-Get-Y dealer incentives &bull; Quantity slab volume discounts &bull; Trade promotion rules
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Launch New Trade Scheme
          </button>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <CardSkeleton />
        ) : schemes.length > 0 ? (
          schemes.map((sch) => (
            <Card key={sch._id} className="hover:border-teal-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    {sch.type === 'BUY_X_GET_Y' ? <Gift className="w-5 h-5" /> : <Percent className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sch.title}</h3>
                    <span className="font-mono text-[10px] text-teal-700 font-semibold">{sch.code}</span>
                  </div>
                </div>
                <StatusBadge status={sch.status} />
              </div>

              <p className="text-xs text-slate-600 mt-3">{sch.description}</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Promotion Type</span>
                  <span className="font-bold text-slate-800">{sch.type.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Incentive Offer</span>
                  <span className="font-bold text-emerald-700">
                    {sch.type === 'BUY_X_GET_Y'
                      ? `Buy ${sch.minQuantity} & Get ${sch.freeQuantity} Free`
                      : `${sch.discountPercent}% Off on ${sch.minQuantity}+ units`}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Orders Applied: {sch.usageCount || 0} times</span>
                <span className="text-teal-600 font-medium">Active in Billing</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center text-xs text-slate-400">No active schemes found</div>
        )}
      </div>

      {/* Launch Scheme Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Launch Trade Discount Scheme">
        <form onSubmit={handleCreateScheme} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheme Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Diwali Bulk Booking 5% Off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheme Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg uppercase"
                placeholder="SCH-DWL-2026"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheme Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="BUY_X_GET_Y">Buy X Get Y Free</option>
                <option value="SLAB_DISCOUNT">Slab Discount (% on Minimum Qty)</option>
                <option value="FLAT_PERCENT">Flat Percentage Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Order Qty</label>
              <input
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            {formData.type === 'BUY_X_GET_Y' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Free Quantity Provided</label>
                <input
                  type="number"
                  min="1"
                  value={formData.freeQuantity}
                  onChange={(e) => setFormData({ ...formData, freeQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Percent (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheme Explanation / Rules</label>
            <textarea
              rows="2"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Retail stores purchasing 10+ boxes get 1 extra box complimentary."
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
              {submitting ? 'Launching...' : 'Activate Scheme'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schemes;
