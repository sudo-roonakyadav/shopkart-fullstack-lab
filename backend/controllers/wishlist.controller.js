/**
 * ============================================================================
 * File: backend/controllers/wishlist.controller.js
 * Purpose: Wishlist System Controller (Lab 04)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - getWishlist: Retrieves customer's wishlist with full product details populated via Mongoose.
 * - addToWishlist: Appends a product ObjectId reference; validates product existence and
 *   returns HTTP 409 Conflict if product is already saved (no duplicates).
 * - removeFromWishlist: Removes a product reference from the customer's wishlist array.
 * ============================================================================
 */
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// @desc    Add product to customer's wishlist
// @route   POST /wishlist/:productId
// @access  Protected
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if product exists in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const customer = await Customer.findById(req.user._id);

    // Check if already in wishlist
    const isAlreadyWishlisted = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add product to wishlist
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding to wishlist'
    });
  }
};

// @desc    Get current customer's wishlist with populated product details
// @route   GET /wishlist
// @access  Protected
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name description price category image stock'
    });

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching wishlist'
    });
  }
};

// @desc    Remove product from customer's wishlist
// @route   DELETE /wishlist/:productId
// @access  Protected
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const customer = await Customer.findById(req.user._id);

    // Check if product is in wishlist
    const index = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist'
      });
    }

    // Remove from wishlist
    customer.wishlist.splice(index, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error removing from wishlist'
    });
  }
};

// @desc    Toggle wishlist item (Bonus Lab-04)
// @route   PATCH /wishlist/:productId/toggle
// @access  Protected
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const customer = await Customer.findById(req.user._id);
    const index = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let saved = false;
    if (index > -1) {
      customer.wishlist.splice(index, 1);
      saved = false;
    } else {
      customer.wishlist.push(productId);
      saved = true;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      saved,
      message: saved ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error toggling wishlist'
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
};
