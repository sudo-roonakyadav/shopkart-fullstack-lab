/**
 * ============================================================================
 * File: backend/controllers/auth.controller.js
 * Purpose: Authentication Controller (Registration, Login, Session)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - register: Validates input, creates User and Customer documents, hashes password,
 *   issues JWT in HttpOnly cookie, and returns user profile.
 * - login: Validates credentials, checks password with bcrypt, issues JWT cookie.
 * - logout: Clears the HttpOnly cookie to invalidate the client session.
 * - getMe: Returns the currently authenticated user profile using req.user.id.
 * ============================================================================
 */
// auth.controller.js alias for customer.controller.js
module.exports = require('./customer.controller');
