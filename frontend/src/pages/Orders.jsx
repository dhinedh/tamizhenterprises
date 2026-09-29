import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, CheckCircle2, Clock, Truck, FileText, AlertCircle, Eye, XCircle, ArrowRight, ChevronDown } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import StoreTransferModal from '../components/stock/StoreTransferModal';
import InvoiceSuccessModal from '../components/stock/InvoiceSuccessModal';

const Orders = () => {
  const { user, isOwner, isSalesman, isStore } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Stock Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferOrder, setTransferOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Place Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 10, unitPrice: 0, discountPercent: 0 }]);
  const [paymentType, setPaymentType] = useState('Credit');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [creditAlert, setCreditAlert] = useState(null);

  // View Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStores();
    fetchProducts();
    fetchSalesmen();
  }, [statusFilter]);

  const fetchSalesmen = async () => {
    try {
      const res = await api.get('/salesmen');
      if (res.data.success) {
        setSalesmen(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/orders${query}`);
      if (res.data.success) {
        setOrders(res.data.data);
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
        if (isStore && user?.storeId) {
          setSelectedStoreId(user.storeId._id || user.storeId);
        } else if (res.data.data.length > 0) {
          setSelectedStoreId(res.data.data[0]._id);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelect = (index, productId) => {
    const prod = products.find(p => p._id === productId);
    const updated = [...orderItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].unitPrice = prod.dealerPrice || prod.sellingPrice || 0;
    }
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const addLine = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 10, unitPrice: 0, discountPercent: 0 }]);
  };

  const removeLine = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCreditAlert(null);
    try {
      const res = await api.post('/orders', {
        storeId: selectedStoreId,
        items: orderItems,
        paymentType,
        deliveryNotes
      });
      if (res.data.success) {
        setIsOrderModalOpen(false);
        setOrderItems([{ productId: '', quantity: 10, unitPrice: 0, discountPercent: 0 }]);
        setDeliveryNotes('');
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/approve`);
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving order');
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const res = await api.post(`/invoices/generate-from-order/${orderId}`);
      if (res.data.success) {
        setGeneratedInvoice(res.data.data);
        setIsInvoiceModalOpen(true);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating invoice');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling order');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}`, { status: newStatus });
      if (res.data.success) {
        setSuccessToast(`Order status updated to "${newStatus}" successfully!`);
        setTimeout(() => setSuccessToast(''), 4500);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4 text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Store Orders & Fulfillment Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Order Placement &rarr; Admin Stock Reservation &rarr; Invoice Generation &rarr; Vehicle Dispatch &rarr; Delivery
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={() => {
                setTransferOrder(null);
                setIsTransferModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" /> + Transfer Stock to Store & Bill
            </button>
          )}
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Book New Order
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['', 'Pending', 'Approved', 'Processing', 'Dispatched', 'Delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
              statusFilter === status
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status || 'All Orders'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Store Name</th>
                  <th className="py-3 px-3">Salesman</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.length > 0 ? (
                  orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{ord.storeId?.name}</div>
                        <div className="text-[10px] text-slate-400">{ord.storeId?.city} &bull; Outstanding: ₹{Number(ord.storeId?.outstandingBalance || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {ord.salesmanId?.name || 'Direct Order'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(ord.orderDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(ord.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isOwner ? (
                          <div className="relative inline-block">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none pr-5 text-center ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : ord.status === 'Dispatched'
                                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                                  : ord.status === 'Approved'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : ord.status === 'Processing'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-slate-100 text-slate-800 border-slate-300'
                              }`}
                              title="Click to edit order status"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Processing">Processing</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                          </div>
                        ) : (
                          <StatusBadge status={ord.status} />
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="View Order Items"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Mark as Delivered button for Dispatched or Processing orders */}
                          {isOwner && (ord.status === 'Dispatched' || ord.status === 'Processing') && (
                            <button
                              onClick={() => handleUpdateStatus(ord._id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title="Mark order as Delivered to retail store"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                            </button>
                          )}

                          {/* Workflow buttons for Owner */}
                          {isOwner && (ord.status === 'Pending' || ord.status === 'Approved') && (
                            <button
                              onClick={() => {
                                setTransferOrder(ord);
                                setIsTransferModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                              title="Transfer physical stock & generate GST invoice"
                            >
                              <Truck className="w-3 h-3" /> Transfer & Bill
                            </button>
                          )}

                          {isOwner && ord.status === 'Pending' && (
                            <button
                              onClick={() => handleApprove(ord._id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] shadow-xs"
                            >
                              Approve
                            </button>
                          )}

                          {isOwner && ord.status === 'Approved' && (
                            <button
                              onClick={() => handleGenerateInvoice(ord._id)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-medium text-[11px] flex items-center gap-1 shadow-xs"
                            >
                              <FileText className="w-3 h-3" /> Gen Invoice
                            </button>
                          )}

                          {ord.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelOrder(ord._id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No orders found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Book New Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Book Wholesale Order for Store"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer Retail Store *</label>
            <select
              required
              disabled={isStore}
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.city}) - Balance Due: ₹{s.outstandingBalance || 0} / Limit: ₹{s.creditLimit || 50000}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Order Items</span>
              <button
                type="button"
                onClick={addLine}
                className="text-teal-600 hover:text-teal-700 font-semibold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another SKU
              </button>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Product SKU</label>
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Avail: {p.stock?.availableStock ?? 0}) - Rate: ₹{p.dealerPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-right"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-right font-medium"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Disc%</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(idx, 'discountPercent', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-right"
                    />
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Credit">Credit (15 Days Net)</option>
                <option value="Cash">Cash on Delivery (COD)</option>
                <option value="UPI">Instant UPI / QR</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dispatch / Delivery Instructions</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="e.g. Unload before 10 AM, rear gate"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Placing Order...' : 'Submit Wholesale Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Item Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.orderNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-900">{selectedOrder.storeId?.name}</span>
                <div className="text-[10px] text-slate-500">{selectedOrder.storeId?.city} &bull; {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Status:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 bg-white cursor-pointer focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Processing">Processing</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                ) : (
                  <StatusBadge status={selectedOrder.status} />
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <div className="text-[10px] text-slate-400">
                      Rate: ₹{item.unitPrice} &bull; GST: {item.gstRate}%
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{item.quantity} units {item.freeQuantity ? `(+${item.freeQuantity} Free)` : ''}</span>
                    <div className="text-teal-700 font-bold">₹ {Number(item.total).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-right">
              <div>Taxable Subtotal: <span className="font-bold">₹ {Number(selectedOrder.subtotal).toFixed(2)}</span></div>
              <div>GST Tax Total: <span className="font-bold">₹ {Number(selectedOrder.taxTotal).toFixed(2)}</span></div>
              <div className="text-sm font-extrabold text-teal-800 pt-1 border-t border-slate-200">
                Grand Total: ₹ {Number(selectedOrder.grandTotal).toLocaleString('en-IN')}
              </div>
            </div>

            {isOwner && (
              <div className="pt-3 flex justify-between items-center border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {selectedOrder.status === 'Delivered'
                    ? '✓ This order has been delivered to the retail store.'
                    : `Current order status is ${selectedOrder.status}.`}
                </span>
                {selectedOrder.status !== 'Delivered' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Delivered')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Order as Delivered
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Store Stock Transfer Modal */}
      <StoreTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferOrder(null);
        }}
        prefillOrder={transferOrder}
        stores={stores}
        salesmen={salesmen}
        onTransferSuccess={(inv) => {
          setGeneratedInvoice(inv);
          setIsInvoiceModalOpen(true);
          fetchOrders();
        }}
      />

      {/* Invoice Success & Print/Share Modal */}
      <InvoiceSuccessModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setGeneratedInvoice(null);
        }}
        invoice={generatedInvoice}
      />
    </div>
  );
};

export default Orders;
