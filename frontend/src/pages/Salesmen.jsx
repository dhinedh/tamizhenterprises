import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Phone,
  Clock,
  IndianRupee,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Salesmen = () => {
  const { user, isOwner } = useAuth();
  const [salesmen, setSalesmen] = useState([]);
  const [visits, setVisits] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [visitFilterSalesman, setVisitFilterSalesman] = useState('ALL');

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Add Salesman Modal State
  const [isAddSalesmanModalOpen, setIsAddSalesmanModalOpen] = useState(false);
  const [submittingSalesman, setSubmittingSalesman] = useState(false);
  const [salesmanForm, setSalesmanForm] = useState({
    name: '',
    employeeCode: '',
    phone: '',
    email: '',
    territory: 'Chennai Central Beat',
    targetMonthly: 200000,
    commissionPercent: 2.5,
    status: 'Active'
  });

  // Edit Salesman Modal State
  const [isEditSalesmanModalOpen, setIsEditSalesmanModalOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState(null);
  const [editSalesmanForm, setEditSalesmanForm] = useState({
    name: '',
    employeeCode: '',
    phone: '',
    email: '',
    territory: '',
    targetMonthly: 200000,
    commissionPercent: 2.5,
    status: 'Active'
  });
  const [updatingSalesman, setUpdatingSalesman] = useState(false);

  // Delete Salesman Modal State
  const [deletingSalesman, setDeletingSalesman] = useState(null);
  const [isDeletingSalesman, setIsDeletingSalesman] = useState(false);

  // Log Visit Modal State
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
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Edit Visit Modal State
  const [isEditVisitModalOpen, setIsEditVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editVisitData, setEditVisitData] = useState({
    salesmanId: '',
    storeId: '',
    purpose: 'Order Booking',
    notes: '',
    orderValue: 0,
    paymentCollectedAmount: 0,
    paymentMode: 'None'
  });
  const [updatingVisit, setUpdatingVisit] = useState(false);

  // Delete Visit State
  const [deletingVisit, setDeletingVisit] = useState(null);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);

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
          setVisitData((prev) => ({
            ...prev,
            salesmanId: prev.salesmanId || res.data.data[0]._id
          }));
        }
      }
    } catch (err) {
      console.error('Fetch salesmen error:', err);
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
      console.error('Fetch visits error:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.data.success) {
        setStores(res.data.data);
        if (res.data.data.length > 0) {
          setVisitData((prev) => ({
            ...prev,
            storeId: prev.storeId || res.data.data[0]._id
          }));
        }
      }
    } catch (err) {
      console.error('Fetch stores error:', err);
    }
  };

  // ----------------------------------------------------
  // SALESMAN CRUD HANDLERS
  // ----------------------------------------------------

  // CREATE Salesman
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
          territory: 'Chennai Central Beat',
          targetMonthly: 200000,
          commissionPercent: 2.5,
          status: 'Active'
        });
        showToast(`Salesman "${res.data.data.name}" registered successfully!`);
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create salesman');
    } finally {
      setSubmittingSalesman(false);
    }
  };

  // OPEN Edit Salesman Modal
  const openEditSalesmanModal = (sls) => {
    setEditingSalesman(sls);
    setEditSalesmanForm({
      name: sls.name || '',
      employeeCode: sls.employeeCode || '',
      phone: sls.phone || '',
      email: sls.email || '',
      territory: sls.territory || '',
      targetMonthly: sls.targetMonthly || 0,
      commissionPercent: sls.commissionPercent || 0,
      status: sls.status || 'Active'
    });
    setIsEditSalesmanModalOpen(true);
  };

  // UPDATE Salesman
  const handleUpdateSalesman = async (e) => {
    e.preventDefault();
    if (!editingSalesman) return;
    try {
      setUpdatingSalesman(true);
      const res = await api.put(`/salesmen/${editingSalesman._id}`, editSalesmanForm);
      if (res.data.success) {
        setIsEditSalesmanModalOpen(false);
        setEditingSalesman(null);
        showToast(`Salesman "${res.data.data.name}" updated successfully!`);
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update salesman');
    } finally {
      setUpdatingSalesman(false);
    }
  };

  // DELETE Salesman
  const handleDeleteSalesman = async () => {
    if (!deletingSalesman) return;
    try {
      setIsDeletingSalesman(true);
      const res = await api.delete(`/salesmen/${deletingSalesman._id}`);
      if (res.data.success) {
        const deletedName = deletingSalesman.name;
        setDeletingSalesman(null);
        showToast(`Salesman "${deletedName}" deleted successfully.`);
        await fetchSalesmen();
        await fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete salesman');
    } finally {
      setIsDeletingSalesman(false);
    }
  };

  // ----------------------------------------------------
  // VISIT CRUD HANDLERS
  // ----------------------------------------------------

  // CREATE Field Visit
  const handleRecordVisit = async (e) => {
    e.preventDefault();
    setSubmittingVisit(true);
    try {
      const res = await api.post('/salesmen/visits', visitData);
      if (res.data.success) {
        setIsVisitModalOpen(false);
        setVisitData((prev) => ({
          ...prev,
          notes: '',
          orderValue: 0,
          paymentCollectedAmount: 0,
          paymentMode: 'None'
        }));
        showToast('Field visit logged successfully!');
        await fetchVisits();
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  // OPEN Edit Visit Modal
  const openEditVisitModal = (visit) => {
    setEditingVisit(visit);
    setEditVisitData({
      salesmanId: visit.salesmanId?._id || visit.salesmanId || '',
      storeId: visit.storeId?._id || visit.storeId || '',
      purpose: visit.purpose || 'Order Booking',
      notes: visit.notes || '',
      orderValue: visit.orderValue || 0,
      paymentCollectedAmount: visit.paymentCollectedAmount || 0,
      paymentMode: visit.paymentMode || 'None'
    });
    setIsEditVisitModalOpen(true);
  };

  // UPDATE Field Visit
  const handleUpdateVisit = async (e) => {
    e.preventDefault();
    if (!editingVisit) return;
    setUpdatingVisit(true);
    try {
      const res = await api.put(`/salesmen/visits/${editingVisit._id}`, editVisitData);
      if (res.data.success) {
        setIsEditVisitModalOpen(false);
        setEditingVisit(null);
        showToast('Field visit updated successfully!');
        await fetchVisits();
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update field visit');
    } finally {
      setUpdatingVisit(false);
    }
  };

  // DELETE Field Visit
  const handleDeleteVisit = async () => {
    if (!deletingVisit) return;
    setIsDeletingVisit(true);
    try {
      const res = await api.delete(`/salesmen/visits/${deletingVisit._id}`);
      if (res.data.success) {
        setDeletingVisit(null);
        showToast('Field visit record deleted.');
        await fetchVisits();
        await fetchSalesmen();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete visit');
    } finally {
      setIsDeletingVisit(false);
    }
  };

  // Filtered salesmen based on search
  const filteredSalesmen = useMemo(() => {
    if (!searchQuery.trim()) return salesmen;
    const q = searchQuery.toLowerCase().trim();
    return salesmen.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.employeeCode?.toLowerCase().includes(q) ||
      s.territory?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  }, [salesmen, searchQuery]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    if (visitFilterSalesman === 'ALL') return visits;
    return visits.filter((v) => {
      const sId = v.salesmanId?._id || v.salesmanId;
      return sId === visitFilterSalesman;
    });
  }, [visits, visitFilterSalesman]);

  // Overall Statistics
  const totalTarget = salesmen.reduce((sum, s) => sum + (Number(s.targetMonthly) || 0), 0);
  const totalAchieved = salesmen.reduce((sum, s) => sum + (Number(s.currentMonthAchievement) || 0), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalAchieved / totalTarget) * 100)) : 0;
  const activeCount = salesmen.filter((s) => s.status !== 'Inactive').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Sales Force & Field Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Field executive tracking &bull; Monthly booking targets vs achievement &bull; Shop check-in/out visit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSalesmanModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Salesman
          </button>
          {salesmen.length > 0 && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4" /> Log Shop Visit
            </button>
          )}
        </div>
      </div>

      {/* Metric Summary Cards */}
      {salesmen.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Sales Executives</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{salesmen.length}</span>
              <span className="text-[11px] text-emerald-600 font-semibold">{activeCount} Active</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Target</span>
              <IndianRupee className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900">
                ₹ {Number(totalTarget).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Achieved</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600">
                ₹ {Number(totalAchieved).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">({overallPct}%)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Recorded Visits</span>
              <MapPin className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900">{visits.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Toolbar */}
      {salesmen.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, code, territory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredSalesmen.length}</span> of {salesmen.length} salesmen
          </div>
        </div>
      )}

      {/* Salesmen Target Progress Cards */}
      {filteredSalesmen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalesmen.map((sls) => {
            const target = sls.targetMonthly || 200000;
            const achieved = sls.currentMonthAchievement || 0;
            const pct = Math.min(100, Math.round((achieved / target) * 100));

            return (
              <Card key={sls._id} className="relative hover:shadow-md transition-all group border border-slate-200/80">
                {/* Top Row: Name, Status, Badges & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{sls.name}</h3>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          sls.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sls.status === 'On Leave'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sls.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                      <span className="font-mono">{sls.employeeCode}</span> &bull; {sls.territory}
                    </div>
                  </div>

                  {/* Actions & Shops Count */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      title="Assigned Retail Shops"
                      className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-100"
                    >
                      {sls.assignedStoresCount || 0} Shops
                    </span>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditSalesmanModal(sls)}
                      title="Edit Salesman"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-200 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingSalesman(sls)}
                      title="Delete Salesman"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target & Achievement */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Monthly Target:</span>
                    <span className="font-bold text-slate-800">
                      ₹ {Number(target).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Achievement:</span>
                    <span className="font-bold text-emerald-600">
                      ₹ {Number(achieved).toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        pct >= 100
                          ? 'bg-emerald-500'
                          : pct >= 50
                          ? 'bg-teal-600'
                          : pct > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sls.phone}</span>
                  </span>
                  <span className="font-medium text-slate-700 shrink-0">
                    Comm: {sls.commissionPercent}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : salesmen.length > 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Salesmen Matched</h3>
          <p className="text-xs text-slate-500 mt-1">No sales force found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Sales Executives Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add your sales team member to assign territories, set monthly targets, and track daily beat visits.
          </p>
          <button
            onClick={() => setIsAddSalesmanModalOpen(true)}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Salesman
          </button>
        </div>
      )}

      {/* Field Visits Log */}
      <Card
        title="Recent Shop Field Visits & Audits"
        subtitle="Real-time check-in logs from salesmen on the road"
      >
        {/* Visits Filter Toolbar */}
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 shrink-0">Filter by Salesman:</span>
            <select
              value={visitFilterSalesman}
              onChange={(e) => setVisitFilterSalesman(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Sales Executives ({visits.length})</option>
              {salesmen.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.employeeCode})
                </option>
              ))}
            </select>
          </div>
          {salesmen.length > 0 && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="w-3.5 h-3.5" /> Log New Visit
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Salesman</th>
                <th className="py-3 px-3">Shop Visited</th>
                <th className="py-3 px-3">Visit Purpose</th>
                <th className="py-3 px-3">Notes & Outcome</th>
                <th className="py-3 px-3 text-right">Payment Collected</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(v.visitDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <div>{v.salesmanId?.name || 'Sales Staff'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {v.salesmanId?.employeeCode}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{v.storeId?.name || 'Retail Store'}</div>
                      <div className="text-[10px] text-slate-400">
                        {v.storeId?.city} {v.storeId?.area ? `(${v.storeId?.area})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold text-[10px] border border-teal-100 whitespace-nowrap">
                        {v.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={v.notes}>
                      {v.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {v.paymentCollectedAmount > 0 ? (
                        <span className="font-bold text-emerald-600">
                          + ₹ {Number(v.paymentCollectedAmount).toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-normal">{v.paymentMode}</div>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    {/* Visit Actions (Edit / Delete) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditVisitModal(v)}
                          title="Edit Visit"
                          className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingVisit(v)}
                          title="Delete Visit"
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No field visits recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ==================================================== */}
      {/* MODAL 1: ADD SALESMAN (CREATE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={isAddSalesmanModalOpen}
        onClose={() => setIsAddSalesmanModalOpen(false)}
        title="Register New Sales Executive"
        maxWidth="max-w-xl"
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
                onChange={(e) =>
                  setSalesmanForm({ ...salesmanForm, employeeCode: e.target.value.toUpperCase() })
                }
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
                placeholder="e.g. 9840234567"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={salesmanForm.email}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. murugan@tamilenterprises.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Territory / Beat Route *
              </label>
              <input
                type="text"
                required
                value={salesmanForm.territory}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, territory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Chennai Central Beat"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={salesmanForm.status}
                onChange={(e) => setSalesmanForm({ ...salesmanForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Monthly Sales Target (₹)
              </label>
              <input
                type="number"
                min="0"
                value={salesmanForm.targetMonthly}
                onChange={(e) =>
                  setSalesmanForm({ ...salesmanForm, targetMonthly: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="200000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={salesmanForm.commissionPercent}
                onChange={(e) =>
                  setSalesmanForm({ ...salesmanForm, commissionPercent: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="2.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSalesmanModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingSalesman}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submittingSalesman ? 'Saving...' : 'Register Salesman'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: EDIT SALESMAN (UPDATE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={isEditSalesmanModalOpen}
        onClose={() => setIsEditSalesmanModalOpen(false)}
        title={`Edit Salesman: ${editingSalesman?.name || ''}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateSalesman} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editSalesmanForm.name}
                onChange={(e) =>
                  setEditSalesmanForm({ ...editSalesmanForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Code *</label>
              <input
                type="text"
                required
                value={editSalesmanForm.employeeCode}
                onChange={(e) =>
                  setEditSalesmanForm({
                    ...editSalesmanForm,
                    employeeCode: e.target.value.toUpperCase()
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={editSalesmanForm.phone}
                onChange={(e) =>
                  setEditSalesmanForm({ ...editSalesmanForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={editSalesmanForm.email}
                onChange={(e) =>
                  setEditSalesmanForm({ ...editSalesmanForm, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Territory / Beat Route *
              </label>
              <input
                type="text"
                required
                value={editSalesmanForm.territory}
                onChange={(e) =>
                  setEditSalesmanForm({ ...editSalesmanForm, territory: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editSalesmanForm.status}
                onChange={(e) =>
                  setEditSalesmanForm({ ...editSalesmanForm, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Monthly Sales Target (₹)
              </label>
              <input
                type="number"
                min="0"
                value={editSalesmanForm.targetMonthly}
                onChange={(e) =>
                  setEditSalesmanForm({
                    ...editSalesmanForm,
                    targetMonthly: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={editSalesmanForm.commissionPercent}
                onChange={(e) =>
                  setEditSalesmanForm({
                    ...editSalesmanForm,
                    commissionPercent: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditSalesmanModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingSalesman}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {updatingSalesman ? 'Saving...' : 'Update Salesman'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: DELETE SALESMAN (DELETE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!deletingSalesman}
        onClose={() => setDeletingSalesman(null)}
        title="Delete Sales Executive"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Are you sure you want to delete this salesman?</p>
              <p className="mt-1 text-[11px] text-red-700">
                You are about to permanently remove{' '}
                <strong className="font-semibold">{deletingSalesman?.name}</strong> (
                {deletingSalesman?.employeeCode}). All assigned retail shops will be unassigned safely.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingSalesman(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSalesman}
              disabled={isDeletingSalesman}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isDeletingSalesman ? 'Deleting...' : 'Yes, Delete Salesman'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: LOG FIELD VISIT (CREATE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title="Log Shop Field Visit & Check-in"
        maxWidth="max-w-xl"
      >
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
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.territory})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retail Shop Visited *</label>
              <select
                required
                value={visitData.storeId}
                onChange={(e) => setVisitData({ ...visitData, storeId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
              <label className="block font-semibold text-slate-700 mb-1">Order Value (₹)</label>
              <input
                type="number"
                min="0"
                value={visitData.orderValue}
                onChange={(e) =>
                  setVisitData({ ...visitData, orderValue: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Collected (₹)</label>
              <input
                type="number"
                min="0"
                value={visitData.paymentCollectedAmount}
                onChange={(e) =>
                  setVisitData({
                    ...visitData,
                    paymentCollectedAmount: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={visitData.paymentMode}
                onChange={(e) => setVisitData({ ...visitData, paymentMode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="None">None</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Field Visit Remarks / Shop Feedback
            </label>
            <textarea
              rows="3"
              required
              value={visitData.notes}
              onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Met owner. Checked shelf space for products. Booked fresh order for weekend delivery."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingVisit}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
            >
              {submittingVisit ? 'Recording...' : 'Log Field Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 5: EDIT FIELD VISIT (UPDATE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={isEditVisitModalOpen}
        onClose={() => setIsEditVisitModalOpen(false)}
        title="Edit Shop Field Visit Log"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateVisit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Executive *</label>
              <select
                required
                value={editVisitData.salesmanId}
                onChange={(e) =>
                  setEditVisitData({ ...editVisitData, salesmanId: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {salesmen.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.territory})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retail Shop Visited *</label>
              <select
                required
                value={editVisitData.storeId}
                onChange={(e) =>
                  setEditVisitData({ ...editVisitData, storeId: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visit Purpose</label>
              <select
                value={editVisitData.purpose}
                onChange={(e) =>
                  setEditVisitData({ ...editVisitData, purpose: e.target.value })
                }
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
              <label className="block font-semibold text-slate-700 mb-1">Order Value (₹)</label>
              <input
                type="number"
                min="0"
                value={editVisitData.orderValue}
                onChange={(e) =>
                  setEditVisitData({ ...editVisitData, orderValue: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Collected (₹)</label>
              <input
                type="number"
                min="0"
                value={editVisitData.paymentCollectedAmount}
                onChange={(e) =>
                  setEditVisitData({
                    ...editVisitData,
                    paymentCollectedAmount: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={editVisitData.paymentMode}
                onChange={(e) =>
                  setEditVisitData({ ...editVisitData, paymentMode: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="None">None</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Notes</label>
            <textarea
              rows="3"
              value={editVisitData.notes}
              onChange={(e) =>
                setEditVisitData({ ...editVisitData, notes: e.target.value })
              }
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditVisitModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingVisit}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
            >
              {updatingVisit ? 'Saving...' : 'Update Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 6: DELETE FIELD VISIT (DELETE) */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!deletingVisit}
        onClose={() => setDeletingVisit(null)}
        title="Delete Field Visit Record"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Are you sure you want to delete this field visit log?</p>
              <p className="mt-1 text-[11px] text-red-700">
                This will permanently remove the visit log for{' '}
                <strong>{deletingVisit?.storeId?.name || 'Retail Store'}</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingVisit(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVisit}
              disabled={isDeletingVisit}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isDeletingVisit ? 'Deleting...' : 'Yes, Delete Visit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Salesmen;
