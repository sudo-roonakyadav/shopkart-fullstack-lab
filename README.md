# ShopKart — Fullstack MERN E-Commerce Platform

A production-grade, fullstack e-commerce web application built using the **MERN** stack (MongoDB, Express, React, Node.js). ShopKart features customer authentication with secure HttpOnly cookies, a digital Linux Distribution ISO catalog, personal wishlist system, persistent shopping cart, multi-step checkout, and Razorpay test payment gateway integration with cryptographic signature verification.

---

## 🚀 Key Features

### 1. Customer Authentication & Security
- **Bcrypt Password Hashing**: Passwords hashed securely with salt rounds before database persistence.
- **JWT & HttpOnly Session Cookies**: Eliminates XSS token theft by storing tokens in cross-origin HttpOnly cookies (`SameSite: Lax`).
- **Authorization Barrier (`auth.middleware.js`)**: Insecure Direct Object Reference (IDOR) protection — user identity is strictly resolved from cryptographically signed tokens via `req.user._id`, never from untrusted URL params or request bodies.
- **Profile Management**: Protected `/customers/me` profile lookup and password update verification.

### 2. Digital Product Catalog (Linux Distribution ISOs)
- **Authentic Digital Products**: Real, downloadable Linux distributions (Ubuntu 24.04 LTS, Fedora Workstation 40, Debian 12, Arch Linux, Linux Mint, Kali Linux, openSUSE Tumbleweed, Pop!_OS, Rocky Linux, Alpine Linux).
- **Search, Category & Sorting**: Real-time keyword filtering, distribution categories (Desktop, Server, Security), and price sorting.
- **Distro Brand Visuals**: Custom typographic badges with dedicated SVG distro identifiers and intelligent fallback rendering.

### 3. Personal Wishlist System
- **Customer Wishlist**: Save favorite distributions for future review.
- **Duplicate Prevention**: Re-saving an existing item returns `409 Conflict`.
- **Populated Catalog Data**: Uses Mongoose `.populate()` to dynamically link product data to wishlist entries.

### 4. Shopping Cart & Inventory Management
- **Persistent User Cart**: Embedded in customer document in MongoDB so cart state persists across logins.
- **Live Inventory Enforcement**: Prevents adding or incrementing quantities beyond available warehouse stock.
- **Derived Totals (`CartContext.jsx`)**: Global React Context dynamically computes `totalItems` and `subtotal` via `.reduce()`, instantly updating Navbar badges without redundant database mutations.

### 5. Multi-Step Checkout & Orders
- **Shipping Address Validation**: Strict formatting validation (6-digit pincode, 10-digit phone number, address line).
- **Server Price & Stock Re-validation**: Guarantees that items have not gone out of stock and recalculates totals authoritatively on the server, ignoring client-provided amounts.
- **Order Snapshotting**: Locks in exact product titles, unit prices, images, and shipping addresses into the immutable `Order` document at purchase time.

### 6. Razorpay Test Payment Integration
- **Server-Side Order Generation**: Converts order total into paise (`INR * 100`) and creates an official order with the Razorpay API.
- **Razorpay Checkout Modal**: Dynamically loads `checkout.razorpay.com` and pre-fills customer information in Test Mode.
- **Cryptographic HMAC-SHA256 Verification**: Server cryptographically verifies payment signatures (`crypto.createHmac('sha256', secret).update(trustedOrderId + '|' + paymentId)`) before marking orders `PAID` / `PLACED`.
- **Atomic Inventory Deduction & Cart Reset**: Decrements inventory stock via MongoDB `$inc` and empties the customer's cart only upon verified payment confirmation.
- **Order Tracking & Lifecycle**: Historical order tracking (`GET /orders`) and order details (`GET /orders/:id`) with strict customer ownership enforcement (`403 Forbidden`) and a 4-stage fulfillment progress tracker (`PLACED` &rarr; `CONFIRMED` &rarr; `SHIPPED` &rarr; `DELIVERED`).

---

## 🛠️ Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Plain CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM *(includes automatic embedded MongoDB fallback for zero-configuration standalone operation)* |
| **Authentication** | JSON Web Tokens (JWT), Cookie-Parser, Bcrypt.js |
| **Payment Gateway** | Razorpay SDK (Test Mode) |
| **Cryptography** | Node.js `crypto` (HMAC-SHA256) |

