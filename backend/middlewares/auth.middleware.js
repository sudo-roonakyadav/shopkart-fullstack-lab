/**
 * ============================================================================
 * File: backend/middlewares/auth.middleware.js
 * Purpose: Authentication & Authorization Middleware
 * ----------------------------------------------------------------------------
 * What this file does:
 * - protect: Verifies incoming requests by extracting the JWT from either the
 *   HttpOnly cookie ('token') or the 'Authorization: Bearer <token>' header.
 * - Decodes the token using jwt.verify() and attaches the user document to req.user.
 * - Blocks unauthenticated requests with HTTP 401 Unauthorized.
 * - adminOnly: Restricts access to routes that require administrative privileges,
 *   returning HTTP 403 Forbidden if req.user.role is not 'admin'.
 * ============================================================================
 */
const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Alternatively check Authorization Bearer header (for Postman/API clients)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopkart_super_secret_jwt_key_2026'
    );

    // Find customer in database, exclude password
    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Customer no longer exists'
      });
    }

    // Attach customer to request object
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token'
    });
  }
};

module.exports = { protect };
