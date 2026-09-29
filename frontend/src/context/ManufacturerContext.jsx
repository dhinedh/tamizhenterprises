import React, { createContext, useContext, useState, useEffect } from 'react';

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
        hasActiveManufacturer: !!activeManufacturer
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
