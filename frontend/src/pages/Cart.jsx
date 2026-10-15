/**
 * ============================================================================
 * File: frontend/src/pages/Cart.jsx
 * Purpose: Shopping Cart Page Component (Lab 05)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders all items currently in the user's shopping cart via CartContext.
 * - Computes dynamic order summary: items count, subtotal, shipping fee, total.
 * - Provides quantity adjustment (+ / -) enforcing minimum of 1 and maximum of stock.
 * - Provides Clear Cart button and Proceed to Checkout button.
 * - Handles empty cart state with call-to-action to browse distributions.
 * ============================================================================
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartLoading,
    cartError,
    totalItems,
    subtotal,
    refreshCart
  } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="page-container">
      <div className="cart-page-header">
        <h2>Shopping Cart</h2>
        <p className="page-subtitle">
          Review your chosen Linux distributions, adjust quantities, and prepare for checkout.
        </p>
      </div>

      {cartLoading && cartItems.length === 0 ? (
        <div className="state-container">
          <p className="loading-text">Loading your cart...</p>
        </div>
      ) : cartError && cartItems.length === 0 ? (
        <div className="state-container error-state">
          <h3>Unable to load your cart.</h3>
          <p>{cartError}</p>
          <button onClick={refreshCart} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="state-container empty-state">
          <h3>Your cart is empty</h3>
          <p className="empty-text">
            Looks like you haven't added any Linux distributions yet.
          </p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout-grid">
          {/* Cart Items List */}
          <div className="cart-items-section">
            <div className="card cart-table-card">
              <div className="cart-table-header">
                <span className="th-product">Distribution</span>
                <span className="th-qty">Quantity</span>
                <span className="th-total">Total</span>
                <span className="th-action">Action</span>
              </div>

              <div className="cart-table-body">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.product?._id || item._id}
                    item={item}
                  />
                ))}
              </div>
            </div>

            <div className="cart-footer-links">
              <Link to="/products" className="btn btn-outline btn-sm">
                Continue Shopping
              </Link>
              <button
                type="button"
                onClick={refreshCart}
                className="btn btn-outline btn-sm"
              >
                Refresh Cart
              </button>
            </div>
          </div>

          {/* Order Summary Box (Lab-05 Derived Totals) */}
          <div className="cart-summary-section">
            <div className="card summary-card">
              <div className="card-header">
                <h3>Order Summary</h3>
              </div>

              <div className="card-body">
                <div className="summary-row">
                  <span>Total Items:</span>
                  <strong>{totalItems}</strong>
                </div>

                <div className="summary-row">
                  <span>Digital Delivery:</span>
                  <span className="badge-success">Instant / Free</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Subtotal:</span>
                  <span className="subtotal-figure">₹{subtotal.toLocaleString()}</span>
                </div>

                <p className="tax-notice">
                  All digital download licenses and taxes included.
                </p>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="btn btn-primary btn-block btn-lg checkout-btn"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
