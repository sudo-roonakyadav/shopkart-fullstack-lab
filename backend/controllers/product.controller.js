/**
 * ============================================================================
 * File: backend/controllers/product.controller.js
 * Purpose: Product Catalog Controller (Lab 03)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - getProducts: Queries all products from MongoDB with optional category/architecture
 *   filtering, text search, and price sorting.
 * - getProductById: Fetches detailed specifications for a single product by its ObjectId.
 * ============================================================================
 */
const mongoose = require('mongoose');
const Product = require('../models/product.model');

// @desc    Create a new product
// @route   POST /products
// @access  Public (Open for Lab-03)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are required'
      });
    }

    // Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid number greater than 0'
      });
    }

    // Validate stock
    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative number'
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numericStock
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating product'
    });
  }
};

// @desc    Get all products with search, category filtering, and sorting
// @route   GET /products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const query = {};

    // Search by product name (case-insensitive)
    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by category
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = category.trim();
    }

    // Build Mongoose query
    let productQuery = Product.find(query);

    // Sorting (Bonus Lab-03)
    if (sort === 'price_asc') {
      productQuery = productQuery.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      productQuery = productQuery.sort({ price: -1 });
    } else {
      productQuery = productQuery.sort({ createdAt: -1 });
    }

    const products = await productQuery;

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching products'
    });
  }
};

// @desc    Get single product by ID
// @route   GET /products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching product'
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById
};
