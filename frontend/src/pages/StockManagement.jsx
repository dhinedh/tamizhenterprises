import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  PackagePlus,
  ArrowDownToLine,
  Calendar,
  IndianRupee,
  Truck,
  UserCheck,
  Eye,
  Download,
  Share2,
  Printer,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { StatusBadge } from '../components/common/Badge';
import { useManufacturer } from '../context/ManufacturerContext';
import StoreTransferModal from '../components/stock/StoreTransferModal';
import InvoiceSuccessModal from '../components/stock/InvoiceSuccessModal';

const StockManagement = () => {
  const { activeManufacturer } = useManufacturer();
  const [stocks, setStocks] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'salesman-requests', 'store-transfer', 'ledger', 'valuation'
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Store Stock Transfer & Salesman Requests
  const [stores, setStores] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [salesmanRequests, setSalesmanRequests] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInitialData, setTransferInitialData] = useState(null);
  const [isInvoiceSuccessOpen, setIsInvoiceSuccessOpen] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState(null);
  const [successToast, setSuccessToast] = useState('');
  
  const transferProductsList = useMemo(() => {
    return stocks.map(s => ({
      ...s.productId,
      stock: s
    }));
  }, [stocks]);

  // Direct Stock Inward Modal (Price, Date, Quantity)
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [inwardData, setInwardData] = useState({
    productId: '',
    quantity: 50,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0],
    billNumber: '',
    batchNumber: '',
    updateProductPrice: true,
    warehouseLocation: 'Main Warehouse - Bay 1',
    notes: ''
  });
  const [inwardProductInfo, setInwardProductInfo] = useState(null);

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    productId: '',
    type: 'ADDITION', // 'ADDITION', 'REDUCTION', 'DAMAGE_TRANSFER'
    adjustmentQty: 10,
    reason: 'Physical Count Verification',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStockData();
    fetchValuation();
    fetchMetadata();
    fetchSalesmanRequests();
  }, [search, lowStockFilter, activeManufacturer]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    }
    if (activeTab === 'salesman-requests') {
      fetchSalesmanRequests();
    }
    if (activeTab === 'store-transfer') {
      fetchRecentTransfers();
    }
  }, [activeTab]);

  const fetchMetadata = async () => {
    try {
      const [storesRes, salesmenRes, prodRes] = await Promise.all([
        api.get('/stores'),
        api.get('/salesmen'),
        api.get('/products')
      ]);
      if (storesRes.data.success) setStores(storesRes.data.data);
      if (salesmenRes.data.success) setSalesmen(salesmenRes.data.data);
      if (prodRes.data.success) setAllProducts(prodRes.data.data);
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  };

  const fetchSalesmanRequests = async () => {
    try {
      const res = await api.get('/stock/salesman-requests');
      if (res.data.success) {
        setSalesmanRequests(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching salesman requests:', e);
    }
  };

  const fetchRecentTransfers = async () => {
    try {
      const res = await api.get('/invoices');
      if (res.data.success) {
        setRecentTransfers(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching invoices:', e);
    }
  };

  const fetchStockData = async () => {
    try {
      setLoading(true);
      let query = `?search=${search}`;
      if (lowStockFilter) query += `&lowStock=true`;
      if (activeManufacturer?._id) query += `&manufacturerId=${activeManufacturer._id}`;
      const res = await api.get(`/stock${query}`);
      if (res.data.success) {
        setStocks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchValuation = async () => {
    try {
      const res = await api.get('/stock/valuation');
      if (res.data.success) {
        setValuation(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await api.get('/stock/ledger');
      if (res.data.success) {
        setLedger(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/stock/adjust', adjustData);
      if (res.data.success) {
        setIsAdjustModalOpen(false);
        setAdjustData({
          productId: '',
          type: 'ADDITION',
          adjustmentQty: 10,
          reason: 'Physical Count Verification',
          notes: ''
        });
        fetchStockData();
        fetchValuation();
        if (activeTab === 'ledger') fetchLedger();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    } finally {
      setSubmitting(false);
    }
  };

  const openInwardModal = (stockItem = null) => {
    if (stockItem && stockItem.productId) {
      const prod = stockItem.productId;
      setInwardProductInfo(prod);
      setInwardData({
        productId: prod._id,
        quantity: 50,
        unitPrice: prod.purchasePrice || 0,
        date: new Date().toISOString().split('T')[0],
        billNumber: '',
        batchNumber: stockItem.batchNumber || '',
        updateProductPrice: true,
        warehouseLocation: stockItem.warehouseLocation || 'Main Warehouse - Bay 1',
        notes: ''
      });
    } else {
      const first = stocks[0]?.productId;
      setInwardProductInfo(first || null);
      setInwardData({
        productId: first?._id || '',
        quantity: 50,
        unitPrice: first?.purchasePrice || 0,
        date: new Date().toISOString().split('T')[0],
        billNumber: '',
        batchNumber: '',
        updateProductPrice: true,
        warehouseLocation: 'Main Warehouse - Bay 1',
        notes: ''
      });
    }
    setIsInwardModalOpen(true);
  };

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    if (!inwardData.productId) {
      alert('Please select a product');
      return;
    }
    if (Number(inwardData.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (Number(inwardData.unitPrice) < 0) {
      alert('Please enter a valid purchase price');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/stock/inward', inwardData);
      if (res.data.success) {
        setIsInwardModalOpen(false);
        fetchStockData();
        fetchValuation();
        if (activeTab === 'ledger') fetchLedger();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock');
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
            Warehouse & Inventory Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical current stock &bull; Reserved for dispatch &bull; Quarantine damaged goods &bull; Complete audit ledger
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setTransferInitialData(null);
              setIsTransferModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Dispatch stock directly to retail store and generate GST invoice bill"
          >
            <Truck className="w-4 h-4" /> + Transfer to Store & Bill
          </button>
          <button
            onClick={() => openInwardModal()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <PackagePlus className="w-4 h-4" /> + Direct Inward
          </button>
          <button
            onClick={() => {
              if (stocks.length > 0) setAdjustData(prev => ({ ...prev, productId: stocks[0].productId?._id }));
              setIsAdjustModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" /> Audit / Adjust
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" /> Live Warehouse Stock
        </button>

        <button
          onClick={() => setActiveTab('salesman-requests')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'salesman-requests'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-600" /> Salesperson Field Requests
          {salesmanRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {salesmanRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('store-transfer')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'store-transfer'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-600" /> Store Transfers & Bills
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Stock Movement Ledger
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'valuation'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" /> Valuation & Margin Analysis
        </button>
      </div>

      {/* TAB 1: LIVE INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search inventory by product, SKU, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                lowStockFilter
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Show Low Stock Only
            </button>
          </div>

          <Card>
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-3">Product Description</th>
                      <th className="py-3 px-3">Location / Bay</th>
                      <th className="py-3 px-3 text-right">Physical On-Hand</th>
                      <th className="py-3 px-3 text-right">Reserved (Pending)</th>
                      <th className="py-3 px-3 text-right">Damaged (Quarantine)</th>
                      <th className="py-3 px-3 text-right">Net Available to Sell</th>
                      <th className="py-3 px-3 text-center">Health Status</th>
                      <th className="py-3 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stocks.length > 0 ? (
                      stocks.map((stock) => {
                        const prod = stock.productId;
                        if (!prod) return null;
                        const available = Math.max(0, stock.currentStock - stock.reservedStock);
                        const isLow = available <= stock.minStockAlert && available > 0;
                        const isOut = available === 0;

                        return (
                          <tr key={stock._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{prod.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                SKU: {prod.sku} &bull; Batch: {stock.batchNumber}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-700">{stock.warehouseLocation}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {stock.currentStock} {prod.unit}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-500 font-medium">
                              {stock.reservedStock > 0 ? (
                                <span className="text-amber-700 font-bold">{stock.reservedStock} {prod.unit}</span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {stock.damagedStock > 0 ? (
                                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                  {stock.damagedStock} {prod.unit}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`text-sm font-extrabold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-teal-700'}`}>
                                {available} {prod.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isOut ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Low Stock (Min: {stock.minStockAlert})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Healthy
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => openInwardModal(stock)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                                title="Directly update stock with price, date, and quantity"
                              >
                                <ArrowDownToLine className="w-3 h-3 text-teal-600" /> + Inward
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">
                          No stock inventory found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: SALESPERSON FIELD REQUESTS & MANUAL TRANSFER */}
      {activeTab === 'salesman-requests' && (
        <div className="space-y-4">
          {/* Subheader & Stats */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Field Salesperson Store Booking Requests ({salesmanRequests.length} Pending)
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Check requested quantities against live warehouse stock availability. Verify physical inventory and execute manual stock transfer with automated GST invoice generation.
              </p>
            </div>

            <button
              onClick={fetchSalesmanRequests}
              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              Check Fresh Requests
            </button>
          </div>

          {/* Requests Cards List */}
          {salesmanRequests.length > 0 ? (
            <div className="space-y-4">
              {salesmanRequests.map((request) => {
                const store = request.storeId;
                const salesman = request.salesmanId;
                const allInStock = request.allItemsInStock;

                return (
                  <Card key={request._id} className="overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center font-mono font-bold text-teal-800 text-xs">
                          ORD
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm font-mono">{request.orderNumber}</span>
                            <StatusBadge status={request.status} />
                            {allInStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> 100% Stock In Warehouse
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Stock Shortage On Items
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Booked on: {new Date(request.orderDate || request.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Total Booking Value</div>
                        <div className="text-base font-extrabold text-teal-800 font-mono">
                          ₹ {Number(request.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Store & Salesman details row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-slate-100 bg-slate-50/50 -mx-4 sm:-mx-6 px-4 sm:px-6 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Destination Retail Store</span>
                        <div className="font-bold text-slate-900">{store?.name || 'Retail Client'}</div>
                        <div className="text-[11px] text-slate-600">
                          {store?.city} &bull; Owner: {store?.ownerName} ({store?.phone})
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Outstanding Due: <strong className="text-amber-700">₹{store?.outstandingBalance?.toLocaleString('en-IN') || 0}</strong> &bull; Credit Limit: ₹{store?.creditLimit?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Booked by Field Sales Executive</span>
                        <div className="font-bold text-slate-900">{salesman?.name || 'Field Officer'}</div>
                        <div className="text-[11px] text-slate-600">
                          Code: {salesman?.employeeCode} &bull; Territory: {salesman?.territory || 'Tamil Nadu'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Phone: {salesman?.phone}
                        </div>
                      </div>
                    </div>

                    {/* Items table with Live Stock Comparison */}
                    <div className="pt-3">
                      <div className="text-xs font-bold text-slate-800 mb-2">
                        Requested Items & Live Warehouse Availability:
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Product Name & SKU</th>
                              <th className="py-2 px-3 text-right">Requested Qty</th>
                              <th className="py-2 px-3 text-right">Physical Warehouse Stock</th>
                              <th className="py-2 px-3 text-center">Stock Check</th>
                              <th className="py-2 px-3 text-right">Unit Rate (₹)</th>
                              <th className="py-2 px-3 text-right">Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                            {request.items?.map((item, iIdx) => {
                              const hasEnough = item.hasEnoughStock;
                              const stockQty = item.currentStock;

                              return (
                                <tr key={iIdx} className={!hasEnough ? 'bg-rose-50/40' : ''}>
                                  <td className="py-2 px-3">
                                    <span className="font-semibold text-slate-900">{item.productName}</span>
                                    <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                                    {item.quantity} {item.freeQuantity ? `(+${item.freeQuantity} free)` : ''}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-medium">
                                    {stockQty} units
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {hasEnough ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        Stock OK ({stockQty} in bay)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                        Shortage: Need {item.quantity} (Have {stockQty})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono">
                                    ₹ {Number(item.unitPrice).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    ₹ {Number(item.total).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {request.deliveryNotes && (
                          <span>Notes: <em>"{request.deliveryNotes}"</em></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTransferInitialData(request);
                            setIsTransferModalOpen(true);
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                          Check & Transfer Stock (Generate Bill)
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <div className="font-semibold text-slate-700 text-sm">No Pending Salesperson Requests</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All requests booked by field sales executives have been reviewed and transferred to stores. New requests will appear here automatically when booked by field staff.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB: STORE TRANSFERS & DISPATCHES (INVOICES) */}
      {activeTab === 'store-transfer' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Store Stock Transfers & GST Invoices</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit history of stock dispatched to retail stores with generated GST Tax Invoices
              </p>
            </div>
            <button
              onClick={() => {
                setTransferInitialData(null);
                setIsTransferModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" /> + New Store Stock Transfer
            </button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Invoice / Challan</th>
                    <th className="py-3 px-3">Destination Store</th>
                    <th className="py-3 px-3">Dispatch Date</th>
                    <th className="py-3 px-3">Payment Terms</th>
                    <th className="py-3 px-3 text-right">Taxable Subtotal</th>
                    <th className="py-3 px-3 text-right">Total Bill (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Invoice Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentTransfers.length > 0 ? (
                    recentTransfers.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <div className="text-[10px] text-slate-400">{inv.deliveryChallanNo || 'Challan Created'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{inv.storeId?.name}</div>
                          <div className="text-[10px] text-slate-400">{inv.storeId?.city}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[10px] text-slate-700">
                            {inv.saleType || 'Credit'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600 font-mono">
                          ₹ {Number(inv.taxableSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-teal-800 font-mono text-sm">
                          ₹ {Number(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => window.open(`/api/invoices/${inv._id}/pdf`, '_blank')}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Download / Print PDF Tax Invoice Bill"
                            >
                              <Download className="w-3.5 h-3.5 text-teal-600" />
                              PDF Bill
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No store transfers recorded yet. Click "+ New Store Stock Transfer" above to initiate a dispatch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: STOCK LEDGER AUDIT TRAIL */}
      {activeTab === 'ledger' && (
        <Card title="Stock Ledger Audit History" subtitle="Immutable movement logs for inward, sales outward, returns and damage">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Product SKU</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Balance (Before &rarr; After)</th>
                  <th className="py-3 px-3">Notes / Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ledger.length > 0 ? (
                  ledger.map((entry) => {
                    const isPositive = entry.quantity > 0;
                    return (
                      <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {new Date(entry.date).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {entry.productId?.name || 'Item'}
                          <div className="text-[10px] text-slate-400 font-mono">{entry.productId?.sku}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                            {entry.transactionType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-teal-800">
                          {entry.referenceId || '-'}
                        </td>
                        <td className={`py-3 px-3 text-right font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${entry.quantity}` : entry.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                          {entry.balanceBefore} &rarr; <span className="font-bold text-slate-900">{entry.balanceAfter}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-slate-700">{entry.notes}</div>
                          <div className="text-[10px] text-slate-400">By: {entry.performedBy}</div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No stock movement ledger records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: INVENTORY VALUATION & MARGIN ANALYSIS */}
      {activeTab === 'valuation' && valuation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Purchase Cost Valuation</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                ₹ {Number(valuation.totalPurchaseValuation).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">Capital currently invested in physical stock</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Wholesale Selling Valuation</span>
              <div className="text-2xl font-bold text-teal-800 mt-2">
                ₹ {Number(valuation.totalSellingValuation).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">Expected revenue upon complete distribution</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Potential Gross Profit</span>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                ₹ {Number(valuation.potentialGrossProfit).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Estimated inventory profit margin (~{((valuation.potentialGrossProfit / valuation.totalSellingValuation) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card title="Damaged & Quarantine Exposure" subtitle="Products reported broken or unsellable">
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div>
                  <div className="text-rose-900 font-bold text-sm">Damaged Stock Units: {valuation.totalDamagedUnits} units</div>
                  <div className="text-rose-700 text-xs mt-0.5">Eligible for supplier replacement or debit credit note</div>
                </div>
                <div className="text-lg font-bold text-rose-800">
                  ₹ {Number(valuation.damagedValuation).toLocaleString('en-IN')}
                </div>
              </div>
            </Card>

            <Card title="Stock Health Metrics" subtitle="Active SKU availability summary">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Unique SKUs Tracked:</span>
                  <span className="font-bold text-slate-900">{valuation.totalSkus} SKUs</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Physical Units in Warehouse:</span>
                  <span className="font-bold text-slate-900">{valuation.totalPhysicalQuantity} Units</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-amber-700 font-semibold">SKUs Below Minimum Alert:</span>
                  <span className="font-bold text-amber-700">{valuation.lowStockCount} Products</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-rose-700 font-semibold">Completely Out-of-Stock SKUs:</span>
                  <span className="font-bold text-rose-700">{valuation.outOfStockCount} Products</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Warehouse Stock Audit / Manual Adjustment"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              required
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Select Product SKU</option>
              {stocks.map((s) => (
                <option key={s.productId?._id} value={s.productId?._id}>
                  {s.productId?.name} ({s.productId?.sku}) - Current: {s.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Action *</label>
              <select
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ADDITION">+ Stock Addition (Found / Surplus)</option>
                <option value="REDUCTION">- Stock Reduction (Damaged / Missing / Promo)</option>
                <option value="DAMAGE_TRANSFER">&rarr; Transfer to Damaged Quarantine</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustData.adjustmentQty}
                onChange={(e) => setAdjustData({ ...adjustData, adjustmentQty: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Reason</label>
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="Physical Count Verification">Physical Count Verification</option>
              <option value="Warehouse Handling Damage">Warehouse Handling Damage</option>
              <option value="Store Free Sample Sampling">Store Free Sample Sampling</option>
              <option value="Supplier Inward Correction">Supplier Inward Correction</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes & Approver Remarks</label>
            <textarea
              rows="2"
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              placeholder="e.g. Verified by Store Manager during quarterly inventory audit"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Applying Adjustment...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Direct Stock Inward Modal (Price, Date, Quantity) */}
      <Modal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        title="Direct Stock Inward Entry (No PO Required)"
      >
        <form onSubmit={handleInwardSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product SKU *</label>
            <select
              required
              value={inwardData.productId}
              onChange={(e) => {
                const prodId = e.target.value;
                const found = stocks.find(s => s.productId?._id === prodId)?.productId;
                setInwardProductInfo(found || null);
                setInwardData(prev => ({
                  ...prev,
                  productId: prodId,
                  unitPrice: found?.purchasePrice || prev.unitPrice || 0
                }));
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="">Select Product SKU...</option>
              {stocks.map((s) => (
                <option key={s.productId?._id} value={s.productId?._id}>
                  {s.productId?.name} ({s.productId?.sku}) &bull; Current Stock: {s.currentStock}
                </option>
              ))}
            </select>
          </div>

          {inwardProductInfo && (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-[11px] text-teal-800">
              <span>Brand: <strong>{inwardProductInfo.brand || inwardProductInfo.manufacturerId?.name || 'Tamil Ent'}</strong></span>
              <span>MRP: <strong>₹{inwardProductInfo.mrp}</strong> &bull; Selling: <strong>₹{inwardProductInfo.sellingPrice}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inward Date *
              </label>
              <input
                type="date"
                required
                value={inwardData.date}
                onChange={(e) => setInwardData({ ...inwardData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Received Qty *
              </label>
              <input
                type="number"
                min="1"
                required
                value={inwardData.quantity}
                onChange={(e) => setInwardData({ ...inwardData, quantity: Math.max(1, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
              <div className="flex gap-1 mt-1">
                {[10, 50, 100].map(add => (
                  <button
                    type="button"
                    key={add}
                    onClick={() => setInwardData(prev => ({ ...prev, quantity: (Number(prev.quantity) || 0) + add }))}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                  >
                    +{add}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Purchase Rate / Unit (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={inwardData.unitPrice}
                  onChange={(e) => setInwardData({ ...inwardData, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Valuation preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-slate-600 font-medium">Total Cost: ({inwardData.quantity} units &times; ₹{inwardData.unitPrice})</span>
            <span className="text-base font-bold text-teal-700">
              ₹ {(Math.round((Number(inwardData.quantity) || 0) * (Number(inwardData.unitPrice) || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bill / Invoice No.</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-99"
                value={inwardData.billNumber}
                onChange={(e) => setInwardData({ ...inwardData, billNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g. B-2026"
                value={inwardData.batchNumber}
                onChange={(e) => setInwardData({ ...inwardData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="updateMasterPrice"
              checked={inwardData.updateProductPrice}
              onChange={(e) => setInwardData({ ...inwardData, updateProductPrice: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="updateMasterPrice" className="text-slate-700 font-medium cursor-pointer">
              Update master product purchase price to ₹{inwardData.unitPrice}
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Direct inward from distributor truck"
              value={inwardData.notes}
              onChange={(e) => setInwardData({ ...inwardData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInwardModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating Stock...' : 'Confirm Direct Inward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Store Stock Transfer Modal */}
      <StoreTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferInitialData(null);
        }}
        initialData={transferInitialData}
        storesList={stores}
        salesmenList={salesmen}
        productsList={transferProductsList}
        onSuccess={(result) => {
          fetchStockData();
          fetchValuation();
          fetchSalesmanRequests();
          fetchRecentTransfers();
          setGeneratedInvoiceData(result);
          setIsInvoiceSuccessOpen(true);
        }}
      />

      {/* Invoice Success & Bill Download/Print Modal */}
      <InvoiceSuccessModal
        isOpen={isInvoiceSuccessOpen}
        onClose={() => setIsInvoiceSuccessOpen(false)}
        invoiceData={generatedInvoiceData}
      />

      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-semibold">{successToast}</div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
