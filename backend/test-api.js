/**
 * ============================================================================
 * File: backend/test-api.js
 * Purpose: API Test Script for Labs 01-04
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Tests authentication endpoints (registration, login, cookie setting).
 * - Tests product catalog queries and single product retrieval.
 * - Tests wishlist operations (adding items, preventing duplicates, removing items).
 * ============================================================================
 */
// Automated test runner for Lab 01 to Lab 05 APIs
const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting ShopKart API Verification ---');
  let cookie = '';
  let token = '';
  let testProductId = '';
  let customerEmail = `student_${Date.now()}@shopkart.org`;

  // Helper fetch with cookie forwarding
  async function api(path, options = {}) {
    const headers = options.headers || {};
    if (cookie) headers['cookie'] = cookie;
    if (token) headers['authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'object') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie.split(';')[0];
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. Health check
  const health = await api('/');
  console.log('1. Health check:', health.status, health.data.message);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Lab-01: Register Customer
  const reg = await api('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Linus Torvalds',
      email: customerEmail,
      password: 'linuxpassword123',
      phone: '9876543210'
    }
  });
  console.log('2. Customer Register:', reg.status, reg.data.message);
  if (reg.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(reg.data));

  // 3. Lab-01: Duplicate Register (Expect 409)
  const dup = await api('/customers/register', {
    method: 'POST',
    body: {
      fullName: 'Linus Torvalds',
      email: customerEmail,
      password: 'linuxpassword123',
      phone: '9876543210'
    }
  });
  console.log('3. Duplicate Email (Expect 409):', dup.status, dup.data.message);
  if (dup.status !== 409) throw new Error('Duplicate check failed: ' + dup.status);

  // 4. Lab-01: Login Customer
  const login = await api('/customers/login', {
    method: 'POST',
    body: {
      email: customerEmail,
      password: 'linuxpassword123'
    }
  });
  console.log('4. Customer Login:', login.status, login.data.message);
  if (login.status !== 200) throw new Error('Login failed: ' + JSON.stringify(login.data));
  token = login.data.token;

  // 5. Lab-01 & Lab-02: Get Me (/customers/me)
  const me = await api('/customers/me');
  console.log('5. Profile /customers/me:', me.status, me.data.fullName, me.data.email);
  if (me.status !== 200 || me.data.email !== customerEmail) {
    throw new Error('Get profile failed: ' + JSON.stringify(me.data));
  }

  // 6. Lab-03: Get Products
  const productsRes = await api('/products');
  console.log('6. Get Products:', productsRes.status, 'Count:', productsRes.data.count);
  if (productsRes.status !== 200 || productsRes.data.count === 0) {
    throw new Error('Get products failed');
  }
  const firstProduct = productsRes.data.products[0];
  testProductId = firstProduct._id;
  console.log('   Sample Product:', firstProduct.name, 'Price:', firstProduct.price);

  // 7. Lab-03: Product Search & Filter
  const searchRes = await api('/products?search=Ubuntu');
  console.log('7. Search Products (?search=Ubuntu):', searchRes.status, 'Results:', searchRes.data.count);

  // 8. Lab-03: Get Single Product
  const singleProduct = await api(`/products/${testProductId}`);
  console.log('8. Single Product by ID:', singleProduct.status, singleProduct.data.product?.name);
  if (singleProduct.status !== 200) throw new Error('Single product failed');

  // 9. Lab-04: Add to Wishlist
  const wishAdd = await api(`/wishlist/${testProductId}`, { method: 'POST' });
  console.log('9. Add to Wishlist:', wishAdd.status, wishAdd.data.message);
  if (wishAdd.status !== 200 && wishAdd.status !== 201) throw new Error('Wishlist add failed');

  // 10. Lab-04: Duplicate Wishlist (Expect 409)
  const wishDup = await api(`/wishlist/${testProductId}`, { method: 'POST' });
  console.log('10. Wishlist Duplicate (Expect 409):', wishDup.status, wishDup.data.message);
  if (wishDup.status !== 409) throw new Error('Wishlist duplicate test failed');

  // 11. Lab-04: Get Wishlist
  const wishGet = await api('/wishlist');
  console.log('11. Get Wishlist:', wishGet.status, 'Items in wishlist:', wishGet.data.count);
  if (wishGet.status !== 200 || wishGet.data.count !== 1) throw new Error('Get wishlist failed');

  // 12. Lab-05: Add to Cart
  const cartAdd1 = await api(`/cart/${testProductId}`, { method: 'POST' });
  console.log('12. Add to Cart (qty 1):', cartAdd1.status, 'Cart items:', cartAdd1.data.cart?.length);
  if (cartAdd1.status !== 200) throw new Error('Cart add failed');

  // 13. Lab-05: Add to Cart Again (Auto-increments to qty 2)
  const cartAdd2 = await api(`/cart/${testProductId}`, { method: 'POST' });
  const itemInCart = cartAdd2.data.cart?.find(i => (i.product._id || i.product) === testProductId);
  console.log('13. Re-add to Cart (qty increment):', cartAdd2.status, 'Quantity:', itemInCart?.quantity);
  if (itemInCart?.quantity !== 2) throw new Error('Cart quantity increment failed');

  // 14. Lab-05: Update Quantity via PATCH
  const cartPatch = await api(`/cart/${testProductId}`, {
    method: 'PATCH',
    body: { quantity: 3 }
  });
  const updatedItem = cartPatch.data.cart?.find(i => (i.product._id || i.product) === testProductId);
  console.log('14. Update Cart Qty (PATCH):', cartPatch.status, 'Quantity:', updatedItem?.quantity);
  if (updatedItem?.quantity !== 3) throw new Error('Cart patch failed');

  // 15. Lab-05: Stock Limit Validation
  const stockOver = await api(`/cart/${testProductId}`, {
    method: 'PATCH',
    body: { quantity: 99999 }
  });
  console.log('15. Stock Limit Check (Expect 400):', stockOver.status, stockOver.data.message);
  if (stockOver.status !== 400) throw new Error('Stock validation failed');

  // 16. Lab-05: Remove from Cart
  const cartRemove = await api(`/cart/${testProductId}`, { method: 'DELETE' });
  console.log('16. Remove from Cart:', cartRemove.status, 'Items left:', cartRemove.data.cart?.length);
  if (cartRemove.status !== 200 || cartRemove.data.cart?.length !== 0) throw new Error('Cart remove failed');

  // 17. Lab-04: Remove from Wishlist
  const wishRemove = await api(`/wishlist/${testProductId}`, { method: 'DELETE' });
  console.log('17. Remove from Wishlist:', wishRemove.status, wishRemove.data.message);
  if (wishRemove.status !== 200) throw new Error('Wishlist remove failed');

  // 18. Lab-01: Logout
  const logoutRes = await api('/customers/logout', { method: 'POST' });
  console.log('18. Customer Logout:', logoutRes.status, logoutRes.data.message);
  if (logoutRes.status !== 200) throw new Error('Logout failed');

  console.log('\n>>> ALL 18 BACKEND API TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n[FAIL] Test failure:', err.message);
  process.exit(1);
});
