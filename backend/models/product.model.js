/**
 * ============================================================================
 * File: backend/models/product.model.js
 * Purpose: Product Catalog Schema & Mongoose Model
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines the schema for Linux distribution products in the catalog (Lab 03).
 * - Stores product attributes: name, version, slug, description, price, stock,
 *   category, architecture, packageManager, kernel, desktopEnvironment, and ratings.
 * - Enforces minimum pricing and stock constraints.
 * ============================================================================
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
