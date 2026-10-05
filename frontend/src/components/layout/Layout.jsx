import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useManufacturer } from '../../context/ManufacturerContext';
import ManufacturerSelectionView from '../common/ManufacturerSelectionView';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeManufacturer } = useManufacturer();
  const location = useLocation();

  // If not on the main dashboard ('/'), profile ('/profile'), field-orders, or add-shop, and no manufacturer is active, show the Manufacturer Selection cards
  const requiresManufacturerSelection =
    !activeManufacturer &&
    location.pathname !== '/' &&
    !location.pathname.startsWith('/profile') &&
    !location.pathname.startsWith('/field-orders') &&
    !(location.pathname.startsWith('/stores') && location.search.includes('action=new'));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation - Always available for seamless ERP workflow */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72 pl-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} hasSidebar={true} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {requiresManufacturerSelection ? (
            <ManufacturerSelectionView />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
