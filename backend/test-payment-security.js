/**
 * ============================================================================
 * File: backend/test-payment-security.js
 * Purpose: Payment Verification Security & Regression Test Suite
 * ----------------------------------------------------------------------------
 * Verifies:
 * 1. A valid genuine Razorpay test signature is accepted by /orders/verify-payment.
 * 2. A tampered signature is rejected with 400 Bad Request.
 * 3. A signature generated with the known simulation secret CANNOT approve payment
 *    through the real verification endpoint.
 * 4. A mismatched Razorpay order ID is rejected with 400 Bad Request.
 * 5. Missing server-side RAZORPAY_KEY_SECRET rejects verification with 500.
 * 6. Offline simulation (/orders/simulate-payment) succeeds in dev/test mode.
 * 7. Simulation is strictly rejected in production (403 Forbidden).
 * 8. Repeated verification does not double-decrement inventory (idempotency).
 * ============================================================================
 */
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const CONFIGURED_SECRET = process.env.RAZORPAY_KEY_SECRET || 'verified_secret_for_automated_testing_key_2026';
const KNOWN_SIMULATION_SECRET = 'shopkart_razorpay_secret_test_key';

async function runSecurityTests() {
  console.log('\n======================================================');
  console.log('    RUNNING PAYMENT VERIFICATION SECURITY TESTS       ');
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

  // 1. Register & Login test user
  const email = `sec_user_${Date.now()}@shopkart.org`;
  const registerRes = await req('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Security Auditor',
      email,
      password: 'StrongSecurityPassword123!',
      phone: '9876543210'
    }
  });
  if (registerRes.status !== 201) {
    throw new Error(`Failed to register test user: ${JSON.stringify(registerRes.data)}`);
  }

  const loginRes = await req('/customers/login', {
    method: 'POST',
    body: { email, password: 'StrongSecurityPassword123!' }
  });
  if (loginRes.status !== 200) {
    throw new Error('Failed to login test user');
  }
  authToken = loginRes.data.token;
  console.log('[PASS] Test user registered and authenticated.');

  // 2. Fetch products to get a test item
  const productsRes = await req('/products');
  const product = productsRes.data.products?.[0];
  if (!product) throw new Error('No products available for test');
  console.log(`[PASS] Selected test product: ${product.name} (Initial stock: ${product.stock})`);

  // Helper to add item to cart and create a payment order
  async function createTestOrder() {
    await req(`/cart/${product._id}`, { method: 'POST' });
    await req(`/cart/${product._id}`, {
      method: 'PATCH',
      body: { quantity: 1 }
    });
    const orderRes = await req('/orders/create-payment-order', {
      method: 'POST',
      body: {
        shippingAddress: {
          fullName: 'Security Auditor',
          phone: '9876543210',
          addressLine1: '404 Security Blvd',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        }
      }
    });
    if (orderRes.status !== 201) {
      throw new Error(`Failed to create test order: ${JSON.stringify(orderRes.data)}`);
    }
    return orderRes.data;
  }

  // ------------------------------------------------------------------------
  // TEST CASE 1: Valid genuine Razorpay test signature is accepted
  // ------------------------------------------------------------------------
  console.log('\n--- Test 1: Genuine HMAC-SHA256 Signature Verification ---');
  const order1 = await createTestOrder();
  const paymentId1 = `pay_real_test_${Date.now()}`;
  const validSignature = crypto
    .createHmac('sha256', CONFIGURED_SECRET)
    .update(`${order1.razorpayOrderId}|${paymentId1}`)
    .digest('hex');

  const verifyRes1 = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId: order1.shopKartOrderId,
      razorpay_order_id: order1.razorpayOrderId,
      razorpay_payment_id: paymentId1,
      razorpay_signature: validSignature
    }
  });

  console.log('[PASS] Valid signature accepted (200):', verifyRes1.status === 200);
  if (verifyRes1.status !== 200) {
    throw new Error(`Expected 200 for valid signature, got ${verifyRes1.status}: ${JSON.stringify(verifyRes1.data)}`);
  }
  if (verifyRes1.data.order?.paymentStatus !== 'PAID' || verifyRes1.data.order?.status !== 'PLACED') {
    throw new Error('Order was not marked PAID/PLACED upon valid verification');
  }

  // ------------------------------------------------------------------------
  // TEST CASE 2: Tampered signature is rejected
  // ------------------------------------------------------------------------
  console.log('\n--- Test 2: Tampered Signature Rejection ---');
  const order2 = await createTestOrder();
  const tamperedRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId: order2.shopKartOrderId,
      razorpay_order_id: order2.razorpayOrderId,
      razorpay_payment_id: `pay_tampered_${Date.now()}`,
      razorpay_signature: 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567'
    }
  });

  console.log('[PASS] Tampered signature rejected with 400:', tamperedRes.status === 400);
  if (tamperedRes.status !== 400) {
    throw new Error(`Expected 400 for tampered signature, got ${tamperedRes.status}`);
  }

  // ------------------------------------------------------------------------
  // TEST CASE 3: Signature from known simulation secret CANNOT approve payment on real endpoint
  // ------------------------------------------------------------------------
  console.log('\n--- Test 3: Simulation Secret Signature Rejected by Real Endpoint ---');
  const order3 = await createTestOrder();
  const simPaymentId = `pay_simulated_${Date.now()}`;
  const simulationSecretSignature = crypto
    .createHmac('sha256', KNOWN_SIMULATION_SECRET)
    .update(`${order3.razorpayOrderId}|${simPaymentId}`)
    .digest('hex');

  const forgedRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId: order3.shopKartOrderId,
      razorpay_order_id: order3.razorpayOrderId,
      razorpay_payment_id: simPaymentId,
      razorpay_signature: simulationSecretSignature
    }
  });

  console.log('[PASS] Known simulation secret rejected by real verification endpoint (400):', forgedRes.status === 400);
  if (forgedRes.status !== 400) {
    throw new Error(`CRITICAL VULNERABILITY: Simulation secret was accepted by real endpoint! Status: ${forgedRes.status}`);
  }

  // ------------------------------------------------------------------------
  // TEST CASE 4: Mismatched Razorpay order ID is rejected
  // ------------------------------------------------------------------------
  console.log('\n--- Test 4: Mismatched Razorpay Order ID Rejection ---');
  const order4 = await createTestOrder();
  const mismatchedPaymentId = `pay_mismatch_${Date.now()}`;
  const mismatchedSig = crypto
    .createHmac('sha256', CONFIGURED_SECRET)
    .update(`order_forged_id_99999|${mismatchedPaymentId}`)
    .digest('hex');

  const mismatchedRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId: order4.shopKartOrderId,
      razorpay_order_id: 'order_forged_id_99999',
      razorpay_payment_id: mismatchedPaymentId,
      razorpay_signature: mismatchedSig
    }
  });

  console.log('[PASS] Mismatched order ID rejected with 400:', mismatchedRes.status === 400);
  if (mismatchedRes.status !== 400) {
    throw new Error(`Expected 400 for mismatched order ID, got ${mismatchedRes.status}`);
  }

  // ------------------------------------------------------------------------
  // TEST CASE 5: Repeated payment verification does not double-decrement inventory (Idempotency)
  // ------------------------------------------------------------------------
  console.log('\n--- Test 5: Payment Verification Idempotency & Inventory Protection ---');
  const prodBeforeRepeat = (await req(`/products/${product._id}`)).data.product;
  const stockBeforeRepeat = prodBeforeRepeat.stock;

  // Re-verify order1 which was already verified and paid
  const repeatVerifyRes = await req('/orders/verify-payment', {
    method: 'POST',
    body: {
      shopKartOrderId: order1.shopKartOrderId,
      razorpay_order_id: order1.razorpayOrderId,
      razorpay_payment_id: paymentId1,
      razorpay_signature: validSignature
    }
  });

  console.log('[PASS] Repeated verification returns 200 (idempotent):', repeatVerifyRes.status === 200);
  const prodAfterRepeat = (await req(`/products/${product._id}`)).data.product;
  const stockAfterRepeat = prodAfterRepeat.stock;

  console.log(`[PASS] Stock preserved without double deduction (${stockBeforeRepeat} === ${stockAfterRepeat}):`, stockBeforeRepeat === stockAfterRepeat);
  if (stockBeforeRepeat !== stockAfterRepeat) {
    throw new Error(`INVENTORY BUG: Repeated verification changed stock from ${stockBeforeRepeat} to ${stockAfterRepeat}`);
  }

  // ------------------------------------------------------------------------
  // TEST CASE 6: Dedicated offline simulation endpoint behavior over HTTP
  // ------------------------------------------------------------------------
  console.log('\n--- Test 6: Offline Payment Simulation Endpoint over HTTP ---');
  const order6 = await createTestOrder();
  const prodBeforeSim = (await req(`/products/${product._id}`)).data.product;
  const stockBeforeSim = prodBeforeSim.stock;

  const serverStatusRes = await req('/orders/simulation-status');
  console.log(`[PASS] Server reports simulation-status: simulationAllowed=${serverStatusRes.data?.simulationAllowed} (env=${serverStatusRes.data?.environment})`);

  if (serverStatusRes.data?.simulationAllowed) {
    const simEndpointRes = await req('/orders/simulate-payment', {
      method: 'POST',
      body: {
        shopKartOrderId: order6.shopKartOrderId
      }
    });

    console.log('[PASS] Enabled offline simulation succeeds (200):', simEndpointRes.status === 200);
    if (simEndpointRes.status !== 200) {
      throw new Error(`Simulation endpoint failed with status: ${simEndpointRes.status}`);
    }
    console.log('[PASS] Order clearly marked as simulated (isSimulated === true):', simEndpointRes.data.order?.isSimulated === true);
    if (simEndpointRes.data.order?.isSimulated !== true) {
      throw new Error('Simulation endpoint failed to set order.isSimulated = true');
    }

    const prodAfterSim = (await req(`/products/${product._id}`)).data.product;
    console.log(`[PASS] Stock correctly decremented by 1 after simulation (${stockBeforeSim} -> ${prodAfterSim.stock}):`, prodAfterSim.stock === stockBeforeSim - 1);
    if (prodAfterSim.stock !== stockBeforeSim - 1) {
      throw new Error('Simulation failed to decrement stock');
    }

    // Repeated simulation call idempotency
    const repeatSimRes = await req('/orders/simulate-payment', {
      method: 'POST',
      body: { shopKartOrderId: order6.shopKartOrderId }
    });
    const prodAfterRepeatSim = (await req(`/products/${product._id}`)).data.product;
    console.log('[PASS] Repeated simulation is idempotent (stock unchanged):', prodAfterRepeatSim.stock === prodAfterSim.stock);
    if (prodAfterRepeatSim.stock !== prodAfterSim.stock) {
      throw new Error('Repeated simulation double-decremented stock!');
    }
  } else {
    const simBlockedRes = await req('/orders/simulate-payment', {
      method: 'POST',
      body: { shopKartOrderId: order6.shopKartOrderId }
    });
    console.log('[PASS] Disabled offline simulation rejected with 403 over HTTP:', simBlockedRes.status === 403);
    if (simBlockedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden when simulation disabled, got ${simBlockedRes.status}`);
    }
  }

  // ------------------------------------------------------------------------
  // TEST CASE 7: Simulation Authorization Combinatorial Matrix (Strict Fail-Closed)
  // Verifies all required conditions:
  // - NODE_ENV unset: simulation rejected
  // - NODE_ENV=development, opt-in unset: simulation rejected
  // - NODE_ENV=development, opt-in false: simulation rejected
  // - NODE_ENV=development, opt-in true: simulation permitted
  // - NODE_ENV=test, opt-in true: simulation permitted
  // - NODE_ENV=production, opt-in true: simulation rejected
  // - The status endpoint reports the same decision as the simulation endpoint
  // ------------------------------------------------------------------------
  console.log('\n--- Test 7: Fail-Closed Simulation Authorization Matrix ---');
  const {
    simulatePayment,
    getSimulationStatus,
    isPaymentSimulationPermitted,
    verifyPayment
  } = require('./controllers/order.controller');

  const testMatrix = [
    {
      label: 'Matrix 1: NODE_ENV unset, opt-in unset',
      env: undefined,
      optIn: undefined,
      expectedAllowed: false
    },
    {
      label: 'Matrix 2: NODE_ENV=development, opt-in unset',
      env: 'development',
      optIn: undefined,
      expectedAllowed: false
    },
    {
      label: 'Matrix 3: NODE_ENV=development, opt-in false',
      env: 'development',
      optIn: 'false',
      expectedAllowed: false
    },
    {
      label: 'Matrix 4: NODE_ENV=development, opt-in true',
      env: 'development',
      optIn: 'true',
      expectedAllowed: true
    },
    {
      label: 'Matrix 5: NODE_ENV=test, opt-in true',
      env: 'test',
      optIn: 'true',
      expectedAllowed: true
    },
    {
      label: 'Matrix 6: NODE_ENV=production, opt-in true',
      env: 'production',
      optIn: 'true',
      expectedAllowed: false
    }
  ];

  for (const tc of testMatrix) {
    const savedEnv = process.env.NODE_ENV;
    const savedOptIn = process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION;

    if (tc.env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = tc.env;

    if (tc.optIn === undefined) delete process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION;
    else process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = tc.optIn;

    // 1. Helper evaluation
    const isPermitted = isPaymentSimulationPermitted();
    if (isPermitted !== tc.expectedAllowed) {
      process.env.NODE_ENV = savedEnv;
      process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
      throw new Error(`${tc.label}: expected isPaymentSimulationPermitted=${tc.expectedAllowed}, got ${isPermitted}`);
    }

    // 2. Status endpoint evaluation
    const mockStatusRes = {
      statusCode: null,
      data: null,
      status(c) { this.statusCode = c; return this; },
      json(d) { this.data = d; return this; }
    };
    getSimulationStatus({}, mockStatusRes);
    if (mockStatusRes.data?.simulationAllowed !== tc.expectedAllowed) {
      process.env.NODE_ENV = savedEnv;
      process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
      throw new Error(`${tc.label}: status endpoint reported simulationAllowed=${mockStatusRes.data?.simulationAllowed}, expected ${tc.expectedAllowed}`);
    }

    // 3. Simulate endpoint gate evaluation
    // When simulation is blocked: gate immediately returns 403 Forbidden.
    // When simulation is permitted: gate passes and proceeds to input validation (400 for missing param).
    const mockSimRes = {
      statusCode: null,
      data: null,
      status(c) { this.statusCode = c; return this; },
      json(d) { this.data = d; return this; }
    };
    await simulatePayment({ body: {} }, mockSimRes);

    if (!tc.expectedAllowed) {
      if (mockSimRes.statusCode !== 403) {
        process.env.NODE_ENV = savedEnv;
        process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
        throw new Error(`${tc.label}: expected 403 Forbidden, got ${mockSimRes.statusCode}`);
      }
    } else {
      if (mockSimRes.statusCode === 403) {
        process.env.NODE_ENV = savedEnv;
        process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
        throw new Error(`${tc.label}: expected simulation gate to permit request, but got 403 Forbidden`);
      }
      if (mockSimRes.statusCode !== 400) {
        process.env.NODE_ENV = savedEnv;
        process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
        throw new Error(`${tc.label}: expected 400 missing param after passing gate, got ${mockSimRes.statusCode}`);
      }
    }

    // 4. Verify status endpoint decision exactly matches simulation endpoint gate
    const gateAllowed = mockSimRes.statusCode !== 403;
    if (mockStatusRes.data?.simulationAllowed !== gateAllowed) {
      process.env.NODE_ENV = savedEnv;
      process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
      throw new Error(`${tc.label}: mismatch between status endpoint (${mockStatusRes.data?.simulationAllowed}) and simulation gate (${gateAllowed})`);
    }

    console.log(`[PASS] ${tc.label} -> permitted: ${isPermitted}, status endpoint: ${mockStatusRes.data?.simulationAllowed}, sim gate: ${mockSimRes.statusCode === 403 ? 'BLOCKED (403)' : 'PERMITTED (Proceeded to validation)'}`);

    // Restore environment
    if (savedEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedEnv;

    if (savedOptIn === undefined) delete process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION;
    else process.env.SHOPKART_ENABLE_PAYMENT_SIMULATION = savedOptIn;
  }

  // ------------------------------------------------------------------------
  // TEST CASE 8: Real verification endpoint rejects if server secret is missing
  // ------------------------------------------------------------------------
  console.log('\n--- Test 8: Missing Server Secret Rejects Verification (500) ---');
  const prevSecret = process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_KEY_SECRET;
  const mockMissingReq = {
    body: {
      shopKartOrderId: order1.shopKartOrderId,
      razorpay_order_id: order1.razorpayOrderId,
      razorpay_payment_id: 'pay_test_missing_secret',
      razorpay_signature: 'signature_here'
    }
  };
  const mockMissingRes = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
  await verifyPayment(mockMissingReq, mockMissingRes);
  console.log('[PASS] Missing RAZORPAY_KEY_SECRET returns 500 error:', mockMissingRes.statusCode === 500);
  if (mockMissingRes.statusCode !== 500) {
    process.env.RAZORPAY_KEY_SECRET = prevSecret;
    throw new Error(`Expected 500 for missing server secret, got ${mockMissingRes.statusCode}`);
  }
  process.env.RAZORPAY_KEY_SECRET = prevSecret;

  console.log('\n======================================================');
  console.log('    ALL PAYMENT SECURITY REGRESSION TESTS PASSED!     ');
  console.log('======================================================\n');
}

runSecurityTests().catch((err) => {
  console.error('\n[FAIL] PAYMENT SECURITY TEST FAILED:', err);
  process.exit(1);
});
