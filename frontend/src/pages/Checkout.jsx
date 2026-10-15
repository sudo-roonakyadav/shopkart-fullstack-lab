/**
 * ============================================================================
 * File: frontend/src/pages/Checkout.jsx
 * Purpose: Multi-Step Checkout & Payment Processing Page (Lab 06)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Collects and validates shipping address (name, phone, address, city, state, pin).
 * - Displays order summary with item breakdown and total amount in INR.
 * - Initiates server-side order creation via /api/orders/create-payment-order.
 * - Opens Razorpay checkout modal (Test Mode) for Netbanking, Cards, UPI.
 * - Provides 1-Click Instant Test Mode Simulation button for 100% reliable demos.
 * - Submits payment credentials to /api/orders/verify-payment for cryptographic verification.
 * - Redirects to /order-success upon successful verification.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Helper to load Razorpay Checkout script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartItems, totalItems, subtotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [simulationAllowed, setSimulationAllowed] = useState(false);

  useEffect(() => {
    const checkSimulationStatus = async () => {
      try {
        const res = await api.get('/orders/simulation-status');
        setSimulationAllowed(Boolean(res.data?.simulationAllowed));
      } catch {
        setSimulationAllowed(false);
      }
    };
    checkSimulationStatus();
  }, []);

  const handleInputChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
    // Clear field-level error on change
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
    setServerError('');
  };

  // Validate shipping details on client before contacting server
  const validateForm = () => {
    const errors = {};
    if (!shippingAddress.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(shippingAddress.phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!shippingAddress.addressLine1.trim()) errors.addressLine1 = 'Address Line is required';
    if (!shippingAddress.city.trim()) errors.city = 'City is required';
    if (!shippingAddress.state.trim()) errors.state = 'State is required';

    if (!shippingAddress.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      setServerError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // 1. Create Pending ShopKart Order & Razorpay Order on server
      const response = await api.post('/orders/create-payment-order', {
        shippingAddress
      });

      const {
        shopKartOrderId,
        razorpayOrderId,
        amount,
        currency,
        key
      } = response.data;

      // 2. Try loading the Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay) {
        // Razorpay Checkout modal
        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: 'ShopKart',
          description: 'Linux Distribution Purchase',
          order_id: razorpayOrderId,
          handler: async function (paymentResponse) {
            try {
              // 3. Send payment details to backend for HMAC SHA256 signature verification
              const verifyRes = await api.post('/orders/verify-payment', {
                shopKartOrderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              });

              if (verifyRes.data.success) {
                // Clear cart in global state & navbar
                await refreshCart();
                navigate(`/order-success/${shopKartOrderId}`);
              }
            } catch (verifyErr) {
              setServerError(
                verifyErr.response?.data?.message ||
                  'Payment verification failed. Your cart has been preserved.'
              );
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
            email: user?.email || ''
          },
          theme: {
            color: '#F97316' // Orange accent
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setServerError(
            resp.error?.description ||
              'Payment failed. Your cart has not been cleared. Please try again.'
          );
        });
        rzp.open();
      } else {
        // Fallback message if razorpay external script cannot load
        setServerError(
          'Razorpay Checkout script could not be loaded from checkout.razorpay.com. Please check internet access or adblockers. (Use Academic Simulation mode below if evaluating offline)'
        );
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to initiate checkout. Please verify inventory and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Dedicated test-payment simulation for viva/offline academic testing environments
  // Calls the isolated development-only simulation backend route
  const handleTestModeDirectPayment = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setServerError('');
    try {
      const response = await api.post('/orders/create-payment-order', {
        shippingAddress
      });
      const { shopKartOrderId } = response.data;

      // Call dedicated offline simulation endpoint on backend
      const simRes = await api.post('/orders/simulate-payment', {
        shopKartOrderId
      });

      if (simRes.data.success) {
        await refreshCart();
        navigate(`/order-success/${shopKartOrderId}`);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Academic payment simulation failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="state-container empty-state">
          <h3>Your cart is empty</h3>
          <p className="empty-text">
            Add at least one Linux distribution to your cart before proceeding to checkout.
          </p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="cart-page-header">
        <h2>Checkout & Payment</h2>
        <p className="page-subtitle">
          Provide your shipping details, review order items, and complete test payment via Razorpay.
        </p>
      </div>

      {serverError && <div className="alert alert-danger">{serverError}</div>}

      <div className="cart-layout-grid">
        {/* Shipping Address Form (Task 2 & 3) */}
        <div className="card">
          <div className="card-header">
            <h3>Shipping & Contact Details</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handlePlaceOrder} id="checkout-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-control"
                  placeholder="e.g. Linus Torvalds"
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.fullName && (
                  <span className="cart-item-error">{formErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.phone && (
                  <span className="cart-item-error">{formErrors.phone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine1">Address Line *</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  className="form-control"
                  placeholder="e.g. 42 Open Source Way, Tech Park"
                  value={shippingAddress.addressLine1}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.addressLine1 && (
                  <span className="cart-item-error">{formErrors.addressLine1}</span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-control"
                    placeholder="e.g. Bengaluru"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.city && (
                    <span className="cart-item-error">{formErrors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className="form-control"
                    placeholder="e.g. Karnataka"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.state && (
                    <span className="cart-item-error">{formErrors.state}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode (6 digits) *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  className="form-control"
                  placeholder="e.g. 560001"
                  maxLength={6}
                  value={shippingAddress.pincode}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.pincode && (
                  <span className="cart-item-error">{formErrors.pincode}</span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Order Review & Payment Summary */}
        <div className="summary-card card">
          <div className="card-header">
            <h3>Order Review ({totalItems} items)</h3>
          </div>
          <div className="card-body">
            <div className="checkout-items-list">
              {cartItems.map((item) => (
                <div key={item.product?._id || item._id} className="checkout-item-row">
                  <div className="checkout-item-info">
                    <strong>{item.product?.name}</strong>
                    <span className="checkout-item-qty">
                      Qty: {item.quantity} × ₹{item.product?.price}
                    </span>
                  </div>
                  <span className="checkout-item-total">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Digital License Delivery:</span>
              <span className="badge-success">Instant / Free</span>
            </div>

            <div className="summary-row total-row">
              <span>Total Payable:</span>
              <span className="subtotal-figure">₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="digital-license-note">
              <strong>Razorpay Test Mode:</strong> Real money will NOT be charged. Use test UPI / Card credentials.
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg checkout-btn"
            >
              {loading ? 'Processing Order...' : `Pay ₹${subtotal.toLocaleString()} with Razorpay`}
            </button>

            {simulationAllowed && (
              <button
                type="button"
                onClick={handleTestModeDirectPayment}
                disabled={loading}
                className="btn btn-secondary btn-block btn-sm test-checkout-btn"
                title="Academic evaluation offline payment simulation (Development/Demo Mode)"
              >
                Simulate Test Payment (Dev/Demo Mode)
              </button>
            )}

            <div className="checkout-back-link">
              <Link to="/cart">Back to Cart</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
