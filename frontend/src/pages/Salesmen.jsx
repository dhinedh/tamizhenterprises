import React, { useState, useEffect } from 'react';
import { Users, Plus, MapPin, CheckCircle2, TrendingUp, Calendar, Phone, Clock, IndianRupee } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Salesmen = () => {
  const { user, isOwner, isSalesman } = useAuth();
  const [salesmen, setSalesmen] = useState([]);
  const [visits, setVisits] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Visit check-in modal
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitData, setVisitData] = useState({
    salesmanId: '',
    storeId: '',
    purpose: 'Order Booking',
    notes: '',
    orderValue: 0,
    paymentCollectedAmount: 0,
    paymentMode: 'None'
  });
  const [submitting, setSubmitting] = useState(false);

  // Add Salesman Modal
  const [isAddSalesmanModalOpen, setIsAddSalesmanModalOpen] = useState(false);
  const [submittingSalesman, setSubmittingSalesman] = useState(false);
  const [salesmanForm, setSalesmanForm] = useState({
    name: '',
    employeeCode: '',
    phone: '',
    email: '',
    territory: 'Madurai Central Beat',
    targetMonthly: 250000,
    commissionPercent: 2.5
  });

  const handleCreateSalesman = async (e) => {
    e.preventDefault();
    try {
      setSubmittingSalesman(true);
      const res = await api.post('/salesmen', salesmanForm);
      if (res.data.success) {
        setIsAddSalesmanModalOpen(false);
        setSalesmanForm({
          name: '',
          employeeCode: '',
          phone: '',
          email: '',
          territory: 'Madurai Central Beat',
          targetMonthly: 250000,
          commissionPercent: 2.5
        });
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create salesman');
    } finally {
      setSubmittingSalesman(false);
    }
  };

  useEffect(() => {
    fetchSalesmen();
    fetchVisits();
    fetchStores();
  }, []);

  const fetchSalesmen = async () => {
    try {
      setLoading(true);
      const res = await api.get('/salesmen');
      if (res.data.success) {
        setSalesmen(res.data.data);
        if (res.data.data.length > 0) {
          setVisitData(prev => ({ ...prev, salesmanId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const res = await api.get('/salesmen/visits');
      if (res.data.success) {
        setVisits(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.data.success) {
        setStores(res.data.data);
        if (res.data.data.length > 0) {
          setVisitData(prev => ({ ...prev, storeId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordVisit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/salesmen/visits', visitData);
      if (res.data.success) {
        setIsVisitModalOpen(false);
        setVisitData(prev => ({
          ...prev,
          notes: '',
          orderValue: 0,
          paymentCollectedAmount: 0,
          paymentMode: 'None'
        }));
        fetchVisits();
        fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording visit');
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
            Sales Force & Field Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Field executive tracking &bull; Monthly booking targets vs achievement &bull; Store check-in/out visit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSalesmanModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Salesman
          </button>
          {salesmen.length > 0 && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MapPin className="w-4 h-4" /> Log Store Visit
            </button>
          )}
        </div>
      </div>

      {/* Salesmen Target Progress Cards */}
      {salesmen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesmen.map((sls) => {
            const target = sls.targetMonthly || 250000;
            const achieved = sls.currentMonthAchievement || 0;
            const pct = Math.min(100, Math.round((achieved / target) * 100));

            return (
              <Card key={sls._id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sls.name}</h3>
                    <div className="text-[10px] text-teal-700 font-semibold">{sls.employeeCode} &bull; {sls.territory}</div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center">
                    {sls.assignedStoresCount || 0} Stores
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Monthly Target:</span>
                    <span className="font-bold text-slate-800">₹ {Number(target).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Achievement:</span>
                    <span className="font-bold text-emerald-600">₹ {Number(achieved).toLocaleString('en-IN')} ({pct}%)</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {sls.phone}</span>
                  <span className="font-medium text-slate-700">Comm: {sls.commissionPercent}%</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Sales Executives Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            All mock sales force records have been cleared. Add your sales team member to assign territories, set monthly targets, and track daily beat visits.
          </p>
          <button
            onClick={() => setIsAddSalesmanModalOpen(true)}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Salesman
          </button>
        </div>
      )}

      {/* Field Visits Log */}
      <Card title="Recent Store Field Visits & Audits" subtitle="Real-time check-in logs from salesmen on the road">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Salesman</th>
                <th className="py-3 px-3">Store Visited</th>
                <th className="py-3 px-3">Visit Purpose</th>
                <th className="py-3 px-3">Notes & Outcome</th>
                <th className="py-3 px-3 text-right">Payment Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visits.length > 0 ? (
                visits.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(v.visitDate).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {v.salesmanId?.name || 'Sales Staff'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{v.storeId?.name}</div>
                      <div className="text-[10px] text-slate-400">{v.storeId?.city} ({v.storeId?.area})</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold text-[10px] border border-teal-100">
                        {v.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                      {v.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {v.paymentCollectedAmount > 0 ? (
                        <span className="font-bold text-emerald-600">
                          + ₹ {Number(v.paymentCollectedAmount).toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-normal">{v.paymentMode}</div>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No field visits recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Visit Modal */}
      <Modal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} title="Log Store Field Visit & Check-in">
        <form onSubmit={handleRecordVisit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Executive *</label>
              <select
                required
                value={visitData.salesmanId}
                onChange={(e) => setVisitData({ ...visitData, salesmanId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {salesmen.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.territory})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retail Store Visited *</label>
              <select
                required
                value={visitData.storeId}
                onChange={(e) => setVisitData({ ...visitData, storeId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visit Purpose</label>
              <select
                value={visitData.purpose}
                onChange={(e) => setVisitData({ ...visitData, purpose: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Order Booking">Order Booking</option>
                <option value="Payment Collection">Payment Collection</option>
                <option value="Stock Audit">Stock Audit</option>
                <option value="New Store Intro">New Store Intro</option>
                <option value="Relationship Meeting">Relationship Meeting</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Collected Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={visitData.paymentCollectedAmount}
                onChange={(e) => setVisitData({ ...visitData, paymentCollectedAmount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Field Visit Remarks / Store Feedback</label>
            <textarea
              rows="3"
              required
              value={visitData.notes}
              onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Met owner. Checked shelf space for Good Day & Dark Fantasy. Booked fresh order for weekend delivery."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Log Field Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Salesman Modal */}
      <Modal
        isOpen={isAddSalesmanModalOpen}
        onClose={() => setIsAddSalesmanModalOpen(false)}
        title="Register New Sales Executive"
        size="md"
      >
        <form onSubmit={handleCreateSalesman} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={salesmanForm.name}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Murugan P"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Code *</label>
              <input
                type="text"
                required
                value={salesmanForm.employeeCode}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, employeeCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase font-mono font-bold"
                placeholder="e.g. SLS-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={salesmanForm.phone}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="+91 98402 34567"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={salesmanForm.email}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="murugan@tamilenterprises.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Territory / Daily Beat Route *</label>
            <input
              type="text"
              required
              value={salesmanForm.territory}
              onChange={(e) => setSalesmanForm({ ...salesmanForm, territory: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Madurai Central & Retail Beat"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Sales Target (₹)</label>
              <input
                type="number"
                min="0"
                value={salesmanForm.targetMonthly}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, targetMonthly: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="250000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={salesmanForm.commissionPercent}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, commissionPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="2.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSalesmanModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingSalesman}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submittingSalesman ? 'Saving...' : 'Register Salesman'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Salesmen;
