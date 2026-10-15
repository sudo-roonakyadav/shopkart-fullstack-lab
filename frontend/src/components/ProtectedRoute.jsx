/**
 * ============================================================================
 * File: frontend/src/components/ProtectedRoute.jsx
 * Purpose: Route Protection Guard Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Wraps protected routes (Wishlist, Cart, Checkout, Orders).
 * - Checks AuthContext to verify if the user is authenticated.
 * - Displays a loading indicator while the initial session check resolves.
 * - Redirects unauthenticated visitors to /login while saving the return path.
 * ============================================================================
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="state-container">
        <p className="loading-text">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
