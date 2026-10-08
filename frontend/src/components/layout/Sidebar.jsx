import React, { useState, useEffect, useRef } from 'react';
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
  Star,
  User,
  KeyRound,
  LogOut,
  Lock,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useManufacturer } from '../../context/ManufacturerContext';
import Modal from '../common/Modal';
import api from '../../api/client';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const {
    activeManufacturer,
    setActiveManufacturer,
    clearActiveManufacturer,
    manufacturers
  } = useManufacturer();
  const location = useLocation();
  const navigate = useNavigate();

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Accordion state for expandable sections - default 'stock', 'customer', and 'invoice' to open
  const [expandedGroups, setExpandedGroups] = useState({
    stock: true,
    customer: true,
    invoice: true,
    shop: false,
    demoDamage: false,
    profile: false,
    userCard: false
  });

  // Profile & Password Modals State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileSuccess('');
      const res = await api.put('/auth/profile', {
        name: profileName,
        phone: profilePhone
      });
      if (res.data.success) {
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setShowProfileModal(false), 1500);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    try {
      setPasswordSaving(true);
      setPasswordError('');
      setPasswordSuccess('');
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      }
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

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
    if (
      location.pathname.startsWith('/customers') ||
      (location.pathname.startsWith('/invoices') && location.search.includes('type=customer'))
    ) {
      setExpandedGroups((prev) => ({ ...prev, customer: true }));
    }
    if (
      location.pathname.startsWith('/stores') ||
      (location.pathname.startsWith('/invoices') && !location.search.includes('type=customer')) ||
      location.pathname.startsWith('/reports')
    ) {
      setExpandedGroups((prev) => ({ ...prev, shop: true }));
    }
    if (location.pathname.startsWith('/demo-damage')) {
      setExpandedGroups((prev) => ({ ...prev, demoDamage: true }));
    }
    if (location.pathname.startsWith('/profile')) {
      setExpandedGroups((prev) => ({ ...prev, profile: true }));
    }
    if (
      location.pathname.startsWith('/field-orders') ||
      location.pathname.startsWith('/orders')
    ) {
      setExpandedGroups((prev) => ({ ...prev, fieldOrder: true }));
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
    if (path === '/invoices?type=customer&action=new') {
      return location.pathname === '/invoices' && location.search.includes('type=customer') && location.search.includes('action=new');
    }
    if (path === '/invoices?type=customer') {
      return location.pathname === '/invoices' && location.search.includes('type=customer') && !location.search.includes('action=new');
    }
    if (path === '/invoices?type=shop&action=new') {
      return location.pathname === '/invoices' && !location.search.includes('type=customer') && location.search.includes('action=new');
    }
    if (path === '/invoices?type=shop') {
      return location.pathname === '/invoices' && !location.search.includes('type=customer') && !location.search.includes('action=new');
    }
    if (path === '/demo-damage?action=new') {
      return location.pathname === '/demo-damage' && location.search.includes('action=new');
    }
    if (path === '/demo-damage') {
      return location.pathname === '/demo-damage' && !location.search.includes('action=new');
    }
    if (path === '/reports') {
      return location.pathname.startsWith('/reports');
    }
    if (path === '/profile') {
      return location.pathname === '/profile';
    }
    if (path === '/field-orders?action=new') {
      return location.pathname === '/field-orders' && location.search.includes('action=new');
    }
    if (path === '/field-orders') {
      return (location.pathname === '/field-orders' || location.pathname === '/orders') && !location.search.includes('action=new');
    }
    return location.pathname === path;
  };

  // Stock accordion menu item
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
      { name: 'Manage Products', path: '/products' }
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
      { name: 'Manage Customer', path: '/customers' },
      { name: 'Add Invoice', path: '/invoices?type=customer&action=new' },
      { name: 'Manage Invoice', path: '/invoices?type=customer' }
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
      { name: 'Add Invoice', path: '/invoices?type=shop&action=new' },
      { name: 'Manage Invoice', path: '/invoices?type=shop' },
      { name: 'Shop Report', path: '/reports' }
    ]
  };

  // Field Order accordion menu item (matching Screenshot 1)
  const fieldOrderAccordion = {
    id: 'fieldOrder',
    name: 'Field Order',
    icon: ClipboardCheck,
    iconColor: 'text-blue-600',
    iconStrokeWidth: 2,
    isAccordion: true,
    children: [
      { name: 'Add Order', path: '/field-orders?action=new' },
      { name: 'Manage Orders', path: '/field-orders' }
    ]
  };

  // Demo/Free/Damage accordion menu item matching user's design
  const demoFreeDamageAccordion = {
    id: 'demoDamage',
    name: 'Demo/Free/Damage',
    icon: Check,
    iconColor: 'text-orange-500',
    iconStrokeWidth: 3,
    titleColor: 'text-blue-600 font-medium',
    isAccordion: true,
    children: [
      { name: 'Add Demo/Free/Damage', path: '/demo-damage?action=new' },
      { name: 'Manage Demo/Free/Damage', path: '/demo-damage' }
    ]
  };

  // Profile accordion menu item
  const profileAccordion = {
    id: 'profile',
    name: 'Profile',
    icon: User,
    iconColor: 'text-blue-600',
    iconStrokeWidth: 2,
    isAccordion: true,
    children: [
      { name: 'My Profile', path: '/profile' },
      { name: 'Change Password', action: 'password' },
      { name: 'Logout', action: 'logout' }
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
        shopRetailersAccordion,
        fieldOrderAccordion,
        demoFreeDamageAccordion,
        profileAccordion
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
        shopRetailersAccordion,
        demoFreeDamageAccordion,
        profileAccordion
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
              <div className="relative" ref={brandDropdownRef}>
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
                    Tamizh Enterprises
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
                              : item.titleColor
                              ? item.titleColor
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
                                if (subItem.action) {
                                  return (
                                    <button
                                      key={subItem.name}
                                      type="button"
                                      onClick={() => {
                                        if (subItem.action === 'profile') setShowProfileModal(true);
                                        if (subItem.action === 'password') setShowPasswordModal(true);
                                        if (subItem.action === 'logout') logout();
                                        if (window.innerWidth < 1024) onClose();
                                      }}
                                      className={`block w-full text-left text-[14px] transition-colors py-1 px-1.5 rounded-lg cursor-pointer ${
                                        subItem.action === 'logout'
                                          ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium'
                                      }`}
                                    >
                                      {subItem.name}
                                    </button>
                                  );
                                }

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

        {/* User Role Card at bottom with collapsible options */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          {expandedGroups.userCard && (
            <div className="mb-2 bg-slate-50/90 rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="block w-full text-left text-[14px] text-slate-600 hover:text-slate-900 font-medium py-1 px-1.5 rounded-lg hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="block w-full text-left text-[14px] text-slate-600 hover:text-slate-900 font-medium py-1 px-1.5 rounded-lg hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full text-left text-[14px] text-slate-600 hover:text-rose-600 font-medium py-1 px-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpandedGroups((prev) => ({ ...prev, userCard: !prev.userCard }))}
            className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || 'Muralitharan'}
              </div>
              <div className="text-[10px] text-blue-600 font-medium">
                {user?.role || 'Owner'} Account
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0"
                title="System Online"
              />
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  expandedGroups.userCard ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </aside>

      {/* ================= MODAL: MY PROFILE ================= */}
      {showProfileModal && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="My Profile"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs sm:text-sm">
            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                {profileSuccess}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Role</label>
              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs">
                {user?.role || 'Owner'}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: CHANGE PASSWORD ================= */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs sm:text-sm">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default Sidebar;
