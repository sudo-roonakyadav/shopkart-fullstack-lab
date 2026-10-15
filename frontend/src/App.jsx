/**
 * ============================================================================
 * File: frontend/src/App.jsx
 * Purpose: Root Application Layout & Route Switcher
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines the top-level application layout containing Navbar and main content area.
 * - Configures React Router routes for public pages:
 *     - /products      -> Product catalog (Lab 03)
 *     - /products/:id  -> Product specifications
 *     - /login         -> User login
 *     - /register      -> User registration
 * - Configures protected routes (via ProtectedRoute wrapper):
 *     - /wishlist      -> Customer wishlist (Lab 04)
 *     - /cart          -> Shopping cart (Lab 05)
 *     - /checkout      -> Checkout & payment (Lab 06)
 *     - /order-success -> Payment confirmation & receipt
 *     - /orders        -> Order history list
 *     - /orders/:id    -> Individual order details
 * ============================================================================
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Default redirect to products catalog */}
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* Authentication Routes (Lab-02) */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Home Route (Lab-02) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Product Discovery Routes (Lab-03) */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Protected Wishlist Route (Lab-04) */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* Protected Cart Route (Lab-05) */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* Protected Checkout & Order Routes (Lab-06) */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success/:id"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route
            path="*"
            element={
              <div className="page-container state-container">
                <h2>404 — Page Not Found</h2>
                <p>The requested page could not be located.</p>
                <a href="/products" className="btn btn-primary">
                  Go to Products Catalog
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2026 ShopKart Inc. — Linux Software & Digital Distribution Platform</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
