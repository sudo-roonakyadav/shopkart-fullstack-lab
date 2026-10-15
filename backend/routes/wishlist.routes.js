/**
 * ============================================================================
 * File: backend/routes/wishlist.routes.js
 * Purpose: Wishlist Express Route Definitions (Lab 04)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Protects all wishlist endpoints with authMiddleware.protect.
 * - Maps GET / to wishlistController.getWishlist (retrieve populated wishlist).
 * - Maps POST /:productId to wishlistController.addToWishlist (save product).
 * - Maps DELETE /:productId to wishlistController.removeFromWishlist (remove product).
 * ============================================================================
 */
const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
} = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

// All wishlist routes are protected
router.use(protect);

router.post('/:productId', addToWishlist);
router.get('/', getWishlist);
router.delete('/:productId', removeFromWishlist);
router.patch('/:productId/toggle', toggleWishlist);

module.exports = router;
