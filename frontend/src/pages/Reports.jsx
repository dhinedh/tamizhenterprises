import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Calendar,
  Search,
  Download,
  Eye,
  ChevronsUpDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Banknote,
  Hourglass,
  Clock,
  ArrowUpDown,
  ExternalLink,
  Phone
} from 'lucide-react';
import api from '../api/client';
import Modal from '../components/common/Modal';

const Reports = () => {
  const navigate = useNavigate();

  // Master Data & Summary
  const [reportData, setReportData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_shop_sales_report');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [summary, setSummary] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamil_erp_shop_sales_summary');
      return saved ? JSON.parse(saved) : {
        totalShopsCount: 0,
        shopsWithSales: 0,
        totalInvoicesCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalDue: 0
      };
    } catch {
      return {
        totalShopsCount: 0,
        shopsWithSales: 0,
        totalInvoicesCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalDue: 0
      };
    }
  });
  const [loading, setLoading] = useState(reportData.length === 0);

  // Filter Form State
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    return firstDay.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return lastDay.toISOString().slice(0, 10);
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [searchShopQuery, setSearchShopQuery] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('This Month');

  // Table pagination & sorting & search
  const [tableSearch, setTableSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('billed');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal: View Shop Invoice Details
  const [selectedShopDetail, setSelectedShopDetail] = useState(null);

  useEffect(() => {
    fetchShopReport();
  }, []);

  const fetchShopReport = async (customStart, customEnd, customStatus) => {
    try {
      if (reportData.length === 0) {
        setLoading(true);
      }
      const start = customStart !== undefined ? customStart : fromDate;
      const end = customEnd !== undefined ? customEnd : toDate;
      const status = customStatus !== undefined ? customStatus : paymentStatusFilter;

      let query = `?startDate=${start}&endDate=${end}`;
      if (status && status !== 'All') {
        query += `&status=${status}`;
      }

      const res = await api.get(`/reports/shop-sales${query}`);
      if (res.data.success) {
        setReportData(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        try {
          sessionStorage.setItem('tamil_erp_shop_sales_report', JSON.stringify(res.data.data || []));
          if (res.data.summary) {
            sessionStorage.setItem('tamil_erp_shop_sales_summary', JSON.stringify(res.data.summary));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to fetch shop report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Date Preset Handlers
  const handleDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'Today') {
      const todayStr = now.toISOString().slice(0, 10);
      start = todayStr;
      end = todayStr;
    } else if (preset === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      start = monday.toISOString().slice(0, 10);
      end = new Date().toISOString().slice(0, 10);
    } else if (preset === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = firstDay.toISOString().slice(0, 10);
      end = lastDay.toISOString().slice(0, 10);
    } else if (preset === 'This Year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      start = firstDay.toISOString().slice(0, 10);
      end = lastDay.toISOString().slice(0, 10);
    } else if (preset === 'All Time') {
      start = '2020-01-01';
      end = '2030-12-31';
    }

    setFromDate(start);
    setToDate(end);
    fetchShopReport(start, end, paymentStatusFilter);
  };

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    fetchShopReport(fromDate, toDate, paymentStatusFilter);
  };

  // Format amount with currency symbol
  const formatAmount = (num) => {
    return Number(num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date helper DD/MMM/YYYY
  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}/${months[d.getMonth()]}/${d.getFullYear()}`;
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = ['Shop Name', 'Shop Code', 'Mobile', 'Category', 'Invoices Count', 'Billed Amount (INR)', 'Received Amount (INR)', 'Due Amount (INR)', 'Status'];
    const rows = filteredShops.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.code}"`,
      `"${s.phone}"`,
      `"${s.category}"`,
      s.invoicesCount,
      s.billed.toFixed(2),
      s.received.toFixed(2),
      s.due.toFixed(2),
      `"${s.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Shop_Sales_Payment_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Shops
  const filteredShops = useMemo(() => {
    let list = [...reportData];

    // Search query from top filter bar
    if (searchShopQuery.trim()) {
      const q = searchShopQuery.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.code || '').toLowerCase().includes(q)
      );
    }

    // In-table search query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.code || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q) ||
          (s.status || '').toLowerCase().includes(q) ||
          String(s.billed).includes(q) ||
          String(s.due).includes(q)
      );
    }

    list.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'shop':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'mobile':
          valA = (a.phone || '').toLowerCase();
          valB = (b.phone || '').toLowerCase();
          break;
        case 'category':
          valA = (a.category || '').toLowerCase();
          valB = (b.category || '').toLowerCase();
          break;
        case 'invoices':
          valA = a.invoicesCount || 0;
          valB = b.invoicesCount || 0;
          break;
        case 'billed':
          valA = a.billed || 0;
          valB = b.billed || 0;
          break;
        case 'received':
          valA = a.received || 0;
          valB = b.received || 0;
          break;
        case 'due':
          valA = a.due || 0;
          valB = b.due || 0;
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = a.billed || 0;
          valB = b.billed || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [reportData, searchShopQuery, tableSearch, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredShops.length / pageSize) || 1;
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShops.slice(start, start + pageSize);
  }, [filteredShops, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Shop Icon, Title and Subtitle matching screenshot */}
      <div className="flex items-center gap-3.5 pt-1">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-2xs">
          <Store className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
            Shop Report — Sales & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
            Invoice and payment detail for every shop, at a glance.
          </p>
        </div>
      </div>

      {/* 2. Top Filter Card matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-4">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* FROM Date */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              From
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveDatePreset('');
                }}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* TO Date */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              To
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveDatePreset('');
                }}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* PAYMENT STATUS */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Not Paid">Not Paid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          {/* SEARCH SHOP */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Search Shop
            </label>
            <input
              type="text"
              placeholder="Name / mobile / ID"
              value={searchShopQuery}
              onChange={(e) => setSearchShopQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Apply Button */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Apply</span>
            </button>
          </div>
        </form>

        {/* Quick Date Range Pills row matching screenshot */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
          {['Today', 'This Week', 'This Month', 'This Year', 'All Time'].map((preset) => {
            const isActive = activeDatePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleDatePreset(preset)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4338ca] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Four Metric Stat Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: SHOPS WITH SALES */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Store className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Shops With Sales
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.shopsWithSales}
          </div>
          <div className="text-xs text-slate-400 font-normal">
            of {summary.totalShopsCount} shown
          </div>
        </div>

        {/* Card 2: TOTAL INVOICES */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <FileText className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Invoices
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalInvoicesCount}
          </div>
          <div className="text-xs text-slate-400 font-normal">
            in selected range
          </div>
        </div>

        {/* Card 3: TOTAL RECEIVED */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Banknote className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Received
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{Number(summary.totalReceived).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 font-normal">
            of ₹{Number(summary.totalBilled).toLocaleString('en-IN')} billed
          </div>
        </div>

        {/* Card 4: TOTAL DUE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Hourglass className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Due
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{Number(summary.totalDue).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 font-normal">
            outstanding
          </div>
        </div>
      </div>

      {/* 4. Table Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
        {/* Table Title & Export Excel Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 stroke-[2]" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Shop-wise Sales & Payment Summary
            </h2>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Show Entries & Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 font-normal">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs sm:text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 text-xs sm:text-sm">Search:</label>
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold text-xs select-none">
              <tr>
                <th
                  onClick={() => handleSort('shop')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>SHOP</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('mobile')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>MOBILE</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>CATEGORY</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('invoices')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>INVOICES</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('billed')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>BILLED</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('received')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>RECEIVED</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('due')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>DUE</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 whitespace-nowrap text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>STATUS</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>DETAIL</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                    Loading shop sales & payment records...
                  </td>
                </tr>
              ) : paginatedShops.length > 0 ? (
                paginatedShops.map((shop) => (
                  <tr key={shop.storeId} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. SHOP */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {shop.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {shop.code}
                      </div>
                    </td>

                    {/* 2. MOBILE */}
                    <td className="py-4 px-4 align-top text-slate-700 whitespace-nowrap">
                      {shop.phone ? (shop.phone.startsWith('+91') ? shop.phone : `+91 ${shop.phone}`) : 'N/A'}
                    </td>

                    {/* 3. CATEGORY */}
                    <td className="py-4 px-4 align-top text-slate-700 uppercase font-medium text-xs whitespace-nowrap">
                      {shop.category}
                    </td>

                    {/* 4. INVOICES */}
                    <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 rounded-full border border-indigo-100">
                        {shop.invoicesCount}
                      </span>
                    </td>

                    {/* 5. BILLED */}
                    <td className="py-4 px-4 align-top whitespace-nowrap font-normal text-slate-900">
                      ₹{formatAmount(shop.billed)}
                    </td>

                    {/* 6. RECEIVED */}
                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <span className="inline-block px-3 py-1 text-xs font-bold text-[#10b981] bg-[#ecfdf5] rounded-full">
                        ₹{formatAmount(shop.received)}
                      </span>
                    </td>

                    {/* 7. DUE */}
                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <span className="inline-block px-3 py-1 text-xs font-bold text-[#ef4444] bg-[#fef2f2] rounded-full">
                        ₹{formatAmount(shop.due)}
                      </span>
                    </td>

                    {/* 8. STATUS */}
                    <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                      {shop.status === 'Paid' ? (
                        <span className="inline-block px-3.5 py-1 text-xs font-bold text-[#10b981] bg-[#ecfdf5] rounded-full">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block px-3.5 py-1 text-xs font-bold text-[#ef4444] bg-[#fef2f2] rounded-full">
                          Not Paid
                        </span>
                      )}
                    </td>

                    {/* 9. DETAIL */}
                    <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedShopDetail(shop)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#4f46e5] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No shops found in the selected range and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
          <div>
            Showing {filteredShops.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredShops.length)} of {filteredShops.length} entries
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
                          ? 'bg-[#4338ca] text-white shadow-xs'
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

      {/* ================= MODAL: SHOP DETAIL & INVOICES BREAKDOWN ================= */}
      {selectedShopDetail && (
        <Modal
          isOpen={!!selectedShopDetail}
          onClose={() => setSelectedShopDetail(null)}
          title={`Sales & Payments Breakdown: ${selectedShopDetail.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Store Quick Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 text-xs block">Shop Code</span>
                <span className="font-mono font-bold text-slate-800">{selectedShopDetail.code}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Mobile</span>
                <span className="font-medium text-slate-800">{selectedShopDetail.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Category</span>
                <span className="font-medium text-slate-800">{selectedShopDetail.category}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Status</span>
                <span className={`font-bold text-xs ${selectedShopDetail.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedShopDetail.status}
                </span>
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 text-center">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Total Billed</span>
                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                  ₹{formatAmount(selectedShopDetail.billed)}
                </div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-center">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Received</span>
                <div className="text-base font-extrabold text-emerald-900 mt-0.5">
                  ₹{formatAmount(selectedShopDetail.received)}
                </div>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 text-center">
                <span className="text-[11px] font-bold text-rose-600 uppercase">Outstanding Due</span>
                <div className="text-base font-extrabold text-rose-900 mt-0.5">
                  ₹{formatAmount(selectedShopDetail.due)}
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-2 pt-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Invoices in Selected Range ({selectedShopDetail.invoices?.length || 0})
              </div>

              {selectedShopDetail.invoices && selectedShopDetail.invoices.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Invoice No</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Billed</th>
                        <th className="py-2 px-3 text-right">Paid</th>
                        <th className="py-2 px-3 text-right">Balance</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedShopDetail.invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3">{formatDateDisplay(inv.invoiceDate)}</td>
                          <td className="py-2 px-3 text-right font-medium">₹{formatAmount(inv.grandTotal)}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">₹{formatAmount(inv.paidAmount)}</td>
                          <td className="py-2 px-3 text-right text-rose-600 font-bold">₹{formatAmount(inv.balanceAmount)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No invoices generated for this shop in the selected date range.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedShopDetail(null);
                  navigate(`/stores/${selectedShopDetail.storeId}`);
                }}
                className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Shop 360° Profile
              </button>

              <button
                type="button"
                onClick={() => setSelectedShopDetail(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs"
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

export default Reports;
