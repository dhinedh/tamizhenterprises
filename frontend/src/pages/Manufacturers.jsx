import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Factory, Plus, Search, Phone, Mail, MapPin, Eye, IndianRupee, PackagePlus, Boxes, ArrowRight, CheckCircle2, Package, Globe } from 'lucide-react';
import api from '../api/client';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { useManufacturer } from '../context/ManufacturerContext';
import QuickStockInwardModal from '../components/stock/QuickStockInwardModal';

const Manufacturers = () => {
  const navigate = useNavigate();
  const { activeManufacturer, setActiveManufacturer } = useManufacturer();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMfg, setSelectedMfg] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [successToast, setSuccessToast] = useState('');

  // Stock Inward Modal State
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [inwardMfg, setInwardMfg] = useState(null);
  const [inwardProduct, setInwardProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    gstNumber: '',
    creditPeriodDays: 30,
    openingBalance: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManufacturers();
    fetchAllProducts();
  }, [search]);

  const fetchAllProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setAllProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/manufacturers?search=${search}`);
      if (res.data.success) {
        setManufacturers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/manufacturers', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          code: '',
          contactPerson: '',
          phone: '',
          email: '',
          website: '',
          address: '',
          city: 'Chennai',
          state: 'Tamil Nadu',
          gstNumber: '',
          creditPeriodDays: 30,
          openingBalance: 0,
          notes: ''
        });
        fetchManufacturers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating manufacturer');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await api.get(`/manufacturers/${id}`);
      if (res.data.success) {
        setSelectedMfg(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Manufacturer & Supplier Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage principal companies, FMCG brands, procurement credit terms and payables
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Manufacturer
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search manufacturer by name, code, phone or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Total Active Suppliers:</span>
          <span className="font-bold text-slate-900">{manufacturers.length} Principal Brands</span>
        </div>
      </div>

      {/* Product Quantity & Stock Overview for Both Manufacturers */}
      {manufacturers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {manufacturers.map((mfg) => {
            const isFemi9 = mfg.code === 'FEMI9' || mfg.name?.toLowerCase().includes('femi9');
            const isMansara = mfg.code === 'MANSARA' || mfg.name?.toLowerCase().includes('mansara');
            const stockQty = mfg.totalPhysicalStock ?? mfg.totalAvailableStock ?? 0;

            return (
              <div
                key={mfg._id}
                onClick={() => {
                  setActiveManufacturer(mfg);
                  openDetails(mfg._id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isFemi9
                    ? 'bg-gradient-to-br from-pink-50/70 to-rose-50/30 border-pink-200 hover:border-pink-300'
                    : isMansara
                    ? 'bg-gradient-to-br from-amber-50/70 to-orange-50/30 border-amber-200 hover:border-amber-300'
                    : 'bg-gradient-to-br from-teal-50/70 to-emerald-50/30 border-teal-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-teal-600" />
                    {mfg.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-700">
                    {mfg.code}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Warehouse Stock Qty</div>
                    <div className="text-xl font-black text-slate-900 flex items-baseline gap-1 mt-0.5">
                      {Number(stockQty).toLocaleString('en-IN')}
                      <span className="text-xs font-semibold text-slate-500">units</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Active SKUs</div>
                    <div className="text-sm font-bold text-teal-800 mt-0.5">
                      {mfg.productsCount || 0} Products
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Stock Value: <strong className="text-emerald-700 font-semibold">₹ {Number(mfg.stockValuation || 0).toLocaleString('en-IN')}</strong></span>
                  <span className="text-teal-700 hover:underline flex items-center gap-0.5 font-medium">
                    Catalogue &rarr;
                  </span>
                </div>
              </div>
            );
          })}

          {/* Combined Inventory Total */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-slate-600" />
                Combined Inventory Total
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {manufacturers.length} Principal Brands
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">Total Quantity (All Brands)</div>
                <div className="text-xl font-black text-slate-900 flex items-baseline gap-1 mt-0.5">
                  {Number(manufacturers.reduce((acc, m) => acc + (m.totalPhysicalStock ?? m.totalAvailableStock ?? 0), 0)).toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-slate-500">units</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Total SKUs</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {manufacturers.reduce((acc, m) => acc + (m.productsCount || 0), 0)} SKUs
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Total Valuation: <strong className="text-emerald-700 font-semibold">₹ {Number(manufacturers.reduce((acc, m) => acc + (m.stockValuation || 0), 0)).toLocaleString('en-IN')}</strong></span>
              <Link to="/stock-management" className="text-teal-700 hover:underline flex items-center gap-0.5 font-medium">
                Overall Stock &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <Card>
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">Manufacturer</th>
                  <th className="py-3 px-3">Code / GSTIN</th>
                  <th className="py-3 px-3">Products & Stock Qty</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">Credit Terms</th>
                  <th className="py-3 px-3 text-right">Payable Outstanding</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {manufacturers.length > 0 ? (
                  manufacturers.map((mfg) => (
                    <tr key={mfg._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div
                          className="cursor-pointer hover:text-teal-700 transition-colors flex items-center gap-1.5"
                          onClick={() => {
                            setActiveManufacturer(mfg);
                            setInwardMfg(mfg);
                            setInwardProduct(null);
                            setIsInwardModalOpen(true);
                          }}
                          title="Click to update stock for this manufacturer"
                        >
                          <span>{mfg.name}</span>
                          <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-normal">
                            + Stock
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-normal">
                          <span>{mfg.city}, {mfg.state}</span>
                          {mfg.website && (
                            <>
                              <span>&bull;</span>
                              <a
                                href={mfg.website.startsWith('http') ? mfg.website : `https://${mfg.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5"
                              >
                                <Globe className="w-2.5 h-2.5" />
                                {mfg.website.replace(/^https?:\/\//, '')}
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-slate-800">{mfg.code}</span>
                        <div className="text-[10px] text-slate-500">{mfg.gstNumber || 'No GST recorded'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5 text-teal-600" />
                          <span>{Number(mfg.totalPhysicalStock ?? mfg.totalAvailableStock ?? 0).toLocaleString('en-IN')} units</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            {mfg.productsCount || 0} SKUs
                          </span>
                          {mfg.stockValuation > 0 && (
                            <span className="text-slate-500">
                              Val: ₹ {Number(mfg.stockValuation).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{mfg.contactPerson || 'Office Sales'}</div>
                        <div className="text-[10px] text-slate-500">{mfg.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {mfg.creditPeriodDays} Days Credit
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        <span className={mfg.currentOutstanding > 0 ? 'text-amber-700' : 'text-slate-700'}>
                          ₹ {Number(mfg.currentOutstanding || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Total: ₹ {Number(mfg.totalPurchased || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={mfg.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveManufacturer(mfg);
                              setInwardMfg(mfg);
                              setInwardProduct(null);
                              setIsInwardModalOpen(true);
                            }}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="Click to update stock for this manufacturer"
                          >
                            <PackagePlus className="w-3.5 h-3.5 text-teal-600" />
                            + Stock
                          </button>
                          <button
                            onClick={() => openDetails(mfg._id)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="View 360 Supplier Ledger & Products"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveManufacturer(mfg);
                              navigate('/products');
                            }}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Open Brand Catalogue Products"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No manufacturers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Manufacturer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Manufacturer / Supplier">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Brand Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="e.g. Dabur India Ltd"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs uppercase focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="e.g. DABUR"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                placeholder="Manager / Sales Officer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                placeholder="+91 98400 11223"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                placeholder="orders@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                placeholder="e.g. mansarafoods.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs uppercase"
                placeholder="33AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
              <input
                type="number"
                value={formData.creditPeriodDays}
                onChange={(e) => setFormData({ ...formData, creditPeriodDays: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Depot / Warehouse Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              placeholder="Plot No, Industrial Estate, Area"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Manufacturer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details View Modal */}
      {selectedMfg && (
        <Modal
          isOpen={!!selectedMfg}
          onClose={() => setSelectedMfg(null)}
          title={`Manufacturer 360° Profile: ${selectedMfg.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Code</span>
                <span className="font-bold text-slate-800 text-sm">{selectedMfg.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Days</span>
                <span className="font-bold text-slate-800 text-sm">{selectedMfg.creditPeriodDays} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Catalogue SKUs</span>
                <span className="font-bold text-teal-700 text-sm">{selectedMfg.productsCount || 0} SKUs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock Qty</span>
                <span className="font-bold text-teal-800 text-sm">{Number(selectedMfg.totalPhysicalStock ?? selectedMfg.totalAvailableStock ?? 0).toLocaleString('en-IN')} Units</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Payable</span>
                <span className="font-bold text-amber-700 text-sm">₹ {Number(selectedMfg.currentOutstanding || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedMfg.website && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-600" /> Official Website:
                </span>
                <a
                  href={selectedMfg.website.startsWith('http') ? selectedMfg.website : `https://${selectedMfg.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1"
                >
                  {selectedMfg.website} &rarr;
                </a>
              </div>
            )}

            {/* Quick Actions Header in Modal */}
            <div className="flex items-center justify-between gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <div>
                <span className="font-bold text-teal-950 text-xs block">Brand Stock & Catalogue Control</span>
                <span className="text-[11px] text-teal-800">Update warehouse inventory directly for this brand's catalogue</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInwardMfg(selectedMfg);
                    setInwardProduct(null);
                    setIsInwardModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  + Update Stock
                </button>
                <button
                  onClick={() => {
                    setActiveManufacturer(selectedMfg);
                    setSelectedMfg(null);
                    navigate('/products');
                  }}
                  className="px-3 py-1.5 bg-white border border-teal-300 hover:bg-teal-100 text-teal-900 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Go to Products &rarr;
                </button>
              </div>
            </div>

            {/* Products Supplied with Live Stock */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  Products Supplied by {selectedMfg.name} ({selectedMfg.products?.length || 0} SKUs)
                </h4>
                <span className="text-[10px] text-slate-500">Live warehouse stock reflected below</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white">
                {selectedMfg.products && selectedMfg.products.length > 0 ? (
                  selectedMfg.products.map((p) => {
                    const avail = p.stock?.availableStock ?? p.stock?.currentStock ?? 0;
                    const isZero = avail === 0;
                    const isLow = avail <= (p.minStockAlert || 20);

                    return (
                      <div key={p._id} className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50/70 rounded-lg transition-colors">
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {p.sku} &bull; Buy: ₹{p.purchasePrice} &bull; Sell: ₹{p.sellingPrice} &bull; MRP: ₹{p.mrp}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isZero
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Stock: {avail} {p.unit || 'units'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setInwardMfg(selectedMfg);
                              setInwardProduct(p);
                              setIsInwardModalOpen(true);
                            }}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="Directly add stock for this SKU"
                          >
                            <PackagePlus className="w-3 h-3 text-teal-600" />
                            + Inward
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    No products found for this manufacturer yet.
                  </div>
                )}
              </div>
            </div>

            {/* Bank details */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-900 block mb-1">Manufacturer Bank Transfer Details:</span>
              <div className="text-slate-600 grid grid-cols-2 gap-1 text-[11px]">
                <div>Bank: {selectedMfg.bankDetails?.bankName || 'State Bank of India'}</div>
                <div>A/C: {selectedMfg.bankDetails?.accountNumber || '30491028374'}</div>
                <div>IFSC: {selectedMfg.bankDetails?.ifscCode || 'SBIN0000843'}</div>
                <div>Branch: {selectedMfg.bankDetails?.branch || selectedMfg.city}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Stock Inward Modal */}
      <QuickStockInwardModal
        isOpen={isInwardModalOpen}
        onClose={() => {
          setIsInwardModalOpen(false);
          setInwardProduct(null);
          setInwardMfg(null);
        }}
        product={inwardProduct}
        manufacturer={inwardMfg}
        productList={allProducts}
        onSuccess={(result) => {
          setSuccessToast(`Stock updated successfully! Added ${result.stock?.currentStock ? 'to inventory' : 'stock'}. Check Product pages to see live stock.`);
          fetchManufacturers();
          fetchAllProducts();
          if (selectedMfg?._id) {
            openDetails(selectedMfg._id);
          }
          setTimeout(() => setSuccessToast(''), 5000);
        }}
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-semibold">{successToast}</div>
        </div>
      )}
    </div>
  );
};

export default Manufacturers;
