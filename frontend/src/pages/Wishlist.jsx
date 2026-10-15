/**
 * ============================================================================
 * File: frontend/src/pages/Wishlist.jsx
 * Purpose: Customer Wishlist Page Component (Lab 04)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Fetches the authenticated customer's saved items from /api/wishlist.
 * - Renders saved items in a clean grid layout using WishlistCard.
 * - Handles empty wishlist state with a direct button to explore the catalog.
 * - Allows removing items or moving them directly into the shopping cart.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WishlistCard from '../components/WishlistCard';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/wishlist');
      setWishlistItems(response.data.wishlist || []);
    } catch (err) {
      setError("We couldn't load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      // Remove item locally for instant reactivity
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <div className="page-container">
      <div className="wishlist-page-header">
        <div>
          <h2>My Saved Wishlist</h2>
          <p className="page-subtitle">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'distribution' : 'distributions'} saved for future reference.
          </p>
        </div>
        <Link to="/products" className="btn btn-secondary btn-sm">
          Browse More Distros
        </Link>
      </div>

      {loading ? (
        <div className="state-container">
          <p className="loading-text">Loading your wishlist...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <h3>Something went wrong.</h3>
          <p>{error}</p>
          <button onClick={fetchWishlist} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="state-container empty-state">
          <h3>Your wishlist is empty</h3>
          <p className="empty-text">
            Save Linux distributions you love and find them here later.
          </p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
