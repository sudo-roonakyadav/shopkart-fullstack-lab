/**
 * ============================================================================
 * File: backend/routes/product.routes.js
 * Purpose: Product Catalog Express Route Definitions (Lab 03)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines public endpoints for browsing products.
 * - Maps GET / to productController.getProducts (catalog list with filters).
 * - Maps GET /:id to productController.getProductById (individual product details).
 * ============================================================================
 */
const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById
} = require('../controllers/product.controller');

// Product routes
router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

module.exports = router;
