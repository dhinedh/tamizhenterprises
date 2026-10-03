import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const ManufacturerContext = createContext(null);

export const ManufacturerProvider = ({ children }) => {
  const [activeManufacturer, setActiveManufacturerState] = useState(() => {
    try {
      const saved = localStorage.getItem('tamil_active_mfg');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [manufacturers, setManufacturers] = useState(() => {
    try {
      const cached = localStorage.getItem('tamil_erp_manufacturers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);

  const fetchManufacturers = useCallback(async () => {
    try {
      setLoadingManufacturers(true);
      const res = await api.get('/manufacturers');
      if (res.data?.success) {
        setManufacturers(res.data.data);
        localStorage.setItem('tamil_erp_manufacturers', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Error fetching manufacturers in ManufacturerContext:', err);
    } finally {
      setLoadingManufacturers(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('tamil_erp_token');
    if (token) {
      fetchManufacturers();
    }
  }, [fetchManufacturers]);

  const setActiveManufacturer = (mfg) => {
    setActiveManufacturerState(mfg);
    try {
      if (mfg) {
        localStorage.setItem('tamil_active_mfg', JSON.stringify(mfg));
      } else {
        localStorage.removeItem('tamil_active_mfg');
      }
    } catch (e) {
      console.error('Error saving active manufacturer to localStorage', e);
    }
  };

  const clearActiveManufacturer = () => {
    setActiveManufacturer(null);
  };

  return (
    <ManufacturerContext.Provider
      value={{
        activeManufacturer,
        setActiveManufacturer,
        clearActiveManufacturer,
        hasActiveManufacturer: !!activeManufacturer,
        manufacturers,
        fetchManufacturers,
        loadingManufacturers
      }}
    >
      {children}
    </ManufacturerContext.Provider>
  );
};

export const useManufacturer = () => {
  const context = useContext(ManufacturerContext);
  if (!context) {
    throw new Error('useManufacturer must be used within a ManufacturerProvider');
  }
  return context;
};

export default ManufacturerContext;
