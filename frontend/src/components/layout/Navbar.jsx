import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, UserCircle2, ArrowRightLeft, Building2, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useManufacturer } from '../../context/ManufacturerContext';

const Navbar = ({ onOpenSidebar, hasSidebar }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const { activeManufacturer, clearActiveManufacturer } = useManufacturer();
  const navigate = useNavigate();

  const handleSwitchBrand = () => {
    clearActiveManufacturer();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {hasSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {activeManufacturer ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSwitchBrand}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 hover:border-teal-300"
              title="Return to Main Dashboard with all manufacturers"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> All Brands
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                {activeManufacturer.name}
              </span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {activeManufacturer.code}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <span className="hidden sm:inline text-xs text-slate-500">Tamil Enterprises ERP &bull; </span>
            <span className="text-xs font-semibold text-slate-800">Select Manufacturer Portal</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Role Demo Switcher */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="px-2 text-slate-400 flex items-center gap-1 font-medium">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Switch View:
          </span>
          <button
            onClick={() => quickDemoLogin('Owner')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'Owner'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin / Owner
          </button>
          <button
            onClick={() => quickDemoLogin('Salesman')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'Salesman'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salesman (Field)
          </button>
          <button
            onClick={() => quickDemoLogin('Store')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'Store'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Store (Retailer)
          </button>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
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
