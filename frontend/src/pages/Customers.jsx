import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
  FileUp,
  ChevronsUpDown,
  NotebookPen,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import api from '../api/client';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner } = useAuth();

  // Master Data
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting State
  const [sortField, setSortField] = useState('index');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals & Feedback State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [successToast, setSuccessToast] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customer Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: ''
  });

  const isNewAction = location.search.includes('action=new') || location.search.includes('create=true');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (isNewAction) {
      resetForm();
    }
  }, [location.search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      gstNumber: '',
      address: ''
    });
    setFormError('');
  };

  // Format date helper: 13/Jul/2026
  const formatDate = (dateString) => {
    if (!dateString) return '13/Jul/2026';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '13/Jul/2026';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format phone helper: +91 9715325560
  const formatPhone = (phone) => {
    if (!phone) return '-';
    const str = String(phone).trim();
    if (str.startsWith('+91')) {
      const rest = str.slice(3).trim();
      return `+91 ${rest}`;
    }
    return `+91 ${str}`;
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Customer Data
  const sortedCustomers = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        return (
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.gstNumber && s.gstNumber.toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q))
        );
      });
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'index') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (sortField === 'createdAt') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (typeof valA === 'string') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, search, sortField, sortAsc]);

  // Paginated Customers
  const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, currentPage, pageSize]);

  // Create Customer Handler
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name?.trim()) {
      setFormError('Customer Name is required');
      return;
    }
    if (!formData.phone?.trim()) {
      setFormError('Mobile Number (Username) is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        countryCode: '+91',
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || '',
        gstNumber: formData.gstNumber?.trim() || ''
      };
      const res = await api.post('/customers', payload);
      if (res.data.success) {
        resetForm();
        setSuccessToast(`Customer "${res.data.data.name}" added successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
        fetchCustomers();
        if (isNewAction) {
          navigate('/customers');
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Update Customer Handler
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name?.trim()) {
      setFormError('Customer Name is required');
      return;
    }
    if (!formData.phone?.trim()) {
      setFormError('Mobile Number is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        countryCode: '+91',
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || '',
        gstNumber: formData.gstNumber?.trim() || ''
      };
      const res = await api.put(`/customers/${editingCustomer._id}`, payload);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        resetForm();
        setSuccessToast(`Customer "${formData.name}" updated successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
        fetchCustomers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error updating customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer Handler
  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      try {
        await api.delete(`/customers/${customer._id}`);
        setSuccessToast(`Customer "${customer.name}" deleted successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
        fetchCustomers();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting customer');
      }
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['#', 'Name', 'Mobile', 'Email', 'GSTIN', 'Address', 'Date'];
    const rows = sortedCustomers.map((s, idx) => [
      idx + 1,
      `"${s.name || ''}"`,
      `"${formatPhone(s.phone)}"`,
      `"${s.email || ''}"`,
      `"${s.gstNumber || ''}"`,
      `"${s.address || ''}"`,
      `"${formatDate(s.createdAt)}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manage_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {isNewAction ? (
        /* ================= ADD NEW CUSTOMER VIEW ================= */
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Manage Customers
            </button>
          </div>

          {/* Customer Creation Card matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
            <form onSubmit={handleCreateCustomer} className="space-y-4 sm:space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Name* */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Customer Name*
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Country Code* & Mobile Number (Username)* */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Country Code*
                  </label>
                  <div className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-bold text-slate-900 select-none flex items-center">
                    India (+91)
                  </div>
                </div>

                <div className="sm:col-span-9">
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Mobile Number (Username)*
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-colors"
                  />
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="optional"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="optional"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 uppercase placeholder:normal-case placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-colors"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Address
                </label>
                <textarea
                  rows={3}
                  placeholder="optional"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* + Add Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{submitting ? 'Adding...' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================= MANAGE CUSTOMERS UI (EXACT MATCH) ================= */
        <div className="space-y-5">
          {/* Top Header Row with Title and Action Icons */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Manage Customers
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/customers?action=new')}
                title="Add New Customer"
                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                title="Export Customer List (CSV)"
                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer"
              >
                <FileUp className="w-6 h-6 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* White Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
            {/* Show Entries & Search Bar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 font-normal">
              {/* Show [10] entries */}
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs sm:text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>

              {/* Search: [ ] */}
              <div className="flex items-center gap-2">
                <label className="text-slate-600 text-xs sm:text-sm">Search:</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="border-b border-slate-100 text-slate-500 font-semibold text-xs select-none">
                  <tr>
                    <th onClick={() => handleSort('index')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>#</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('name')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('phone')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>Mobile</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('email')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>Email</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('gstNumber')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>GSTIN</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('address')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>Address</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('createdAt')} className="py-3 px-3 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 font-semibold">
                        <span>Edit</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading customers...
                      </td>
                    </tr>
                  ) : paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((customer, idx) => {
                      const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={customer._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-3 text-slate-800 font-normal">{rowNumber}</td>
                          <td className="py-4 px-3 font-normal text-slate-900">{customer.name}</td>
                          <td className="py-4 px-3 text-slate-800 whitespace-nowrap">{formatPhone(customer.phone)}</td>
                          <td className="py-4 px-3 text-slate-600">{customer.email || ''}</td>
                          <td className="py-4 px-3 text-slate-600 font-mono text-xs">{customer.gstNumber || ''}</td>
                          <td className="py-4 px-3 text-slate-800 uppercase">{customer.address || ''}</td>
                          <td className="py-4 px-3 text-slate-800 whitespace-nowrap">{formatDate(customer.createdAt)}</td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              {/* Green Notebook/Pencil Edit Icon */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(customer)}
                                title="Edit Customer"
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <NotebookPen className="w-5 h-5 stroke-[2]" />
                              </button>
                              {/* Red Trash Delete Icon */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(customer)}
                                title="Delete Customer"
                                className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-5 h-5 stroke-[2]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No customers found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <div>
                Showing {paginatedCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, sortedCustomers.length)} of {sortedCustomers.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1 font-semibold text-slate-800 bg-slate-100 rounded-lg">
                  {currentPage}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
          }}
          title={`Edit Customer: ${editingCustomer?.name || ''}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Customer Name*
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              <div className="sm:col-span-4">
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Country Code*
                </label>
                <div className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-bold text-slate-900 select-none flex items-center">
                  India (+91)
                </div>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Mobile Number (Username)*
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                placeholder="optional"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                GSTIN
              </label>
              <input
                type="text"
                placeholder="optional"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 uppercase placeholder:normal-case placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Address
              </label>
              <textarea
                rows={3}
                placeholder="optional"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Updating...' : 'Update Customer'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
