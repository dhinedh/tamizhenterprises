import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Plus,
  ChevronsUpDown,
  Search,
  Download,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Store as StoreIcon,
  RotateCcw,
  Trash2,
  List,
  ShoppingCart,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import api from '../api/client';
import Modal from '../components/common/Modal';
import { sortProducts } from '../utils/productSorter';

// --- Custom Detailed Icons to match screenshot exactly ---

// 1. Detailed Desktop Printer Icon
const PrinterIcon = () => (
  <svg
    className="w-7 h-7 text-slate-600 hover:text-slate-900 transition-transform hover:scale-105 inline-block"
    viewBox="0 0 32 32"
    fill="none"
  >
    {/* Paper entering top */}
    <path
      d="M9 12V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8"
      fill="#FFFFFF"
      stroke="#64748B"
      strokeWidth="1.5"
    />
    <path d="M12 7h8M12 9.5h5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    {/* Metallic Grey Printer Body */}
    <rect
      x="5"
      y="11"
      width="22"
      height="12"
      rx="3"
      fill="#94A3B8"
      stroke="#475569"
      strokeWidth="1.5"
    />
    {/* Dark Front Feed Slot */}
    <rect x="8" y="16" width="16" height="7" rx="1" fill="#334155" />
    {/* Paper output tray sheet */}
    <rect
      x="9"
      y="18"
      width="14"
      height="8"
      rx="1"
      fill="#FFFFFF"
      stroke="#64748B"
      strokeWidth="1.2"
    />
    <path d="M11 21h10M11 23.5h7" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
    {/* Power LED Indicator */}
    <circle cx="23" cy="14" r="1" fill="#22C55E" />
  </svg>
);

// 2. Green Spiral Notepad with Pencil Icon
const GreenNotepadIcon = () => (
  <svg
    className="w-6 h-6 text-emerald-600 hover:text-emerald-700 transition-transform hover:scale-105 inline-block"
    viewBox="0 0 32 32"
    fill="none"
  >
    {/* Top Spiral Rings */}
    <path d="M8 3v4M12 3v4M16 3v4M20 3v4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
    {/* Notepad Outline */}
    <rect
      x="5"
      y="5"
      width="17"
      height="23"
      rx="2"
      fill="#FFFFFF"
      stroke="#16A34A"
      strokeWidth="2"
    />
    {/* Ruled lines on paper */}
    <path
      d="M9 11h9M9 15h9M9 19h5"
      stroke="#86EFAC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="1 1"
    />
    {/* Diagonal Green Pencil */}
    <path
      d="M26 11l-9 9-2 4 4-2 9-9a2 2 0 0 0-2-2z"
      fill="#22C55E"
      stroke="#15803D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Pencil tip */}
    <path d="M15 24l1.5-1.5" stroke="#15803D" strokeWidth="1.5" />
  </svg>
);

