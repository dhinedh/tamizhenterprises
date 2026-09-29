import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Search, Phone, MapPin, User, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const Deliveries = () => {
  const { isOwner } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    orderId: '',
    storeId: '',
    vehicleNumber: 'TN 09 AB 4591',
    driverName: 'R. Kandan',
    driverPhone: '+91 94440 12890',
    vehicleType: 'Tata Ace (Chhota Hathi)',
    deliveryNotes: ''
  });

  // Mark Delivered Modal
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [receivedByName, setReceivedByName] = useState('Shop Receiving Manager');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    fetchReadyOrders();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/deliveries');
      if (res.data.success) {
        setDeliveries(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadyOrders = async () => {
    try {
      const res = await api.get('/orders?status=Processing');
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.data.length > 0) {
          setDispatchData(prev => ({
            ...prev,
            orderId: res.data.data[0]._id,
            storeId: res.data.data[0].storeId?._id || res.data.data[0].storeId
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/deliveries', dispatchData);
      if (res.data.success) {
        setIsDispatchModalOpen(false);
        fetchDeliveries();
        fetchReadyOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error dispatching delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/deliveries/${selectedDelivery._id}/status`, {
        status: 'Delivered',
        receivedByName
      });
      if (res.data.success) {
        setSelectedDelivery(null);
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating delivery');
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
            Logistics & Delivery Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet vehicle assignment &bull; Real-time delivery status &bull; Driver contact & Proof of Delivery (POD)
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Dispatch Next Vehicle
          </button>
        )}
      </div>

      {/* Deliveries Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Delivery #</th>
                  <th className="py-3 px-3">Destination Shop</th>
                  <th className="py-3 px-3">Vehicle Details</th>
                  <th className="py-3 px-3">Driver Contact</th>
                  <th className="py-3 px-3">Dispatch Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Proof / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {deliveries.length > 0 ? (
                  deliveries.map((del) => (
                    <tr key={del._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {del.deliveryNumber}
                        <div className="text-[10px] text-slate-400 font-normal">Order: {del.orderId?.orderNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{del.storeId?.name}</div>
                        <div className="text-[10px] text-slate-500">{del.storeId?.city} ({del.storeId?.address})</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 font-mono">{del.vehicleNumber}</span>
                        <div className="text-[10px] text-slate-400">{del.vehicleType}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{del.driverName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {del.driverPhone}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(del.dispatchDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={del.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {del.status === 'Delivered' ? (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            <span className="flex items-center justify-end gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Received
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">By: {del.receivedByName}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedDelivery(del)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[11px] rounded border border-teal-200"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No deliveries dispatched yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Vehicle / Dispatch Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Dispatch Delivery Vehicle">
        <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Order to Dispatch *</label>
            <select
              required
              value={dispatchData.orderId}
              onChange={(e) => {
                const ord = orders.find(o => o._id === e.target.value);
                setDispatchData({
                  ...dispatchData,
                  orderId: e.target.value,
                  storeId: ord?.storeId?._id || ord?.storeId || ''
                });
              }}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="">Select Invoiced Order</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} - {o.storeId?.name} ({o.storeId?.city}) - ₹{o.grandTotal}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Plate Number *</label>
              <input
                type="text"
                required
                value={dispatchData.vehicleNumber}
                onChange={(e) => setDispatchData({ ...dispatchData, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg uppercase font-mono"
                placeholder="TN 59 AB 1234"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
              <input
                type="text"
                value={dispatchData.vehicleType}
                onChange={(e) => setDispatchData({ ...dispatchData, vehicleType: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="Tata Ace / 1.5T Pickup"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver Name *</label>
              <input
                type="text"
                required
                value={dispatchData.driverName}
                onChange={(e) => setDispatchData({ ...dispatchData, driverName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="Driver Name"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver Phone *</label>
              <input
                type="text"
                required
                value={dispatchData.driverPhone}
                onChange={(e) => setDispatchData({ ...dispatchData, driverPhone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="+91 94440 00000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Dispatching...' : 'Confirm Vehicle Dispatch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Delivered Modal */}
      {selectedDelivery && (
        <Modal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Confirm Proof of Delivery: ${selectedDelivery.deliveryNumber}`}
        >
          <form onSubmit={handleMarkDelivered} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block">{selectedDelivery.storeId?.name}</span>
              <div className="text-slate-500 text-[11px]">Address: {selectedDelivery.storeId?.address}</div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Received By (Shop Manager Name) *</label>
              <input
                type="text"
                required
                value={receivedByName}
                onChange={(e) => setReceivedByName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                placeholder="Receiver name & stamp"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Order Delivered
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Deliveries;
