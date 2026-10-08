import React, { useState } from 'react';
import { CheckCircle2, FileText, Download, Printer, Share2, ArrowRight, Truck, Store } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../api/client';

const InvoiceSuccessModal = ({
  isOpen,
  onClose,
  invoiceData,
  onViewAllInvoices
}) => {
  const [downloading, setDownloading] = useState(false);
  if (!invoiceData) return null;

  const { invoice, order, invoiceNumber, grandTotal } = invoiceData;
  const store = invoice?.storeId;
  const invId = invoice?._id;
  const invNumber = invoice?.invoiceNumber || invoiceNumber;
  const total = invoice?.grandTotal || grandTotal || 0;

  const handleDownloadPDF = async () => {
    if (!invId) return;
    try {
      setDownloading(true);
      const res = await api.get(`/invoices/${invId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tax-Invoice-${invNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Download error:', err);
      const token = localStorage.getItem('tamil_erp_token');
      if (token) {
        window.open(`/api/invoices/${invId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `வணக்கம் / Hello ${store?.name || 'Customer'},\n\nTamizh Enterprises has issued Tax Invoice *${invNumber}* for *₹${Number(total).toLocaleString('en-IN')}*.\nDue Date: ${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Immediate'}\nChallan No: ${invoice?.deliveryChallanNo || ''}\n\nThank you for your business!`
    );
    const phone = store?.phone ? store.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Transferred & Tax Invoice Generated"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              Transfer Successful & Bill Generated!
            </h4>
            <p className="text-emerald-800 text-xs mt-0.5">
              Warehouse stock deducted and logged to stock ledger. Official GST Tax Invoice has been generated for retail store dispatch.
            </p>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Invoice Number</span>
              <div className="text-base font-extrabold text-slate-900 font-mono">{invNumber}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Bill Amount</span>
              <div className="text-base font-extrabold text-teal-700 font-mono">
                ₹ {Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Destination Store:</span>
              <strong className="text-slate-800">{store?.name || 'Retail Client'}</strong>
              <div className="text-slate-500">{store?.city} &bull; {store?.phone}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Payment Terms:</span>
              <strong className="text-slate-800">{invoice?.saleType || 'Credit'}</strong>
              <div className="text-slate-500">Challan: {invoice?.deliveryChallanNo || 'Generated'}</div>
            </div>
          </div>

          {invoice?.items && invoice.items.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Dispatched Items ({invoice.items.length} SKUs):
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-100">
                    <span className="font-medium text-slate-800 truncate mr-2">{item.name}</span>
                    <span className="font-bold text-teal-700 font-mono whitespace-nowrap">
                      {item.quantity} units @ ₹{item.unitPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" /> Download / Print PDF
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" /> Send via WhatsApp
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl transition-colors text-center"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceSuccessModal;
