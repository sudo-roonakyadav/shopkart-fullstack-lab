/**
 * ============================================================================
 * File: backend/index.js
 * Purpose: Application Entry Point & Express Server Configuration
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Initializes the Express web application and loads environment variables.
 * - Establishes connection to MongoDB via backend/config/db.js.
 * - Configures essential global middleware:
 *     - CORS (Cross-Origin Resource Sharing) with credentials enabled
 *     - express.json() for parsing incoming JSON request bodies
 *     - cookie-parser for reading HttpOnly JWT authentication cookies
 * - Mounts RESTful API route modules under '/api':
 *     - /api/auth     -> User authentication & session management
 *     - /api/products -> Product catalog and details
 *     - /api/customer -> Customer profile & address data
 *     - /api/wishlist -> Customer wishlist (Lab 04)
 *     - /api/cart     -> Shopping cart operations (Lab 05)
 *     - /api/orders   -> Checkout, Razorpay payments & orders (Lab 06)
 * - Starts the HTTP server on PORT 5000 (or process.env.PORT).
 * ============================================================================
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const Product = require('./models/product.model');
const { seedProducts } = require('./seed');

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local student development
    },
    credentials: true
  })
);

// Route Mounting
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopKart API is running (Labs 01 - 05)'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Start server after connecting to database
const startServer = async () => {
  await connectDB();

  // Auto-seed if products collection is empty
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('No products found in database. Auto-seeding Linux digital products...');
      await seedProducts();
    } else {
      console.log(`Database ready with ${productCount} products.`);
    }
  } catch (err) {
    console.error('Error during initial product check:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`ShopKart Backend Server running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
