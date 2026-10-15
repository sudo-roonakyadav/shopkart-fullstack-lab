/**
 * ============================================================================
 * File: frontend/src/components/CartItem.jsx
 * Purpose: Individual Cart Item Row Component (Lab 05)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders a single product row inside the shopping cart.
 * - Displays distribution logo, title, unit price, and calculated item subtotal.
 * - Provides quantity increment and decrement buttons bounded by available stock.
 * - Provides a remove button to delete the item from the cart.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const product = item.product;

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!product) return null;

  const handleDecrease = async () => {
    if (item.quantity <= 1) return;
    setLoadingAction(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, item.quantity - 1);
    setLoadingAction(false);
    if (!res.success) setErrorMsg(res.message);
  };

  const handleIncrease = async () => {
    if (item.quantity >= product.stock) {
      setErrorMsg(`Cannot exceed stock (${product.stock} units)`);
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }
    setLoadingAction(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, item.quantity + 1);
    setLoadingAction(false);
    if (!res.success) setErrorMsg(res.message);
  };

  const handleRemove = async () => {
    setLoadingAction(true);
    setErrorMsg('');
    const res = await removeFromCart(product._id);
    setLoadingAction(false);
    if (!res.success) setErrorMsg(res.message);
  };

  const itemTotal = (product.price || 0) * (item.quantity || 1);

  return (
    <div className="cart-item-row">
      <div className="cart-item-image-wrap">
        <ProductImage product={product} />
      </div>

      <div className="cart-item-info">
        <span className="product-card-category">{product.category}</span>
        <h4 className="cart-item-title">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h4>
        <div className="cart-item-price-unit">
          Unit Price: <strong>₹{product.price}</strong>
        </div>
        {errorMsg && <div className="cart-item-error">{errorMsg}</div>}
      </div>

      <div className="cart-item-controls">
        <div className="quantity-control-group">
          <button
            type="button"
            className="qty-btn"
            onClick={handleDecrease}
            disabled={loadingAction || item.quantity <= 1}
            title="Decrease quantity"
          >
            -
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={handleIncrease}
            disabled={loadingAction || item.quantity >= product.stock}
            title="Increase quantity"
          >
            +
          </button>
        </div>
        <div className="cart-item-stock-hint">
          {product.stock} available
        </div>
      </div>

      <div className="cart-item-total">
        <span className="total-amount">₹{itemTotal.toLocaleString()}</span>
      </div>

      <div className="cart-item-remove-wrap">
        <button
          type="button"
          onClick={handleRemove}
          disabled={loadingAction}
          className="btn btn-outline-danger btn-sm"
          title="Remove from cart"
        >
          {loadingAction ? '...' : 'Remove'}
        </button>
      </div>
    </div>
  );
};

export default CartItem;
