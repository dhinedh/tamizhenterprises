import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Building2, ChevronDown, Check, Layers, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useManufacturer } from '../../context/ManufacturerContext';

const Navbar = ({ onOpenSidebar, hasSidebar }) => {
  const { user, logout } = useAuth();
  const {
    activeManufacturer,
    setActiveManufacturer,
    clearActiveManufacturer,
    manufacturers,
    fetchManufacturers
  } = useManufacturer();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectManufacturer = (mfg) => {
    setIsOpen(false);
    if (mfg) {
      setActiveManufacturer(mfg);
    } else {
      clearActiveManufacturer();
      navigate('/');
    }
  };

  const handleSwitchBrand = () => {
    clearActiveManufacturer();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {hasSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Change Manufacturer Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              activeManufacturer
                ? 'bg-teal-50 hover:bg-teal-100/80 border-teal-200 text-teal-950 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
            title="Click to switch or select manufacturer"
          >
            {activeManufacturer ? (
              <>
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex items-center gap-1.5 text-left">
                  <span className="text-[11px] text-teal-700/80 font-normal hidden sm:inline">Brand:</span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 max-w-[120px] sm:max-w-[180px] truncate">
                    {activeManufacturer.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 hidden md:inline">
                    {activeManufacturer.code}
                  </span>
                </div>
              </>
            ) : (
              <>
                <img
                  src="/logo.jpg"
                  alt="Tamizh Enterprises"
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                />
                <div className="flex items-center gap-1.5 text-left">
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    All Manufacturers
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">(Hub)</span>
                </div>
              </>
            )}

            <span className="text-[11px] text-teal-700 font-semibold bg-white px-1.5 py-0.5 rounded border border-teal-200/60 shadow-2xs">
              Change
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Switch Manufacturer
                </span>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full border border-teal-100">
                  {manufacturers.length} Brands
                </span>
              </div>

              {/* All Manufacturers Overview */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => handleSelectManufacturer(null)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    !activeManufacturer
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${!activeManufacturer ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">All Manufacturers Hub</div>
                      <div className="text-[10px] text-slate-500">Aggregated view across all brands</div>
                    </div>
                  </div>
                  {!activeManufacturer && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Manufacturers List */}
              <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                {manufacturers.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No manufacturers loaded
                  </div>
                ) : (
                  manufacturers.map((mfg) => {
                    const isSelected = activeManufacturer?._id === mfg._id;
                    return (
                      <button
                        key={mfg._id}
                        type="button"
                        onClick={() => handleSelectManufacturer(mfg)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate">{mfg.name}</span>
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {mfg.code}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {mfg.contactPerson ? `${mfg.contactPerson} • ` : ''}{mfg.city || 'Tamil Nadu'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Link to Manage Manufacturers */}
              <div className="border-t border-slate-100 p-1.5 mt-1 bg-slate-50/70 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/manufacturers');
                  }}
                  className="w-full text-center py-1 text-[11px] text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  Manage Manufacturers Directory &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick shortcut back to All Brands Hub if a brand is active */}
        {activeManufacturer && (
          <button
            type="button"
            onClick={handleSwitchBrand}
            className="hidden lg:flex px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
            title="Return to Main Dashboard with all manufacturers"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All Brands Hub
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5">
          <img
            src={user?.logo || '/logo.jpg'}
            alt="User"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
          />
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-800 leading-tight">{user?.name}</span>
            <span className="text-[10px] text-teal-600 font-semibold uppercase">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
