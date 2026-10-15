/**
 * ============================================================================
 * File: backend/utils/generateToken.js
 * Purpose: JWT Generation & HttpOnly Cookie Setter
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Signs a JSON Web Token (JWT) containing the user's ID, role, and email.
 * - Uses the secret key (JWT_SECRET) with a configured expiration (30 days).
 * - Attaches the token to the HTTP response as a secure, HttpOnly cookie ('token').
 * - Protects against XSS attacks by preventing client-side JavaScript access to the cookie.
 * ============================================================================
 */
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'shopkart_super_secret_jwt_key_2026', {
    expiresIn: '7d'
  });
};

module.exports = generateToken;
