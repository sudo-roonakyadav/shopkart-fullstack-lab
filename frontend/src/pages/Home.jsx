/**
 * ============================================================================
 * File: frontend/src/pages/Home.jsx
 * Purpose: Home / Landing Page Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Displays brand introduction, featured Linux distributions, and value propositions.
 * - Provides quick-start navigation buttons to browse the catalog or view cart/orders.
 * ============================================================================
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Home = () => {
  const { user } = useAuth();
  const { totalItems } = useCart();

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="home-hero-card">
        <div className="home-hero-content">
          <h2>Welcome, {user.fullName}</h2>
          <p className="home-hero-text">
            Customer Dashboard & Account Overview
          </p>
        </div>
      </div>

      <div className="home-grid">
        {/* Customer Profile Box (Lab-02 Task 3) */}
        <div className="card profile-card">
          <div className="card-header">
            <h3>Customer Account Information</h3>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <span className="detail-label">Customer ID:</span>
              <span className="detail-value mono-text">{user._id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{user.fullName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email Address:</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone Number:</span>
              <span className="detail-value">{user.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account Status:</span>
              <span className="detail-value badge-success">Active</span>
            </div>
          </div>
        </div>

        {/* Quick Portal Navigation */}
        <div className="card navigation-card">
          <div className="card-header">
            <h3>Quick Navigation</h3>
          </div>
          <div className="card-body quick-actions-list">
            <Link to="/products" className="quick-action-item">
              <div className="action-info">
                <strong>Browse Linux Catalog</strong>
                <p>Explore official ISOs for Ubuntu, Debian, Fedora, Arch, Mint, and more.</p>
              </div>
            </Link>

            <Link to="/wishlist" className="quick-action-item">
              <div className="action-info">
                <strong>Saved Wishlist</strong>
                <p>Manage distributions saved for future review.</p>
              </div>
            </Link>

            <Link to="/cart" className="quick-action-item">
              <div className="action-info">
                <strong>Shopping Cart {totalItems > 0 && `(${totalItems} items)`}</strong>
                <p>Adjust order quantities and review subtotal.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
