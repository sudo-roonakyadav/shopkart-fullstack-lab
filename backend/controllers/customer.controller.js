/**
 * ============================================================================
 * File: backend/controllers/customer.controller.js
 * Purpose: Customer Profile & Address Management Controller
 * ----------------------------------------------------------------------------
 * What this file does:
 * - getProfile: Fetches the authenticated customer's profile and default address.
 * - updateProfile: Updates customer contact details and shipping address in MongoDB.
 * ============================================================================
 */
const bcrypt = require('bcryptjs');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

// @desc    Register a new customer
// @route   POST /customers/register
// @access  Public
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validate all fields are provided
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, password, phone) are required'
      });
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new customer
    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Authenticate customer & set cookie
// @route   POST /customers/login
// @access  Public
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer) {
      // Do not reveal whether email or password was incorrect
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(customer._id);

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // Also returned for convenience (e.g. Bearer auth)
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current authenticated customer profile
// @route   GET /customers/me
// @access  Protected
const getMe = async (req, res) => {
  try {
    // req.user is set by auth.middleware.js
    return res.status(200).json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile'
    });
  }
};

// @desc    Logout customer & clear cookie
// @route   POST /customers/logout
// @access  Protected (or Public)
const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during logout'
    });
  }
};

// @desc    Change password (Bonus Lab 01)
// @route   PATCH /customers/change-password
// @access  Protected
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both oldPassword and newPassword'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const customer = await Customer.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating password'
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword
};
