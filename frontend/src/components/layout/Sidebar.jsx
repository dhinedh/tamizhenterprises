import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Smile,
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
  Check,
  Star
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useManufacturer } from '../../context/ManufacturerContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    activeManufacturer,
    setActiveManufacturer,
    clearActiveManufacturer,
    manufacturers
  } = useManufacturer();
  const location = useLocation();
  const navigate = useNavigate();

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  // Accordion state for expandable sections - default 'stock', 'customer', and 'invoice' to open
  const [expandedGroups, setExpandedGroups] = useState({
    stock: true,
    customer: true,
    invoice: true,
    shop: false
  });

  // Keep accordion open if on any related page
  useEffect(() => {
    if (
      location.pathname.startsWith('/stock') ||
      location.pathname.startsWith('/products') ||
      location.pathname.startsWith('/stock-transfers') ||
      location.pathname.startsWith('/store-transfers')
    ) {
      setExpandedGroups((prev) => ({ ...prev, stock: true }));
    }
    if (location.pathname.startsWith('/customers')) {
      setExpandedGroups((prev) => ({ ...prev, customer: true }));
    }
    if (location.pathname.startsWith('/invoices')) {
      setExpandedGroups((prev) => ({ ...prev, invoice: true }));
    }
    if (location.pathname.startsWith('/stores') || location.pathname.startsWith('/reports')) {
      setExpandedGroups((prev) => ({ ...prev, shop: true }));
    }
  }, [location.pathname, location.search]);

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

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Helper to determine if a top-level sidebar link should be highlighted
  const isItemActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Helper to determine if a submenu item should be highlighted
  const isSubItemActive = (path) => {
    if (path === '/stock?action=update') {
      return location.pathname === '/stock' && location.search.includes('action=update');
    }
    if (path === '/stock') {
      return location.pathname === '/stock' && !location.search.includes('action=update');
    }
    if (path === '/products?action=new') {
      return location.pathname === '/products' && location.search.includes('action=new');
    }
    if (path === '/products') {
      return location.pathname === '/products' && !location.search.includes('action=new');
    }
    if (path === '/customers?action=new') {
      return location.pathname === '/customers' && location.search.includes('action=new');
    }
    if (path === '/customers') {
      return location.pathname === '/customers' && !location.search.includes('action=new');
    }
    if (path === '/stores?action=new') {
      return location.pathname === '/stores' && location.search.includes('action=new');
    }
    if (path === '/stores') {
      return location.pathname === '/stores' && !location.search.includes('action=new');
    }
    if (path === '/stock-transfers' || path === '/store-transfers') {
      return location.pathname.startsWith('/stock-transfers') || location.pathname.startsWith('/store-transfers');
    }
    if (path === '/invoices') {
      return location.pathname.startsWith('/invoices');
    }
    if (path === '/reports') {
      return location.pathname.startsWith('/reports');
    }
    return location.pathname === path;
  };

  // Stock accordion menu item with Stock Transfer to shops
  const stockAccordion = {
    id: 'stock',
    name: 'Stock',
    icon: Check,
    iconColor: 'text-orange-500',
    iconStrokeWidth: 3,
    isAccordion: true,
    children: [
      { name: 'Overall Stock', path: '/stock' },
      { name: 'Update Stock', path: '/stock?action=update' },
      { name: 'Add New Product', path: '/products?action=new' },
      { name: 'Stock Transfer', path: '/stock-transfers' }
    ]
  };

  // Customer accordion menu item: DEDICATED Customer management
  const customerAccordion = {
    id: 'customer',
    name: 'Customer',
    icon: Star,
    iconColor: 'text-blue-600',
    iconStrokeWidth: 2,
    isAccordion: true,
    children: [
      { name: 'Add New Customer', path: '/customers?action=new' },
      { name: 'Manage Customer', path: '/customers' }
    ]
  };

  // Invoice accordion menu item: DEDICATED SEPARATE MODULE for Billing & Invoices
  const invoiceAccordion = {
    id: 'invoice',
    name: 'Invoice',
    icon: FileText,
    iconColor: 'text-blue-600',
    iconStrokeWidth: 2,
    isAccordion: true,
    children: [
      { name: 'Add Invoice', path: '/stock-transfers' },
      { name: 'Manage Invoice', path: '/invoices' }
    ]
  };

  // Shop (Retailers) accordion menu item
  const shopRetailersAccordion = {
    id: 'shop',
    name: 'Shop (Retailers)',
    icon: Smile,
    iconColor: 'text-blue-600',
    iconStrokeWidth: 2,
    isAccordion: true,
    children: [
      { name: 'Add Shop', path: '/stores?action=new' },
      { name: 'Manage Shop', path: '/stores' },
      { name: 'Shop Report', path: '/reports' }
    ]
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
        stockAccordion,
        customerAccordion,
        invoiceAccordion,
        shopRetailersAccordion,
        {
          name: 'Shop Orders',
          path: '/orders',
          icon: ShoppingCart
        },
        {
          name: 'Dispatch & Deliveries',
          path: '/deliveries',
          icon: Truck
        }
      ]
    },
    {
      group: 'Finance & Operations',
      items: [
        {
          name: 'Ledger & Payments',
          path: '/payments',
          icon: CreditCard
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
        },
        {
          name: 'Analytics & Reports',
          path: '/reports',
          icon: BarChart3
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
        stockAccordion,
        customerAccordion,
        invoiceAccordion,
        shopRetailersAccordion,
        {
          name: 'Shop Orders',
          path: '/orders',
          icon: ShoppingCart
        },
        {
          name: 'Dispatch & Deliveries',
          path: '/deliveries',
          icon: Truck
        }
      ]
    },
    {
      group: 'Finance & Management',
      items: [
        {
          name: 'Ledger & Payments',
          path: '/payments',
          icon: CreditCard
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
        },
        {
          name: 'Analytics & Reports',
          path: '/reports',
          icon: BarChart3
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white text-slate-700 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 shadow-xl lg:shadow-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-100 bg-white space-y-2.5">
          {activeManufacturer ? (
            <>
              {/* Switch to All Brands Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleBackToAllBrands}
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all border border-slate-200 hover:border-blue-300 text-xs font-semibold group shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
                    All Manufacturers
                  </span>
                  <span className="text-[10px] bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium">
                    Hub
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Brand Card with Quick Switch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs tracking-wider flex-shrink-0 shadow-2xs">
                        {activeManufacturer?.code ? activeManufacturer.code.substring(0, 3) : <Building2 className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-xs truncate leading-snug">
                          {activeManufacturer?.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono text-blue-600 font-semibold">{activeManufacturer?.code}</span>
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
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 max-h-56 overflow-y-auto space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Switch Active Brand
                    </div>
                    {(manufacturers || []).map((m) => (
                      <button
                        key={m._id}
                        onClick={() => handleSelectBrand(m)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          m._id === activeManufacturer?._id || m.code === activeManufacturer?.code
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {m.code}
                          </span>
                          <span className="truncate">{m.name}</span>
                        </div>
                        {(m._id === activeManufacturer?._id || m.code === activeManufacturer?.code) && (
                          <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0">
                  TE
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs tracking-tight truncate">
                    Tamil Enterprises
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium">
                    Madurai Central ERP
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4">
          {currentMenu.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  // Accordion item (Shop Retailers)
                  if (item.isAccordion) {
                    const isExpanded = !!expandedGroups[item.id];
                    const isAnyChildActive = item.children.some((c) => isSubItemActive(c.path));

                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                            isAnyChildActive || isExpanded
                              ? 'text-blue-600 font-medium'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              strokeWidth={item.iconStrokeWidth || 2}
                              className={`w-5 h-5 flex-shrink-0 ${
                                item.iconColor
                                  ? item.iconColor
                                  : isAnyChildActive || isExpanded
                                  ? 'text-blue-600'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Collapsible Card Container exactly matching the user's screenshot */}
                        {isExpanded && (
                          <div className="bg-slate-50/90 rounded-2xl p-4 ml-1 mr-1 border border-slate-100 shadow-2xs">
                            <div className="space-y-3">
                              {item.children.map((subItem) => {
                                const active = isSubItemActive(subItem.path);

                                return (
                                  <NavLink
                                    key={subItem.name}
                                    to={subItem.path}
                                    onClick={() => {
                                      if (window.innerWidth < 1024) onClose();
                                    }}
                                    className={`block text-[14px] transition-colors py-1 px-1.5 rounded-lg ${
                                      active
                                        ? 'text-blue-600 font-semibold bg-blue-50/60'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium'
                                    }`}
                                  >
                                    {subItem.name}
                                  </NavLink>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Standard Nav item
                  const active = isItemActive(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap border ${
                            active
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
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
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Muralitharan'}</div>
              <div className="text-[10px] text-blue-600 font-medium">{user?.role || 'Owner'} Account</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0" title="System Online" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
