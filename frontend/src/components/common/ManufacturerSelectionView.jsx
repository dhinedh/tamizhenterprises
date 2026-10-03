import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  Package,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ArrowRightLeft,
  Layers,
  MapPin,
  Phone,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import api from '../../api/client';
import { useManufacturer } from '../../context/ManufacturerContext';

const getModuleInfo = (pathname, search = '') => {
  if (pathname.startsWith('/stock-transfers') || pathname.startsWith('/store-transfers')) {
    return {
      title: 'Stock Transfers to Shops',
      subtitle: 'Dispatch physical warehouse stocks and generate GST tax invoices for retail shops',
      badge: 'Warehouse Dispatch'
    };
  }
  if (pathname.startsWith('/stock')) {
    if (search.includes('action=update')) {
      return {
        title: 'Update Stock Levels',
        subtitle: 'Adjust closing stock, record additions or reconciliations for warehouse inventory',
        badge: 'Stock Adjustment'
      };
    }
    return {
      title: 'Overall Stock Management',
      subtitle: 'View live warehouse inventory, batch numbers, valuation, and reorder levels',
      badge: 'Inventory Control'
    };
  }
  if (pathname.startsWith('/products')) {
    if (search.includes('action=new')) {
      return {
        title: 'Add New Product',
        subtitle: 'Register a new product SKU into the master catalogue and inventory database',
        badge: 'New SKU'
      };
    }
    return {
      title: 'Products & Master Catalogue',
      subtitle: 'Manage products, selling prices, dealer rates, and GST tax classifications',
      badge: 'Master Catalog'
    };
  }
  if (pathname.startsWith('/customers')) {
    return {
      title: 'Customer Management',
      subtitle: 'Manage direct customer profiles, contact numbers, GSTIN, and order histories',
      badge: 'CRM'
    };
  }
  if (pathname.startsWith('/stores')) {
    return {
      title: 'Shop (Retailers) Network',
      subtitle: 'Track retail supermarket distribution, credit limits, outstanding balances, and field orders',
      badge: 'Retail Distribution'
    };
  }
  if (pathname.startsWith('/orders')) {
    return {
      title: 'Shop Orders',
      subtitle: 'Track purchase orders from retail stores and salesman booking history',
      badge: 'Order Booking'
    };
  }
  if (pathname.startsWith('/invoices')) {
    return {
      title: 'Invoices & Billing',
      subtitle: 'Official GST tax invoices, payment statuses, and printable delivery receipts',
      badge: 'Finance & Billing'
    };
  }
  if (pathname.startsWith('/deliveries')) {
    return {
      title: 'Dispatch & Deliveries',
      subtitle: 'Manage route dispatches, vehicle tracking, and shop delivery confirmations',
      badge: 'Logistics'
    };
  }
  if (pathname.startsWith('/payments')) {
    return {
      title: 'Ledger & Payments',
      subtitle: 'Track retailer collections, credit aging, and payment receipts',
      badge: 'Accounts'
    };
  }
  if (pathname.startsWith('/salesmen')) {
    return {
      title: 'Field Sales Agents',
      subtitle: 'Manage sales representatives, assigned territories, and field order performance',
      badge: 'Field Force'
    };
  }
  if (pathname.startsWith('/returns')) {
    return {
      title: 'Returns & Replacements',
      subtitle: 'Process damaged or expired goods returned by retail shops',
      badge: 'Returns'
    };
  }
  if (pathname.startsWith('/schemes')) {
    return {
      title: 'Trade Schemes & Offers',
      subtitle: 'Configure B2B trade discounts, free unit slabs, and promotional margins',
      badge: 'Trade Promotions'
    };
  }
  if (pathname.startsWith('/reports')) {
    return {
      title: 'Analytics & Reports',
      subtitle: 'Sales breakdown, inventory velocity, and retail shop ledger statements',
      badge: 'Reports'
    };
  }
  return {
    title: 'ERP Operations Portal',
    subtitle: 'Select a brand / manufacturer below to proceed with dedicated operations',
    badge: 'Operations'
  };
};

const ManufacturerSelectionView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveManufacturer } = useManufacturer();

  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);

  const moduleInfo = getModuleInfo(location.pathname, location.search);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manufacturers');
      if (res.data.success) {
        setManufacturers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching manufacturers for selection view:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (mfg) => {
    setActiveManufacturer(mfg);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Brand to Continue</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-white font-medium">{moduleInfo.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {moduleInfo.title}
          </h1>

          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Please choose a manufacturer / brand below to view and manage its respective stock, products, and transactions for <span className="text-teal-300 font-semibold">{moduleInfo.title}</span>.
          </p>
        </div>

        {/* Ambient Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Manufacturer Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Available Manufacturers ({manufacturers.length})</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Back to Main Dashboard
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/3" />
                <div className="h-10 bg-slate-100 rounded w-3/4" />
                <div className="h-20 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {manufacturers.map((mfg) => {
              const isFemi9 =
                mfg.code === 'FEMI9' ||
                mfg.name?.toLowerCase().includes('femi9') ||
                mfg.website?.toLowerCase().includes('femi9');
              const isMansara =
                mfg.code === 'MANSARA' ||
                mfg.name?.toLowerCase().includes('mansara') ||
                mfg.website?.toLowerCase().includes('mansara');

              return (
                <div
                  key={mfg._id}
                  onClick={() => handleSelect(mfg)}
                  className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between p-6 hover:shadow-xl hover:-translate-y-1 ${
                    isFemi9
                      ? 'border-pink-200 hover:border-pink-500 hover:ring-4 hover:ring-pink-100'
                      : isMansara
                      ? 'border-amber-200 hover:border-amber-500 hover:ring-4 hover:ring-amber-100'
                      : 'border-slate-200 hover:border-teal-500 hover:ring-4 hover:ring-teal-100'
                  }`}
                >
                  {/* Top Bar Accent */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isFemi9
                        ? 'bg-gradient-to-r from-pink-500 to-rose-400'
                        : isMansara
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                    }`}
                  />

                  {/* Top Section */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-inner transition-transform group-hover:scale-105 ${
                            isFemi9
                              ? 'bg-pink-100 text-pink-700 border border-pink-200'
                              : isMansara
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {mfg.code ? mfg.code.substring(0, 3) : <Building2 className="w-6 h-6" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                              {mfg.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {mfg.code}
                            </span>
                            {mfg.city && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <MapPin className="w-3 h-3 text-slate-400" /> {mfg.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isFemi9
                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                            : isMansara
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {isFemi9 ? 'Femi9 Hygiene' : isMansara ? 'Mansara Foods' : 'Manufacturer'}
                      </span>
                    </div>

                    {/* Key Metrics Overview */}
                    <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Catalog
                        </span>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">
                          {mfg.productsCount || 0} <span className="text-xs font-normal text-slate-500">Products</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Live Warehouse Stock
                        </span>
                        <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                          {(mfg.totalPhysicalStock || 0).toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal text-slate-500">units</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelect(mfg)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                        isFemi9
                          ? 'bg-pink-600 hover:bg-pink-700 text-white group-hover:bg-pink-700'
                          : isMansara
                          ? 'bg-amber-600 hover:bg-amber-700 text-white group-hover:bg-amber-700'
                          : 'bg-teal-600 hover:bg-teal-700 text-white group-hover:bg-teal-700'
                      }`}
                    >
                      <span>Open {mfg.name} Data</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManufacturerSelectionView;