---

## 📁 Repository Structure

```text
shopkart-fullstack-lab/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & persistent standalone fallback
│   │   └── razorpay.js           # Razorpay client & test order generation
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication helper
│   │   ├── customer.controller.js # Customer registration, login & profile
│   │   ├── product.controller.js  # Product catalog, search & filtering
│   │   ├── wishlist.controller.js # Wishlist operations
│   │   ├── cart.controller.js     # Shopping cart mutations & limits
│   │   └── order.controller.js    # Checkout, Razorpay & cryptographic verification
│   ├── models/
│   │   ├── customer.model.js      # Customer schema (with wishlist & cart)
│   │   ├── user.model.js          # User alias model
│   │   ├── product.model.js       # Product schema
│   │   └── order.model.js         # Order schema with snapshots & fulfillment status
│   ├── routes/
│   │   ├── auth.routes.js         # Auth routes
│   │   ├── customer.routes.js     # /customers endpoints
│   │   ├── product.routes.js      # /products endpoints
│   │   ├── wishlist.routes.js     # /wishlist endpoints
│   │   ├── cart.routes.js         # /cart endpoints
│   │   └── order.routes.js        # /orders endpoints
│   ├── middlewares/
│   │   └── auth.middleware.js     # JWT & HttpOnly cookie verification guard
│   ├── utils/
│   │   └── generateToken.js       # JWT signing utility
│   ├── seed.js                    # Linux digital ISOs seeder
│   ├── test-api.js                # Core API automated tests
│   ├── test-comprehensive.js      # Edge-case automated tests
│   ├── test-lab6.js               # Checkout & orders automated tests
│   ├── index.js                   # Express application entrypoint
│   ├── package.json
│   └── .env.example               # Template environment configuration
│
├── frontend/
│   ├── public/
│   │   └── images/distros/        # Dedicated vector assets for Linux distros
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation bar with dynamic cart count & orders link
│   │   │   ├── ProductCard.jsx    # Card with details, wishlist & cart actions
│   │   │   ├── ProductImage.jsx   # Distro logo handler with typographic fallback
│   │   │   ├── WishlistCard.jsx   # Saved wishlist item row
│   │   │   ├── CartItem.jsx       # Cart row with [-] qty [+] controls
│   │   │   └── ProtectedRoute.jsx # Route authentication barrier
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Customer authentication & session state
│   │   │   └── CartContext.jsx    # Global cart state & derived calculations
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Customer login page
│   │   │   ├── Register.jsx       # Registration page
│   │   │   ├── Home.jsx           # Customer dashboard overview
│   │   │   ├── Products.jsx       # Product catalog with search & filter
│   │   │   ├── ProductDetails.jsx # Single product details & digital notice
│   │   │   ├── Wishlist.jsx       # Saved wishlist page
│   │   │   ├── Cart.jsx           # Shopping cart & order summary
│   │   │   ├── Checkout.jsx       # Shipping form & Razorpay payment
│   │   │   ├── OrderSuccess.jsx   # Order receipt confirmation
│   │   │   ├── Orders.jsx         # Historical orders list view
│   │   │   └── OrderDetails.jsx   # Single order details & fulfillment status tracker
│   │   ├── services/
│   │   │   └── api.js             # Axios client with withCredentials: true
│   │   ├── App.jsx                # Application routing configuration
│   │   ├── index.css              # Restrained Orange/White/Black styling
│   │   └── main.jsx               # React DOM entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                     # Git ignore rules
├── package.json                   # Root convenience scripts
└── README.md                      # Comprehensive project documentation & setup
```

---

## ⚙️ Setup & Execution Guide

### 1. Prerequisites
- **Node.js**: v18.x or newer (tested on Node.js v20+ / v26)
- **npm**: v9.x or newer
- **MongoDB**: Standard MongoDB service running locally on `mongodb://127.0.0.1:27017/shopkart`, **OR** nothing! The backend includes automatic embedded MongoDB fallback (`mongodb-memory-server`) that persists directly to disk under `backend/data/db`.

---

### 2. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/sudo-roonakyadav/shopkart-fullstack-lab.git
cd shopkart-fullstack-lab

