import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Package, Factory, Boxes, Sparkles, PackagePlus, Plus, ArrowDown, Check, CheckCircle2, Layers } from 'lucide-react';
import api from '../api/client';
import { useManufacturer } from '../context/ManufacturerContext';
import Modal from '../components/common/Modal';
import { sortProducts } from '../utils/productSorter';

const DEFAULT_STOCKS = [
  // femi9 Products
  { _id: '1', name: '180mm (30 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '2', name: 'Combo pack - Femi9 Sanitary Napkins', closingQty: 0, brand: 'femi9' },
  { _id: '3', name: '330mm XL (SW-9 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '4', name: '290mm L (SW-9 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '5', name: '330mm XL (6 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '6', name: '330mm XL (3 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '7', name: '290mm L (6 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '8', name: '290mm L (3 PCS) - Femi9 Premium Sanitary Napkin', closingQty: 0, brand: 'femi9' },
  { _id: '9', name: 'Femi9 Natural Intimate Foam Hygiene Wash (100ml)', closingQty: 0, brand: 'femi9' },
  // Lumi9 Baby Diapers (femi9)
  { _id: '18', name: 'Lumi9 Baby Diaper NB(3)', closingQty: 0, brand: 'femi9' },
  { _id: '19', name: 'Lumi9 Baby Diaper NB(24)', closingQty: 0, brand: 'femi9' },
  { _id: '20', name: 'Lumi9 Baby Diaper NB(54)', closingQty: 0, brand: 'femi9' },
  { _id: '21', name: 'Lumi9 Baby Diaper S(3)', closingQty: 0, brand: 'femi9' },
  { _id: '22', name: 'Lumi9 Baby Diaper S(24)', closingQty: 0, brand: 'femi9' },
  { _id: '23', name: 'Lumi9 Baby Diaper S(54)', closingQty: 0, brand: 'femi9' },
  { _id: '16', name: 'Lumi9 Baby Diaper M(24)', closingQty: 0, brand: 'femi9' },
  { _id: '17', name: 'Lumi9 Baby Diaper M(54)', closingQty: 0, brand: 'femi9' },
  { _id: '14', name: 'Lumi9 Baby Diaper L(24)', closingQty: 0, brand: 'femi9' },
  { _id: '15', name: 'Lumi9 Baby Diaper L(54)', closingQty: 0, brand: 'femi9' },
  { _id: '24', name: 'Lumi9 Baby Diaper XL(24)', closingQty: 0, brand: 'femi9' },
  { _id: '25', name: 'Lumi9 Baby Diaper XL(54)', closingQty: 0, brand: 'femi9' },
  // mansarafoods.com Products
  { _id: '10', name: 'Mansara Instant Chettinad Kulambu Masala Paste (200g)', closingQty: 0, brand: 'mansarafoods.com' },
  { _id: '11', name: 'Mansara Traditional Gunpowder / Idli Podi (250g)', closingQty: 0, brand: 'mansarafoods.com' },
  { _id: '12', name: 'Mansara Pure Wood Pressed Sesame Oil / Gingelly Oil (500ml)', closingQty: 0, brand: 'mansarafoods.com' },
  { _id: '13', name: 'Mansara Traditional Kaikara Ragi Murukku (200g)', closingQty: 0, brand: 'mansarafoods.com' }
];

const StockManagement = () => {
  const { activeManufacturer } = useManufacturer();
  const location = useLocation();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Update Stock Dialog State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [updateMode, setUpdateMode] = useState('SET'); // 'SET' or 'ADDITION'
  const [modalSearch, setModalSearch] = useState('');
  const [modalBrandFilter, setModalBrandFilter] = useState('ALL');
  const [savingStock, setSavingStock] = useState(false);
  const [lastMovedProduct, setLastMovedProduct] = useState(null);

  useEffect(() => {
    fetchStockData();
  }, [activeManufacturer]);

  useEffect(() => {
    if (location.search.includes('action=update')) {
      handleOpenModal();
    }
  }, [location.search, stocks]);

  const handleOpenModal = () => {
    const list = stocks.length > 0 ? stocks : DEFAULT_STOCKS;
    setModalProducts(list.map(s => ({ ...s, isUpdated: false })));
    if (list.length > 0) {
      setSelectedProductId(list[0]._id);
      setStockInput(list[0].closingQty !== undefined ? String(list[0].closingQty) : '');
    }
    setIsUpdateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUpdateModalOpen(false);
    if (location.search.includes('action=update')) {
      navigate('/stock', { replace: true });
    }
    fetchStockData();
  };

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeManufacturer?._id) {
        params.manufacturerId = activeManufacturer._id;
      }

      const [prodRes, stockRes] = await Promise.allSettled([
        api.get('/products', { params }),
        api.get('/stock', { params })
      ]);

      let items = [];

      if (prodRes.status === 'fulfilled' && prodRes.value.data?.success && prodRes.value.data?.data?.length > 0) {
        const products = prodRes.value.data.data;
        const stockMap = {};

        if (stockRes.status === 'fulfilled' && stockRes.value.data?.success) {
          (stockRes.value.data.data || []).forEach(s => {
            const pid = s.productId?._id || s.productId;
            if (pid) stockMap[pid.toString()] = s.currentStock ?? s.availableStock ?? 0;
          });
        }

        items = products.map(p => {
          const brandName = p.brand || p.manufacturerId?.name || (p.sku?.startsWith('MANS') ? 'mansarafoods.com' : 'femi9.in');
          const isFemi9 = brandName.toLowerCase().includes('femi9') || p.sku?.startsWith('FEMI');
          return {
            _id: p._id,
            name: p.name,
            sku: p.sku,
            brand: isFemi9 ? 'femi9.in' : 'mansarafoods.com',
            mrp: p.mrp || 0,
            purchasePrice: p.purchasePrice || 0,
            unit: p.unit || 'Pcs',
            category: p.category || 'General',
            closingQty: stockMap[p._id.toString()] ?? p.stock?.currentStock ?? p.currentStock ?? 0
          };
        });
      } else if (stockRes.status === 'fulfilled' && stockRes.value.data?.success && stockRes.value.data?.data?.length > 0) {
        items = stockRes.value.data.data.map(s => {
          const name = s.productId?.name || s.productName || 'Product';
          const isMansara = (s.productId?.brand && s.productId.brand.toLowerCase().includes('mansara')) || (s.productId?.sku && s.productId.sku.startsWith('MANS'));
          return {
            _id: s._id,
            name: name,
            sku: s.productId?.sku,
            brand: isMansara ? 'mansarafoods.com' : 'femi9.in',
            mrp: s.productId?.mrp || 0,
            purchasePrice: s.productId?.purchasePrice || 0,
            unit: s.productId?.unit || 'Pcs',
            category: s.productId?.category || 'General',
            closingQty: s.currentStock ?? s.availableStock ?? 0
          };
        });
      }

      if (items.length > 0) {
        setStocks(sortProducts(items));
      } else {
        setStocks(sortProducts(DEFAULT_STOCKS));
      }
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      setStocks(sortProducts(DEFAULT_STOCKS));
    } finally {
      setLoading(false);
    }
  };

  // Quantities for each manufacturer
  const femi9Total = useMemo(() => {
    return stocks
      .filter(s => s.brand === 'femi9.in')
      .reduce((sum, item) => sum + (Number(item.closingQty) || 0), 0);
  }, [stocks]);

  const mansaraTotal = useMemo(() => {
    return stocks
      .filter(s => s.brand === 'mansarafoods.com')
      .reduce((sum, item) => sum + (Number(item.closingQty) || 0), 0);
  }, [stocks]);

  const combinedTotal = useMemo(() => {
    return stocks.reduce((sum, item) => sum + (Number(item.closingQty) || 0), 0);
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let list = stocks;
    if (selectedBrand !== 'ALL') {
      list = list.filter(s => s.brand === selectedBrand);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || (s.sku && s.sku.toLowerCase().includes(q)));
  }, [stocks, search, selectedBrand]);

  const totalFilteredQty = useMemo(() => {
    return filteredStocks.reduce((sum, item) => sum + (Number(item.closingQty) || 0), 0);
  }, [filteredStocks]);

  // Modal active product
  const activeModalProduct = useMemo(() => {
    return modalProducts.find(p => p._id === selectedProductId) || modalProducts[0] || null;
  }, [modalProducts, selectedProductId]);

  // Filtered list inside the modal's left column
  const filteredModalList = useMemo(() => {
    let list = modalProducts;
    if (modalBrandFilter !== 'ALL') {
      list = list.filter(p => p.brand === modalBrandFilter);
    }
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return list;
  }, [modalProducts, modalBrandFilter, modalSearch]);

  // Update stock for the active product and MOVE IT DOWN to the bottom
  const handleUpdateCurrentStock = async (e) => {
    if (e) e.preventDefault();
    if (!activeModalProduct) return;

    const qty = Number(stockInput);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid non-negative number for stock quantity.');
      return;
    }

    try {
      setSavingStock(true);
      const res = await api.post('/stock/adjust', {
        productId: activeModalProduct._id,
        adjustmentQty: qty,
        type: updateMode
      });

      if (res.data?.success) {
        const newQty = updateMode === 'SET' ? qty : ((activeModalProduct.closingQty || 0) + qty);

        const updatedItem = {
          ...activeModalProduct,
          closingQty: newQty,
          isUpdated: true
        };

        // REQUIREMENT: If 1 product in the top if i update stock that should go down!
        // Remove from current position and append to the bottom of the queue
        const remaining = modalProducts.filter(p => p._id !== activeModalProduct._id);
        const reordered = [...remaining, updatedItem];
        setModalProducts(reordered);

        setLastMovedProduct({
          name: activeModalProduct.name,
          qty: newQty
        });
        setTimeout(() => setLastMovedProduct(null), 4000);

        // Next product at the top is automatically selected
        const nextProduct = remaining[0] || updatedItem;
        setSelectedProductId(nextProduct._id);
        setStockInput(nextProduct.closingQty !== undefined ? String(nextProduct.closingQty) : '');

        // Update overall stocks list in background
        setStocks(prev => prev.map(s => s._id === activeModalProduct._id ? { ...s, closingQty: newQty } : s));
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert(err.response?.data?.message || 'Error updating stock');
    } finally {
      setSavingStock(false);
    }
  };

  // Skip current product and push it down to bottom
  const handleSkipCurrent = () => {
    if (!activeModalProduct) return;
    const remaining = modalProducts.filter(p => p._id !== activeModalProduct._id);
    const reordered = [...remaining, activeModalProduct];
    setModalProducts(reordered);
    const nextProduct = remaining[0] || activeModalProduct;
    setSelectedProductId(nextProduct._id);
    setStockInput(nextProduct.closingQty !== undefined ? String(nextProduct.closingQty) : '');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header with Search, Update Stock, and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Overall Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Central Warehouse • Physical Closing Product Quantity for Both Manufacturers
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Add New Product Button */}
          <button
            onClick={() => navigate('/products?action=new')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Create New Product Master"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          {/* Update Stock Action Button */}
          <button
            onClick={handleOpenModal}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Open Stock Update Dialog"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Update Stock</span>
          </button>

          <button
            onClick={fetchStockData}
            title="Refresh Stock Data"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Manufacturer Quantity Summary Cards for Both Manufacturers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Femi9 Card */}
        <button
          type="button"
          onClick={() => setSelectedBrand(selectedBrand === 'femi9.in' ? 'ALL' : 'femi9.in')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBrand === 'femi9.in'
              ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-200 shadow-xs'
              : 'bg-white hover:bg-pink-50/40 border-pink-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-pink-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              femi9.in
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-100 text-pink-800 font-semibold">
              FEMI9
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">
              {Number(femi9Total).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">units</span>
            </span>
            <span className="text-[11px] text-pink-700 font-medium">
              {stocks.filter(s => s.brand === 'femi9.in').length} SKUs
            </span>
          </div>
        </button>

        {/* Mansara Foods Card */}
        <button
          type="button"
          onClick={() => setSelectedBrand(selectedBrand === 'mansarafoods.com' ? 'ALL' : 'mansarafoods.com')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBrand === 'mansarafoods.com'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs'
              : 'bg-white hover:bg-amber-50/40 border-amber-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-amber-600" />
              mansarafoods.com
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
              MANSARA
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">
              {Number(mansaraTotal).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">units</span>
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              {stocks.filter(s => s.brand === 'mansarafoods.com').length} SKUs
            </span>
          </div>
        </button>

        {/* Combined Inventory Card */}
        <button
          type="button"
          onClick={() => setSelectedBrand('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBrand === 'ALL'
              ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-200 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-teal-600" />
              Both Manufacturers
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
              Combined Total
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">
              {Number(combinedTotal).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">units</span>
            </span>
            <span className="text-[11px] text-teal-700 font-medium">
              {stocks.length} SKUs Total
            </span>
          </div>
        </button>
      </div>

      {/* Main Overall Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Product SKU & Name
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                  Manufacturer / Brand
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Closing Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && stocks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading Overall Stock...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No products found</p>
                    {search && <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query</p>}
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  const isFemi9 = item.brand === 'femi9.in';
                  return (
                    <tr
                      key={item._id || item.name}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-6 text-sm font-bold text-slate-900 leading-snug">
                        <div>{item.name}</div>
                        {item.sku && (
                          <div className="text-[11px] font-mono font-normal text-slate-400 mt-0.5">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isFemi9
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isFemi9 ? 'femi9.in' : 'mansarafoods.com'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-sm font-bold text-slate-900 text-right font-mono">
                        {Number(item.closingQty).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/60">
                <td colSpan={2} className="py-4 px-6 text-sm font-bold text-slate-900">
                  Total Closing Stock Quantity {selectedBrand !== 'ALL' ? `(${selectedBrand})` : '(Both Manufacturers)'}
                </td>
                <td className="py-4 px-6 text-base font-black text-slate-900 text-right font-mono">
                  {Number(totalFilteredQty).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {/* 2-Column Update Stock Dialog Box */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseModal}
        title="Update Product Stock"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Top Brand Filter Tabs & Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Brand Filter:</span>
              <button
                type="button"
                onClick={() => setModalBrandFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  modalBrandFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({modalProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setModalBrandFilter('femi9.in')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  modalBrandFilter === 'femi9.in'
                    ? 'bg-pink-600 text-white'
                    : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                }`}
              >
                femi9.in ({modalProducts.filter(p => p.brand === 'femi9.in').length})
              </button>
              <button
                type="button"
                onClick={() => setModalBrandFilter('mansarafoods.com')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  modalBrandFilter === 'mansarafoods.com'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                mansarafoods.com ({modalProducts.filter(p => p.brand === 'mansarafoods.com').length})
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Updated in queue: <span className="font-bold text-teal-700">{modalProducts.filter(p => p.isUpdated).length}</span> / {modalProducts.length} SKUs
            </div>
          </div>

          {/* Feedback banner when product was updated and moved down */}
          {lastMovedProduct && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between text-xs animate-in fade-in duration-300">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{lastMovedProduct.name}</strong> updated to <strong>{lastMovedProduct.qty} units</strong> and moved down to the bottom of the list.
                </span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-0.5 font-bold">
                <ArrowDown className="w-3.5 h-3.5" /> Moved Down
              </span>
            </div>
          )}

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* LEFT COLUMN: List all products one by one */}
            <div className="md:col-span-5 flex flex-col border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden">
              <div className="p-2.5 bg-white border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Product Queue ({filteredModalList.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Top item is active
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in queue..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Scrollable list of products one by one */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
                {filteredModalList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No products matching search
                  </div>
                ) : (
                  filteredModalList.map((item, idx) => {
                    const isSelected = item._id === selectedProductId;
                    const isTop = idx === 0;
                    const isFemi9 = item.brand === 'femi9.in';

                    return (
                      <div
                        key={item._id}
                        onClick={() => {
                          setSelectedProductId(item._id);
                          setStockInput(item.closingQty !== undefined ? String(item.closingQty) : '');
                        }}
                        className={`p-2.5 rounded-lg transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-teal-50/80 border-2 border-teal-500 shadow-xs'
                            : 'bg-white hover:bg-slate-100/70 border border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isTop && !item.isUpdated
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.isUpdated
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isTop && !item.isUpdated ? 'TOP #1' : `#${idx + 1}`}
                            </span>
                            <div className="font-semibold text-slate-900 line-clamp-2 leading-tight">
                              {item.name}
                            </div>
                          </div>
                          
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            item.isUpdated
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.closingQty > 0
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.isUpdated ? `✓ ${item.closingQty}` : `${item.closingQty} qty`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pl-6">
                          <span>{item.sku || 'SKU'}</span>
                          <span className={isFemi9 ? 'text-pink-600 font-semibold' : 'text-amber-700 font-semibold'}>
                            {item.brand}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Allow to enter the stock for the product */}
            <div className="md:col-span-7 flex flex-col justify-between border border-slate-200 rounded-xl bg-white p-4 shadow-2xs">
              {activeModalProduct ? (
                <form onSubmit={handleUpdateCurrentStock} className="space-y-4">
                  {/* Selected Product Card */}
                  <div className={`p-3.5 rounded-xl border ${
                    activeModalProduct.brand === 'femi9.in'
                      ? 'bg-gradient-to-br from-pink-50/60 to-rose-50/30 border-pink-200'
                      : 'bg-gradient-to-br from-amber-50/60 to-orange-50/30 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeModalProduct.brand === 'femi9.in' ? 'bg-pink-100 text-pink-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activeModalProduct.brand}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {activeModalProduct.sku}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {activeModalProduct.name}
                    </h4>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Current Stock</span>
                        <span className="font-black text-slate-800 text-xs">
                          {activeModalProduct.closingQty || 0} {activeModalProduct.unit || 'units'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">MRP Rate</span>
                        <span className="font-bold text-slate-700 text-xs">
                          ₹ {activeModalProduct.mrp || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Queue Status</span>
                        <span className="font-semibold text-teal-700 text-xs flex items-center gap-1">
                          {activeModalProduct.isUpdated ? '✓ Updated' : 'Pending Entry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Entry Section */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Enter Stock Quantity *
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <label className="flex items-center gap-1 text-slate-600 cursor-pointer">
                          <input
                            type="radio"
                            name="updateMode"
                            checked={updateMode === 'SET'}
                            onChange={() => setUpdateMode('SET')}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>Set Absolute</span>
                        </label>
                        <label className="flex items-center gap-1 text-slate-600 cursor-pointer">
                          <input
                            type="radio"
                            name="updateMode"
                            checked={updateMode === 'ADDITION'}
                            onChange={() => setUpdateMode('ADDITION')}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>Add (+)</span>
                        </label>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        required
                        autoFocus
                        value={stockInput}
                        onChange={(e) => setStockInput(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full px-4 py-2.5 text-lg font-black text-slate-900 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-mono tracking-tight"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Units
                      </span>
                    </div>

                    {/* Quick quantity shortcuts */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick:</span>
                      {[0, 10, 25, 50, 100, 200, 500].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setStockInput(String(num))}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {num === 0 ? '0' : `+${num}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flow Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSkipCurrent}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="Skip this product and move it to the bottom"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                      <span>Skip to Next</span>
                    </button>

                    <button
                      type="submit"
                      disabled={savingStock}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingStock ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Update Stock & Move Down &rarr;</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="font-bold text-slate-700 text-sm">All products have been updated!</p>
                  <p className="text-xs text-slate-400">You can close this dialog or select any product on the left to re-edit.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Close Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Updating stock here immediately reflects in Central Warehouse & Principal Supplier records.
            </span>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StockManagement;
