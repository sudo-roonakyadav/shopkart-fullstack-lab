/**
 * ============================================================================
 * File: backend/controllers/order.controller.js
 * Purpose: Order Processing & Razorpay Payment Verification Controller (Lab 06)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - createPaymentOrder: Validates shipping address and cart items, checks stock availability,
 *   calculates final order total, and creates a pending Razorpay order via Razorpay API.
 * - verifyPayment: Validates the cryptographic HMAC-SHA256 signature sent by Razorpay checkout
 *   to ensure payment was not tampered with, deducts purchased quantities from product inventory,
 *   creates the finalized Order record in MongoDB, and clears the user's cart.
 * - getMyOrders: Retrieves all past orders placed by the authenticated customer.
 * - getOrderById: Retrieves detailed receipt information for a specific order.
 * ============================================================================
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const { createOrder } = require('../config/razorpay');

// @desc    Validate cart, calculate total, create pending order & Razorpay order
// @route   POST /orders/create-payment-order
// @access  Protected
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'All shipping address fields (fullName, phone, addressLine1, city, state, pincode) are required'
      });
    }

    // Pincode validation: must be 6 digits
    const cleanPincode = pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be exactly 6 digits'
      });
    }

    // Phone validation: at least 10 digits
    const cleanPhone = phone.trim();
    if (!/^\d{10,15}$/.test(cleanPhone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be a valid 10-digit number'
      });
    }

    // 2. Load authenticated customer's cart
    const customer = await Customer.findById(req.user._id);
    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add products before checking out.'
      });
    }

    // 3. Load latest product data and verify stock
    const orderItems = [];
    let calculatedTotal = 0;

    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One or more products in your cart are no longer available'
        });
      }

      // Check stock availability
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} units available.`
        });
      }

      // Snapshot product information
      const lineTotal = product.price * cartItem.quantity;
      calculatedTotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image
      });
    }

    // 4. Create pending ShopKart order in MongoDB
    const shopKartOrder = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPincode
      },
      totalAmount: calculatedTotal,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    // 5. Create Razorpay order (amount in paise = INR * 100)
    const amountInPaise = Math.round(calculatedTotal * 100);
    const razorpayOrder = await createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: shopKartOrder._id.toString()
    });

    // 6. Save razorpayOrderId to the ShopKart order
    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_shopkart2026',
      totalAmount: calculatedTotal
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating payment order'
    });
  }
};

// @desc    Verify Razorpay signature, mark order PAID/PLACED, and clear cart
// @route   POST /orders/verify-payment
// @access  Protected
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!shopKartOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details (shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature)'
      });
    }

    // Validate ShopKart Order ID format
    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Enforce configured server-side Razorpay secret
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret.trim() === '' || secret.includes('placeholder')) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway secret is not configured on the server. Real payment verification cannot proceed.'
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure order belongs to authenticated user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order'
      });
    }

    // Verify submitted razorpay_order_id matches trusted order record in database
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Mismatched order ID: razorpay_order_id does not match server order record'
      });
    }

    // If already verified, return idempotent success (prevents repeated stock deductions)
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Order is already paid and confirmed',
        order
      });
    }

    // Cryptographic signature verification using HMAC SHA256
    // Strictly uses trusted DB razorpayOrderId and server RAZORPAY_KEY_SECRET
    const trustedOrderId = order.razorpayOrderId || razorpay_order_id;
    const body = `${trustedOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(typeof razorpay_signature === 'string' ? razorpay_signature : '', 'utf8');

    const isValidSignature =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!isValidSignature) {
      // Failed signature verification: do NOT mark paid, do NOT clear cart
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Signature verified successfully: Mark PAID & PLACED
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.isSimulated = false;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Deduct stock for purchased items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user's cart in database
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order placed',
      order
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying payment'
    });
  }
};

/**
 * Helper to determine if offline payment simulation is permitted.
 * Strict Fail-Closed Policy:
 * Permitted ONLY when BOTH conditions are satisfied:
 *  1. process.env.NODE_ENV is strictly 'development' or 'test'.
 *  2. process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION is strictly 'true'.
 *
 * Missing or unexpected configuration must disable simulation.
 * Production must always disable it, even if the opt-in variable is set to 'true'.
 */
const isPaymentSimulationPermitted = () => {
  const env = process.env.NODE_ENV;
  const optIn = process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION;
  const isAllowedEnv = env === 'development' || env === 'test';
  const isOptedIn = optIn === 'true';
  return isAllowedEnv && isOptedIn;
};

// @desc    Simulate payment completion in dev/test environment without Razorpay
// @route   POST /orders/simulate-payment
// @access  Protected
const simulatePayment = async (req, res) => {
  try {
    // 1. Strict Fail-Closed Simulation Gate
    if (!isPaymentSimulationPermitted()) {
      return res.status(403).json({
        success: false,
        message:
          'Offline payment simulation is disabled. Simulation requires NODE_ENV to be development or test AND SHOPKART_ENABLE_PAYMENT_SIMULATION=true.'
      });
    }

    const { shopKartOrderId } = req.body;

    if (!shopKartOrderId) {
      return res.status(400).json({
        success: false,
        message: 'shopKartOrderId is required for payment simulation'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure order belongs to authenticated user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order'
      });
    }

    // Idempotent check: if already paid, do not re-decrement inventory
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Order is already paid and confirmed',
        order,
        isSimulated: order.isSimulated || false
      });
    }

    // Mark as simulated payment - clearly differentiated from genuine Razorpay transactions
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.isSimulated = true;
    order.razorpayPaymentId = `simulated_pay_${Date.now()}`;
    await order.save();

    // Deduct stock for purchased items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user's cart in database
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Offline payment simulation successful (Academic Demo Mode - Not a Razorpay Gateway Transaction)',
      isSimulated: true,
      order
    });
  } catch (error) {
    console.error('Error simulating payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error simulating payment'
    });
  }
};

// @desc    Check whether offline payment simulation is enabled
// @route   GET /orders/simulation-status
// @access  Public / Protected
const getSimulationStatus = (req, res) => {
  const isAllowed = isPaymentSimulationPermitted();
  return res.status(200).json({
    success: true,
    simulationAllowed: isAllowed,
    environment: process.env.NODE_ENV || 'unspecified'
  });
};

// @desc    Get all orders for authenticated customer
// @route   GET /orders
// @access  Protected
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching orders'
    });
  }
};

// @desc    Get single order by ID (with ownership check)
// @route   GET /orders/:id
// @access  Protected
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Enforce ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching order'
    });
  }
};

// @desc    Update order status (Bonus Lab 06)
// @route   PATCH /orders/:id/status
// @access  Protected
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating order status'
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  simulatePayment,
  getSimulationStatus,
  isPaymentSimulationPermitted,
  getMyOrders,
  getOrderById,
  updateOrderStatus
};
