/**
 * ============================================================================
 * File: backend/routes/order.routes.js
 * Purpose: Order & Payment Express Route Definitions (Lab 06)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Protects all order endpoints with authMiddleware.protect.
 * - Maps POST /create-payment-order to orderController.createPaymentOrder.
 * - Maps POST /verify-payment to orderController.verifyPayment.
 * - Maps GET /my-orders to orderController.getMyOrders.
 * - Maps GET /:id to orderController.getOrderById.
 * ============================================================================
 */
const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  simulatePayment,
  getSimulationStatus,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public route to inspect whether offline simulation is enabled in current environment
router.get('/simulation-status', getSimulationStatus);

// All transactional order routes are protected
router.use(protect);

router.post('/create-payment-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/simulate-payment', simulatePayment);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