# Install dependencies for both backend and frontend at once:
npm run install:all
```

*(Alternatively, run `npm install` inside `backend/` and `frontend/` individually).*

---

### 3. Environment Configuration

Copy the sample environment file in `backend/`:

```bash
cp backend/.env.example backend/.env
```

Ensure your `backend/.env` file contains:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here

# Academic Offline Payment Simulation (Disabled by default)
SHOPKART_ENABLE_PAYMENT_SIMULATION=false
```

#### Academic Offline Payment Simulation (Viva / Demo Mode):
For offline grading or viva evaluation where external network connectivity or the Razorpay checkout script is unreachable, you can explicitly opt into the offline payment simulation route:
1. Set `SHOPKART_ENABLE_PAYMENT_SIMULATION=true` in `backend/.env`.
2. Ensure `NODE_ENV=development` (or `test`).
3. Restart the backend server (`npm start`).

> **Security Policy (Fail-Closed):** Simulation is disabled by default. Offline simulation is permitted **only** when BOTH conditions are met:
> - `NODE_ENV` is strictly `development` or `test`.
> - `SHOPKART_ENABLE_PAYMENT_SIMULATION` is strictly `true`.
>
> If either variable is missing, false, or if `NODE_ENV=production`, simulation is unconditionally blocked with HTTP `403 Forbidden` and the simulation button is hidden from the UI.

> **Security Note:** `backend/.env` is ignored by `.gitignore` to protect credentials from being committed. Only `backend/.env.example` is tracked.

---

### 4. Database Seeding

The catalog includes 10 authentic Linux distribution ISO files (Ubuntu, Debian, Fedora, Arch Linux, Linux Mint, Kali, openSUSE, Pop!_OS, Rocky Linux, Alpine).

To seed manually:
```bash
cd backend
npm run seed
```

*(Note: The server also auto-seeds the catalog on first boot if no products exist).*

---

### 5. Running the Application

Open two terminal windows:

#### Terminal 1 — Start the Backend Server:
```bash
cd backend
npm start
```
- API server listens on: `http://localhost:5000`

#### Terminal 2 — Start the Frontend Application:
```bash
cd frontend
npm run dev
```
- Vite dev client serves on: `http://localhost:5173`

---

## 🌐 Application URLs

| Page / Route | URL | Access |
|---|---|---|
| Frontend Web Client | `http://localhost:5173/` | Public |
| Products Catalog | `http://localhost:5173/products` | Public |
| Single Product Details | `http://localhost:5173/products/:id` | Public |
| Customer Login | `http://localhost:5173/login` | Public |
| Customer Registration | `http://localhost:5173/register` | Public |
| Customer Dashboard | `http://localhost:5173/home` | Protected |
| Saved Wishlist | `http://localhost:5173/wishlist` | Protected |
| Shopping Cart | `http://localhost:5173/cart` | Protected |
| Checkout & Payment | `http://localhost:5173/checkout` | Protected |
| Order Confirmation | `http://localhost:5173/order-success/:id` | Protected |
| My Orders History | `http://localhost:5173/orders` | Protected |
| Single Order Details | `http://localhost:5173/orders/:id` | Protected |
| Backend Health Check | `http://localhost:5000/` | Public |

---

## 💳 Razorpay Test Mode Payment Guide

Razorpay runs in **Test Mode** (no real money is charged).

### How to Complete a Test Payment:
1. Log in and add Linux ISOs to your Cart.
2. Navigate to **Checkout** and fill in your delivery details.
3. Click **Pay with Razorpay** to launch the Razorpay Checkout popup.
4. In the popup, choose **Netbanking**:
   - Select any bank (e.g., **HDFC** or **SBI**).
   - Click **Pay**.
   - On the simulation screen, click the green **Success** button.
5. Razorpay signs the test payment and passes the signature to `/orders/verify-payment`.
6. The backend cryptographically verifies the HMAC-SHA256 signature, marks the order **PAID** / **PLACED**, decrements inventory stock in MongoDB, clears the user's cart, and redirects to **Order Success**.

*(When `SHOPKART_ENABLE_PAYMENT_SIMULATION=true` is enabled in development/test mode, an alternative **Simulate Test Payment (Dev/Demo Mode)** button appears on the checkout page for offline viva demonstrations).*

---

## 🧪 Automated Testing

Four comprehensive test suites are included in `backend/` to verify all business rules, Lab 06 checkout requirements, and payment security barriers:

