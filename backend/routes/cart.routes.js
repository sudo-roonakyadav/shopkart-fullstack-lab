/**
 * ============================================================================
 * File: backend/routes/cart.routes.js
 * Purpose: Shopping Cart Express Route Definitions (Lab 05)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Protects all cart endpoints with authMiddleware.protect.
 * - Maps GET / to cartController.getCart (fetch cart with derived totals).
 * - Maps POST / to cartController.addToCart (add item with stock check).
 * - Maps PUT /:productId to cartController.updateCartItem (update quantity).
 * - Maps DELETE /:productId to cartController.removeFromCart (remove item).
 * - Maps DELETE / to cartController.clearCart (empty cart).
 * ============================================================================
 */
const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// All cart routes are protected
router.use(protect);

router.post('/:productId', addToCart);
router.get('/', getCart);
router.patch('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);

module.exports = router;
