import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar, TrendingUp, AlertOctagon, CheckCircle2, IndianRupee } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import { TableSkeleton } from '../components/common/Skeleton';

const Reports = () => {
  const [reportType, setReportType] = useState('sales'); // 'sales', 'product-perf', 'store-perf', 'mfg-perf'
  const [salesGroupBy, setSalesGroupBy] = useState('store'); // 'store', 'product', 'brand', 'salesman'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType, salesGroupBy]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = '/reports/sales?groupBy=' + salesGroupBy;
      if (reportType === 'product-perf') url = '/reports/product-performance';
      if (reportType === 'store-perf') url = '/reports/store-performance';
      if (reportType === 'mfg-perf') url = '/reports/manufacturer-performance';

      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TamilEnterprises_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Executive Analytics & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store velocity &bull; Fast/Slow/Dead stock classification &bull; Margin analytics &bull; Brand contribution
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Dimension Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setReportType('sales')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'sales'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales & Collections
        </button>
        <button
          onClick={() => setReportType('product-perf')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'product-perf'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Product Fast/Slow/Dead Stock
        </button>
        <button
          onClick={() => setReportType('store-perf')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'store-perf'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Retail Store Growth & AOV
        </button>
        <button
          onClick={() => setReportType('mfg-perf')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'mfg-perf'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manufacturer & Brand Margins
        </button>
      </div>

      {/* Sub-grouping for Sales */}
      {reportType === 'sales' && (
        <div className="flex items-center gap-2 no-print">
          <span className="text-xs text-slate-500 font-medium">Group Report By:</span>
          {['store', 'product', 'brand', 'salesman'].map((dim) => (
            <button
              key={dim}
              onClick={() => setSalesGroupBy(dim)}
              className={`px-3 py-1 rounded-md text-xs font-medium uppercase border ${
                salesGroupBy === dim
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      )}

      {/* Table Content */}
      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            {/* 1. SALES REPORT */}
            {reportType === 'sales' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Dimension ({salesGroupBy})</th>
                    <th className="py-3 px-3 text-right">Invoices / Orders</th>
                    {salesGroupBy === 'product' || salesGroupBy === 'brand' ? (
                      <th className="py-3 px-3 text-right">Total Units Sold</th>
                    ) : null}
                    <th className="py-3 px-3 text-right">GST Tax</th>
                    <th className="py-3 px-3 text-right">Grand Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {row.invoiceCount || row.orderCount || 1}
                      </td>
                      {row.quantity !== undefined && (
                        <td className="py-3 px-3 text-right font-bold text-teal-700">{row.quantity} units</td>
                      )}
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                        ₹ {Number(row.taxTotal || row.tax || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(row.grandTotal || row.revenue || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. PRODUCT PERFORMANCE */}
            {reportType === 'product-perf' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Product Name & Brand</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3 text-right">Current Stock</th>
                    <th className="py-3 px-3 text-right">90-Day Sold Qty</th>
                    <th className="py-3 px-3 text-right">Margin %</th>
                    <th className="py-3 px-3 text-center">Velocity Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{row.name}</div>
                        <div className="text-[10px] text-slate-400">{row.brand} &bull; {row.manufacturer}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">{row.sku}</td>
                      <td className="py-3 px-3 text-right font-medium">{row.currentStock} units</td>
                      <td className="py-3 px-3 text-right font-bold text-teal-800">{row.soldQty90d} units</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">{row.marginPercent}%</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.movementType === 'Fast Moving'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.movementType === 'Medium Moving'
                              ? 'bg-teal-100 text-teal-800'
                              : row.movementType === 'Slow Moving'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.movementType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. STORE PERFORMANCE */}
            {reportType === 'store-perf' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Retail Store Name</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Assigned Salesman</th>
                    <th className="py-3 px-3 text-right">Orders Count</th>
                    <th className="py-3 px-3 text-right">Average Order Value (AOV)</th>
                    <th className="py-3 px-3 text-right">Total Revenue Billed</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((row) => (
                    <tr key={row.storeId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-3 px-3 text-slate-600">{row.city}</td>
                      <td className="py-3 px-3 text-slate-600">{row.salesman}</td>
                      <td className="py-3 px-3 text-right font-bold">{row.orderCount}</td>
                      <td className="py-3 px-3 text-right font-medium text-teal-800">
                        ₹ {Number(row.averageOrderValue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(row.totalRevenue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-700">
                        ₹ {Number(row.outstandingBalance).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. MANUFACTURER PERFORMANCE */}
            {reportType === 'mfg-perf' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Manufacturer / Brand</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3 text-right">Total Goods Purchased</th>
                    <th className="py-3 px-3 text-right">Total Sales Revenue</th>
                    <th className="py-3 px-3 text-right">Estimated Gross Margin</th>
                    <th className="py-3 px-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((row) => (
                    <tr key={row.manufacturerId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{row.code}</td>
                      <td className="py-3 px-3 text-right font-medium">
                        ₹ {Number(row.totalPurchased).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(row.salesRevenue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-teal-800">
                        ₹ {Number(row.estimatedMargin).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                        {row.marginPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;
