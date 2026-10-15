/**
 * ============================================================================
 * File: frontend/src/components/Navbar.jsx
 * Purpose: Global Top Navigation Bar Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Displays brand identity (ShopKart Linux Distros).
 * - Renders navigation links: Catalog, Wishlist (Lab 04), Cart (Lab 05), Orders (Lab 06).
 * - Shows dynamic item count badge on Cart link using CartContext.
 * - Displays user authentication status, profile name, and Login/Logout controls.
 * ============================================================================
 */
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/products" className="navbar-brand">
          <span className="brand-dot"></span>
          <span className="brand-name">ShopKart</span>
          <span className="brand-sub">Linux ISOs</span>
        </Link>

        <nav className="navbar-links">
          <NavLink
            to="/home"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Products
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/wishlist"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Wishlist
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) => `nav-link cart-link ${isActive ? 'active' : ''}`}
              >
                Cart {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Orders
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar-auth">
          {user ? (
            <div className="user-profile-menu">
              <span className="user-greeting">
                {user.fullName.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline-light btn-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline-light btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
