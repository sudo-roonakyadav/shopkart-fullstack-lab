/**
 * ============================================================================
 * File: backend/models/order.model.js
 * Purpose: Order Schema & Mongoose Model (Checkout & Receipts)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines the schema for finalized customer orders (Lab 06).
 * - Stores a snapshot of ordered items (product ID, name, price, quantity) to
 *   preserve historic purchase prices even if catalog prices change later.
 * - Stores customer reference, shipping address snapshot, and subtotal/total calculations.
 * - Tracks payment status ('pending', 'paid', 'failed') and order status ('placed', 'processing', 'completed').
 * - Stores Razorpay transaction metadata: razorpayOrderId, razorpayPaymentId, and signature.
 * ============================================================================
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        image: {
          type: String
        }
      }
    ],

    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true }
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING'
    },

    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PLACED',
        'CONFIRMED',
        'SHIPPED',
        'DELIVERED'
      ],
      default: 'PENDING_PAYMENT'
    },

    razorpayOrderId: {
      type: String
    },
    razorpayPaymentId: {
      type: String
    },
    isSimulated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
