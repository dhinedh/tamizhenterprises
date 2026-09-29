import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Printer, Search, IndianRupee, Eye, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices?search=${search}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (invoiceId, invoiceNumber) => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  const shareWhatsApp = (inv) => {
    const text = encodeURIComponent(
      `வணக்கம் / Hello ${inv.storeId?.name || 'Customer'},\n\nTamil Enterprises has issued Tax Invoice *${inv.invoiceNumber}* for ₹${Number(inv.grandTotal).toLocaleString('en-IN')}.\nDue Date: ${new Date(inv.dueDate).toLocaleDateString('en-IN')}\nBalance Payable: *₹${Number(inv.balanceAmount).toLocaleString('en-IN')}*\n\nPayment via UPI: tamilenterprises@hdfcbank\nThank you for your business!`
    );
    const phone = inv.storeId?.phone ? inv.storeId.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Sales & GST Tax Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GST-compliant B2B Tax Invoices &bull; CGST/SGST/IGST Schedules &bull; E-Way Bill &bull; PDF & WhatsApp Sharing
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search invoices by invoice number or e-Way bill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs"
        />
      </div>

      {/* Invoices List */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Invoice Number</th>
                  <th className="py-3 px-3">Shop Name</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Taxable Subtotal</th>
                  <th className="py-3 px-3 text-right">GST Tax</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                        {inv.eWayBillNo && (
                          <div className="text-[10px] text-teal-600 font-normal">EWB: {inv.eWayBillNo}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{inv.storeId?.name}</div>
                        <div className="text-[10px] text-slate-400">GST: {inv.storeId?.gstNumber || 'Unregistered'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        ₹ {Number(inv.taxableSubtotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        ₹ {Number(inv.taxTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹ {Number(inv.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${inv.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          ₹ {Number(inv.balanceAmount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="View GST Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                            title="Download PDF Tax Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => shareWhatsApp(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Share on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Detail / Print Preview Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs bg-white p-2">
            {/* Header / Bill Details */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="text-base font-bold text-teal-800">TAMIL ENTERPRISES</div>
                <div className="text-[11px] text-slate-500">124, Goods Shed Road, Madurai - 625001</div>
                <div className="text-[11px] text-slate-600 font-mono">GSTIN: 33AABCT9988C1Z4</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">TAX INVOICE</div>
                <div className="font-mono text-xs font-semibold">{selectedInvoice.invoiceNumber}</div>
                <div className="text-slate-500">Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Customer / Billed To:</span>
                <div className="font-semibold text-slate-900">{selectedInvoice.storeId?.name}</div>
                <div className="text-slate-500">{selectedInvoice.storeId?.city}, Tamil Nadu</div>
                <div className="text-slate-500 font-mono">GSTIN: {selectedInvoice.storeId?.gstNumber || 'URP'}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block mb-1">Payment & Dispatch:</span>
                <div>Sale Terms: <span className="font-semibold">{selectedInvoice.saleType}</span></div>
                <div>Status: <span className="font-semibold">{selectedInvoice.status}</span></div>
                <div>Challan: <span className="font-mono">{selectedInvoice.deliveryChallanNo || '-'}</span></div>
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
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 font-mono text-[10px]">{item.hsnCode}</td>
                      <td className="p-2 text-right font-bold">{item.quantity} {item.freeQuantity ? `(+${item.freeQuantity})` : ''}</td>
                      <td className="p-2 text-right font-mono">₹{item.unitPrice}</td>
                      <td className="p-2 text-right font-mono">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="p-2 text-center">{item.gstRate}%</td>
                      <td className="p-2 text-right font-mono">₹{(item.taxAmount || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">
                CGST: ₹{Number(selectedInvoice.cgstTotal || 0).toFixed(2)} &bull; SGST: ₹{Number(selectedInvoice.sgstTotal || 0).toFixed(2)}
              </div>
              <div className="text-right space-y-0.5">
                <div>Taxable Value: <span className="font-bold">₹ {Number(selectedInvoice.taxableSubtotal).toFixed(2)}</span></div>
                <div>GST Tax: <span className="font-bold">₹ {Number(selectedInvoice.taxTotal).toFixed(2)}</span></div>
                <div className="text-base font-extrabold text-teal-800">
                  Grand Total: ₹ {Number(selectedInvoice.grandTotal).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber)}
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

export default Invoices;