// 3. Vibrant WhatsApp Share Icon
const WhatsAppShareIcon = () => (
  <svg
    className="w-6 h-6 text-emerald-600 hover:text-emerald-700 transition-transform hover:scale-110 inline-block drop-shadow-2xs"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.767.464 3.488 1.344 5.01L2 22l5.127-1.319a9.99 9.99 0 0 0 4.904 1.348h.005c5.533 0 10.029-4.494 10.029-10.029A10.022 10.022 0 0 0 12.031 2zm0 18.358h-.004a8.31 8.31 0 0 1-4.237-1.164l-.304-.18-3.148.81.84-3.037-.197-.318a8.32 8.32 0 0 1-1.282-4.44c0-4.6 3.743-8.343 8.332-8.343a8.29 8.29 0 0 1 5.894 2.443 8.29 8.29 0 0 1 2.438 5.898c0 4.602-3.742 8.331-8.339 8.331zm4.567-6.242c-.25-.125-1.48-.73-1.709-.813-.229-.083-.396-.125-.562.125-.167.25-.646.813-.792.979-.146.167-.292.188-.542.063-.25-.125-1.056-.389-2.011-1.24-.743-.663-1.245-1.482-1.391-1.732-.146-.25-.015-.385.11-.51.112-.112.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438-.063-.125-.562-1.354-.771-1.854-.204-.488-.41-.422-.562-.43-.146-.008-.313-.01-.479-.01-.167 0-.438.063-.667.313-.229.25-.875.854-.875 2.083s.896 2.417 1.021 2.583c.125.167 1.762 2.692 4.271 3.774.597.258 1.063.412 1.426.527.6.19 1.146.163 1.577.099.48-.072 1.48-.604 1.688-1.188.208-.583.208-1.083.146-1.188-.063-.104-.229-.167-.479-.292z" />
  </svg>
);

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || 'shop'; // 'customer' | 'shop'
  const isCustomerType = typeParam === 'customer';

  // Mode: if query string has ?action=new, show Add Invoice form
  const isCreateMode = location.search.includes('action=new');

  const [invoices, setInvoices] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [printingId, setPrintingId] = useState(null);

  // Pagination & Sorting state for Manage Invoice table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('invoiceDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state for table actions
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [updatingShop, setUpdatingShop] = useState(null);
  const [shopPhoneInput, setShopPhoneInput] = useState('');
  const [shopSaving, setShopSaving] = useState(false);
  const [historyInvoice, setHistoryInvoice] = useState(null);
  const [voidInvoiceTarget, setVoidInvoiceTarget] = useState(null);
  const [voiding, setVoiding] = useState(false);
  const [returnInvoiceTarget, setReturnInvoiceTarget] = useState(null);
  const [removeInvoiceTarget, setRemoveInvoiceTarget] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // ================= Share Invoice State =================
  const [shareInvoiceTarget, setShareInvoiceTarget] = useState(null);
  const [sharePhone, setSharePhone] = useState('');
  const [shareRecipientName, setShareRecipientName] = useState('');
  const [copiedShareText, setCopiedShareText] = useState(false);

  // ================= Edit Invoice State =================
  const [editInvoiceForm, setEditInvoiceForm] = useState(null);
  const [isSavingEditInvoice, setIsSavingEditInvoice] = useState(false);
  const [editInvoiceError, setEditInvoiceError] = useState('');
  const [addEditProductId, setAddEditProductId] = useState('');

  // ================= Add Invoice Form State =================
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('905');
  const [billingType, setBillingType] = useState(isCustomerType ? 'customer' : 'store'); // 'customer' | 'store'
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [invoicePaymentType, setInvoicePaymentType] = useState('Credit');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  useEffect(() => {
    setBillingType(isCustomerType ? 'customer' : 'store');
  }, [isCustomerType]);

  // Added Products List for the new invoice
  const [addedItems, setAddedItems] = useState([]);

  // Quick Add Customer / Shop Modal State
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    ownerName: '',
    city: 'Chennai',
    address: '',
    gstNumber: '',
    email: ''
  });
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState('');

  // "ADD PRODUCT" Box Input Fields
  const [currentProductId, setCurrentProductId] = useState('');
  const [itemMrp, setItemMrp] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemShopPercent, setItemShopPercent] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemTotal, setItemTotal] = useState('');
  const [itemDiscPercent, setItemDiscPercent] = useState('');
  const [itemDiscRs, setItemDiscRs] = useState('');

  // Helper for today's formatted date: DD-MM-YYYY (e.g. 05-10-2026)
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes, storesRes, prodsRes] = await Promise.all([
        api.get('/invoices', { params: { fresh: 'true' } }),
        api.get('/customers'),
        api.get('/stores'),
        api.get('/products')
      ]);

      if (invRes.data.success) {
        setInvoices(invRes.data.data || []);
        // Next invoice number default (sequential or count + 1)
        const count = invRes.data.data?.length || 0;
        setInvoiceNumberInput(String(count > 0 ? count + 1 : 10));
      }
      if (custRes.data.success) {
        setCustomers(custRes.data.data || []);
      }
      if (storesRes.data.success) {
        setStores(storesRes.data.data || []);
      }
      if (prodsRes.data.success) {
        setProducts(sortProducts(prodsRes.data.data || []));
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices', { params: { fresh: 'true' } });
      if (res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  // Handler for Quick Add Customer / Shop (+ New button in Add Invoice)
  const handleQuickCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      setNewCustomerError('Name is required');
      return;
    }
    if (!newCustomerForm.phone.trim()) {
      setNewCustomerError('Mobile number is required');
      return;
    }
    try {
      setSavingNewCustomer(true);
      setNewCustomerError('');

      if (billingType === 'customer') {
        const res = await api.post('/customers', {
          name: newCustomerForm.name.trim(),
          phone: newCustomerForm.phone.trim(),
          email: newCustomerForm.email ? newCustomerForm.email.trim() : '',
          address: newCustomerForm.address.trim(),
          gstNumber: newCustomerForm.gstNumber.trim().toUpperCase()
        });
        if (res.data.success && res.data.data) {
          const created = res.data.data;
          setCustomers((prev) => [created, ...prev]);
          setSelectedCustomerId(created._id);
          setIsNewCustomerModalOpen(false);
          setNewCustomerForm({
            name: '',
            phone: '',
            ownerName: '',
            city: 'Chennai',
            address: '',
            gstNumber: '',
            email: ''
          });
          showToast(`Customer "${created.name}" created and selected!`);
        }
      } else {
        const res = await api.post('/stores', {
          name: newCustomerForm.name.trim(),
          phone: newCustomerForm.phone.trim(),
          ownerName: newCustomerForm.ownerName.trim(),
          city: newCustomerForm.city.trim() || 'Chennai',
          address: newCustomerForm.address.trim(),
          gstNumber: newCustomerForm.gstNumber.trim().toUpperCase()
        });
        if (res.data.success && res.data.data) {
          const created = res.data.data;
          setStores((prev) => [created, ...prev]);
          setSelectedStoreId(created._id);
          setIsNewCustomerModalOpen(false);
          setNewCustomerForm({
            name: '',
            phone: '',
            ownerName: '',
            city: 'Chennai',
            address: '',
            gstNumber: '',
            email: ''
          });
          showToast(`Retail Shop "${created.name}" created and selected!`);
        }
      }
    } catch (err) {
      console.error('Failed to create customer/shop:', err);
      setNewCustomerError(err.response?.data?.message || 'Failed to add record.');
    } finally {
      setSavingNewCustomer(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Helper to format invoice number to 3-digit padded number like in screenshot (009, 008, etc.)
  const formatInvoiceNumber = (numStr) => {
    if (!numStr) return '---';
    const parts = String(numStr).split('-');
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      const intVal = parseInt(lastPart, 10);
      return String(intVal).padStart(3, '0');
    }
    return numStr;
  };

  // Helper to format date as DD/MMM/YYYY (e.g. 02/Oct/2026)
  const formatInvoiceDate = (dateVal) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to format currency amount (e.g. 3,564.00)
  const formatAmount = (num) => {
    return Number(num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Print / Directly send PDF Invoice to print dialog
  const handlePrintInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setPrintingId(invoiceId);
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);

      // Create or recycle invisible iframe for direct printing
      let printFrame = document.getElementById('direct-print-iframe');
      if (printFrame) {
        printFrame.remove();
      }
      printFrame = document.createElement('iframe');
      printFrame.id = 'direct-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.src = blobUrl;
      document.body.appendChild(printFrame);

      // Trigger print directly once loaded
      let printed = false;
      const triggerPrint = () => {
        if (printed) return;
        printed = true;
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print call error, opening window fallback:', e);
          const win = window.open(blobUrl, '_blank');
          if (win) {
            win.onload = () => {
              win.focus();
              win.print();
            };
          }
        }
      };

      printFrame.onload = () => {
        setTimeout(triggerPrint, 300);
      };

      // Fallback timer in case onload doesn't fire for PDF object
      setTimeout(triggerPrint, 1000);

      // Clean up blob URL after print
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error('Failed to print invoice:', err);
      const token = localStorage.getItem('tamil_erp_token');
      if (token) {
        const win = window.open(`/api/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
        if (win) {
          win.onload = () => {
            win.focus();
            win.print();
          };
        }
      } else {
        alert('Failed to load invoice PDF for printing. Please try again.');
      }
    } finally {
      setPrintingId(null);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      setPrintingId(invoiceId);
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Bill-of-Supply-${formatInvoiceNumber(invoiceNumber)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      showToast('Invoice PDF downloaded successfully!');
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to download PDF invoice.');
    } finally {
      setPrintingId(null);
    }
  };

  // ================= Share Invoice Handlers =================
  const handleOpenShareModal = (inv) => {
    const defaultRecipient =
      inv.customerId?.name ||
      inv.storeId?.name ||
      (isCustomerType ? 'Customer' : 'Retail Shop');
    const defaultPhone = inv.customerId?.phone || inv.storeId?.phone || '';
    setShareInvoiceTarget(inv);
    setShareRecipientName(defaultRecipient);
    setSharePhone(defaultPhone);
    setCopiedShareText(false);
  };

  const getShareInvoiceMessage = (inv, recipientName = '') => {
    if (!inv) return '';
    const partyName =
      recipientName ||
      inv.customerId?.name ||
      inv.storeId?.name ||
      (isCustomerType ? 'Customer' : 'Retail Shop');
    const invNum = inv.invoiceNumber;
    const invDate = formatInvoiceDate(inv.invoiceDate);
    const total = formatAmount(inv.grandTotal);
    const isPaid = inv.status === 'Paid' || inv.balanceAmount <= 0;
    const statusText = isPaid ? 'PAID ✅' : `DUE: ₹${formatAmount(inv.balanceAmount)} ⚠️`;
    const challan = inv.deliveryChallanNo || '';
    const saleType = inv.saleType || 'Credit';

    let itemLines = '';
    if (inv.items && inv.items.length > 0) {
      itemLines = inv.items
        .map(
          (i) =>
            `• ${i.name} - ${i.quantity} units @ ₹${i.unitPrice} (₹${formatAmount(i.total)})`
        )
        .join('\n');
    }

    return (
      `வணக்கம் / Hello ${partyName},\n\n` +
      `🏢 *TAMIZH ENTERPRISES - GST TAX INVOICE*\n` +
      `Goods dispatched & billed under Tamil Nadu Distribution Network.\n\n` +
      `📋 *Invoice Details:*\n` +
      `• Invoice No: *${invNum}*\n` +
      `• Invoice Date: *${invDate}*\n` +
      `• Bill Amount: *₹ ${total}*\n` +
      `• Payment Status: *${statusText}*\n` +
      `• Terms: *${saleType}*\n` +
      (challan ? `• Delivery Challan: *${challan}*\n` : '') +
      `\n` +
      (itemLines ? `📦 *Dispatched Items:*\n${itemLines}\n\n` : '') +
      `🏦 *Payment Options (UPI & Bank):*\n` +
      `• UPI ID: tamizhenterprises@hdfcbank\n` +
      `• Bank: HDFC Bank, Madurai Main Branch\n` +
      `• A/C: 50200012345678 | IFSC: HDFC0000123\n\n` +
      `Thank you for your business!\n` +
      `Tamizh Enterprises Distribution Central Depot\n` +
      `Helpline: +91 94432 10987`
    );
  };

  const handleSendWhatsApp = () => {
    if (!shareInvoiceTarget) return;
    const text = getShareInvoiceMessage(shareInvoiceTarget, shareRecipientName);
    const cleanPhone = sharePhone ? sharePhone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyShareText = async () => {
    if (!shareInvoiceTarget) return;
    const text = getShareInvoiceMessage(shareInvoiceTarget, shareRecipientName);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShareText(true);
      showToast('Invoice summary copied to clipboard!');
      setTimeout(() => setCopiedShareText(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleSystemShare = async () => {
    if (!shareInvoiceTarget) return;
    const text = getShareInvoiceMessage(shareInvoiceTarget, shareRecipientName);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tax Invoice #${shareInvoiceTarget.invoiceNumber} - Tamizh Enterprises`,
          text: text,
          url: window.location.href
        });
        showToast('Invoice shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyShareText();
    }
  };

  // Open Invoice Edit Modal & Populate Form
  const handleOpenEditInvoice = (inv) => {
    setSelectedInvoice(inv);
    setEditInvoiceError('');
    let dStr = '';
    if (inv.invoiceDate) {
      const d = new Date(inv.invoiceDate);
      if (!isNaN(d.getTime())) {
        dStr = d.toISOString().split('T')[0];
      }
    }
    setEditInvoiceForm({
      invoiceNumber: inv.invoiceNumber || '',
      invoiceDate: dStr || new Date().toISOString().split('T')[0],
      storeId: inv.storeId?._id || inv.storeId || '',
      customerId: inv.customerId?._id || inv.customerId || '',
      saleType: inv.saleType || 'Credit',
      status: inv.status || 'Unpaid',
      deliveryChallanNo: inv.deliveryChallanNo || '',
      notes: inv.notes || '',
      items: (inv.items || []).map((it) => ({
        productId: it.productId?._id || it.productId || '',
        name: it.name || it.productId?.name || '',
        hsnCode: it.hsnCode || '3004',
        quantity: Number(it.quantity) || 1,
        freeQuantity: Number(it.freeQuantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        discountPercent: Number(it.discountPercent) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxableValue: Number(it.taxableValue) || 0,
        gstRate: it.gstRate !== undefined ? Number(it.gstRate) : 5,
        taxAmount: Number(it.taxAmount) || 0,
        total: Number(it.total) || 0
      }))
    });
  };

  // Edit item fields inside invoice edit modal
  const handleEditItemChange = (idx, field, value) => {
    setEditInvoiceForm((prev) => {
      const items = [...prev.items];
      const cur = { ...items[idx] };
      if (field === 'quantity') cur.quantity = Number(value) || 0;
      if (field === 'unitPrice') cur.unitPrice = Number(value) || 0;
      if (field === 'hsnCode') cur.hsnCode = value;
      if (field === 'gstRate') cur.gstRate = Number(value) || 0;
      if (field === 'discountPercent') cur.discountPercent = Number(value) || 0;

      const q = cur.quantity;
      const p = cur.unitPrice;
      const discPct = cur.discountPercent;
      const gst = cur.gstRate;
      const gross = q * p;
      const discAmt = (gross * discPct) / 100;
      const taxable = Math.max(0, gross - discAmt);
      const tax = (taxable * gst) / 100;
      const total = taxable + tax;

      cur.discountAmount = Math.round(discAmt * 100) / 100;
      cur.taxableValue = Math.round(taxable * 100) / 100;
      cur.taxAmount = Math.round(tax * 100) / 100;
      cur.total = Math.round(total * 100) / 100;

      items[idx] = cur;
      return { ...prev, items };
    });
  };

  const handleRemoveEditItem = (idx) => {
    setEditInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleAddProductToEditInvoice = () => {
    if (!addEditProductId) return;
    const prod = products.find((p) => p._id === addEditProductId);
    if (!prod) return;

    const rate = Number(prod.dealerPrice || prod.sellingPrice || prod.mrp || 0);
    const gst = Number(prod.gstRate !== undefined ? prod.gstRate : 5);
    const taxable = rate;
    const tax = (taxable * gst) / 100;
    const total = taxable + tax;

    const newItem = {
      productId: prod._id,
      name: prod.name,
      hsnCode: prod.hsnCode || '3004',
      quantity: 1,
      freeQuantity: 0,
      unitPrice: rate,
      discountPercent: 0,
      discountAmount: 0,
      taxableValue: Math.round(taxable * 100) / 100,
      gstRate: gst,
      taxAmount: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };

    setEditInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setAddEditProductId('');
  };

  // Recalculate totals in real-time as user edits items
  const editCalculatedTotals = useMemo(() => {
    if (!editInvoiceForm?.items) return { taxable: 0, tax: 0, cgst: 0, sgst: 0, grand: 0 };
    let taxable = 0;
    let tax = 0;
    let grand = 0;
    for (const it of editInvoiceForm.items) {
      taxable += Number(it.taxableValue || 0);
      tax += Number(it.taxAmount || 0);
      grand += Number(it.total || 0);
    }
    return {
      taxable: Math.round(taxable * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      cgst: Math.round((tax / 2) * 100) / 100,
      sgst: Math.round((tax / 2) * 100) / 100,
      grand: Math.round(grand * 100) / 100
    };
  }, [editInvoiceForm?.items]);

  // Save edited invoice to backend
  const handleSaveInvoiceEdit = async () => {
    if (!selectedInvoice || !editInvoiceForm) return;
    if (!editInvoiceForm.invoiceNumber.trim()) {
      setEditInvoiceError('Bill / Invoice Number is required');
      return;
    }
    if (!editInvoiceForm.items || editInvoiceForm.items.length === 0) {
      setEditInvoiceError('Please include at least one item in the invoice');
      return;
    }

    try {
      setIsSavingEditInvoice(true);
      setEditInvoiceError('');
      const res = await api.put(`/invoices/${selectedInvoice._id}`, editInvoiceForm);
      if (res.data.success) {
        showToast('Bill / Invoice updated successfully!');
        setInvoices((prev) =>
          prev.map((inv) => (inv._id === selectedInvoice._id ? res.data.data : inv))
        );
        setSelectedInvoice(res.data.data);
        handleOpenEditInvoice(res.data.data);
      } else {
        setEditInvoiceError(res.data.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error('Update invoice error:', err);
      setEditInvoiceError(err.response?.data?.message || 'Error occurred while saving invoice');
    } finally {
      setIsSavingEditInvoice(false);
    }
  };

  // Sorting Handler for Table
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted Invoices (Strictly Filtered by Customer vs Shop)
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter((inv) => {
      const hasCustomer = Boolean(
        inv.customerId && (typeof inv.customerId === 'object' ? (inv.customerId._id || inv.customerId.name) : true)
      );
      const hasStore = Boolean(
        inv.storeId && (typeof inv.storeId === 'object' ? (inv.storeId._id || inv.storeId.name) : true)
      );

      if (isCustomerType) {
        // Customer Invoices: MUST have customer attached
        return hasCustomer;
      } else {
        // Shop Invoices: MUST have retail store and NEVER be a customer invoice
        return hasStore && !hasCustomer;
      }
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((inv) => {
        const invNum = (inv.invoiceNumber || '').toLowerCase();
        const displayNum = formatInvoiceNumber(inv.invoiceNumber).toLowerCase();
        const party = (inv.customerId?.name || inv.storeId?.name || '').toLowerCase();
        const phone = (inv.customerId?.phone || inv.storeId?.phone || '').toLowerCase();
        const dateStr = formatInvoiceDate(inv.invoiceDate).toLowerCase();
        const amountStr = String(inv.grandTotal || '');
        const status = (inv.status || '').toLowerCase();
        return (
          invNum.includes(q) ||
          displayNum.includes(q) ||
          party.includes(q) ||
          phone.includes(q) ||
          dateStr.includes(q) ||
          amountStr.includes(q) ||
          status.includes(q)
        );
      });
    }

    result.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'sno':
          return 0;
        case 'invoiceNumber':
          valA = a.invoiceNumber || '';
          valB = b.invoiceNumber || '';
          break;
        case 'shopName':
          valA = (a.customerId?.name || a.storeId?.name || '').toLowerCase();
          valB = (b.customerId?.name || b.storeId?.name || '').toLowerCase();
          break;
        case 'invoiceDate':
          valA = new Date(a.invoiceDate || 0).getTime();
          valB = new Date(b.invoiceDate || 0).getTime();
          break;
        case 'invoiceAmount':
          valA = Number(a.grandTotal || 0);
          valB = Number(b.grandTotal || 0);
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = new Date(a.invoiceDate || 0).getTime();
          valB = new Date(b.invoiceDate || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, isCustomerType, search, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Shop Update Actions
  const handleOpenShopUpdate = (store) => {
    if (!store) return;
    setUpdatingShop(store);
    setShopPhoneInput(store.phone || '');
  };

  const handleSaveShopUpdate = async (e) => {
    e.preventDefault();
    if (!updatingShop) return;
    try {
      setShopSaving(true);
      await api.put(`/stores/${updatingShop._id}`, {
        phone: shopPhoneInput
      });
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.storeId?._id === updatingShop._id
            ? { ...inv, storeId: { ...inv.storeId, phone: shopPhoneInput } }
            : inv
        )
      );
      setUpdatingShop(null);
      showToast('Shop contact updated successfully!');
    } catch (err) {
      console.error('Error updating shop:', err);
      alert('Failed to update shop contact information.');
    } finally {
      setShopSaving(false);
    }
  };

  // Void Invoice Action
  const handleConfirmVoid = async () => {
    if (!voidInvoiceTarget) return;
    try {
      setVoiding(true);
      await api.put(`/invoices/${voidInvoiceTarget._id}/void`);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === voidInvoiceTarget._id ? { ...inv, status: 'Cancelled' } : inv
        )
      );
      setVoidInvoiceTarget(null);
      showToast('Invoice has been voided.');
    } catch (err) {
      console.error('Failed to void invoice:', err);
      alert('Failed to void invoice.');
    } finally {
      setVoiding(false);
    }
  };

  // ================= ADD PRODUCT INVOICE FORM CALCULATIONS =================
  const calculateTotal = (qtyVal, priceVal, discRsVal) => {
    const q = Number(qtyVal) || 0;
    const p = Number(priceVal) || 0;
    const d = Number(discRsVal) || 0;
    const total = Math.max(0, q * p - d);
    return total ? total.toFixed(2) : '';
  };

  const handleProductSelect = (pId) => {
    setCurrentProductId(pId);
    if (!pId) {
      setItemMrp('');
      setItemQty('');
      setItemShopPercent('');
      setItemPrice('');
      setItemTotal('');
      setItemDiscPercent('');
      setItemDiscRs('');
      return;
    }
    const prod = products.find((p) => p._id === pId);
    if (prod) {
      const mrp = Number(prod.mrp || 0);
      const price = Number(prod.dealerPrice || prod.sellingPrice || mrp || 0);
      const defaultQty = 1;

      setItemMrp(mrp ? String(mrp) : '');
      setItemQty(String(defaultQty));

      // Calculate initial shop % from MRP and dealer price
      if (mrp > 0 && price > 0 && mrp >= price) {
        const pct = (((mrp - price) / mrp) * 100).toFixed(1);
        setItemShopPercent(pct === '0.0' ? '0' : pct);
        setItemPrice(String(price));
      } else if (mrp > 0) {
        setItemShopPercent('0');
        setItemPrice(String(mrp));
      } else {
        setItemShopPercent('0');
        setItemPrice(price ? String(price) : '');
      }

      setItemDiscPercent('');
      setItemDiscRs('');
      const activePrice = price > 0 ? price : mrp;
      setItemTotal(calculateTotal(defaultQty, activePrice, 0));
    }
  };

  // When MRP changes
  const handleMrpChange = (val) => {
    setItemMrp(val);
    const m = Number(val) || 0;
    const shopPct = Number(itemShopPercent) || 0;
    let newPrice = Number(itemPrice) || 0;

    if (m > 0 && shopPct > 0) {
      newPrice = Math.max(0, m - (m * shopPct) / 100);
      setItemPrice(newPrice ? newPrice.toFixed(2) : '0.00');
    }

    const q = Number(itemQty) || 0;
    const discPercent = Number(itemDiscPercent) || 0;
    let discRs = Number(itemDiscRs) || 0;
    if (discPercent > 0) {
      discRs = (q * newPrice * discPercent) / 100;
      setItemDiscRs(discRs ? discRs.toFixed(2) : '');
    }
    setItemTotal(calculateTotal(q, newPrice, discRs));
  };

  // When Quantity changes
  const handleQtyChange = (val) => {
    setItemQty(val);
    const q = Number(val) || 0;
    const p = Number(itemPrice) || 0;
    const discPercent = Number(itemDiscPercent) || 0;
    let discRs = Number(itemDiscRs) || 0;
    if (discPercent > 0) {
      discRs = (q * p * discPercent) / 100;
      setItemDiscRs(discRs ? discRs.toFixed(2) : '');
    }
    setItemTotal(calculateTotal(val, itemPrice, discRs));
  };

  // When Shop % changes: reduces % price from MRP and updates Shop Price input
  const handleShopPercentChange = (val) => {
    setItemShopPercent(val);
    const m = Number(itemMrp) || 0;
    const pct = Number(val) || 0;
    const reducedPrice = Math.max(0, m - (m * pct) / 100);
    const priceStr = reducedPrice ? reducedPrice.toFixed(2) : '0.00';
    setItemPrice(priceStr);

    const q = Number(itemQty) || 0;
    const discPercent = Number(itemDiscPercent) || 0;
    let discRs = Number(itemDiscRs) || 0;
    if (discPercent > 0) {
      discRs = (q * reducedPrice * discPercent) / 100;
      setItemDiscRs(discRs ? discRs.toFixed(2) : '');
    }
    setItemTotal(calculateTotal(q, reducedPrice, discRs));
  };

  // When Shop Price changes directly: recalculates Shop % from MRP
  const handlePriceChange = (val) => {
    setItemPrice(val);
    const m = Number(itemMrp) || 0;
    const p = Number(val) || 0;
    if (m > 0) {
      const pct = Math.max(0, ((m - p) / m) * 100);
      setItemShopPercent(pct ? pct.toFixed(1) : '0');
    }

    const q = Number(itemQty) || 0;
    const discPercent = Number(itemDiscPercent) || 0;
    let discRs = Number(itemDiscRs) || 0;
    if (discPercent > 0) {
      discRs = (q * p * discPercent) / 100;
      setItemDiscRs(discRs ? discRs.toFixed(2) : '');
    }
    setItemTotal(calculateTotal(q, val, discRs));
  };

  const handleDiscPercentChange = (val) => {
    setItemDiscPercent(val);
    const q = Number(itemQty) || 0;
    const p = Number(itemPrice) || 0;
    const percent = Number(val) || 0;
    const discRs = (q * p * percent) / 100;
    setItemDiscRs(discRs ? discRs.toFixed(2) : '');
    setItemTotal(calculateTotal(itemQty, itemPrice, discRs));
  };

  const handleDiscRsChange = (val) => {
    setItemDiscRs(val);
    const q = Number(itemQty) || 0;
    const p = Number(itemPrice) || 0;
    const subtotal = q * p;
    const discRs = Number(val) || 0;
    if (subtotal > 0) {
      const percent = (discRs / subtotal) * 100;
      setItemDiscPercent(percent ? percent.toFixed(2) : '');
    }
    setItemTotal(calculateTotal(itemQty, itemPrice, discRs));
  };

  const handleAddItem = () => {
    if (!currentProductId) {
      alert('Please select a product.');
      return;
    }
    const q = Number(itemQty);
    if (!q || q <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    const prod = products.find((p) => p._id === currentProductId);
    if (!prod) return;

    const p = Number(itemPrice) || 0;
    const mrp = Number(itemMrp) || 0;
    const shopPercent = Number(itemShopPercent) || 0;
    const discPercent = Number(itemDiscPercent) || 0;
    const discAmount = Number(itemDiscRs) || (q * p * discPercent) / 100;
    const taxableValue = Math.max(0, q * p - discAmount);
    const gstRate = prod.gstRate || 18;
    const taxAmount = (taxableValue * gstRate) / 100;
    const lineTotal = taxableValue + taxAmount;

    setAddedItems((prev) => [
      ...prev,
      {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        hsnCode: prod.hsnCode || '3004',
        quantity: q,
        unitPrice: p,
        mrp,
        shopPercent,
        discountPercent: discPercent,
        discountAmount: discAmount,
        taxableValue,
        gstRate,
        taxAmount,
        total: lineTotal
      }
    ]);

    // Reset ADD PRODUCT input box
    setCurrentProductId('');
    setItemMrp('');
    setItemQty('');
    setItemShopPercent('');
    setItemPrice('');
    setItemTotal('');
    setItemDiscPercent('');
    setItemDiscRs('');
  };

  const handleRemoveAddedItem = (index) => {
    setAddedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Grand total calculations for added items
  const invoiceFinancials = useMemo(() => {
    let taxableSubtotal = 0;
    let totalDiscount = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    for (const item of addedItems) {
      taxableSubtotal += Number(item.taxableValue || 0);
      totalDiscount += Number(item.discountAmount || 0);
      taxTotal += Number(item.taxAmount || 0);
      grandTotal += Number(item.total || 0);
    }

    return {
      taxableSubtotal,
      totalDiscount,
      taxTotal,
      grandTotal: Math.round(grandTotal)
    };
  }, [addedItems]);

  const handleGenerateInvoice = async () => {
    if (billingType === 'customer' && !selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (billingType === 'store' && !selectedStoreId) {
      alert('Please select a destination shop.');
      return;
    }
    if (addedItems.length === 0) {
      alert('Please add at least one product to the invoice.');
      return;
    }

    try {
      setSubmittingInvoice(true);
      const payload = {
        paymentType: invoicePaymentType,
        notes: invoiceNotes,
        items: addedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          discountAmount: item.discountAmount || 0,
          gstRate: item.gstRate || 18
        }))
      };

      if (billingType === 'customer') {
        payload.customerId = selectedCustomerId;
      } else {
        payload.storeId = selectedStoreId;
      }

      const res = await api.post('/stock/transfer-to-store', payload);

      if (res.data.success) {
        showToast('Tax invoice generated successfully!');
        setAddedItems([]);
        setSelectedCustomerId('');
        setSelectedStoreId('');
        await fetchInvoices();
        navigate(isCustomerType ? '/invoices?type=customer' : '/invoices?type=shop');
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert(err.response?.data?.message || 'Failed to generate invoice.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {isCreateMode ? (
        /* ================= ADD INVOICE (INVOICE – CUSTOMER) UI (EXACT SCREENSHOT MATCH) ================= */
        <div className="space-y-4">
          {/* Top Profile / Territory Partner Badge Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between">
            {/* Left: Avatar & Profile Details */}
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.jpg"
                alt="Tamizh Enterprises"
                className="w-13 h-13 rounded-full object-cover shadow-xs flex-shrink-0 border-2 border-amber-300 ring-2 ring-amber-100"
              />
              <div className="flex flex-col justify-center leading-tight">
                <span className="text-sm sm:text-base font-extrabold text-[#b45309] tracking-tight uppercase">
                  K.TAMIZHMOZHI
                </span>
                <span className="text-xs font-semibold text-[#0284c7]">
                  TP-0243
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  9841433607
                </span>
                <span className="text-[11px] text-teal-700 font-semibold tracking-wide">
                  Territory Partner
                </span>
              </div>
            </div>

            {/* Right: Wallet Balance & Femi9 Badge */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm sm:text-base bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
                <svg className="w-5 h-5 text-slate-600 inline-block" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 7H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-1 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM3 5h16a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2z" />
                </svg>
                <span>₹0.00</span>
              </div>

              {/* Femi9 Logo Yellow Badge */}
              <div className="w-11 h-11 rounded-full bg-[#facc15] border border-amber-300 flex flex-col items-center justify-center shadow-xs flex-shrink-0 p-1">
                <span className="font-serif italic font-extrabold text-[#713f12] text-xs leading-none">
                  femi<span className="text-[10px]">9</span>
                </span>
                <span className="text-[6px] font-sans font-bold text-[#854d0e] tracking-tight leading-none scale-90 mt-0.5">
                  born for dignity
                </span>
              </div>
            </div>
          </div>

          {/* Main White Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-6">
            {/* Card Header with Blue Invoice Icon, Title, Billing Type Toggle, and List Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v18l-3-2-3 2-3-2-3 2-3-2-1 0.67V3zm3 4h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e293b] tracking-tight">
                  {billingType === 'customer' ? 'Invoice – Customer' : 'Invoice – Retail Shop'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {/* Billing Type Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBillingType('customer')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingType === 'customer'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType('store')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingType === 'store'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Retail Shop
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(isCustomerType ? '/invoices?type=customer' : '/invoices?type=shop')}
                  title="View Invoices List"
                  className="w-10 h-10 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                >
                  <List className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Section 1: INVOICE DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-blue-600">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-700 uppercase">
                  Invoice Details
                </h2>
              </div>

              {/* 3 Columns Row: Invoice Number*, Customer/Shop Name*, Invoice Date* */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Invoice Number * */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    Invoice Number*
                  </label>
                  <input
                    type="text"
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-blue-500 rounded-xl font-bold text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* 2. Customer Name* (or Shop Name*) with + New */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      {billingType === 'customer' ? 'Customer Name*' : 'Shop Name*'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustomerError('');
                        setIsNewCustomerModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      + New
                    </button>
                  </div>
                  {billingType === 'customer' ? (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-sm"
                    >
                      <option value="">Select</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} {c.address ? `- ${c.address}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-sm"
                    >
                      <option value="">Select</option>
                      {stores.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} {s.city ? `(${s.city})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 3. Invoice Date* */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    Invoice Date*
                  </label>
                  <div className="w-full px-4 py-2.5 bg-[#e2e8f0] border border-slate-200 rounded-xl font-bold text-slate-900 text-sm flex items-center select-none">
                    {todayFormatted}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: ADD PRODUCT (Dotted / Dashed Box matching screenshot) */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 sm:p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs sm:text-sm tracking-wider uppercase">
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                <span>Add Product</span>
              </div>

              {/* Row 1: PRODUCT, MRP, QTY, SHOP %, SHOP PRICE */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Product
                  </label>
                  <select
                    value={currentProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select Product</option>
                    {sortProducts(products).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.sku ? `(${p.sku})` : ''} - MRP: ₹{p.mrp || p.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    MRP
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="MRP"
                    value={itemMrp}
                    onChange={(e) => handleMrpChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={itemQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Shop %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Shop %"
                    value={itemShopPercent}
                    onChange={(e) => handleShopPercentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Shop Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Shop Price"
                    value={itemPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Row 2: TOTAL, DISC (%), DISC (₹), + Add Button */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Total
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Total"
                    value={itemTotal ? `₹${itemTotal}` : ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Disc (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Disc(%)"
                    value={itemDiscPercent}
                    onChange={(e) => handleDiscPercentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Disc (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Disc(Rs.)"
                    value={itemDiscRs}
                    onChange={(e) => handleDiscRsChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Added Items Line List */}
            {addedItems.length > 0 && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Added Products ({addedItems.length})
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">MRP</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Shop %</th>
                        <th className="py-2.5 px-3 text-right">Shop Price</th>
                        <th className="py-2.5 px-3 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right">Taxable</th>
                        <th className="py-2.5 px-3 text-center">GST</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {addedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">₹{Number(item.mrp || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-blue-600 font-semibold">{Number(item.shopPercent || 0).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{Number(item.unitPrice).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-red-600">
                            ₹{Number(item.discountAmount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ₹{Number(item.taxableValue).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">{item.gstRate}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ₹{Number(item.total).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveAddedItem(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Additional Settings & Financial Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Type
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="paymentType"
                            value="Credit"
                            checked={invoicePaymentType === 'Credit'}
                            onChange={(e) => setInvoicePaymentType(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Credit (Store Ledger)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="paymentType"
                            value="Cash"
                            checked={invoicePaymentType === 'Cash'}
                            onChange={(e) => setInvoicePaymentType(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Cash / Direct</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Invoice Notes / Dispatch Remarks
                      </label>
                      <input
                        type="text"
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        placeholder="e.g. Delivery via vehicle, special terms"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Subtotal:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(invoiceFinancials.taxableSubtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Discount:</span>
                      <span className="font-semibold text-red-600">
                        -₹{Number(invoiceFinancials.totalDiscount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Tax Total:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(invoiceFinancials.taxTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-extrabold text-blue-700">
                      <span>Grand Total:</span>
                      <span>₹{formatAmount(invoiceFinancials.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => navigate(isCustomerType ? '/invoices?type=customer' : '/invoices?type=shop')}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingInvoice}
                    onClick={handleGenerateInvoice}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingInvoice ? 'Generating Invoice...' : 'Generate & Issue Invoice'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= MANAGE INVOICE (MANAGE INVOICE - SHOP) UI ================= */
        <div className="space-y-5">
          {/* Top Header Row with Title, Quick Switcher, and + Action Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
                {isCustomerType ? 'Manage Invoice - Customer' : 'Manage Invoice - Shop'}
              </h1>

              {/* Quick Switcher Pills */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => navigate('/invoices?type=shop')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    !isCustomerType
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shop Invoices
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/invoices?type=customer')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isCustomerType
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customer Invoices
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(isCustomerType ? '/invoices?type=customer&action=new' : '/invoices?type=shop&action=new')}
              title={`Create / Add New ${isCustomerType ? 'Customer' : 'Shop'} Invoice`}
              className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-8 h-8 stroke-[2.5]" />
            </button>
          </div>

          {/* White Card Container matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
            {/* Show Entries & Search Bar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 font-normal">
              {/* Show [ 10 ] entries */}
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

            {/* Invoices Table matching screenshot columns exactly */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="border-b border-slate-100 text-slate-500 font-semibold text-xs sm:text-sm select-none">
                  <tr>
                    <th
                      onClick={() => handleSort('sno')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>S.No</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('invoiceNumber')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Invoice Number</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('shopName')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>{isCustomerType ? 'Customer Name' : 'Shop / Retailer'}</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('invoiceDate')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Invoice Date</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('invoiceAmount')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Invoice Amount</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Print</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Share</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800 whitespace-nowrap text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Edit</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>Return (Credit Note)</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>Remove</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>History</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Void</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Delete</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="14" className="py-12 text-center text-slate-400 font-medium">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((inv, idx) => {
                      const serialNo = (currentPage - 1) * pageSize + idx + 1;
                      const formattedNum = formatInvoiceNumber(inv.invoiceNumber);
                      const isPaid = inv.status === 'Paid' || inv.balanceAmount <= 0;
                      const isVoid = inv.status === 'Cancelled';

                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* 1. S.No */}
                          <td className="py-4 px-3 align-top font-normal text-slate-700">
                            {serialNo}
                          </td>

                          {/* 2. Invoice Number */}
                          <td className="py-4 px-3 align-top whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditInvoice(inv)}
                              title={`Click to edit / view invoice ${inv.invoiceNumber}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            >
                              {formattedNum}
                            </button>
                          </td>

                          {/* 3. Customer / Shop Name */}
                          <td className="py-4 px-3 align-top">
                            {isCustomerType ? (
                              <>
                                <div className="font-medium text-slate-800 leading-snug">
                                  {inv.customerId?.name || 'Customer'}
                                </div>
                                <div className="text-xs text-slate-500 font-normal mt-0.5">
                                  M: {inv.customerId?.phone || 'N/A'}
                                </div>
                                <span className="mt-1 inline-block px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                                  Customer
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-slate-800 leading-snug">
                                  {inv.storeId?.name || 'Retail Shop'}
                                </div>
                                <div className="text-xs text-slate-500 font-normal mt-0.5">
                                  M: {inv.storeId?.phone || 'N/A'}
                                </div>
                                {inv.storeId && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenShopUpdate(inv.storeId)}
                                    className="mt-1 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 border border-blue-500 rounded-md hover:bg-blue-50 transition-colors cursor-pointer inline-block"
                                  >
                                    Update
                                  </button>
                                )}
                              </>
                            )}
                          </td>

                          {/* 4. Invoice Date */}
                          <td className="py-4 px-3 align-top text-slate-700 whitespace-nowrap">
                            {formatInvoiceDate(inv.invoiceDate)}
                          </td>

                          {/* 5. Invoice Amount */}
                          <td className="py-4 px-3 align-top whitespace-nowrap">
                            <div className="text-slate-800 font-normal">
                              {formatAmount(inv.grandTotal)}
                            </div>
                            <div>
                              {isPaid ? (
                                <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500 rounded-md">
                                  Paid
                                </span>
                              ) : (
                                <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-500 rounded-md">
                                  Not Paid
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Print */}
                          <td className="py-4 px-3 align-top text-center">
                            <button
                              type="button"
                              disabled={printingId === inv._id}
                              onClick={() => handlePrintInvoice(inv._id, inv.invoiceNumber)}
                              title="Print Bill of Supply"
                              className="p-1 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                            >
                              {printingId === inv._id ? (
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <PrinterIcon />
                              )}
                            </button>
                          </td>

                          {/* 7. Share */}
                          <td className="py-4 px-3 align-top text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenShareModal(inv)}
                              title="Share Invoice (WhatsApp, Copy & Details)"
                              className="p-1 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center"
                            >
                              <WhatsAppShareIcon />
                            </button>
                          </td>

                          {/* 8. Status */}
                          <td className="py-4 px-3 align-top text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${
                                isVoid
                                  ? 'border-slate-400 text-slate-500'
                                  : 'border-emerald-500 text-emerald-600'
                              }`}
                            >
                              {isVoid ? 'Void' : 'Active'}
                            </span>
                          </td>

                          {/* 8. Edit */}
                          <td className="py-4 px-3 align-top text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditInvoice(inv)}
                              title="Edit Bill / Invoice Details"
                              className="p-1 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center"
                            >
                              <GreenNotepadIcon />
                            </button>
                          </td>

                          {/* 9. Return (Credit Note) */}
                          <td className="py-4 px-3 align-top whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setReturnInvoiceTarget(inv)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-xs cursor-pointer"
                            >
                              Request to Return
                            </button>
                          </td>

                          {/* 10. Remove */}
                          <td className="py-4 px-3 align-top whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setRemoveInvoiceTarget(inv)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-xs cursor-pointer"
                            >
                              Request to Remove
                            </button>
                          </td>

                          {/* 11. History */}
                          <td className="py-4 px-3 align-top text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setHistoryInvoice(inv)}
                              className="px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-500 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              History
                            </button>
                          </td>

                          {/* 12. Void */}
                          <td className="py-4 px-3 align-top text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={isVoid}
                              onClick={() => setVoidInvoiceTarget(inv)}
                              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition-colors ${
                                isVoid
                                  ? 'border-slate-300 text-slate-400 cursor-not-allowed'
                                  : 'border-slate-700 text-slate-800 hover:bg-slate-100 cursor-pointer'
                              }`}
                            >
                              Void
                            </button>
                          </td>

                          {/* 13. Delete */}
                          <td className="py-4 px-3 align-top text-center text-slate-700 font-medium text-xs">
                            ---
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="14" className="py-12 text-center text-slate-400">
                        No matching invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
              <div>
                Showing {filteredInvoices.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} entries
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === p
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SHARE INVOICE (WHATSAPP & SUMMARY) ================= */}
      {shareInvoiceTarget && (
        <Modal
          isOpen={!!shareInvoiceTarget}
          onClose={() => setShareInvoiceTarget(null)}
          title={`Share Tax Invoice #${formatInvoiceNumber(shareInvoiceTarget.invoiceNumber)}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Top Summary Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 p-3.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Bill of Supply
                </span>
                <div className="font-extrabold text-base text-slate-900 font-mono">
                  {shareInvoiceTarget.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatInvoiceDate(shareInvoiceTarget.invoiceDate)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Invoice Amount
                </span>
                <div className="font-extrabold text-lg text-emerald-700 font-mono">
                  ₹{formatAmount(shareInvoiceTarget.grandTotal)}
                </div>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    shareInvoiceTarget.status === 'Paid' || shareInvoiceTarget.balanceAmount <= 0
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-100/60'
                      : 'border-red-400 text-red-600 bg-red-50'
                  }`}
                >
                  {shareInvoiceTarget.status === 'Paid' || shareInvoiceTarget.balanceAmount <= 0
                    ? 'Paid'
                    : 'Not Paid'}
                </span>
              </div>
            </div>

            {/* Recipient & Phone Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Recipient Name:
                </label>
                <input
                  type="text"
                  value={shareRecipientName}
                  onChange={(e) => setShareRecipientName(e.target.value)}
                  placeholder="Customer / Shop name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  WhatsApp Mobile No:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="tel"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <WhatsAppShareIcon /> WhatsApp Message Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {copiedShareText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Message Text
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#e7f7ed] border border-emerald-200/90 rounded-xl p-3 text-slate-800 font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap select-all">
                {getShareInvoiceMessage(shareInvoiceTarget, shareRecipientName)}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadPDF(shareInvoiceTarget._id, shareInvoiceTarget.invoiceNumber)
                  }
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePrintInvoice(shareInvoiceTarget._id, shareInvoiceTarget.invoiceNumber)
                  }
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Direct Print"
                >
                  <PrinterIcon /> Print
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    type="button"
                    onClick={handleSystemShare}
                    className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Device System Share"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share App
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShareInvoiceTarget(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex-1 sm:flex-initial"
                >
                  <WhatsAppShareIcon /> Send on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: QUICK SHOP CONTACT UPDATE ================= */}
      {updatingShop && (
        <Modal
          isOpen={!!updatingShop}
          onClose={() => setUpdatingShop(null)}
          title={`Update Shop Details: ${updatingShop.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveShopUpdate} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Shop Name</label>
              <input
                type="text"
                disabled
                value={updatingShop.name || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={shopPhoneInput}
                onChange={(e) => setShopPhoneInput(e.target.value)}
                placeholder="Enter 10-digit mobile"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setUpdatingShop(null);
                  navigate(`/stores/${updatingShop._id}`);
                }}
                className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Shop Profile
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingShop(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shopSaving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs disabled:opacity-50"
                >
                  {shopSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: INVOICE HISTORY / AUDIT ================= */}
      {historyInvoice && (
        <Modal
          isOpen={!!historyInvoice}
          onClose={() => setHistoryInvoice(null)}
          title={`Invoice History - #${formatInvoiceNumber(historyInvoice.invoiceNumber)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-bold text-slate-800">{historyInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shop / Customer:</span>
                <span className="font-semibold text-slate-800">
                  {historyInvoice.customerId?.name || historyInvoice.storeId?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="text-slate-700">{formatInvoiceDate(historyInvoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Billed Amount:</span>
                <span className="font-bold text-slate-900">₹{formatAmount(historyInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-semibold text-emerald-600">₹{formatAmount(historyInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Due:</span>
                <span className="font-bold text-red-600">₹{formatAmount(historyInvoice.balanceAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Challan No:</span>
                <span className="font-mono text-slate-700">{historyInvoice.deliveryChallanNo || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-semibold">{historyInvoice.status}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryInvoice(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: RETURN REQUEST ================= */}
      {returnInvoiceTarget && (
        <Modal
          isOpen={!!returnInvoiceTarget}
          onClose={() => setReturnInvoiceTarget(null)}
          title={`Request Return (Credit Note)`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600">
              Initiate a stock return and generate a Credit Note against Invoice{' '}
              <strong className="text-slate-900 font-mono">
                {returnInvoiceTarget.invoiceNumber}
              </strong>{' '}
              for <strong className="text-slate-900">{returnInvoiceTarget.customerId?.name || returnInvoiceTarget.storeId?.name || 'Customer / Shop'}</strong>.
            </p>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-800 text-xs">
              Would you like to open the Returns module to select items and reasons for return?
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnInvoiceTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = returnInvoiceTarget;
                  setReturnInvoiceTarget(null);
                  navigate(`/returns?invoiceId=${target._id}`);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                Proceed to Returns
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: REMOVE REQUEST ================= */}
      {removeInvoiceTarget && (
        <Modal
          isOpen={!!removeInvoiceTarget}
          onClose={() => setRemoveInvoiceTarget(null)}
          title="Request to Remove Invoice"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Confirmation Required</div>
                <div className="text-xs mt-0.5">
                  Request removal of invoice{' '}
                  <span className="font-mono font-bold">{removeInvoiceTarget.invoiceNumber}</span>.
                  Once approved by Owner, it will be unlinked from inventory ledgers.
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoveInvoiceTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRemoveInvoiceTarget(null);
                  showToast('Removal request submitted to administrator.');
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
              >
                Submit Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: VOID INVOICE ================= */}
      {voidInvoiceTarget && (
        <Modal
          isOpen={!!voidInvoiceTarget}
          onClose={() => setVoidInvoiceTarget(null)}
          title="Void Invoice Confirmation"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600">
              Are you sure you want to mark Invoice{' '}
              <strong className="text-slate-900 font-mono">
                {voidInvoiceTarget.invoiceNumber}
              </strong>{' '}
              as <strong>Void (Cancelled)</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidInvoiceTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={voiding}
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {voiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: INVOICE DETAIL & EDIT ================= */}
      {selectedInvoice && editInvoiceForm && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => {
            setSelectedInvoice(null);
            setEditInvoiceForm(null);
          }}
          title={`Bill of Supply: ${editInvoiceForm.invoiceNumber || selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4 text-xs bg-white p-2">
            {editInvoiceError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editInvoiceError}</span>
              </div>
            )}

            {/* Header / Bill Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-base font-bold text-teal-800">TAMIZH ENTERPRISES</div>
                <div className="text-[11px] text-slate-500">124, Goods Shed Road, Madurai - 625001</div>
                <div className="text-[11px] text-slate-600 font-mono">GSTIN: 33AABCT9988C1Z4</div>
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right bg-yellow-50/70 p-3 rounded-xl border border-yellow-200/80">
                <div className="font-bold text-slate-900 text-xs uppercase mb-1">
                  BILL OF SUPPLY / INVOICE NO
                </div>
                <div className="flex items-center sm:justify-end gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Bill #:</span>
                  <input
                    type="text"
                    value={editInvoiceForm.invoiceNumber}
                    onChange={(e) =>
                      setEditInvoiceForm((prev) => ({
                        ...prev,
                        invoiceNumber: e.target.value.toUpperCase()
                      }))
                    }
                    className="w-44 px-2.5 py-1 text-sm font-mono font-bold text-slate-900 bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. INV-2026-00002"
                  />
                </div>
                <div className="flex items-center sm:justify-end gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-slate-500">Date:</span>
                  <input
                    type="date"
                    value={editInvoiceForm.invoiceDate}
                    onChange={(e) =>
                      setEditInvoiceForm((prev) => ({ ...prev, invoiceDate: e.target.value }))
                    }
                    className="w-44 px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Party & Terms Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Billed To / Party */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  {selectedInvoice.customerId ? 'Customer / Billed To:' : 'Shop / Billed To:'}
                </label>
                {selectedInvoice.customerId ? (
                  <select
                    value={editInvoiceForm.customerId || ''}
                    onChange={(e) =>
                      setEditInvoiceForm((prev) => ({ ...prev, customerId: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={editInvoiceForm.storeId || ''}
                    onChange={(e) =>
                      setEditInvoiceForm((prev) => ({ ...prev, storeId: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select Retail Shop</option>
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.city ? `- ${s.city}` : ''}
                      </option>
                    ))}
                  </select>
                )}

                <div className="text-slate-500 mt-2 space-y-0.5 text-[11px]">
                  <div>
                    <span className="font-medium text-slate-600">Location:</span>{' '}
                    {selectedInvoice.customerId?.address ||
                      selectedInvoice.storeId?.address ||
                      selectedInvoice.storeId?.city ||
                      'Tamil Nadu'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Phone:</span>{' '}
                    {selectedInvoice.customerId?.phone || selectedInvoice.storeId?.phone || '-'}
                  </div>
                  <div className="font-mono">
                    <span className="font-medium text-slate-600">GSTIN:</span>{' '}
                    {selectedInvoice.customerId?.gstNumber ||
                      selectedInvoice.storeId?.gstNumber ||
                      'URP'}
                  </div>
                </div>
              </div>

              {/* Payment & Dispatch */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Payment & Dispatch:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Sale Terms:
                    </label>
                    <select
                      value={editInvoiceForm.saleType}
                      onChange={(e) =>
                        setEditInvoiceForm((prev) => ({ ...prev, saleType: e.target.value }))
                      }
                      className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Credit">Credit</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Status:
                    </label>
                    <select
                      value={editInvoiceForm.status}
                      onChange={(e) =>
                        setEditInvoiceForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled (Void)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                    Delivery Challan:
                  </label>
                  <input
                    type="text"
                    value={editInvoiceForm.deliveryChallanNo}
                    onChange={(e) =>
                      setEditInvoiceForm((prev) => ({
                        ...prev,
                        deliveryChallanNo: e.target.value
                      }))
                    }
                    className="w-full px-2 py-1 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. DC-INV-2026-00002"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table with Inline Editing */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                  Line Items ({editInvoiceForm.items.length})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Editable QTY, Rate, HSN & GST %
                </span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24">HSN</th>
                      <th className="p-2.5 w-20 text-right">Qty</th>
                      <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">Taxable (₹)</th>
                      <th className="p-2.5 w-16 text-center">GST</th>
                      <th className="p-2.5 text-right">Tax (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {editInvoiceForm.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) => handleEditItemChange(idx, 'hsnCode', e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-xs font-mono border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-right font-bold text-xs bg-yellow-50 border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.unitPrice}
                            onChange={(e) => handleEditItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-right font-mono font-bold text-xs bg-yellow-50 border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium">
                          ₹{Number(item.taxableValue).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleEditItemChange(idx, 'gstRate', e.target.value)}
                            className="px-1 py-0.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          ₹{Number(item.taxAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                          ₹{Number(item.total).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(idx)}
                            title="Remove product"
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add More Products to this invoice */}
              <div className="bg-slate-50 p-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700">Add Product:</span>
                <select
                  value={addEditProductId}
                  onChange={(e) => setAddEditProductId(e.target.value)}
                  className="flex-1 min-w-[200px] px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Choose Product to Add --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (₹{p.dealerPrice || p.sellingPrice || p.mrp})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!addEditProductId}
                  onClick={handleAddProductToEditInvoice}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px]">
                CGST: ₹{editCalculatedTotals.cgst.toFixed(2)} &bull; SGST: ₹
                {editCalculatedTotals.sgst.toFixed(2)}
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-xs">
                  Taxable Value:{' '}
                  <span className="font-bold text-slate-800">
                    ₹{editCalculatedTotals.taxable.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs">
                  GST Tax:{' '}
                  <span className="font-bold text-slate-800">
                    ₹{editCalculatedTotals.tax.toFixed(2)}
                  </span>
                </div>
                <div className="text-base font-extrabold text-blue-700">
                  Grand Total: ₹{formatAmount(editCalculatedTotals.grand)}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setEditInvoiceForm(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadPDF(selectedInvoice._id, editInvoiceForm.invoiceNumber)
                  }
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePrintInvoice(selectedInvoice._id, editInvoiceForm.invoiceNumber)
                  }
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PrinterIcon /> Print
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenShareModal(selectedInvoice)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  type="button"
                  disabled={isSavingEditInvoice}
                  onClick={handleSaveInvoiceEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSavingEditInvoice ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      {/* ================= MODAL: QUICK ADD CUSTOMER / SHOP ================= */}
      {isNewCustomerModalOpen && (
        <Modal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          title={billingType === 'customer' ? 'Add New Customer' : 'Add New Retail Shop'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleQuickCreateCustomer} className="space-y-4 pt-1">
            {newCustomerError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{newCustomerError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {billingType === 'customer' ? 'Customer Name *' : 'Shop Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={billingType === 'customer' ? 'e.g. Sudha' : 'e.g. Sri Balaji Supermarket'}
                value={newCustomerForm.name}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9841433607"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chennai"
                  value={newCustomerForm.city}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, city: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {billingType === 'store' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner / Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Murugan"
                  value={newCustomerForm.ownerName}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, ownerName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {billingType === 'customer' ? 'Customer Address' : 'Shop Address'}
              </label>
              <input
                type="text"
                placeholder={billingType === 'customer' ? 'e.g. 15, Anna Nagar, Chennai' : 'e.g. 12 Bazaar Street'}
                value={newCustomerForm.address}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={newCustomerForm.gstNumber}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, gstNumber: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingNewCustomer}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingNewCustomer ? 'Saving...' : billingType === 'customer' ? 'Add Customer' : 'Add Shop'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Invoices;
