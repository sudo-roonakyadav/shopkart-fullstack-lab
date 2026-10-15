/**
 * ============================================================================
 * File: backend/controllers/cart.controller.js
 * Purpose: Shopping Cart Controller (Lab 05)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - getCart: Fetches customer's cart with populated product data and calculates derived
 *   totals (subtotal, total items).
 * - addToCart: Adds an item or increments quantity; validates requested quantity against
 *   live product stock in MongoDB.
 * - updateCartItem: Modifies item quantity while enforcing minimum (1) and maximum (stock) bounds.
 * - removeFromCart: Removes an individual item from the cart.
 * - clearCart: Empties all items from the customer's cart.
 * ============================================================================
 */
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// @desc    Add product to cart or increment quantity
// @route   POST /cart/:productId
// @access  Protected
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Find product in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is out of stock
    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    const customer = await Customer.findById(req.user._id);

    // Find if product already in cart
    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // Check stock limit before incrementing
      if (existingItem.quantity + 1 > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} units available in stock.`
        });
      }
      existingItem.quantity += 1;
    } else {
      // Add new item with quantity 1
      customer.cart.push({
        product: productId,
        quantity: 1
      });
    }

    await customer.save();

    // Populate product details for response
    await customer.populate({
      path: 'cart.product',
      select: 'name description price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding to cart'
    });
  }
};

// @desc    Get current customer's cart
// @route   GET /cart
// @access  Protected
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name description price category image stock'
    });

    return res.status(200).json({
      success: true,
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching cart'
    });
  }
};

// @desc    Update product quantity in cart
// @route   PATCH /cart/:productId
// @access  Protected
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Validate quantity parameter
    const numericQuantity = Number(quantity);
    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer (minimum 1)'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock limit
    if (numericQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.stock} available)`
      });
    }

    const customer = await Customer.findById(req.user._id);

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    cartItem.quantity = numericQuantity;
    await customer.save();

    await customer.populate({
      path: 'cart.product',
      select: 'name description price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating cart quantity'
    });
  }
};

// @desc    Remove product from cart
// @route   DELETE /cart/:productId
// @access  Protected
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const customer = await Customer.findById(req.user._id);

    const itemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    customer.cart.splice(itemIndex, 1);
    await customer.save();

    await customer.populate({
      path: 'cart.product',
      select: 'name description price category image stock'
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error removing product from cart'
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart
};
