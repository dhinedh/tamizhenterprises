import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ManufacturerProvider } from './context/ManufacturerContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import StockManagement from './pages/StockManagement';
import StoreTransfers from './pages/StoreTransfers';
import Stores from './pages/Stores';
import StoreDetail from './pages/StoreDetail';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Salesmen from './pages/Salesmen';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Returns from './pages/Returns';
import Schemes from './pages/Schemes';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Loading ERP Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ManufacturerProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Main ERP App */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="manufacturers" element={<Navigate to="/" replace />} />
              <Route path="products" element={<Products />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="stock" element={<StockManagement />} />
              <Route path="store-transfers" element={<StoreTransfers />} />
              <Route path="stock-transfers" element={<Navigate to="/store-transfers" replace />} />
              <Route path="transfers" element={<Navigate to="/store-transfers" replace />} />
              <Route path="stores" element={<Stores />} />
              <Route path="stores/:id" element={<StoreDetail />} />
              <Route path="orders" element={<Orders />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="salesmen" element={<Salesmen />} />
              <Route path="payments" element={<Payments />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="returns" element={<Returns />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ManufacturerProvider>
    </AuthProvider>
  );
}

export default App;