```bash
cd backend

# 1. Test Core Workflows (Labs 1–5):
node test-api.js

# 2. Test Edge Cases & Security Barriers (Labs 1–5):
node test-comprehensive.js

# 3. Test Checkout, Razorpay & Cryptographic Signature Verification (Lab 6):
node test-lab6.js

# 4. Test Payment Verification Security & Fail-Closed Simulation Gates:
node test-payment-security.js

# Or run both Lab 06 and Security test suites together:
npm test
```

### What the Tests Verify:
- `[PASS]` Rejection of missing fields and short passwords with `400 Bad Request`
- `[PASS]` Prevention of duplicate registration emails with `409 Conflict`
- `[PASS]` Protection of private customer routes (`/customers/me`, `/wishlist`, `/cart`, `/orders`) with `401 Unauthorized`
- `[PASS]` Inventory stock enforcement when incrementing cart quantities
- `[PASS]` Empty cart checkout rejection with `400 Bad Request`
- `[PASS]` Shipping address validation (6-digit pincode, 10-digit phone)
- `[PASS]` Rejection of tampered payment signatures with `400 Bad Request`
- `[PASS]` Cryptographic HMAC-SHA256 payment signature verification (`200 OK`)
- `[PASS]` Atomic inventory deduction in MongoDB after verified payment
- `[PASS]` Automated cart clearance after verified payment
- `[PASS]` Strict order ownership enforcement (`403 Forbidden` if another user attempts to view the order)

---

## 📜 REST API Reference

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/customers/register` | Register new customer account (`fullName`, `email`, `password`, `phone`) | No |
| `POST` | `/customers/login` | Authenticate customer and set HttpOnly session cookie | No |
| `GET` | `/customers/me` | Retrieve profile of authenticated customer | **Yes** |
| `POST` | `/customers/logout` | Clear HttpOnly session cookie | **Yes** |
| `PATCH`| `/customers/change-password` | Update account password | **Yes** |
| `GET` | `/products` | List all products with optional filters: `?search=`, `?category=`, `?sort=` | No |
| `GET` | `/products/:id` | Retrieve single product details | No |
| `POST` | `/products` | Create a new product | No |
| `POST` | `/wishlist/:productId` | Add product to authenticated customer's wishlist | **Yes** |
| `GET` | `/wishlist` | View wishlist items with populated product data | **Yes** |
| `DELETE`| `/wishlist/:productId` | Remove product from wishlist | **Yes** |
| `PATCH`| `/wishlist/:productId/toggle`| Toggle wishlist state | **Yes** |
| `POST` | `/cart/:productId` | Add product to cart (qty 1) or increment if existing | **Yes** |
| `GET` | `/cart` | View cart with populated product data | **Yes** |
| `PATCH`| `/cart/:productId` | Update item quantity (`{ quantity: N }`) with stock boundary check | **Yes** |
| `DELETE`| `/cart/:productId` | Remove item from cart | **Yes** |
| `POST` | `/orders/create-payment-order` | Validate address, check stock, calculate total, create pending & Razorpay order | **Yes** |
| `POST` | `/orders/verify-payment` | Verify HMAC-SHA256 signature, mark PAID, deduct stock, empty cart | **Yes** |
| `GET` | `/orders` | View user's order history sorted by most recent | **Yes** |
| `GET` | `/orders/:id` | View single order snapshot (enforces ownership with `403 Forbidden`) | **Yes** |
| `PATCH`| `/orders/:id/status` | Update order fulfillment status (`PLACED` &rarr; `CONFIRMED` &rarr; `SHIPPED` &rarr; `DELIVERED`) | **Yes** |

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `connect ECONNREFUSED 127.0.0.1:27017` | Local MongoDB daemon is not running | The backend automatically boots a persistent embedded MongoDB instance (`backend/data/db`). No action required. |
| CORS error in browser console | Origin mismatch | Verify that `backend/.env` has `CLIENT_URL=http://localhost:5173`. |
| `401 Unauthorized` on protected pages | Session cookie missing or expired | Log in via `/login` to generate a fresh session cookie. |
| Port 5000 or 5173 in use | Stale background process | Run `npx kill-port 5000` or `npx kill-port 5173` before starting. |
| Payment signature verification failed | Key Secret mismatch | Ensure `RAZORPAY_KEY_SECRET` in `backend/.env` matches the secret generated in your Razorpay Dashboard. |

---

## 📄 License
ISC
