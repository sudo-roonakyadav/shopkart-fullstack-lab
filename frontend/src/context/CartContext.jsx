/**
 * ============================================================================
 * File: frontend/src/context/CartContext.jsx
 * Purpose: Global Shopping Cart State Management (Context API - Lab 05)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Maintains synchronized shopping cart state across all components.
 * - Computes derived values: itemCount (sum of quantities) and subtotal amount.
 * - Exposes actions: addToCart(), updateQuantity(), removeFromCart(), and clearCart().
 * - Automatically syncs with backend /api/cart endpoints when authenticated.
 * ============================================================================
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  // Refresh cart from server
  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setCartLoading(true);
    setCartError(null);
    try {
      const response = await api.get('/cart');
      setCartItems(response.data.cart || []);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load shopping cart';
      setCartError(errorMsg);
    } finally {
      setCartLoading(false);
    }
  };

  // Sync cart whenever authenticated user state changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
      setCartError(null);
    }
  }, [user]);

  // Add product to cart
  const addToCart = async (productId) => {
    setCartError(null);
    try {
      const response = await api.post(`/cart/${productId}`);
      setCartItems(response.data.cart || []);
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to add product to cart';
      setCartError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    setCartError(null);
    try {
      const response = await api.patch(`/cart/${productId}`, { quantity });
      setCartItems(response.data.cart || []);
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to update item quantity';
      setCartError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    setCartError(null);
    try {
      const response = await api.delete(`/cart/${productId}`);
      setCartItems(response.data.cart || []);
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to remove product from cart';
      setCartError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Derived Values (Never stored separately in DB or state)
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartLoading,
        cartError,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
