import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Truck,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  CheckCircle2,
  IndianRupee,
  Store,
  UserCheck,
  Search,
  Download,
  Share2,
  Printer,
  Copy,
  Boxes,
  Eye,
  Calendar,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Package,
  Layers,
  Check,
  Filter
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useManufacturer } from '../context/ManufacturerContext';
import { sortProducts } from '../utils/productSorter';

const StoreTransfers = () => {
  const navigate = useNavigate();
  const { activeManufacturer } = useManufacturer();

  // Tab State: 'transfer' (New Transfer & Direct Billing) | 'history' (Transfers History & Generated Invoices)
  const [activeTab, setActiveTab] = useState('transfer');

  // Master Data
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Brand Filter for product selection in Transfer Form
  const [filterBrandOnly, setFilterBrandOnly] = useState(true);

  // Form State
  const [storeId, setStoreId] = useState('');
  const [salesmanId, setSalesmanId] = useState('');
  const [paymentType, setPaymentType] = useState('Credit');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', quantity: 10, unitPrice: 0, discountPercent: 0, freeQuantity: 0, gstRate: 18 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Post-Transfer Generated Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState(null);

  // View Invoice Detail Modal State (for history items)
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  // History Search & Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, salesmenRes, invoicesRes] = await Promise.all([
        api.get('/stores'),
        api.get('/products'),
        api.get('/salesmen'),
        api.get('/invoices')
      ]);

      if (storesRes.data.success) {
        setStores(storesRes.data.data);
        if (storesRes.data.data.length > 0 && !storeId) {
          const firstStore = storesRes.data.data[0];
          setStoreId(firstStore._id);
          if (firstStore.salesmanId) {
            setSalesmanId(firstStore.salesmanId._id || firstStore.salesmanId);
          }
        }
      }

      if (productsRes.data.success) {
        const sortedProds = sortProducts(productsRes.data.data || []);
        setProducts(sortedProds);
        // Default first item with first product
        const prods = sortedProds;
        if (prods.length > 0) {
          setItems([
            {
              productId: prods[0]._id,
              quantity: 10,
              unitPrice: prods[0].dealerPrice || prods[0].sellingPrice || 0,
              discountPercent: 0,
              freeQuantity: 0,
              gstRate: prods[0].gstRate || 18
            }
          ]);
        }
      }

      if (salesmenRes.data.success) {
        setSalesmen(salesmenRes.data.data);
      }

      if (invoicesRes.data.success) {
        setInvoices(invoicesRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching transfer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoicesAndStock = async () => {
    try {
      setHistoryLoading(true);
      const [invoicesRes, productsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/products')
      ]);
      if (invoicesRes.data.success) setInvoices(invoicesRes.data.data);
      if (productsRes.data.success) setProducts(sortProducts(productsRes.data.data || []));
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Selected Store Object
  const selectedStore = useMemo(() => {
    return stores.find(s => s._id === storeId);
  }, [stores, storeId]);

  // Handle Store Selection
  const handleStoreChange = (sId) => {
    setStoreId(sId);
    const store = stores.find(s => s._id === sId);
    if (store && store.salesmanId) {
      setSalesmanId(store.salesmanId._id || store.salesmanId);
    }

    // Refresh item unit prices if custom store pricing exists
    setItems(prevItems =>
      prevItems.map(item => {
        const prod = products.find(p => p._id === item.productId);
        if (!prod) return item;
        const custom = prod.customStorePrices?.find(c => c.storeId?.toString() === sId);
        return {
          ...item,
          unitPrice: custom?.specialPrice || prod.dealerPrice || prod.sellingPrice || item.unitPrice
        };
      })
    );
  };

  // Filtered Products for transfer item selection
  const selectableProducts = useMemo(() => {
    let prods = products;
    if (filterBrandOnly && activeManufacturer) {
      const brandFiltered = products.filter(
        p =>
          p.manufacturerId?._id?.toString() === activeManufacturer._id?.toString() ||
          p.manufacturerId?.toString() === activeManufacturer._id?.toString() ||
          p.brand?.toLowerCase() === activeManufacturer.code?.toLowerCase() ||
          p.brand?.toLowerCase() === activeManufacturer.name?.toLowerCase()
      );
      prods = brandFiltered.length > 0 ? brandFiltered : products;
    }
    return sortProducts(prods);
  }, [products, filterBrandOnly, activeManufacturer]);

  // Product Selection on row
  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p._id === prodId);
    const updated = [...items];
    const custom = prod?.customStorePrices?.find(c => c.storeId?.toString() === storeId);
    const unitPrice = custom?.specialPrice || prod?.sellingPrice || prod?.dealerPrice || prod?.mrp || prod?.purchasePrice || 0;

    updated[index] = {
      ...updated[index],
      productId: prodId,
      unitPrice,
      gstRate: prod?.gstRate || 18
    };
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addLineItem = () => {
    const defaultProd = selectableProducts[0] || products[0];
    const custom = defaultProd?.customStorePrices?.find(c => c.storeId?.toString() === storeId);
    const unitPrice = custom?.specialPrice || defaultProd?.sellingPrice || defaultProd?.dealerPrice || defaultProd?.mrp || defaultProd?.purchasePrice || 0;

    setItems([
      ...items,
      {
        productId: defaultProd?._id || '',
        quantity: 10,
        unitPrice,
        discountPercent: 0,
        freeQuantity: 0,
        gstRate: defaultProd?.gstRate || 18
      }
    ]);
  };

  const removeLineItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations for current transfer
  const isInterstate = selectedStore?.state && selectedStore.state.toLowerCase() !== 'tamil nadu';

  const transferTotals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let totalUnits = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const freeQty = Number(item.freeQuantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discPct = Number(item.discountPercent) || 0;
      const gstRate = Number(item.gstRate) || 18;

      const gross = qty * price;
      const discount = (gross * discPct) / 100;
      const taxable = gross - discount;
      const tax = (taxable * gstRate) / 100;

      subtotal += taxable;
      discountTotal += discount;
      taxTotal += tax;
      totalUnits += qty + freeQty;
    });

    const grandTotal = subtotal + taxTotal;
    const cgst = isInterstate ? 0 : taxTotal / 2;
    const sgst = isInterstate ? 0 : taxTotal / 2;
    const igst = isInterstate ? taxTotal : 0;

    return {
      subtotal,
      discountTotal,
      taxTotal,
      cgst,
      sgst,
      igst,
      grandTotal,
      totalUnits
    };
  }, [items, isInterstate]);

  // Validation
  const validateTransfer = () => {
    if (!storeId) return 'Please select a destination store.';
    if (!items || items.length === 0) return 'Please add at least one product item to transfer.';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId) return `Item row #${i + 1} has no product selected.`;
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) return `Item row #${i + 1} requires a valid transfer quantity (> 0).`;

      const prod = products.find(p => p._id === item.productId);
      const availStock = prod?.stock?.currentStock ?? 0;
      if (qty > availStock) {
        return `Requested transfer of ${qty} units for "${prod?.name || 'Product'}" exceeds physical warehouse stock (${availStock} units currently available).`;
      }
    }
    return null;
  };

  // Submit Stock Transfer & Generate Invoice
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errorMsg = validateTransfer();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId,
        salesmanId: salesmanId || null,
        items,
        paymentType,
        vehicleNumber,
        driverName,
        notes: deliveryNotes
      };

      const res = await api.post('/stock/transfer-to-store', payload);
      if (res.data.success) {
        const data = res.data.data;
        setGeneratedInvoiceData(data);
        setIsInvoiceModalOpen(true);
        setSuccessToast(`Stock transferred successfully! Invoice ${data.invoiceNumber} generated.`);
        setTimeout(() => setSuccessToast(''), 6000);

        // Reset form items
        if (products.length > 0) {
          const firstProd = selectableProducts[0] || products[0];
          setItems([
            {
              productId: firstProd._id,
              quantity: 10,
              unitPrice: firstProd.dealerPrice || firstProd.sellingPrice || 0,
              discountPercent: 0,
              freeQuantity: 0,
              gstRate: firstProd.gstRate || 18
            }
          ]);
        }
        setVehicleNumber('');
        setDriverName('');
        setDeliveryNotes('');

        // Refresh stock levels & invoices list in background
        refreshInvoicesAndStock();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error processing stock transfer to store');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Download Official PDF
  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tax-Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    }
  };

  // Action: Send to Store on WhatsApp
  const handleShareWhatsApp = (invoiceData) => {
    const inv = invoiceData.invoice || invoiceData;
    const store = inv.storeId || selectedStore;
    const invNum = inv.invoiceNumber || invoiceData.invoiceNumber;
    const total = inv.grandTotal || invoiceData.grandTotal || 0;
    const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'As per credit terms';
    const challan = inv.deliveryChallanNo || `DC-${invNum}`;

    let itemLines = '';
    if (inv.items && inv.items.length > 0) {
      itemLines = inv.items
        .map(i => `• ${i.name || i.productName} - ${i.quantity} units @ ₹${i.unitPrice}`)
        .join('\n');
    }

    const text = encodeURIComponent(
      `வணக்கம் / Hello ${store?.name || 'Customer'},\n\n` +
      `🏢 *TAMIZH ENTERPRISES - DISPATCH & GST TAX INVOICE*\n` +
      `Goods have been transferred & dispatched from our central warehouse to your store.\n\n` +
      `📋 *Invoice Details:*\n` +
      `• Invoice No: *${invNum}*\n` +
      `• Delivery Challan: *${challan}*\n` +
      `• Due Date: *${dueDate}*\n` +
      `• Payment Terms: *${inv.saleType || paymentType}*\n\n` +
      `📦 *Dispatched Items:*\n` +
      `${itemLines || 'Stock transfer items'}\n\n` +
      `💰 *Grand Total: ₹ ${Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n` +
      `🏦 *Payment Options:*\n` +
      `• UPI ID: tamizhenterprises@hdfcbank\n` +
      `• Bank: HDFC Bank, Madurai Main Branch\n` +
      `• A/C: 50200012345678 | IFSC: HDFC0000123\n\n` +
      `Thank you for your business!\n` +
      `Tamizh Enterprises Distribution Central Depot\n` +
      `Helpline: +91 94432 10987`
    );

    const phone = store?.phone ? store.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  // Action: Copy Invoice Summary Text to Clipboard
  const handleCopyInvoiceSummary = (invoiceData) => {
    const inv = invoiceData.invoice || invoiceData;
    const store = inv.storeId || selectedStore;
    const invNum = inv.invoiceNumber || invoiceData.invoiceNumber;
    const total = inv.grandTotal || invoiceData.grandTotal || 0;

    const summary =
      `TAMIZH ENTERPRISES - INVOICE ${invNum}\n` +
      `Shop: ${store?.name || ''} (${store?.city || ''})\n` +
      `Amount: ₹ ${Number(total).toLocaleString('en-IN')}\n` +
      `Challan: ${inv.deliveryChallanNo || ''}\n` +
      `Payment UPI: tamizhenterprises@hdfcbank`;

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Action: Print Invoice
  const handlePrint = () => {
    window.print();
  };

  // Filtered History Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        !historySearch ||
        inv.invoiceNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.storeId?.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.storeId?.city?.toLowerCase().includes(historySearch.toLowerCase()) ||
        inv.deliveryChallanNo?.toLowerCase().includes(historySearch.toLowerCase());

      const matchStatus =
        historyStatusFilter === 'All' || inv.status === historyStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [invoices, historySearch, historyStatusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalTransfers = invoices.length;
    const totalBilledValue = invoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
    const totalUnits = invoices.reduce((sum, i) => {
      const itemUnits = (i.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      return sum + itemUnits;
    }, 0);
    const pendingBalance = invoices.reduce((sum, i) => sum + (Number(i.balanceAmount) || 0), 0);

    return {
      totalTransfers,
      totalBilledValue,
      totalUnits,
      pendingBalance
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-teal-500/20 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Direct B2B Distribution & Billing
              </span>
              {activeManufacturer && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Brand: {activeManufacturer.name}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <ArrowRightLeft className="w-6 h-6 text-teal-400" />
              Stock Transfers to Shops & GST Invoicing
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dispatch physical warehouse goods to retail supermarkets, grocery shops & dealer outlets. Automatically deducts inventory, records outward ledger, and generates official GST Tax Invoices to send directly to shops.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'transfer'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Stock Transfer
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Transfers & Invoices ({invoices.length})
            </button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Dispatches</div>
            <div className="text-lg font-extrabold text-slate-900">{stats.totalTransfers} Invoices</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Units Transferred</div>
            <div className="text-lg font-extrabold text-slate-900">{stats.totalUnits.toLocaleString('en-IN')} units</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Billed Value</div>
            <div className="text-lg font-extrabold text-slate-900">
              ₹ {stats.totalBilledValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Receivables Due</div>
            <div className="text-lg font-extrabold text-amber-700">
              ₹ {stats.pendingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: NEW STOCK TRANSFER FORM ================= */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleTransferSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Validation Warning</span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Store Selection & Line Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Destination Store & Route */}
              <Card>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Destination Shop & Route</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Step 1 of 2</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Select Retail Shop / Supermarket <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate('/stores?action=new')}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add New Shop
                      </button>
                    </div>
                    <select
                      value={storeId}
                      onChange={(e) => handleStoreChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Destination Shop --</option>
                      {stores.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code}) &bull; {s.city} {s.gstNumber ? `&bull; GST: ${s.gstNumber}` : ''}
                        </option>
                      ))}
                    </select>
                    {stores.length === 0 && !loading && (
                      <div className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
                        <span>No retail shops found. Please register a shop first.</span>
                        <button
                          type="button"
                          onClick={() => navigate('/stores?action=new')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          + Add Shop
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Shop Detail Quick Preview Card */}
                  {selectedStore && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shop Contact</span>
                        <div className="font-bold text-slate-800">{selectedStore.name}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {selectedStore.phone || 'No phone'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location & GSTIN</span>
                        <div className="text-slate-700 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {selectedStore.city}, {selectedStore.state || 'Tamil Nadu'}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                          {selectedStore.gstNumber ? `GST: ${selectedStore.gstNumber}` : 'URP (Unregistered)'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Credit & Outstanding</span>
                        <div className="font-bold text-slate-800">
                          {selectedStore.creditPeriodDays || 21} Days Credit
                        </div>
                        <div className="text-[11px] mt-0.5">
                          Balance: <span className="font-bold text-amber-700">₹ {Number(selectedStore.outstandingBalance || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Terms */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing & Payment Terms <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="Credit">Credit (Standard Shop Account)</option>
                      <option value="Cash">Cash on Delivery (Immediate)</option>
                      <option value="UPI">UPI / Digital QR Code</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Step 2: Line Items to Transfer */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Products & Warehouse Stock Deduction</h3>
                  </div>

                  {activeManufacturer && (
                    <button
                      type="button"
                      onClick={() => setFilterBrandOnly(!filterBrandOnly)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                        filterBrandOnly
                          ? 'bg-teal-50 border-teal-300 text-teal-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {filterBrandOnly ? `Scoped to ${activeManufacturer.code}` : 'Show All Brands'}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const prod = products.find(p => p._id === item.productId);
                    const availStock = prod?.stock?.currentStock ?? 0;
                    const isOverStock = Number(item.quantity) > availStock;
                    const itemGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    const itemDiscount = (itemGross * (Number(item.discountPercent) || 0)) / 100;
                    const itemTaxable = itemGross - itemDiscount;
                    const itemTax = (itemTaxable * (Number(item.gstRate) || 18)) / 100;
                    const itemTotal = itemTaxable + itemTax;

                    return (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isOverStock
                            ? 'bg-rose-50/50 border-rose-300'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                          {/* Product Select */}
                          <div className="md:col-span-5">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Product / SKU ({index + 1})
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              required
                            >
                              <option value="">-- Choose Product --</option>
                              {selectableProducts.map((p) => {
                                const stockVal = p.stock?.currentStock ?? 0;
                                return (
                                  <option key={p._id} value={p._id}>
                                    {p.name} [{p.sku}] - Avail: {stockVal} units (₹{p.dealerPrice || p.sellingPrice})
                                  </option>
                                );
                              })}
                            </select>

                            {/* Stock Indicator Badge */}
                            {prod && (
                              <div className="mt-1 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">
                                  HSN: <strong className="font-mono text-slate-700">{prod.hsnCode || '2106'}</strong> &bull; Brand: {prod.brand || 'Tamil'}
                                </span>
                                <span
                                  className={`font-semibold px-1.5 py-0.2 rounded ${
                                    availStock <= 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : availStock <= 20
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  Warehouse: {availStock} in stock
                                </span>
                              </div>
                            )}

                            {isOverStock && (
                              <div className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Requested transfer ({item.quantity}) exceeds warehouse stock ({availStock} units)!
                              </div>
                            )}
                          </div>

                          {/* Transfer Quantity */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Transfer Qty <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-teal-500 focus:outline-none ${
                                isOverStock ? 'border-rose-400 text-rose-700' : 'border-slate-200'
                              }`}
                              required
                            />
                            <div className="text-[10px] text-slate-400 text-right mt-0.5">
                              Free/Bonus:
                              <input
                                type="number"
                                min="0"
                                value={item.freeQuantity}
                                onChange={(e) => handleItemChange(index, 'freeQuantity', e.target.value)}
                                className="w-10 ml-1 px-1 py-0.5 border border-slate-200 rounded text-[10px] text-center"
                                title="Free Scheme Units"
                              />
                            </div>
                          </div>

                          {/* Unit Price */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Rate / Unit (₹)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-right focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              required
                            />
                            <div className="text-[10px] text-slate-400 text-right mt-0.5">
                              Disc:
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) => handleItemChange(index, 'discountPercent', e.target.value)}
                                className="w-10 ml-1 px-1 py-0.5 border border-slate-200 rounded text-[10px] text-center"
                                title="Discount %"
                              />
                              %
                            </div>
                          </div>

                          {/* Line Total & GST */}
                          <div className="md:col-span-2 text-right">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Line Total (₹)
                            </label>
                            <div className="font-extrabold text-slate-900 text-xs py-1.5">
                              ₹ {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              GST {item.gstRate}%: ₹{itemTax.toFixed(1)}
                            </div>
                          </div>

                          {/* Delete Line */}
                          <div className="md:col-span-1 flex justify-end md:justify-center pt-6">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              disabled={items.length === 1}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addLineItem}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all bg-slate-50/50 hover:bg-teal-50/50"
                  >
                    <Plus className="w-4 h-4" /> Add Another Product Line
                  </button>
                </div>
              </Card>
            </div>

            {/* Right Col: Logistics, Live Invoice Summary & Dispatch Button */}
            <div className="space-y-6">
              {/* Transport Logistics */}
              <Card>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Transport & Delivery Challan
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Delivery Vehicle Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN-58-BZ-4521 (Van #1)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs uppercase font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Driver / Delivery In-Charge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. M. Murugan (98401 23456)"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dispatch Notes / Instructions
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Urgent morning delivery before 11 AM; unload at rear store dock"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </Card>

              {/* Live Invoice Breakdown Card */}
              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-5 rounded-2xl border border-teal-500/30 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                      Live GST Invoice Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded border border-teal-500/40">
                    B2B Tax Bill
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Dispatched Units:</span>
                    <strong className="text-white font-mono">{transferTotals.totalUnits} units</strong>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Taxable Subtotal:</span>
                    <strong className="text-white font-mono">
                      ₹ {transferTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {transferTotals.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Total Scheme Discount:</span>
                      <strong className="font-mono">
                        - ₹ {transferTotals.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  )}

                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>CGST (9%):</span>
                        <span className="font-mono">
                          ₹ {transferTotals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>SGST (9%):</span>
                        <span className="font-mono">
                          ₹ {transferTotals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>IGST (18% Interstate):</span>
                      <span className="font-mono">
                        ₹ {transferTotals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      Grand Total:
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono">
                      ₹ {transferTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1">
                    Payment: <strong className="text-slate-200">{paymentType}</strong> &bull; Due in {selectedStore?.creditPeriodDays || 21} days
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Deducting Stock & Billing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Dispatch Stock & Generate GST Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: TRANSFERS & GENERATED INVOICES HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search store, invoice #, challan #..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400">Payment Status:</span>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="All">All Invoices</option>
                <option value="Unpaid">Unpaid (Credit)</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>

              <button
                onClick={refreshInvoicesAndStock}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs"
                title="Refresh Registry"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transfers / Invoices Table */}
          <Card>
            {loading || historyLoading ? (
              <TableSkeleton rows={6} cols={8} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-3">Invoice & DC Challan</th>
                      <th className="py-3 px-3">Destination Shop</th>
                      <th className="py-3 px-3">Dispatch Date</th>
                      <th className="py-3 px-3 text-right">Qty (Units)</th>
                      <th className="py-3 px-3 text-right">Taxable Subtotal</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Send to Shop / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((inv) => {
                        const totalUnits = (inv.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Invoice & Challan */}
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                              <div className="text-[10px] text-teal-600 font-mono">
                                {inv.deliveryChallanNo || `DC-${inv.invoiceNumber}`}
                              </div>
                            </td>

                            {/* Store details */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{inv.storeId?.name || 'Retail Client'}</div>
                              <div className="text-[10px] text-slate-400">
                                {inv.storeId?.city} &bull; {inv.storeId?.phone || 'No phone'}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3 text-slate-600">
                              <div>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</div>
                              <div className="text-[10px] text-slate-400">
                                Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}
                              </div>
                            </td>

                            {/* Total Units */}
                            <td className="py-3 px-3 text-right font-bold text-slate-800">
                              {totalUnits} units
                              <div className="text-[10px] text-slate-400 font-normal">
                                {inv.items?.length || 0} SKUs
                              </div>
                            </td>

                            {/* Taxable */}
                            <td className="py-3 px-3 text-right font-medium text-slate-600">
                              ₹ {Number(inv.taxableSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>

                            {/* Grand Total */}
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              ₹ {Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              <StatusBadge status={inv.status} />
                            </td>

                            {/* Action Buttons to Send to Store */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedInvoiceForView(inv)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="View GST Tax Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                                  className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Download PDF Invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleShareWhatsApp(inv)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Send Invoice to Store (WhatsApp)"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">
                          No stock transfers found matching filters.
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

      {/* ================= MODAL: INVOICE GENERATED & SEND TO STORE ================= */}
      {isInvoiceModalOpen && generatedInvoiceData && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title="Stock Transfer Dispatched & GST Invoice Generated"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  Stock Transfer Dispatched to Shop!
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-bold uppercase">
                    Billed
                  </span>
                </h4>
                <p className="text-emerald-800 text-xs mt-0.5 leading-relaxed">
                  Warehouse physical stock has been deducted and outward sales ledger entry recorded. Official GST Tax Invoice is ready to be sent to the shop.
                </p>
              </div>
            </div>

            {/* Invoice & Dispatch Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Generated Tax Invoice</span>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {generatedInvoiceData.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-teal-700 font-mono">
                    Challan: {generatedInvoiceData.invoice?.deliveryChallanNo || `DC-${generatedInvoiceData.invoiceNumber}`}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total Payable</span>
                  <div className="text-xl font-extrabold text-teal-700 font-mono">
                    ₹ {Number(generatedInvoiceData.grandTotal || generatedInvoiceData.invoice?.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Status: <strong className="text-emerald-700">{generatedInvoiceData.invoice?.status || 'Unpaid'}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Customer / Destination Shop:</span>
                  <strong className="text-slate-800 text-xs">
                    {generatedInvoiceData.invoice?.storeId?.name || selectedStore?.name || 'Retail Client'}
                  </strong>
                  <div className="text-slate-500">
                    {generatedInvoiceData.invoice?.storeId?.city || selectedStore?.city} &bull; {generatedInvoiceData.invoice?.storeId?.phone || selectedStore?.phone}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Transport Details:</span>
                  <div className="font-semibold text-slate-800">
                    {vehicleNumber ? `Vehicle: ${vehicleNumber}` : 'Dispatch Van'}
                  </div>
                  <div className="text-slate-500">
                    Driver: {driverName || 'Depot Driver'}
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              {generatedInvoiceData.invoice?.items && generatedInvoiceData.invoice.items.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    Transferred Goods ({generatedInvoiceData.invoice.items.length} SKUs):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {generatedInvoiceData.invoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-100"
                      >
                        <span className="font-medium text-slate-800 truncate mr-2">{item.name}</span>
                        <span className="font-bold text-teal-700 font-mono whitespace-nowrap">
                          {item.quantity} units @ ₹{item.unitPrice} = ₹{item.total?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Send to Store Actions */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-teal-600" />
                <span>Send Invoice & Payment Notification to Shop:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. WhatsApp Action */}
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(generatedInvoiceData)}
                  className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                >
                  <Share2 className="w-4 h-4" />
                  Send to Shop on WhatsApp
                </button>

                {/* 2. Download Official PDF */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadPDF(
                      generatedInvoiceData.invoice?._id,
                      generatedInvoiceData.invoiceNumber
                    )
                  }
                  className="w-full py-3 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  Download Official PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyInvoiceSummary(generatedInvoiceData)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedToast ? 'Summary Copied!' : 'Copy Bill Summary'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setSelectedInvoiceForView(generatedInvoiceData.invoice);
                  }}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Tax Invoice View
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="w-full py-2 text-center text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors pt-1"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: FULL TAX INVOICE DETAILS ================= */}
      {selectedInvoiceForView && (
        <Modal
          isOpen={!!selectedInvoiceForView}
          onClose={() => setSelectedInvoiceForView(null)}
          title={`Tax Invoice & Delivery Challan: ${selectedInvoiceForView.invoiceNumber}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs bg-white p-2">
            {/* Header / Bill Details */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="text-base font-bold text-teal-800">TAMIZH ENTERPRISES</div>
                <div className="text-[11px] text-slate-500">124, Goods Shed Road, Madurai - 625001, Tamil Nadu</div>
                <div className="text-[11px] text-slate-600 font-mono">GSTIN: 33AABCT9988C1Z4</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">TAX INVOICE</div>
                <div className="font-mono text-xs font-semibold text-teal-700">{selectedInvoiceForView.invoiceNumber}</div>
                <div className="text-slate-500">
                  Date: {new Date(selectedInvoiceForView.invoiceDate).toLocaleDateString('en-IN')}
                </div>
                <div className="text-slate-500 text-[10px] font-mono">
                  Challan: {selectedInvoiceForView.deliveryChallanNo || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Customer / Billed To:</span>
                <div className="font-semibold text-slate-900">{selectedInvoiceForView.storeId?.name || 'Retail Client'}</div>
                <div className="text-slate-500">{selectedInvoiceForView.storeId?.city}, Tamil Nadu</div>
                <div className="text-slate-500 font-mono">
                  GSTIN: {selectedInvoiceForView.storeId?.gstNumber || 'URP (Unregistered)'}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block mb-1">Dispatch & Payment:</span>
                <div>Sale Terms: <span className="font-semibold">{selectedInvoiceForView.saleType || 'Credit'}</span></div>
                <div>Status: <span className="font-semibold">{selectedInvoiceForView.status}</span></div>
                <div>Due Date: <span className="font-mono">{selectedInvoiceForView.dueDate ? new Date(selectedInvoiceForView.dueDate).toLocaleDateString('en-IN') : '-'}</span></div>
              </div>
            </div>

            {/* Line Items with GST Breakdown */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2">HSN</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate (₹)</th>
                    <th className="p-2 text-right">Taxable (₹)</th>
                    <th className="p-2 text-center">GST</th>
                    <th className="p-2 text-right">Tax (₹)</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedInvoiceForView.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 font-mono text-[10px]">{item.hsnCode}</td>
                      <td className="p-2 text-right font-bold">
                        {item.quantity} {item.freeQuantity ? `(+${item.freeQuantity})` : ''}
                      </td>
                      <td className="p-2 text-right font-mono">₹{item.unitPrice}</td>
                      <td className="p-2 text-right font-mono">₹{Number(item.taxableValue).toFixed(2)}</td>
                      <td className="p-2 text-center">{item.gstRate}%</td>
                      <td className="p-2 text-right font-mono">₹{(item.taxAmount || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">
                CGST: ₹{Number(selectedInvoiceForView.cgstTotal || 0).toFixed(2)} &bull; SGST: ₹{Number(selectedInvoiceForView.sgstTotal || 0).toFixed(2)}
              </div>
              <div className="text-right space-y-0.5">
                <div>Taxable Value: <span className="font-bold">₹ {Number(selectedInvoiceForView.taxableSubtotal).toFixed(2)}</span></div>
                <div>GST Tax: <span className="font-bold">₹ {Number(selectedInvoiceForView.taxTotal).toFixed(2)}</span></div>
                <div className="text-base font-extrabold text-teal-800">
                  Grand Total: ₹ {Number(selectedInvoiceForView.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(selectedInvoiceForView)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp to Store
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedInvoiceForView._id, selectedInvoiceForView.invoiceNumber)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StoreTransfers;
