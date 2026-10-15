/**
 * ============================================================================
 * File: frontend/src/context/AuthContext.jsx
 * Purpose: Global Authentication State Management (Context API)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Manages global authentication status across the application (user, isAuthenticated, loading).
 * - On initial app load, calls GET /api/auth/me to verify existing session cookies.
 * - Provides login(email, password) to authenticate users and set session state.
 * - Provides register(userData) to create customer accounts.
 * - Provides logout() to clear server session cookies and reset client state.
 * ============================================================================
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on initial mount
  const checkAuth = async () => {
    try {
      const response = await api.get('/customers/me');
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/customers/login', { email, password });
    if (response.data.customer) {
      setUser(response.data.customer);
    } else {
      // Re-fetch profile if customer object was not directly returned
      await checkAuth();
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post('/customers/register', userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/customers/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
