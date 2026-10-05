import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tamil_erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('tamil_erp_token'));
  const [loading, setLoading] = useState(() => {
    const storedToken = localStorage.getItem('tamil_erp_token');
    const storedUser = localStorage.getItem('tamil_erp_user');
    // Only block if token exists but user isn't cached yet
    return !!(storedToken && !storedUser);
  });

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('tamil_erp_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('tamil_erp_user', JSON.stringify(res.data.data));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Failed to load user', err);
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, ...userData } = res.data.data;
        localStorage.setItem('tamil_erp_token', newToken);
        localStorage.setItem('tamil_erp_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const quickDemoLogin = async (roleName) => {
    let credentials = { email: 'admin@tamilenterprises.com', password: 'admin123' };
    if (roleName === 'Salesman') {
      credentials = { email: 'murugan@tamilenterprises.com', password: 'sales123' };
    } else if (roleName === 'Store') {
      credentials = { email: 'store@srikrishnastores.com', password: 'store123' };
    }
    return await login(credentials.email, credentials.password);
  };

  const logout = () => {
    localStorage.removeItem('tamil_erp_token');
    localStorage.removeItem('tamil_erp_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
    try {
      const current = JSON.parse(localStorage.getItem('tamil_erp_user') || '{}');
      localStorage.setItem('tamil_erp_user', JSON.stringify({ ...current, ...userData }));
    } catch {
      localStorage.setItem('tamil_erp_user', JSON.stringify(userData));
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    quickDemoLogin,
    logout,
    updateUser,
    isOwner: user?.role === 'Owner',
    isSalesman: user?.role === 'Salesman',
    isStore: user?.role === 'Store'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
