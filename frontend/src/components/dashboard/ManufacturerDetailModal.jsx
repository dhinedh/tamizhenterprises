import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Building2,
  Package,
  Boxes,
  ShoppingBag,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Globe
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { sortProducts } from '../../utils/productSorter';

const ManufacturerDetailModal = ({ manufacturer, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !manufacturer) return null;

  const products = manufacturer.products || [];
  const filteredProducts = sortProducts(
    products.filter(p =>
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const purchases = manufacturer.recentPurchases || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-5xl border border-slate-200 z-10 my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-12">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold text-xl flex-shrink-0 shadow-inner">
                  {manufacturer.code ? manufacturer.code.substring(0, 3) : <Building2 className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {manufacturer.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 tracking-wider">
                      {manufacturer.code}
                    </span>
                    {(manufacturer.code === 'FEMI9' || manufacturer.name?.toLowerCase().includes('femi9') || manufacturer.website?.toLowerCase().includes('femi9')) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Featured Healthcare Partner
                      </span>
                    )}
                    {(manufacturer.code === 'MANSARA' || manufacturer.name?.toLowerCase().includes('mansara') || manufacturer.website?.toLowerCase().includes('mansara')) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Traditional Agro & Foods
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5">
                    {manufacturer.website && (
                      <a
                        href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-teal-300 hover:text-white underline underline-offset-2"
                      >
                        <Globe className="w-3.5 h-3.5 text-teal-400" /> {manufacturer.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {manufacturer.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" /> {manufacturer.city}, {manufacturer.state || 'Tamil Nadu'}
                      </span>
                    )}
                    {manufacturer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-teal-400" /> {manufacturer.phone}
                      </span>
                    )}
                    {manufacturer.gstNumber && (
                      <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                        GSTIN: {manufacturer.gstNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {manufacturer.website && (
                  <a
                    href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/20"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-300" /> Visit Website
                  </a>
                )}
                <Link
                  to={`/products?manufacturer=${manufacturer.code}`}
                  onClick={onClose}
                  className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Catalog
                </Link>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Total SKUs</div>
                <div className="text-xl font-bold text-white mt-0.5">{manufacturer.productsCount || 0} Products</div>
                <div className="text-[11px] text-teal-300 mt-0.5">{manufacturer.totalPhysicalStock || 0} units in warehouse</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Stock Valuation</div>
                <div className="text-xl font-bold text-emerald-300 mt-0.5">
                  ₹ {Number(manufacturer.stockValuation || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">At purchase cost</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Total Procurement</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  ₹ {Number(manufacturer.totalPurchased || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">From {purchases.length} recorded POs</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Outstanding Payable</div>
                <div className="text-xl font-bold text-amber-300 mt-0.5">
                  ₹ {Number(manufacturer.currentOutstanding || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-amber-200 mt-0.5">Terms: {manufacturer.creditPeriodDays || 21} Days Credit</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 bg-slate-50">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Products & Live Stock ({products.length})
              </button>

              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'purchases'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Procurement / PO History ({purchases.length})
              </button>

              <button
                onClick={() => setActiveTab('details')}
                className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Manufacturer Info & Bank Details
              </button>
            </div>

            {activeTab === 'products' && (
              <div className="relative my-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter SKUs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-48"
                />
              </div>
            )}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'products' && (
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No products found matching your filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-3.5">SKU & Item Name</th>
                          <th className="py-3 px-3 text-right">Physical Stock</th>
                          <th className="py-3 px-3 text-right">Available Stock</th>
                          <th className="py-3 px-3 text-right">Purchase Price</th>
                          <th className="py-3 px-3 text-right">MRP</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center">Warehouse Bay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((p) => {
                          const stock = p.stock || {};
                          const avail = stock.availableStock ?? 0;
                          const current = stock.currentStock ?? 0;
                          const isLow = avail <= (p.minStockAlert || 20);
                          const isOut = avail === 0;

                          return (
                            <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3.5">
                                <div className="font-semibold text-slate-900">{p.name}</div>
                                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                  SKU: {p.sku} &bull; HSN: {p.hsnCode}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-slate-900">
                                {current} <span className="text-slate-400 text-[10px]">{p.unit}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                                  {avail}
                                </span>
                                <span className="text-slate-400 text-[10px] ml-1">{p.unit}</span>
                                {stock.reservedStock > 0 && (
                                  <div className="text-[10px] text-slate-400">({stock.reservedStock} res.)</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600 font-mono">
                                ₹{Number(p.purchasePrice || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-700 font-mono">
                                ₹{Number(p.mrp || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isOut ? (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                                    Out of Stock
                                  </span>
                                ) : isLow ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Low Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium text-[10px]">
                                    In Stock
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                                {stock.warehouseLocation ? stock.warehouseLocation.replace('Warehouse Main - ', '') : 'Bay Default'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="space-y-4">
                {purchases.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-700">No Purchase Orders Recorded Yet</p>
                    <p className="text-xs text-slate-500 mt-1">No recorded purchase orders for this manufacturer.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-3.5">PO Number</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3 text-right">Grand Total</th>
                          <th className="py-3 px-3 text-center">Receipt Status</th>
                          <th className="py-3 px-3 text-center">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchases.map((po) => (
                          <tr key={po._id} className="hover:bg-slate-50">
                            <td className="py-3 px-3.5 font-bold font-mono text-slate-900">
                              {po.poNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ₹ {Number(po.grandTotal || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <StatusBadge status={po.status} />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                po.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : po.paymentStatus === 'Partially Paid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {po.paymentStatus || 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Info */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-teal-800">
                    <Building2 className="w-4 h-4" /> Commercial & Contact Details
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-slate-200/60">
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-semibold text-slate-800">{manufacturer.contactPerson || 'Direct Dispatch Desk'}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-semibold text-slate-800">{manufacturer.phone || '-'}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-semibold text-slate-800">{manufacturer.email || '-'}</span>
                    </div>
                    {manufacturer.website && (
                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-slate-500">Website:</span>
                        <a
                          href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {manufacturer.website}
                        </a>
                      </div>
                    )}
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">GST Registration:</span>
                      <span className="font-mono font-semibold text-slate-900">{manufacturer.gstNumber || '-'}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="text-right text-slate-700 max-w-xs">{manufacturer.address || `${manufacturer.city}, ${manufacturer.state}`}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Credit Period:</span>
                      <span className="font-bold text-amber-700">{manufacturer.creditPeriodDays || 21} Days</span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-teal-800">
                    <CreditCard className="w-4 h-4" /> Settlement Bank Account
                  </h4>
                  {manufacturer.bankDetails ? (
                    <div className="space-y-2 text-xs divide-y divide-slate-200/60">
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">Bank Name:</span>
                        <span className="font-semibold text-slate-800">{manufacturer.bankDetails.bankName || '-'}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">Account Number:</span>
                        <span className="font-mono font-bold text-slate-900">{manufacturer.bankDetails.accountNumber || '-'}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">IFSC Code:</span>
                        <span className="font-mono font-semibold text-teal-800">{manufacturer.bankDetails.ifscCode || '-'}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">Branch:</span>
                        <span className="text-slate-700">{manufacturer.bankDetails.branch || '-'}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">Current Outstanding:</span>
                        <span className="font-bold text-rose-700">₹ {Number(manufacturer.currentOutstanding || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4">No bank account mapped for this manufacturer.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tamizh Enterprises Distribution ERP &bull; Manufacturer Profile #{manufacturer.code}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDetailModal;
