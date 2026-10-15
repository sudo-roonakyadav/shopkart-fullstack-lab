/**
 * ============================================================================
 * File: backend/models/customer.model.js
 * Purpose: Customer Schema & Mongoose Model (Wishlist & Cart Storage)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Defines customer-specific data extending user authentication.
 * - Stores customer shipping address details (fullName, phone, addressLine1, city, state, pincode).
 * - Implements the Wishlist array (Lab 04): An array of product ObjectIds with
 *   'ref: Product' for Mongoose population.
 * - Implements the Shopping Cart array (Lab 05): Embedded subdocuments storing
 *   '{ product: ObjectId, quantity: Number }' with 'ref: Product'.
 * ============================================================================
 */
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    // Lab-04: Wishlist reference to Product collection
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    // Lab-05: Cart items containing Product reference and quantity
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, 'Quantity cannot be less than 1']
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Never return password in JSON transformations
customerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
