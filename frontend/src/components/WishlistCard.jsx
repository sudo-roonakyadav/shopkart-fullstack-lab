/**
 * ============================================================================
 * File: frontend/src/components/WishlistCard.jsx
 * Purpose: Wishlist Item Card Component (Lab 04)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders saved products on the customer's wishlist page.
 * - Displays distribution image, title, price, architecture, and stock status.
 * - Provides a Move to Cart button to transfer saved items directly to the cart.
 * - Provides a Remove button to delete the item reference from the wishlist.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';

const WishlistCard = ({ product, onRemove }) => {
  const { addToCart } = useCart();
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(product._id);
    setRemoving(false);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    setFeedback('');
    const res = await addToCart(product._id);
    setAdding(false);
    if (res.success) {
      setFeedback('Added to cart!');
    } else {
      setFeedback(res.message);
    }
    setTimeout(() => setFeedback(''), 2000);
  };

  return (
    <div className="wishlist-card">
      <div className="wishlist-card-image-wrap">
        <ProductImage product={product} />
      </div>

      <div className="wishlist-card-content">
        <span className="product-card-category">{product.category}</span>
        <h3 className="wishlist-card-title">{product.name}</h3>

        <div className="wishlist-card-meta">
          <span className="product-price">₹{product.price}</span>
          <span
            className={`stock-status ${
              product.stock > 0 ? 'in-stock' : 'out-of-stock'
            }`}
          >
            {product.stock > 0 ? `${product.stock} units left` : 'Out of stock'}
          </span>
        </div>

        {feedback && <div className="card-feedback-msg">{feedback}</div>}

        <div className="wishlist-card-actions">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-secondary btn-sm"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.stock <= 0}
            className="btn btn-primary btn-sm"
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="btn btn-danger btn-sm"
          >
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
