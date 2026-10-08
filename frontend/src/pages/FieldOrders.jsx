import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  Store as StoreIcon,
  User,
  Clock
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { sortProducts } from '../utils/productSorter';

const FieldOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActionNew = searchParams.get('action') === 'new';

  // Mode: 'manage' or 'new'
  const [activeTab, setActiveTab] = useState(isActionNew ? 'new' : 'manage');

  // Master Data
  const [orders, setOrders] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_field_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [stores, setStores] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_stores');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_products');
      return saved ? sortProducts(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(orders.length === 0 && stores.length === 0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  // Manage Orders Filter States (Screenshot 4)
  const [filterFromDate, setFilterFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [filterToDate, setFilterToDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [filterShopQuery, setFilterShopQuery] = useState('');

  // Location Modal
  const [locationModal, setLocationModal] = useState({
    isOpen: false,
    title: '',
    shopName: '',
    address: '',
    lat: 13.0827,
    lng: 80.2707
  });

  // ================= ADD ORDER FORM STATE (Screenshots 2 & 3) =================
  const [orderType, setOrderType] = useState('Get Order'); // 'Get Order' | 'No Order'
  const [districtFilter, setDistrictFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [talukFilter, setTalukFilter] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [orderDateStr] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [notes, setNotes] = useState('');
  const [noOrderReason, setNoOrderReason] = useState('Stock Full');

  // Line item staging inputs
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscPct, setItemDiscPct] = useState('');
  const [itemDiscRs, setItemDiscRs] = useState('');

  // Added items list
  const [orderItems, setOrderItems] = useState([]);

  // Sync tab with URL
  useEffect(() => {
    if (isActionNew) {
      setActiveTab('new');
    } else {
      setActiveTab('manage');
    }
  }, [isActionNew]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const fetchInitialData = async () => {
    if (orders.length === 0 && stores.length === 0) {
      setLoading(true);
    }
    try {
      await Promise.all([fetchOrdersList(), fetchStoresList(), fetchProductsList()]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersList = async (customParams = {}) => {
    try {
      let query = `?status=${customParams.status !== undefined ? customParams.status : filterStatus}`;
      const from = customParams.from !== undefined ? customParams.from : filterFromDate;
      const to = customParams.to !== undefined ? customParams.to : filterToDate;
      if (from) query += `&from=${from}`;
      if (to) query += `&to=${to}`;
      const shop = customParams.shop !== undefined ? customParams.shop : filterShopQuery;
      if (shop) query += `&shopName=${encodeURIComponent(shop)}`;

      const res = await api.get(`/orders${query}`);
      if (res.data.success) {
        setOrders(res.data.data || []);
        if (!shop && !from && !to) {
          try {
            sessionStorage.setItem('tamil_erp_field_orders', JSON.stringify(res.data.data || []));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchStoresList = async () => {
    try {
      const res = await api.get('/stores');
      if (res.data.success) {
        setStores(res.data.data || []);
        try {
          sessionStorage.setItem('tamil_erp_stores', JSON.stringify(res.data.data || []));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(sortProducts(res.data.data || []));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Distinct lists for District, Division, Taluk
  const districtsList = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => {
      if (s.district) set.add(s.district);
      if (s.city) set.add(s.city);
    });
    return Array.from(set).sort();
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (districtFilter) {
        const matchesDistrict =
          (s.district && s.district.toLowerCase() === districtFilter.toLowerCase()) ||
          (s.city && s.city.toLowerCase() === districtFilter.toLowerCase());
        if (!matchesDistrict) return false;
      }
      if (talukFilter) {
        const matchesTaluk = s.taluk && s.taluk.toLowerCase().includes(talukFilter.toLowerCase());
        if (!matchesTaluk) return false;
      }
      return true;
    });
  }, [stores, districtFilter, talukFilter]);

  // Handle Product Select in Line Item Staging
  const handleProductSelectChange = (e) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    if (!prodId) {
      setItemPrice('');
      return;
    }
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      const price = prod.dealerPrice || prod.sellingPrice || prod.mrp || 0;
      setItemPrice(price);
    }
  };

  // Auto-calculated item total
  const calculatedItemTotal = useMemo(() => {
    const q = Number(itemQty) || 0;
    const p = Number(itemPrice) || 0;
    const gross = q * p;
    let disc = 0;
    if (itemDiscPct) {
      disc = (gross * Number(itemDiscPct)) / 100;
    } else if (itemDiscRs) {
      disc = Number(itemDiscRs);
    }
    return Math.max(0, gross - disc);
  }, [itemQty, itemPrice, itemDiscPct, itemDiscRs]);

  // Add line item to table
  const handleAddLineItem = () => {
    if (!selectedProductId) {
      showToast('error', 'Please select a product first');
      return;
    }
    const q = Number(itemQty);
    if (!q || q <= 0) {
      showToast('error', 'Please enter a valid quantity');
      return;
    }

    const prod = products.find((p) => p._id === selectedProductId);
    if (!prod) return;

    const p = Number(itemPrice) || 0;
    const gross = q * p;
    let discountAmount = 0;
    let discountPercent = 0;

    if (itemDiscPct) {
      discountPercent = Number(itemDiscPct);
      discountAmount = (gross * discountPercent) / 100;
    } else if (itemDiscRs) {
      discountAmount = Number(itemDiscRs);
      discountPercent = gross > 0 ? (discountAmount / gross) * 100 : 0;
    }

    const total = Math.max(0, gross - discountAmount);

    const newItem = {
      productId: prod._id,
      productName: prod.name,
      sku: prod.sku,
      quantity: q,
      unitPrice: p,
      discountPercent,
      discountAmount,
      gstRate: prod.gstRate !== undefined ? prod.gstRate : 0,
      total
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Reset line inputs
    setSelectedProductId('');
    setItemQty('');
    setItemPrice('');
    setItemDiscPct('');
    setItemDiscRs('');
  };

  const handleRemoveLineItem = (index) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Order (POST /api/orders)
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!selectedStoreId) {
      showToast('error', 'Please select a shop');
      return;
    }

    if (orderType === 'Get Order' && orderItems.length === 0) {
      showToast('error', 'Please add at least one product to the order');
      return;
    }

    setSaving(true);
    try {
      const storeObj = stores.find((s) => s._id === selectedStoreId);

      const payload = {
        storeId: selectedStoreId,
        orderType,
        district: districtFilter || storeObj?.district || '',
        division: divisionFilter,
        taluk: talukFilter,
        notes,
        noOrderReason: orderType === 'No Order' ? (noOrderReason || notes) : '',
        salesmanName: user?.name || 'KARTHIBAN',
        orderDate: new Date().toISOString(),
        items: orderType === 'Get Order' ? orderItems : [],
        shopLocation: {
          lat: 13.0827,
          lng: 80.2707,
          address: storeObj?.address || `${storeObj?.city || 'Chennai'}, Tamil Nadu`
        },
        orderLocation: {
          lat: 13.0845,
          lng: 80.2715,
          address: `Field Order Location - ${storeObj?.name || 'Store'}`
        }
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        showToast('success', `${orderType} placed successfully!`);
        // Reset form
        setSelectedStoreId('');
        setNotes('');
        setOrderItems([]);
        // Switch to manage tab
        setTimeout(() => {
          navigate('/field-orders');
          fetchOrdersList();
        }, 1000);
      } else {
        showToast('error', res.data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      showToast('error', err.response?.data?.message || 'Error creating order');
    } finally {
      setSaving(false);
    }
  };

  // Generate Invoice from Order
  const handleGenerateInvoice = async (orderId) => {
    try {
      const res = await api.post(`/invoices/generate-from-order/${orderId}`);
      if (res.data.success) {
        showToast('success', 'GST Invoice generated successfully!');
        fetchOrdersList();
      } else {
        showToast('error', res.data.message || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error('Invoice generation error:', err);
      showToast('error', err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  // Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this field order?')) return;

    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        showToast('success', 'Order cancelled');
        fetchOrdersList();
      } else {
        showToast('error', res.data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      showToast('error', err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    fetchOrdersList();
  };

  const openLocationModal = (type, order) => {
    const isShop = type === 'shop';
    setLocationModal({
      isOpen: true,
      title: isShop ? 'Shop Location' : 'Order Location (DM)',
      shopName: order.storeId?.name || 'Retail Shop',
      address: isShop
        ? (order.storeId?.address || `${order.storeId?.city || 'Chennai'}, Tamil Nadu`)
        : (order.orderLocation?.address || `Field GPS Check-In for ${order.storeId?.name || 'Shop'}`),
      lat: isShop ? (order.shopLocation?.lat || 13.0827) : (order.orderLocation?.lat || 13.0845),
      lng: isShop ? (order.shopLocation?.lng || 80.2707) : (order.orderLocation?.lng || 80.2715)
    });
  };

  // Format date helper DD-MM-YYYY
  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-8">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= MODE: MANAGE FIELD ORDERS (Screenshot 4) ================= */}
      {activeTab === 'manage' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
              Manage Field Orders
            </h1>
            <button
              onClick={() => navigate('/field-orders?action=new')}
              title="Add New Field Order"
              className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer text-xl font-bold"
            >
              +
            </button>
          </div>

          {/* Filter Bar (Matching Screenshot 4) */}
          <form
            onSubmit={handleFilterSearch}
            className="bg-transparent grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end"
          >
            {/* From Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              >
                <option value="Pending">Pending</option>
                <option value="All">All Statuses</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={filterShopQuery}
                onChange={(e) => setFilterShopQuery(e.target.value)}
                placeholder="Search shop..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Search Button */}
            <div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Orders Table Container (Screenshot 4) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-5">DATE</th>
                    <th className="py-3 px-5">SHOP</th>
                    <th className="py-3 px-5">STATUS</th>
                    <th className="py-3 px-5">DETAILS</th>
                    <th className="py-3 px-5 text-center">INVOICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        Loading field orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No field orders found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* DATE */}
                        <td className="py-4 px-5 align-top font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                          {formatDateDisplay(order.orderDate || order.createdAt)}
                        </td>

                        {/* SHOP */}
                        <td className="py-4 px-5 align-top">
                          <div className="font-semibold text-slate-900 text-sm mb-1.5">
                            {order.storeId?.name || 'Retail Shop'}
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                            {/* Shop Location Pill */}
                            <button
                              type="button"
                              onClick={() => openLocationModal('shop', order)}
                              className="px-2.5 py-0.5 bg-sky-100/80 hover:bg-sky-200 text-sky-700 text-[11px] font-semibold rounded-full transition-colors cursor-pointer"
                            >
                              Shop Location
                            </button>
                            {/* Order Location Pill */}
                            <button
                              type="button"
                              onClick={() => openLocationModal('order', order)}
                              className="px-2.5 py-0.5 bg-sky-100/80 hover:bg-sky-200 text-sky-700 text-[11px] font-semibold rounded-full transition-colors cursor-pointer"
                            >
                              Order Location (DM)
                            </button>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-5 align-top">
                          <div className="space-y-1.5">
                            {order.orderType === 'No Order' ? (
                              <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[11px] rounded-sm border border-amber-200">
                                No Order
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-sm border border-emerald-200">
                                Get Order
                              </span>
                            )}
                            <div>
                              <span className="inline-block px-2.5 py-0.5 bg-sky-50 text-sky-700 font-semibold text-[11px] rounded-sm border border-sky-100">
                                From DM: {order.salesmanName || order.salesmanId?.name || 'KARTHIBAN'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* DETAILS */}
                        <td className="py-4 px-5 align-top text-xs text-slate-700 font-medium">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="leading-snug">
                                  <span>{it.productName}: </span>
                                  <strong className="text-slate-900 font-bold">{it.quantity}</strong>{' '}
                                  <span className="text-slate-400 font-normal">
                                    (GST {it.gstRate || 0}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">
                              {order.noOrderReason || order.notes || 'No products listed'}
                            </span>
                          )}
                        </td>

                        {/* INVOICE & ACTIONS */}
                        <td className="py-4 px-5 align-top text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {order.status === 'Invoiced' ? (
                              <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-md border border-purple-200">
                                Invoiced
                              </span>
                            ) : order.status === 'Cancelled' ? (
                              <span className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded-md border border-red-200">
                                Cancelled
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateInvoice(order._id)}
                                  className="w-24 py-1.5 bg-[#6b58b8] hover:bg-[#5a48a0] active:bg-[#4f3e91] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
                                >
                                  Invoice
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="w-24 py-1 border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs rounded-md transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODE: ADD FIELD ORDER (Screenshots 2 & 3) ================= */}
      {activeTab === 'new' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header (Screenshot 2) */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight mb-2">
                Field Order – {orderType}
              </h1>
              {/* Mode Toggle Buttons: Get Order vs No Order */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('Get Order')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    orderType === 'Get Order'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Get Order
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('No Order')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    orderType === 'No Order'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  No Order
                </button>
              </div>
            </div>

            {/* Back to Manage Link */}
            <button
              onClick={() => navigate('/field-orders')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Manage Orders</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 sm:p-8">
            <form onSubmit={handleCreateOrder} className="space-y-5">
              {/* DISTRICT Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  DISTRICT Filter
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select DISTRICT</option>
                  {districtsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* DIVISION Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  DIVISION Filter
                </label>
                <input
                  type="text"
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  placeholder="Select DIVISION"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* TALUK Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5 tracking-wide">
                  TALUK Filter
                </label>
                <select
                  value={talukFilter}
                  onChange={(e) => setTalukFilter(e.target.value)}
                  style={{
                    backgroundColor: '#fef9a7',
                    borderColor: '#60a5fa',
                    color: '#0f172a'
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#fef9a7] border-[1.5px] border-[#60a5fa] rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 cursor-pointer shadow-sm transition-all"
                >
                  <option value="" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Select TALUK
                  </option>
                  <option value="Aminjikarai" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Aminjikarai
                  </option>
                  <option value="Ambattur" style={{ backgroundColor: '#fef9a7', color: '#0f172a' }}>
                    Ambattur
                  </option>
                </select>
              </div>

              {/* Shop* Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Shop<span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  {filteredStores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code || s.city || 'Store'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Date* */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Order Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={orderDateStr}
                  className="w-full px-3.5 py-2.5 bg-[#e9ecef] border border-slate-300 rounded-lg text-slate-900 font-bold text-sm cursor-not-allowed select-none"
                />
              </div>

              {/* If No Order: Reason select */}
              {orderType === 'No Order' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Reason for No Order<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={noOrderReason}
                    onChange={(e) => setNoOrderReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Stock Full">Stock Full</option>
                    <option value="Shop Closed">Shop Closed</option>
                    <option value="Owner / Decision Maker Not Available">
                      Owner / Decision Maker Not Available
                    </option>
                    <option value="Payment Overdue Issue">Payment Overdue Issue</option>
                    <option value="Competitor Products Existing">
                      Competitor Products Existing
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter order notes or visit observations..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              </div>

              {/* ================= GET ORDER: PRODUCT SELECTION & LINE ITEMS (Screenshot 3) ================= */}
              {orderType === 'Get Order' && (
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  {/* Select Product */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Select Product
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={handleProductSelectChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Select Product</option>
                      {sortProducts(products).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} - ₹{p.dealerPrice || p.sellingPrice || p.mrp} (GST {p.gstRate || 0}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Inline Staging Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                    {/* Qty */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Price</label>
                      <input
                        type="number"
                        readOnly
                        placeholder="Price"
                        value={itemPrice}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-sm cursor-not-allowed"
                      />
                    </div>

                    {/* Total */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total</label>
                      <input
                        type="number"
                        readOnly
                        placeholder="Total"
                        value={calculatedItemTotal}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-sm cursor-not-allowed"
                      />
                    </div>

                    {/* Disc(%) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Disc(%)</label>
                      <input
                        type="number"
                        placeholder="Disc(%)"
                        value={itemDiscPct}
                        onChange={(e) => {
                          setItemDiscPct(e.target.value);
                          if (e.target.value) setItemDiscRs('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Disc(Rs.) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Disc(Rs.)</label>
                      <input
                        type="number"
                        placeholder="Disc(Rs.)"
                        value={itemDiscRs}
                        onChange={(e) => {
                          setItemDiscRs(e.target.value);
                          if (e.target.value) setItemDiscPct('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* + Add Button (Green) */}
                    <div>
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Added Items Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                        <tr>
                          <th className="py-2.5 px-4 w-12 text-center">#</th>
                          <th className="py-2.5 px-4">Product</th>
                          <th className="py-2.5 px-4 text-center">Qty</th>
                          <th className="py-2.5 px-4 text-right">Price</th>
                          <th className="py-2.5 px-4 text-right">Disc</th>
                          <th className="py-2.5 px-4 text-right">Total</th>
                          <th className="py-2.5 px-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                              No products added yet.
                            </td>
                          </tr>
                        ) : (
                          orderItems.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 text-center text-slate-500 font-semibold text-xs">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                                {it.productName}
                              </td>
                              <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                                {it.quantity}
                              </td>
                              <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                                ₹{it.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                                ₹{it.discountAmount.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                                ₹{it.total.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Submit Button (Blue + Add button) */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'Placing Order...' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LOCATION DETAIL MODAL ================= */}
      {locationModal.isOpen && (
        <Modal
          isOpen={locationModal.isOpen}
          onClose={() => setLocationModal((prev) => ({ ...prev, isOpen: false }))}
          title={locationModal.title}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">{locationModal.shopName}</div>
                <div className="text-slate-600 text-xs mt-0.5">{locationModal.address}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">GPS Coordinates:</span>
              <span className="font-mono font-bold text-slate-800">
                {locationModal.lat.toFixed(4)}, {locationModal.lng.toFixed(4)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${locationModal.lat},${locationModal.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setLocationModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FieldOrders;
