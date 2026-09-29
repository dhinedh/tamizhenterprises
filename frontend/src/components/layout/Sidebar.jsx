import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Store,
  FileText,
  Truck,
  Users,
  CreditCard,
  RotateCcw,
  Tag,
  BarChart3,
  X,
  ArrowLeft,
  Building2,
  ChevronDown,
  Sparkles,
  MapPin,
  PackagePlus,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useManufacturer } from '../../context/ManufacturerContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeManufacturer, setActiveManufacturer, clearActiveManufacturer } = useManufacturer();
  const location = useLocation();
  const navigate = useNavigate();

  const [manufacturers, setManufacturers] = useState([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const res = await api.get('/manufacturers');
      if (res.data.success) {
        setManufacturers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load manufacturers in sidebar:', err);
    }
  };

  const isFemi9 = activeManufacturer?.code === 'FEMI9';
  const isMansara = activeManufacturer?.code === 'MANSARA';

  const handleBackToAllBrands = () => {
    clearActiveManufacturer();
    navigate('/');
    if (window.innerWidth < 1024) onClose();
  };

  const handleSelectBrand = (mfg) => {
    setActiveManufacturer(mfg);
    setShowBrandDropdown(false);
    if (window.innerWidth < 1024) onClose();
  };

  // Helper to determine if a sidebar link should be highlighted
  const isItemActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/stores') {
      return location.pathname.startsWith('/stores');
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Menu when a specific manufacturer is active
  const manufacturerMenu = [
    {
      group: 'Brand Portal',
      items: [
        {
          name: `${activeManufacturer?.code || 'Brand'} Overview`,
          path: '/',
          icon: LayoutDashboard,
          badge: 'Live'
        },
        {
          name: 'Products & SKUs',
          path: '/products',
          icon: Package,
          badge: activeManufacturer?.productsCount ? `${activeManufacturer.productsCount} SKUs` : null
        },
        {
          name: 'Warehouse Stock',
          path: '/stock',
          icon: Boxes,
          badge: activeManufacturer?.totalPhysicalStock ? `${activeManufacturer.totalPhysicalStock} units` : null
        }
      ]
    },
    {
      group: 'Stock Inward & Procurement',
      items: [
        {
          name: 'Direct Stock Inward',
          path: '/purchases',
          icon: PackagePlus,
          badge: 'Direct'
        },
        {
          name: 'Ledger & Payments',
          path: '/payments',
          icon: CreditCard
        }
      ]
    },
    {
      group: 'Shop Distribution',
      items: [
        {
          name: 'Retail Shops',
          path: '/stores',
          icon: Store,
          badge: 'Master'
        },
        {
          name: 'Stock Transfers',
          path: '/store-transfers',
          icon: ArrowRightLeft,
          badge: 'Direct Bill'
        },
        {
          name: 'Shop Orders',
          path: '/orders',
          icon: ShoppingCart
        },
        {
          name: 'GST Tax Invoices',
          path: '/invoices',
          icon: FileText
        },
        {
          name: 'Dispatch & Deliveries',
          path: '/deliveries',
          icon: Truck
        }
      ]
    },
    {
      group: 'Operations & Insights',
      items: [
        {
          name: 'Analytics & Reports',
          path: '/reports',
          icon: BarChart3
        },
        {
          name: 'Field Sales Agents',
          path: '/salesmen',
          icon: Users
        },
        {
          name: 'Returns & Replacements',
          path: '/returns',
          icon: RotateCcw
        },
        {
          name: 'Trade Schemes',
          path: '/schemes',
          icon: Tag
        }
      ]
    }
  ];

  // Menu when in Central Hub mode (All Brands)
  const centralHubMenu = [
    {
      group: 'Central ERP Hub',
      items: [
        {
          name: 'Main Dashboard',
          path: '/',
          icon: LayoutDashboard,
          badge: 'All Brands'
        },
        {
          name: 'Master Catalog',
          path: '/products',
          icon: Package
        },
        {
          name: 'Central Warehouse Stock',
          path: '/stock',
          icon: Boxes
        }
      ]
    },
    {
      group: 'Procurement & Finance',
      items: [
        {
          name: 'Direct Stock Inward',
          path: '/purchases',
          icon: PackagePlus
        },
        {
          name: 'Ledger & Payments',
          path: '/payments',
          icon: CreditCard
        }
      ]
    },
    {
      group: 'Shop Distribution',
      items: [
        {
          name: 'Retail Shops',
          path: '/stores',
          icon: Store,
          badge: 'Master'
        },
        {
          name: 'Stock Transfers',
          path: '/store-transfers',
          icon: ArrowRightLeft,
          badge: 'Direct Bill'
        },
        {
          name: 'Shop Orders',
          path: '/orders',
          icon: ShoppingCart
        },
        {
          name: 'GST Tax Invoices',
          path: '/invoices',
          icon: FileText
        },
        {
          name: 'Dispatch & Deliveries',
          path: '/deliveries',
          icon: Truck
        }
      ]
    },
    {
      group: 'Management & Reports',
      items: [
        {
          name: 'Analytics & Reports',
          path: '/reports',
          icon: BarChart3
        },
        {
          name: 'Field Sales Agents',
          path: '/salesmen',
          icon: Users
        },
        {
          name: 'Returns Management',
          path: '/returns',
          icon: RotateCcw
        },
        {
          name: 'Trade Schemes',
          path: '/schemes',
          icon: Tag
        }
      ]
    }
  ];

  const currentMenu = activeManufacturer ? manufacturerMenu : centralHubMenu;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950 space-y-2.5">
          {activeManufacturer ? (
            <>
              {/* Switch to All Brands Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleBackToAllBrands}
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-teal-900/40 text-slate-300 hover:text-teal-200 transition-all border border-slate-700/70 hover:border-teal-500/50 text-xs font-semibold group shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5 text-teal-400 group-hover:-translate-x-0.5 transition-transform" />
                    All Manufacturers
                  </span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    Hub
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Brand Card with Quick Switch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className={`w-full text-left p-3 rounded-xl border relative transition-all ${
                    isFemi9
                      ? 'bg-gradient-to-br from-pink-950/70 to-slate-900 border-pink-500/40 hover:border-pink-400/60'
                      : isMansara
                      ? 'bg-gradient-to-br from-amber-950/70 to-slate-900 border-amber-500/40 hover:border-amber-400/60'
                      : 'bg-gradient-to-br from-teal-950/70 to-slate-900 border-teal-500/40 hover:border-teal-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider border flex-shrink-0 shadow-inner ${
                          isFemi9
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                            : isMansara
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        }`}
                      >
                        {activeManufacturer?.code ? activeManufacturer.code.substring(0, 3) : <Building2 className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate leading-snug">
                          {activeManufacturer?.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono text-teal-300 font-semibold">{activeManufacturer?.code}</span>
                          {activeManufacturer?.city && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate">{activeManufacturer.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown to switch brand */}
                {showBrandDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Switch Active Brand
                    </div>
                    {manufacturers.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => handleSelectBrand(m)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          m._id === activeManufacturer?._id || m.code === activeManufacturer?.code
                            ? 'bg-teal-600/30 text-teal-200 border border-teal-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {m.code}
                          </span>
                          <span className="truncate">{m.name}</span>
                        </div>
                        {(m._id === activeManufacturer?._id || m.code === activeManufacturer?.code) && (
                          <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Central Hub Header */
            <div className="flex items-center justify-between gap-2 p-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-teal-500/20 flex-shrink-0">
                  TE
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-xs tracking-tight truncate">
                    Tamil Enterprises
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium">
                    Madurai Central ERP
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
          {currentMenu.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap border ${
                            active
                              ? 'bg-teal-700/80 text-teal-100 border-teal-500/50'
                              : 'bg-slate-800 text-teal-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Card at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'Muralitharan'}</div>
              <div className="text-[10px] text-teal-400 font-medium">{user?.role || 'Owner'} Account</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="System Online" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
