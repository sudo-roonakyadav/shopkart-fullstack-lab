/**
 * ============================================================================
 * File: frontend/src/main.jsx
 * Purpose: React Application Client Entry Point
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Mounts the root React component tree into the DOM element (#root).
 * - Wraps the application in BrowserRouter for client-side routing.
 * - Wraps the application in AuthProvider for global authentication state.
 * - Wraps the application in CartProvider for global shopping cart synchronization.
 * - Imports global stylesheet (index.css).
 * ============================================================================
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
