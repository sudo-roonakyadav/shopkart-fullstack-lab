/**
 * ============================================================================
 * File: frontend/src/components/ProductCard.jsx
 * Purpose: Product Catalog Card Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders an individual product in the catalog grid with distribution logo, name,
 *   category, architecture badge, price, and stock status.
 * - Provides Quick Add to Cart button integrated with CartContext and stock checks.
 * - Provides Add to Wishlist toggle button integrated with backend /api/wishlist.
 * - Links to the full product specifications page (/products/:id).
 * ============================================================================
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';

const ProductCard = ({ product, initialWishlisted = false, onWishlistChange }) => {
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();

  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartAdding, setCartAdding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Check if this product is already in the cart
  const itemInCart = cartItems.find(
    (item) => (item.product?._id || item.product) === product._id
  );

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    setFeedbackMsg('');
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        setWishlisted(false);
        setFeedbackMsg('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${product._id}`);
        setWishlisted(true);
        setFeedbackMsg('Added to wishlist');
      }
      if (onWishlistChange) onWishlistChange();
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlisted(true);
        setFeedbackMsg('Already in wishlist');
      } else {
        setFeedbackMsg(err.response?.data?.message || 'Wishlist action failed');
      }
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setFeedbackMsg(''), 2000);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCartAdding(true);
    setFeedbackMsg('');
    const result = await addToCart(product._id);
    setCartAdding(false);
    if (result.success) {
      setFeedbackMsg('Added to cart!');
    } else {
      setFeedbackMsg(result.message);
    }
    setTimeout(() => setFeedbackMsg(''), 2000);
  };

  return (
    <div className="product-card">
      <div className="product-card-image-wrap">
        <ProductImage product={product} />
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`wishlist-action-btn ${wishlisted ? 'active' : ''}`}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {wishlistLoading ? '...' : wishlisted ? 'Saved' : 'Wishlist'}
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-card-category">{product.category}</div>
        <h3 className="product-card-title">{product.name}</h3>

        <div className="product-card-meta">
          <div className="product-price">₹{product.price}</div>
          <div
            className={`stock-status ${
              product.stock > 0 ? 'in-stock' : 'out-of-stock'
            }`}
          >
            {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
          </div>
        </div>

        {feedbackMsg && <div className="card-feedback-msg">{feedbackMsg}</div>}

        <div className="product-card-actions">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-secondary btn-sm"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartAdding || product.stock <= 0}
            className="btn btn-primary btn-sm"
          >
            {cartAdding
              ? 'Adding...'
              : itemInCart
              ? `In Cart (${itemInCart.quantity}) +`
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
