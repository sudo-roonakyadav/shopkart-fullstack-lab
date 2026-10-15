/**
 * ============================================================================
 * File: backend/view-orders.js
 * Purpose: Interactive CLI Tool to Inspect MongoDB Orders Database
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Connects to the active MongoDB instance (local or embedded persistent server).
 * - Queries all documents from the 'orders' collection with populated customer details.
 * - Displays a formatted, easy-to-read table/report of all orders placed in the system:
 *     - MongoDB ObjectId
 *     - Customer Name & Email
 *     - Payment Status (PAID / PENDING / FAILED)
 *     - Razorpay Payment ID & Order ID
 *     - Ordered Products (Item, Qty, Unit Price)
 *     - Total Amount & Shipping Address
 *     - Timestamps
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Order = require('./models/order.model');
const Customer = require('./models/customer.model');
const User = require('./models/user.model');
const Product = require('./models/product.model');

// Determine database connection URI
let mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  const uriFile = path.join(__dirname, 'data/db-uri.txt');
  if (fs.existsSync(uriFile)) {
    mongoUri = fs.readFileSync(uriFile, 'utf-8').trim();
  }
}

if (!mongoUri) {
  mongoUri = 'mongodb://127.0.0.1:27017/shopkart';
}

async function displayOrders() {
  console.log('\n==============================================================================');
  console.log('                 SHOPKART — LIVE MONGODB ORDERS DATABASE                      ');
  console.log('==============================================================================');
  console.log(`Connecting to MongoDB at: ${mongoUri} ...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB successfully.\n');

    const totalCount = await Order.countDocuments();
    const paidCount = await Order.countDocuments({ paymentStatus: 'PAID' });

    console.log(`Summary:`);
    console.log(`  - Total Orders in Database: ${totalCount}`);
    console.log(`  - Paid & Verified Orders:   ${paidCount}`);
    console.log('------------------------------------------------------------------------------\n');

    if (totalCount === 0) {
      console.log('No orders found in the database yet!');
      console.log('To create an order:');
      console.log('  1. Open http://localhost:5173 in your browser');
      console.log('  2. Log in (e.g. customer@shopkart.com / password123)');
      console.log('  3. Add products to cart and proceed to Checkout');
      console.log('  4. Complete payment via Razorpay Netbanking or the 1-Click Simulation button');
      console.log('  5. Re-run this command: npm run orders\n');
      await mongoose.disconnect();
      return;
    }

    const orders = await Order.find()
      .populate('user', 'fullName name email')
      .sort({ createdAt: -1 });

    orders.forEach((order, index) => {
      const customerName = order.user?.fullName || order.user?.name || order.shippingAddress?.fullName || 'Customer';
      console.log(`[Order #${index + 1}] — Reference ID: ${order._id}`);
      console.log(`  Customer:       ${customerName} (${order.user?.email || 'N/A'})`);
      console.log(`  Date Placed:    ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`);
      console.log(`  Order Status:   ${order.status}`);
      console.log(`  Payment Status: ${order.paymentStatus} ${order.paymentStatus === 'PAID' ? (order.isSimulated ? '(SIMULATED DEMO)' : '(VERIFIED)') : ''}`);
      console.log(`  Mode:           ${order.isSimulated ? 'Academic Offline Simulation (Demo)' : 'Razorpay Gateway Checkout (Test Mode)'}`);
      console.log(`  Order Ref ID:   ${order.razorpayOrderId || 'N/A'}`);
      console.log(`  Payment Ref ID: ${order.razorpayPaymentId || 'N/A'}`);
      console.log(`  Total Amount:   ₹${order.totalAmount}`);
      console.log(`  Shipping To:    ${order.shippingAddress?.fullName}, ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}`);
      console.log(`  Items (${order.items?.length || 0}):`);
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, itemIdx) => {
          console.log(`    ${itemIdx + 1}. ${item.name} | Qty: ${item.quantity} | Unit Price: ₹${item.price} | Subtotal: ₹${item.price * item.quantity}`);
        });
      }
      console.log('------------------------------------------------------------------------------');
    });

    console.log('\nAll order records successfully retrieved from MongoDB.\n');
  } catch (err) {
    console.error('Failed to query orders from MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

displayOrders();
