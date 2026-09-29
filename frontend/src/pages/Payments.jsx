import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Search, IndianRupee, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const { isOwner, isSalesman } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stores, setStores] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [outstandings, setOutstandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  // Store Collection Modal
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionData, setCollectionData] = useState({
    storeId: '',
    amount: '',
    paymentMode: 'UPI',
    referenceNumber: '',
    notes: ''
  });

  // Manufacturer Payment Modal
  const [isMfgPayModalOpen, setIsMfgPayModalOpen] = useState(false);
  const [mfgPayData, setMfgPayData] = useState({
    manufacturerId: '',
    amount: '',
    paymentMode: 'NEFT/RTGS',
    referenceNumber: '',
    bankName: 'HDFC Bank',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchOutstandings();
    fetchStores();
    fetchManufacturers();
  }, [typeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = typeFilter ? `?paymentType=${typeFilter}` : '';
      const res = await api.get(`/payments${query}`);
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstandings = async () => {
    try {
      const res = await api.get('/payments/outstandings');
      if (res.data.success) {
        setOutstandings(res.data.data);
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
          setCollectionData(prev => ({ ...prev, storeId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const res = await api.get('/manufacturers');
      if (res.data.success) {
        setManufacturers(res.data.data);
        if (res.data.data.length > 0) {
          setMfgPayData(prev => ({ ...prev, manufacturerId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordCollection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/payments/store-collection', collectionData);
      if (res.data.success) {
        setIsCollectionModalOpen(false);
        setCollectionData({
          storeId: stores[0]?._id || '',
          amount: '',
          paymentMode: 'UPI',
          referenceNumber: '',
          notes: ''
        });
        fetchPayments();
        fetchOutstandings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManufacturerPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/payments/manufacturer-payment', mfgPayData);
      if (res.data.success) {
        setIsMfgPayModalOpen(false);
        setMfgPayData({
          manufacturerId: manufacturers[0]?._id || '',
          amount: '',
          paymentMode: 'NEFT/RTGS',
          referenceNumber: '',
          bankName: 'HDFC Bank',
          notes: ''
        });
        fetchPayments();
        fetchOutstandings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording manufacturer payment');
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
            Financial Ledger & Payments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shop Collections (Receivables Inflow) &bull; Manufacturer Settlements (Payables Outflow) &bull; Working Capital
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollectionModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" /> Collect Shop Due
          </button>
          {isOwner && (
            <button
              onClick={() => setIsMfgPayModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" /> Pay Manufacturer
            </button>
          )}
        </div>
      </div>

      {/* Outstandings Summary Cards */}
      {outstandings && isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
              <ArrowDownLeft className="w-4 h-4" /> Total Shop Receivables (Due In)
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ₹ {Number(outstandings.totalStoreReceivables).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Outstanding across {outstandings.storesWithOutstanding?.length || 0} shops
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase">
              <ArrowUpRight className="w-4 h-4" /> Total Manufacturer Payables (Due Out)
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ₹ {Number(outstandings.totalManufacturerPayables).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Payables owed to {outstandings.manufacturersWithOutstanding?.length || 0} principals
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold uppercase">
              <IndianRupee className="w-4 h-4" /> Net Working Capital Gap
            </div>
            <div className="text-2xl font-bold text-teal-800 mt-2">
              ₹ {Number(outstandings.netWorkingCapital).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Receivables minus Payables balance
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            typeFilter === '' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setTypeFilter('Store_Collection')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            typeFilter === 'Store_Collection' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          Shop Collections (Inflow)
        </button>
        <button
          onClick={() => setTypeFilter('Manufacturer_Payment')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            typeFilter === 'Manufacturer_Payment' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          Manufacturer Payments (Outflow)
        </button>
      </div>

      {/* Transactions Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Receipt / Voucher #</th>
                  <th className="py-3 px-3">Transaction Type</th>
                  <th className="py-3 px-3">Party (Shop / Manufacturer)</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Mode & Reference</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.length > 0 ? (
                  payments.map((p) => {
                    const isInflow = p.paymentType === 'Store_Collection';
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3 px-3">
                          {isInflow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ArrowDownLeft className="w-3 h-3" /> Shop Collection
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              <ArrowUpRight className="w-3 h-3" /> Manufacturer Pay
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {isInflow ? p.storeId?.name : p.manufacturerId?.name}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {isInflow ? p.storeId?.city : p.manufacturerId?.code}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{p.paymentMode}</span>
                          {p.referenceNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {p.referenceNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-sm">
                          <span className={isInflow ? 'text-emerald-600' : 'text-slate-900'}>
                            {isInflow ? '+' : '-'} ₹ {Number(p.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {p.recordedBy || 'Staff'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Store Collection Modal */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        title="Record Shop Payment Collection"
      >
        <form onSubmit={handleRecordCollection} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Shop *</label>
            <select
              required
              value={collectionData.storeId}
              onChange={(e) => setCollectionData({ ...collectionData, storeId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.city}) - Balance Due: ₹{s.outstandingBalance || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Collected (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={collectionData.amount}
                onChange={(e) => setCollectionData({ ...collectionData, amount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
              <select
                value={collectionData.paymentMode}
                onChange={(e) => setCollectionData({ ...collectionData, paymentMode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="UPI">UPI / GooglePay / PhonePe</option>
                <option value="Cash">Cash Handover</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="NEFT/RTGS">NEFT / RTGS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No</label>
            <input
              type="text"
              value={collectionData.referenceNumber}
              onChange={(e) => setCollectionData({ ...collectionData, referenceNumber: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="UPI Ref ID or Cheque No"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt Notes</label>
            <textarea
              rows="2"
              value={collectionData.notes}
              onChange={(e) => setCollectionData({ ...collectionData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Collected during field visit by Murugan"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCollectionModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Save Collection Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Manufacturer Modal */}
      <Modal
        isOpen={isMfgPayModalOpen}
        onClose={() => setIsMfgPayModalOpen(false)}
        title="Disburse Manufacturer Payment (Outflow)"
      >
        <form onSubmit={handleManufacturerPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Principal Manufacturer *</label>
            <select
              required
              value={mfgPayData.manufacturerId}
              onChange={(e) => setMfgPayData({ ...mfgPayData, manufacturerId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              {manufacturers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} - Outstanding Payable: ₹{m.currentOutstanding || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={mfgPayData.amount}
                onChange={(e) => setMfgPayData({ ...mfgPayData, amount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                placeholder="25000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={mfgPayData.paymentMode}
                onChange={(e) => setMfgPayData({ ...mfgPayData, paymentMode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="NEFT/RTGS">NEFT / RTGS Net Banking</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank UTR / Reference No *</label>
            <input
              type="text"
              required
              value={mfgPayData.referenceNumber}
              onChange={(e) => setMfgPayData({ ...mfgPayData, referenceNumber: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono uppercase"
              placeholder="UTR-HDFC..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMfgPayModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Disburse & Update Ledger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
