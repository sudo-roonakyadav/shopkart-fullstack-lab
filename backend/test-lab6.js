/**
 * ============================================================================
 * File: backend/test-lab6.js
 * Purpose: Targeted Integration Test Suite for Lab 06 (Checkout & Payments)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Verifies Razorpay payment order generation with valid amounts in paise.
 * - Validates server-side cryptographic HMAC-SHA256 signature calculation.
 * - Verifies that invalid signatures are rejected with HTTP 400.
 * - Verifies that successful verification deducts product inventory in MongoDB.
 * ============================================================================
 */
require('dotenv').config();
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';

async function runLab6Tests() {
  console.log('\n======================================================');
  console.log('       RUNNING LAB 06 (CHECKOUT & ORDERS) TESTS       ');
  console.log('======================================================\n');

  let authCookie = '';
  let authToken = '';

  async function req(path, options = {}) {
    const headers = options.headers || {};
    if (authCookie) headers['cookie'] = authCookie;
    if (authToken) headers['authorization'] = `Bearer ${authToken}`;
    if (options.body && typeof options.body === 'object') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      authCookie = setCookie.split(';')[0];
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. Register & login a test user
  const email = `checkout_user_${Date.now()}@shopkart.org`;
  const registerRes = await req('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Linus Torvalds',
      email,
      password: 'gitmasterpass123',
      phone: '9876543210'
    }
  });

  console.log('[PASS] Register new user (201):', registerRes.status === 201);
  if (registerRes.status !== 201) throw new Error('Registration failed');

  const loginRes = await req('/customers/login', {
    method: 'POST',
    body: { email, password: 'gitmasterpass123' }
  });
  console.log('[PASS] Login user (200):', loginRes.status === 200);
  if (loginRes.status !== 200) throw new Error('Login failed');
  authToken = loginRes.data.token;

  // 2. Fetch available products
  const productsRes = await req('/products');
  console.log('[PASS] Fetch products (200):', productsRes.status === 200, `Found: ${productsRes.data.products?.length}`);
  const product = productsRes.data.products?.[0];
  if (!product) throw new Error('No products available for checkout test');

  // 3. Test checkout with empty cart -> 400 Bad Request
  const emptyCartOrder = await req('/orders/create-payment-order', {
    method: 'POST',
    body: {
      shippingAddress: {
        fullName: 'Linus Torvalds',
        phone: '9876543210',
        addressLine1: '100 Kernel Way',
        city: 'Portland',
        state: 'Oregon',
        pincode: '972010'
      }
    }
  });
  console.log('[PASS] Empty cart rejected with 400:', emptyCartOrder.status === 400);
  if (emptyCartOrder.status !== 400) throw new Error('Expected 400 for empty cart order');

  // 4. Add product to cart and set quantity to 2
  await req(`/cart/${product._id}`, { method: 'POST' });
  const updateQtyRes = await req(`/cart/${product._id}`, {
    method: 'PATCH',
    body: { quantity: 2 }
  });
  console.log('[PASS] Added product and updated to 2 units (200):', updateQtyRes.status === 200);
  const initialStock = product.stock;

  // 5. Test invalid address validation (e.g., missing pincode) -> 400 Bad Request
  const invalidAddressRes = await req('/orders/create-payment-order', {
    method: 'POST',
    body: {
      shippingAddress: {
        fullName: 'Linus Torvalds',
        phone: '9876543210',
        addressLine1: '100 Kernel Way',
        city: 'Portland',
        state: 'Oregon',
        pincode: '123' // Invalid pincode (not 6 digits)
      }
    }
  });
  console.log('[PASS] Invalid pincode rejected with 400:', invalidAddressRes.status === 400);
  if (invalidAddressRes.status !== 400) throw new Error('Expected 400 for invalid pincode');

  // 6. Create valid payment order
  const validOrderRes = await req('/orders/create-payment-order', {
    method: 'POST',
    body: {
      shippingAddress: {
        fullName: 'Linus Torvalds',
        phone: '9876543210',
        addressLine1: '100 Kernel Way',
        city: 'Portland',
        state: 'Oregon',
        pincode: '972010'
      }
    }
  });
  console.log('[PASS] Create payment order (201):', validOrderRes.status === 201);
  if (validOrderRes.status !== 201) throw new Error('Failed to create payment order');
  const { shopKartOrderId, razorpayOrderId, amount } = validOrderRes.data;
  console.log(`  -> shopKartOrderId: ${shopKartOrderId}, razorpayOrderId: ${razorpayOrderId}, amount: ${amount} paise`);

  // 7. Test payment verification with invalid signature -> 400 Bad Request
  const badSigRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_fake_payment_123',
      razorpay_signature: 'invalid_sha256_hash_here'
    }
  });
  console.log('[PASS] Invalid signature rejected with 400:', badSigRes.status === 400);
  if (badSigRes.status !== 400) throw new Error('Expected 400 for bad signature');

  // 7b. Security Test: Signature generated with old simulation secret must be REJECTED by real endpoint
  const simSecretSig = crypto
    .createHmac('sha256', 'shopkart_razorpay_secret_test_key')
    .update(`${razorpayOrderId}|pay_forged_attempt`)
    .digest('hex');
  const simSecretRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_forged_attempt',
      razorpay_signature: simSecretSig
    }
  });
  console.log('[PASS] Simulation secret HMAC rejected by real endpoint (400):', simSecretRes.status === 400);
  if (simSecretRes.status !== 400) throw new Error('Real endpoint accepted simulation secret!');

  // 7c. Security Test: Mismatched order ID rejected with 400
  const mismatchRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId,
      razorpay_order_id: 'order_wrong_mismatched_id_999',
      razorpay_payment_id: 'pay_valid_sample',
      razorpay_signature: 'signature_here'
    }
  });
  console.log('[PASS] Mismatched order ID rejected with 400:', mismatchRes.status === 400);
  if (mismatchRes.status !== 400) throw new Error('Expected 400 for mismatched order ID');

  // 8. Test payment verification with valid HMAC-SHA256 signature using configured secret
  const secret = process.env.RAZORPAY_KEY_SECRET || 'verified_secret_for_automated_testing_key_2026';
  const paymentId = `pay_test_${Date.now()}`;
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex');

  const verifyRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    }
  });
  console.log('[PASS] Valid payment verification succeeds (200):', verifyRes.status === 200);
  if (verifyRes.status !== 200) throw new Error('Valid signature verification failed');
  console.log(`  -> Order marked status: ${verifyRes.data.order?.status}, paymentStatus: ${verifyRes.data.order?.paymentStatus}`);

  // 8b. Test verification idempotency: Repeated call returns 200 without changing stock
  const repeatVerifyRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    }
  });
  console.log('[PASS] Repeated payment verification is idempotent (200):', repeatVerifyRes.status === 200);
  if (repeatVerifyRes.status !== 200) throw new Error('Repeated verification failed');

  // 9. Verify cart is now empty
  const cartAfterOrder = await req('/cart');
  console.log('[PASS] Cart is cleared after verified payment:', cartAfterOrder.data.cart?.length === 0);
  if (cartAfterOrder.data.cart?.length !== 0) throw new Error('Cart was not cleared after payment');

  // 10. Verify stock was deducted
  const productAfterOrder = await req(`/products/${product._id}`);
  console.log(`[PASS] Product inventory decremented from ${initialStock} to ${productAfterOrder.data.product?.stock}:`, productAfterOrder.data.product?.stock === initialStock - 2);
  if (productAfterOrder.data.product?.stock !== initialStock - 2) throw new Error('Stock was not properly decremented');

  // 11. Fetch user orders via GET /orders
  const ordersListRes = await req('/orders');
  console.log('[PASS] Fetch user orders (200):', ordersListRes.status === 200, `Count: ${ordersListRes.data.count}`);
  if (ordersListRes.status !== 200 || ordersListRes.data.count < 1) throw new Error('Orders list retrieval failed');

  // 12. Fetch single order via GET /orders/:id
  const singleOrderRes = await req(`/orders/${shopKartOrderId}`);
  console.log('[PASS] Fetch single order details (200):', singleOrderRes.status === 200, `Total: ₹${singleOrderRes.data.order?.totalAmount}`);
  if (singleOrderRes.status !== 200) throw new Error('Order details retrieval failed');

  // 13. Verify order ownership isolation (Another user attempting to fetch this order -> 403 Forbidden)
  const user2Email = `other_user_${Date.now()}@shopkart.org`;
  const user2Reg = await req('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Other Person',
      email: user2Email,
      password: 'password123',
      phone: '1122334455'
    }
  });
  // Log in as user 2
  const user2Login = await req('/customers/login', {
    method: 'POST',
    body: { email: user2Email, password: 'password123' }
  });
  authToken = user2Login.data.token; // switch to user 2

  const unauthorizedOrderFetch = await req(`/orders/${shopKartOrderId}`);
  console.log('[PASS] Unauthorized access to another user\'s order rejected with 403:', unauthorizedOrderFetch.status === 403);
  if (unauthorizedOrderFetch.status !== 403) throw new Error('Expected 403 Forbidden for another user accessing order');

  console.log('\n======================================================');
  console.log('       ALL LAB 06 AUTOMATED TESTS PASSED!           ');
  console.log('======================================================\n');
}

runLab6Tests().catch(err => {
  console.error('\n[FAIL] TEST FAILED:', err);
  process.exit(1);
});
