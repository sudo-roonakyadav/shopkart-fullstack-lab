/**
 * ============================================================================
 * File: frontend/src/pages/OrderSuccess.jsx
 * Purpose: Order Confirmation & Receipt Page (Lab 06)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Displays payment success banner and newly generated MongoDB Order Reference ID.
 * - Displays payment status ('paid'), total amount, and order status.
 * - Lists purchased items with quantities and snapshot prices.
 * - Shows shipping address confirmation.
 * - Provides navigation links to view full Order History or continue shopping.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <p className="loading-text">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="state-container error-state">
          <h3>Order Confirmation</h3>
          <p>{error || 'Order details not found.'}</p>
          <Link to="/orders" className="btn btn-secondary">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card order-success-card">
        <div className="order-success-header">
          <h2>Order Placed Successfully!</h2>
          <p className="page-subtitle">
            {order.isSimulated
              ? 'Academic Demo Mode: Order recorded via offline simulation.'
              : 'Payment verified. Your Linux distribution licenses and direct download ISO links are confirmed.'}
          </p>
          {order.isSimulated && (
            <div
              style={{
                marginTop: '1rem',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                color: '#1e40af',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              <strong>Academic Simulation Notice:</strong> This transaction was completed using offline academic demo simulation. It was not processed through the live or test Razorpay payment gateway.
            </div>
          )}
        </div>

        <div className="order-success-details-grid">
          <div className="detail-box order-id-box">
            <span className="detail-box-label">Order Reference ID</span>
            <strong className="detail-box-val mono-text">{order._id}</strong>
          </div>

          <div className="detail-box">
            <span className="detail-box-label">Total Amount Paid</span>
            <strong className="detail-box-val subtotal-figure">
              ₹{order.totalAmount.toLocaleString()}
            </strong>
          </div>

          <div className="detail-box">
            <span className="detail-box-label">Payment Status</span>
            <strong className="badge-success">
              {order.paymentStatus} {order.isSimulated ? '(SIMULATED)' : ''}
            </strong>
          </div>

          <div className="detail-box">
            <span className="detail-box-label">Order Status</span>
            <strong className="badge-status-placed">{order.status}</strong>
          </div>
        </div>

        {/* Purchased Items Snapshot */}
        <div className="order-items-summary-section">
          <h3>Purchased Linux Distributions</h3>
          <div className="checkout-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="checkout-item-row">
                <div className="checkout-item-info">
                  <strong>{item.name}</strong>
                  <span className="checkout-item-qty">
                    Qty: {item.quantity} × ₹{item.price}
                  </span>
                </div>
                <span className="checkout-item-total">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Destination */}
        <div className="order-shipping-summary">
          <h4>Delivery Address & Contact:</h4>
          <p>
            <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})<br />
            {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
          </p>
        </div>

        <div className="order-success-actions">
          <Link to="/orders" className="btn btn-secondary">
            View My Orders
          </Link>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
