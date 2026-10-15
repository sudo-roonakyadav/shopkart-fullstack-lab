/**
 * ============================================================================
 * File: frontend/src/pages/Orders.jsx
 * Purpose: Customer Order History Page Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Fetches all past orders placed by the authenticated customer from /api/orders/my-orders.
 * - Displays orders sorted by date with Order ID, item count, total price, and status.
 * - Provides direct links to inspect individual receipts (/orders/:id).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="page-container">
      <div className="cart-page-header">
        <div>
          <h2>My Orders</h2>
          <p className="page-subtitle">
            Review your purchase history, historical price snapshots, and fulfillment statuses.
          </p>
        </div>
        <Link to="/products" className="btn btn-secondary btn-sm">
          Browse Products
        </Link>
      </div>

      {loading ? (
        <div className="state-container">
          <p className="loading-text">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <h3>Failed to load orders</h3>
          <p>{error}</p>
          <button onClick={fetchOrders} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="state-container empty-state">
          <h3>You have not placed any orders yet.</h3>
          <p className="empty-text">
            Add Linux distributions to your cart and complete checkout to see them listed here.
          </p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              'en-IN',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }
            );

            return (
              <div key={order._id} className="card order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id-label">Order Reference:</span>{' '}
                    <strong className="mono-text">{order._id}</strong>
                  </div>
                  <div className="order-date-text">{formattedDate}</div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-line">
                        <span className="item-name-qty">
                          {item.name} <strong>× {item.quantity}</strong>
                        </span>
                        <span className="item-line-price">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-status-group">
                      <span className="status-badge-item">
                        Payment:{' '}
                        <strong
                          className={
                            order.paymentStatus === 'PAID'
                              ? 'badge-success'
                              : 'badge-status-placed'
                          }
                        >
                          {order.paymentStatus}
                          {order.isSimulated ? ' (Demo)' : ''}
                        </strong>
                      </span>
                      <span className="status-badge-item">
                        Fulfillment:{' '}
                        <strong className="badge-status-placed">
                          {order.status}
                        </strong>
                      </span>
                    </div>

                    <div className="order-total-action-group">
                      <div className="order-total-display">
                        Total:{' '}
                        <strong className="subtotal-figure">
                          ₹{order.totalAmount.toLocaleString()}
                        </strong>
                      </div>
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
