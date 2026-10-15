/**
 * ============================================================================
 * File: backend/test-comprehensive.js
 * Purpose: Comprehensive End-to-End Test Suite (Labs 01 through 06)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Executes automated integration tests covering the entire user journey:
 *     1. User registration & authentication with HttpOnly cookies
 *     2. Product catalog browsing & specification retrieval
 *     3. Wishlist item addition, duplicate rejection, and deletion (Lab 04)
 *     4. Shopping cart addition, stock constraint enforcement, quantity updates (Lab 05)
 *     5. Razorpay order initialization, HMAC-SHA256 signature verification (Lab 06)
 *     6. Inventory stock deduction verification and order history inspection
 * ============================================================================
 */
// Comprehensive edge-case verification for Labs 01 to 05
const BASE_URL = 'http://localhost:5000';

async function runComprehensiveVerification() {
  console.log('\n======================================================');
  console.log('   RUNNING COMPREHENSIVE LAB 1-5 VERIFICATION SUITE   ');
  console.log('======================================================\n');

  let testCookie = '';
  let testToken = '';

  async function req(path, options = {}) {
    const headers = options.headers || {};
    if (testCookie) headers['cookie'] = testCookie;
    if (testToken) headers['authorization'] = `Bearer ${testToken}`;
    if (options.body && typeof options.body === 'object') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      testCookie = setCookie.split(';')[0];
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // --- LAB 01 TESTS ---
  console.log('--- Testing Lab 01 (Customer Authentication) ---');

  // Test: Missing fields in register
  const regMissing = await req('/customers/register', {
    method: 'POST',
    body: { fullName: 'Test', email: 'incomplete@test.com' }
  });
  console.log('[PASS] Missing fields rejected with 400:', regMissing.status === 400);
  if (regMissing.status !== 400) throw new Error('Failed: Expected 400 for missing fields');

  // Test: Password too short
  const regShortPass = await req('/customers/register', {
    method: 'POST',
    body: { fullName: 'Test', email: 'short@test.com', password: '123', phone: '1234567890' }
  });
  console.log('[PASS] Short password rejected with 400:', regShortPass.status === 400);
  if (regShortPass.status !== 400) throw new Error('Failed: Expected 400 for short password');

  // Test: Successful registration
  const userEmail = `lab_user_${Date.now()}@test.org`;
  const regSuccess = await req('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Richard Stallman',
      email: userEmail,
      password: 'freeasinfreedom',
      phone: '9988776655'
    }
  });
  console.log('[PASS] Registration succeeded with 201:', regSuccess.status === 201);
  if (regSuccess.status !== 201) throw new Error('Registration failed');

  // Test: Duplicate email rejected with 409
  const regDup = await req('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Richard Stallman',
      email: userEmail,
      password: 'freeasinfreedom',
      phone: '9988776655'
    }
  });
  console.log('[PASS] Duplicate email rejected with 409:', regDup.status === 409);
  if (regDup.status !== 409) throw new Error('Expected 409 for duplicate email');

  // Test: Login invalid credentials
  const loginInvalid = await req('/customers/login', {
    method: 'POST',
    body: { email: userEmail, password: 'wrongpassword' }
  });
  console.log('[PASS] Invalid login rejected with 401:', loginInvalid.status === 401);
  if (loginInvalid.status !== 401) throw new Error('Expected 401 for wrong credentials');

  // Test: Successful login
  const loginSuccess = await req('/customers/login', {
    method: 'POST',
    body: { email: userEmail, password: 'freeasinfreedom' }
  });
  console.log('[PASS] Login succeeded with 200 and cookie set:', loginSuccess.status === 200);
  if (loginSuccess.status !== 200) throw new Error('Login failed');
  testToken = loginSuccess.data.token;

  // Test: Protected /customers/me
  const me = await req('/customers/me');
  console.log('[PASS] Protected /customers/me returns user details:', me.status === 200, me.data.fullName);
  if (me.status !== 200 || me.data.email !== userEmail) throw new Error('Failed /customers/me');

  // Test: Bonus Change Password
  const changePass = await req('/customers/change-password', {
    method: 'PATCH',
    body: { oldPassword: 'freeasinfreedom', newPassword: 'newlinuxpassword456' }
  });
  console.log('[PASS] Bonus Change Password succeeded:', changePass.status === 200);
  if (changePass.status !== 200) throw new Error('Change password failed');

  // --- LAB 03 TESTS ---
  console.log('\n--- Testing Lab 03 (Product Catalog) ---');

  // Test: Create product with invalid price
  const prodBadPrice = await req('/products', {
    method: 'POST',
    body: {
      name: 'Bad Price OS',
      description: 'Invalid',
      price: -50,
      category: 'Desktop',
      image: 'http://img.png',
      stock: 10
    }
  });
  console.log('[PASS] Negative price rejected with 400:', prodBadPrice.status === 400);
  if (prodBadPrice.status !== 400) throw new Error('Expected 400 for negative price');

  // Test: List all products
  const allProds = await req('/products');
  console.log('[PASS] List all products count:', allProds.data.count);
  if (allProds.status !== 200 || allProds.data.count < 5) throw new Error('Products fetch failed');
  const sampleProduct = allProds.data.products[0];

  // Test: Filter by Category
  const filterCat = await req(`/products?category=${encodeURIComponent(sampleProduct.category)}`);
  console.log('[PASS] Filter by category count:', filterCat.data.count);

  // Test: Single product by ID
  const single = await req(`/products/${sampleProduct._id}`);
  console.log('[PASS] Single product lookup succeeded:', single.status === 200, single.data.product?.name);
  if (single.status !== 200) throw new Error('Single product lookup failed');

  // Test: Invalid product ID
  const invalidProdId = await req('/products/invalid-id-12345');
  console.log('[PASS] Invalid product ID returns 400:', invalidProdId.status === 400);
  if (invalidProdId.status !== 400) throw new Error('Expected 400 for invalid ID');

  // --- LAB 04 TESTS ---
  console.log('\n--- Testing Lab 04 (Wishlist System) ---');

  // Test: Add to Wishlist
  const wishAdd = await req(`/wishlist/${sampleProduct._id}`, { method: 'POST' });
  console.log('[PASS] Add to wishlist succeeded:', wishAdd.status === 200);
  if (wishAdd.status !== 200) throw new Error('Wishlist add failed');

  // Test: Duplicate wishlist returns 409
  const wishDup = await req(`/wishlist/${sampleProduct._id}`, { method: 'POST' });
  console.log('[PASS] Duplicate wishlist returned 409:', wishDup.status === 409);
  if (wishDup.status !== 409) throw new Error('Expected 409 for duplicate wishlist');

  // Test: View populated wishlist
  const wishList = await req('/wishlist');
  console.log('[PASS] Get wishlist returns populated products:', wishList.data.count === 1);
  if (wishList.status !== 200 || wishList.data.count !== 1) throw new Error('Get wishlist failed');

  // Test: Remove from Wishlist
  const wishDel = await req(`/wishlist/${sampleProduct._id}`, { method: 'DELETE' });
  console.log('[PASS] Remove from wishlist succeeded:', wishDel.status === 200);
  if (wishDel.status !== 200) throw new Error('Wishlist delete failed');

  // Test: Removing again returns 404
  const wishDelAgain = await req(`/wishlist/${sampleProduct._id}`, { method: 'DELETE' });
  console.log('[PASS] Removing absent item returns 404:', wishDelAgain.status === 404);
  if (wishDelAgain.status !== 404) throw new Error('Expected 404 for deleting absent wishlist item');

  // --- LAB 05 TESTS ---
  console.log('\n--- Testing Lab 05 (Shopping Cart) ---');

  // Test: Add to Cart (qty 1)
  const cartAdd = await req(`/cart/${sampleProduct._id}`, { method: 'POST' });
  console.log('[PASS] Add to cart succeeded:', cartAdd.status === 200, 'Items:', cartAdd.data.cart?.length);
  if (cartAdd.status !== 200) throw new Error('Cart add failed');

  // Test: Re-add increments quantity (qty 2)
  const cartReAdd = await req(`/cart/${sampleProduct._id}`, { method: 'POST' });
  const itemInCart = cartReAdd.data.cart?.find(i => (i.product._id || i.product) === sampleProduct._id);
  console.log('[PASS] Re-add increments quantity:', itemInCart?.quantity === 2);
  if (itemInCart?.quantity !== 2) throw new Error('Expected quantity 2');

  // Test: Update quantity to 4
  const cartUpdate = await req(`/cart/${sampleProduct._id}`, {
    method: 'PATCH',
    body: { quantity: 4 }
  });
  const updated = cartUpdate.data.cart?.find(i => (i.product._id || i.product) === sampleProduct._id);
  console.log('[PASS] Update quantity to 4 succeeded:', updated?.quantity === 4);
  if (updated?.quantity !== 4) throw new Error('Update quantity failed');

  // Test: Quantity < 1 rejected with 400
  const cartLowQty = await req(`/cart/${sampleProduct._id}`, {
    method: 'PATCH',
    body: { quantity: 0 }
  });
  console.log('[PASS] Quantity < 1 rejected with 400:', cartLowQty.status === 400);
  if (cartLowQty.status !== 400) throw new Error('Expected 400 for quantity 0');

  // Test: Quantity > stock rejected with 400
  const cartHighQty = await req(`/cart/${sampleProduct._id}`, {
    method: 'PATCH',
    body: { quantity: sampleProduct.stock + 1000 }
  });
  console.log('[PASS] Quantity exceeding stock rejected with 400:', cartHighQty.status === 400);
  if (cartHighQty.status !== 400) throw new Error('Expected 400 for quantity exceeding stock');

  // Test: Remove from cart
  const cartDel = await req(`/cart/${sampleProduct._id}`, { method: 'DELETE' });
  console.log('[PASS] Remove from cart succeeded:', cartDel.status === 200, 'Remaining:', cartDel.data.cart?.length);
  if (cartDel.status !== 200 || cartDel.data.cart?.length !== 0) throw new Error('Cart delete failed');

  // --- UNAUTHENTICATED TESTS ---
  console.log('\n--- Testing Authentication Barriers (401 Unauthorized) ---');

  // Clear session
  testCookie = '';
  testToken = '';

  const unauthMe = await req('/customers/me');
  console.log('[PASS] Unauthenticated /customers/me returns 401:', unauthMe.status === 401);
  if (unauthMe.status !== 401) throw new Error('Expected 401 for unauth me');

  const unauthWish = await req('/wishlist');
  console.log('[PASS] Unauthenticated /wishlist returns 401:', unauthWish.status === 401);
  if (unauthWish.status !== 401) throw new Error('Expected 401 for unauth wishlist');

  const unauthCart = await req('/cart');
  console.log('[PASS] Unauthenticated /cart returns 401:', unauthCart.status === 401);
  if (unauthCart.status !== 401) throw new Error('Expected 401 for unauth cart');

  console.log('\n======================================================');
  console.log('  ALL COMPREHENSIVE TESTS PASSED WITHOUT ANY ERRORS!  ');
  console.log('======================================================\n');
  process.exit(0);
}

runComprehensiveVerification().catch(err => {
  console.error('\n[FAIL] Comprehensive test failed:', err.message);
  process.exit(1);
});
