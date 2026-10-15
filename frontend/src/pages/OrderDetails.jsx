/**
 * ============================================================================
 * File: frontend/src/pages/OrderDetails.jsx
 * Purpose: Individual Order Receipt Page Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Fetches complete details of a specific order by ID (/api/orders/:id).
 * - Displays Razorpay transaction ID, payment status, placed date, and shipping details.
 * - Displays itemized breakdown with snapshot unit prices, quantities, and totals.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'Access denied: You do not own this order.'
            : err.response?.data?.message || 'Order not found.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <p className="loading-text">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="state-container error-state">
          <h3>Order Details Error</h3>
          <p>{error || 'Could not find the requested order.'}</p>
          <Link to="/orders" className="btn btn-secondary">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const statuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentStatusIndex = statuses.indexOf(order.status);

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link to="/orders">Back to My Orders</Link>
        <span>/</span>
        <span className="current">Order #{order._id}</span>
      </div>

      <div className="card order-details-card">
        <div className="card-header order-details-header-flex">
          <div>
            <h2>Order #{order._id}</h2>
            <p className="order-date-text">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="order-status-header-badges">
            <span
              className={
                order.paymentStatus === 'PAID'
                  ? 'badge-success'
                  : 'badge-status-placed'
              }
            >
              Payment: {order.paymentStatus}
            </span>
            <span className="badge-status-placed">
              Status: {order.status}
            </span>
          </div>
        </div>

        <div className="card-body">
          {/* Status Progression Tracker (Bonus Lab 06) */}
          <div className="status-tracker-container">
            <h4>Order Fulfillment Progress</h4>
            <div className="status-tracker-steps">
              {statuses.map((s, idx) => {
                const isCompleted = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                return (
                  <div
                    key={s}
                    className={`status-step ${
                      isCompleted ? 'completed' : ''
                    } ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="status-step-circle">{idx + 1}</div>
                    <span className="status-step-label">{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-details-sections-grid">
            {/* Items Snapshot Section */}
            <div className="order-details-left">
              <h3>Purchased Linux Distributions</h3>
              <div className="order-items-table">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-table-row">
                    <div className="order-item-title-col">
                      <strong>{item.name}</strong>
                      <span className="item-snapshot-note">
                        Snapshot unit price: ₹{item.price}
                      </span>
                    </div>
                    <div className="order-item-qty-col">
                      Qty: {item.quantity}
                    </div>
                    <div className="order-item-subtotal-col">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total-summary-box">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Digital Delivery:</span>
                  <span className="badge-success">Free</span>
                </div>
                <div className="summary-row total-row">
                  <span>Grand Total:</span>
                  <span className="subtotal-figure">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping & Payment Meta Section */}
            <div className="order-details-right">
              <div className="info-block">
                <h4>Shipping Address</h4>
                <p>
                  <strong>{order.shippingAddress?.fullName}</strong>
                </p>
                <p>Phone: {order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.addressLine1}</p>
                <p>
                  {order.shippingAddress?.city},{' '}
                  {order.shippingAddress?.state} —{' '}
                  {order.shippingAddress?.pincode}
                </p>
              </div>

              <div className="info-block">
                <h4>Payment Metadata</h4>
                <p>
                  Method:{' '}
                  <strong>
                    {order.isSimulated
                      ? 'Academic Offline Simulation (Demo Mode)'
                      : 'Razorpay Standard Checkout (Test Mode)'}
                  </strong>
                </p>
                {order.isSimulated && (
                  <p
                    style={{
                      color: '#b45309',
                      fontSize: '0.85rem',
                      margin: '4px 0 8px 0',
                      fontWeight: 500
                    }}
                  >
                    (Simulated for academic testing. Not processed through Razorpay gateway.)
                  </p>
                )}
                {order.razorpayOrderId && (
                  <p>
                    {order.isSimulated ? 'Internal Order ID: ' : 'Razorpay Order ID: '}
                    <span className="mono-text">{order.razorpayOrderId}</span>
                  </p>
                )}
                {order.razorpayPaymentId && (
                  <p>
                    {order.isSimulated ? 'Simulated Payment ID: ' : 'Razorpay Payment ID: '}
                    <span className="mono-text">{order.razorpayPaymentId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
