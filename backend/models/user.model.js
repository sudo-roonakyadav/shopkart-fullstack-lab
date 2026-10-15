/**
 * ============================================================================
 * File: backend/models/user.model.js
 * Purpose: User Schema & Mongoose Model (Base Authentication)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines the schema for base users (name, email, password, role).
 * - Implements a Mongoose pre-save hook that automatically hashes plaintext
 *   passwords using bcrypt before saving to MongoDB.
 * - Defines the comparePassword() instance method to securely verify passwords during login.
 * ============================================================================
 */
// In ShopKart, Customer is the User model (from Lab 01 to Lab 05)
const Customer = require('./customer.model');

module.exports = Customer;
