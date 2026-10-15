/**
 * ============================================================================
 * File: backend/routes/auth.routes.js
 * Purpose: Authentication Express Route Definitions
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Maps /register to authController.register
 * - Maps /login to authController.login
 * - Maps /logout to authController.logout
 * - Maps /me to authController.getMe (protected by authMiddleware)
 * ============================================================================
 */
// auth.routes.js alias for customer.routes.js
module.exports = require('./customer.routes');
