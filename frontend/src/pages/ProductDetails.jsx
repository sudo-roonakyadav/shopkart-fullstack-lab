/**
 * ============================================================================
 * File: frontend/src/pages/ProductDetails.jsx
 * Purpose: Product Specification & Details Page Component
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Fetches full specifications for a single product by ID (/api/products/:id).
 * - Displays kernel version, package manager, desktop environment, and release notes.
 * - Provides interactive quantity selector and Add to Cart button (with stock limit).
 * - Provides Add to Wishlist toggle button.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ProductImage';

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartAdding, setCartAdding] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Fetch product and wishlist status
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);

        // Check if item is in wishlist
        if (user) {
          try {
            const wishRes = await api.get('/wishlist');
            const isSaved = (wishRes.data.wishlist || []).some(
              (p) => p._id === id
            );
            setWishlisted(isSaved);
          } catch (e) {
            // ignore wishlist error
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID.');
        } else {
          setError('Something went wrong while loading product details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    setFeedback('');
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${id}`);
        setWishlisted(false);
        setFeedback('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${id}`);
        setWishlisted(true);
        setFeedback('Added to wishlist');
      }
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Wishlist operation failed');
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setFeedback(''), 2000);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCartAdding(true);
    setFeedback('');
    const res = await addToCart(id);
    setCartAdding(false);
    if (res.success) {
      setFeedback('Added to cart!');
    } else {
      setFeedback(res.message);
    }
    setTimeout(() => setFeedback(''), 2000);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <p className="loading-text">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-container">
        <div className="state-container error-state">
          <h3>Product Error</h3>
          <p>{error || 'Product not found.'}</p>
          <Link to="/products" className="btn btn-secondary">
            Back to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  const itemInCart = cartItems.find(
    (item) => (item.product?._id || item.product) === product._id
  );

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link to="/products">Back to Catalog</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span className="current">{product.name}</span>
      </div>

      <div className="product-details-container card">
        <div className="details-image-section">
          <ProductImage product={product} />
        </div>

        <div className="details-info-section">
          <span className="product-card-category">{product.category}</span>
          <h1 className="details-title">{product.name}</h1>

          <div className="details-meta-row">
            <span className="details-price">₹{product.price}</span>
            <span
              className={`stock-status ${
                product.stock > 0 ? 'in-stock' : 'out-of-stock'
              }`}
            >
              {product.stock > 0
                ? `${product.stock} units available in stock`
                : 'Currently out of stock'}
            </span>
          </div>

          <div className="details-description">
            <h3>Distribution Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="digital-license-note">
            <strong>Digital ISO Notice:</strong> Verified bootable digital image. Direct ISO download link and SHA256 checksum are generated upon checkout.
          </div>

          {feedback && <div className="card-feedback-msg">{feedback}</div>}

          <div className="details-actions">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartAdding || product.stock <= 0}
              className="btn btn-primary btn-lg"
            >
              {cartAdding
                ? 'Adding to Cart...'
                : itemInCart
                ? `In Cart (${itemInCart.quantity}) — Add Another`
                : 'Add to Cart'}
            </button>

            <button
              type="button"
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`btn ${wishlisted ? 'btn-wishlist-active' : 'btn-secondary'} btn-lg`}
            >
              {wishlistLoading ? 'Saving...' : wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
