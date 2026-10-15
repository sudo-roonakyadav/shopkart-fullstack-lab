/**
 * ============================================================================
 * File: backend/routes/customer.routes.js
 * Purpose: Customer Profile Express Route Definitions
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Protects customer endpoints with authMiddleware.protect.
 * - Maps GET /profile to customerController.getProfile.
 * - Maps PUT /profile to customerController.updateProfile.
 * ============================================================================
 */
const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword
} = require('../controllers/customer.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutCustomer);
router.patch('/change-password', protect, changePassword);

module.exports = router;
