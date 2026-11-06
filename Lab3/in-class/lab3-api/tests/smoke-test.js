/**
 * Smoke test for the Lab 3 API.
 * Usage: make sure MongoDB + `node server.js` are running, then:
 *   node tests/smoke-test.js
 */
const BASE = process.env.BASE || 'http://localhost:3000/api';

let passed = 0;
let failed = 0;

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  return { status: res.status, data };
};

const check = (label, condition, extra) => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${extra ? ` -> ${JSON.stringify(extra)}` : ''}`);
  }
};

const section = (title) => console.log(`\n=== ${title} ===`);

(async () => {
  // ---------------------------------------------------------------------
  section('PRODUCTS');
  // ---------------------------------------------------------------------
  const created = await request('POST', '/products', {
    name: 'MacBook Air M3',
    category: 'Electronics',
    price: 27900000,
    stock: 8,
    description: 'Thin and light laptop'
  });
  check('POST /products -> 201', created.status === 201, created);
  const productId = created.data?.data?._id;

  const badPrice = await request('POST', '/products', {
    name: 'Ghost product',
    category: 'Electronics',
    price: -100
  });
  check('POST /products negative price -> 400', badPrice.status === 400, badPrice);

  const badCategory = await request('POST', '/products', {
    name: 'Ghost product',
    category: 'NotACategory',
    price: 10
  });
  check('POST /products unknown category -> 400', badCategory.status === 400, badCategory);

  const list = await request('GET', '/products?page=1&limit=5');
  check('GET /products -> 200 with pagination', list.status === 200 && !!list.data?.pagination, list);

  const filtered = await request(
    'GET',
    '/products?category=Electronics&minPrice=1000000&maxPrice=50000000'
  );
  check('GET /products with filters -> 200', filtered.status === 200, filtered);

  const one = await request('GET', `/products/${productId}`);
  check('GET /products/:id -> 200', one.status === 200, one);

  const malformed = await request('GET', '/products/not-a-valid-id');
  check('GET /products/:id malformed -> 400', malformed.status === 400, malformed);

  const missing = await request('GET', '/products/64b7f0c2a1b2c3d4e5f60718');
  check('GET /products/:id missing -> 404', missing.status === 404, missing);

  const updated = await request('PUT', `/products/${productId}`, { stock: 99 });
  check('PUT /products/:id -> 200', updated.status === 200 && updated.data?.data?.stock === 99, updated);

  // ---------------------------------------------------------------------
  section('CATEGORIES');
  // ---------------------------------------------------------------------
  const catName = `Home & Living ${Date.now()}`;
  const cat = await request('POST', '/categories', {
    name: catName,
    description: 'Furniture, decor and household items'
  });
  check('POST /categories -> 201', cat.status === 201, cat);
  check(
    'slug auto-generated from name',
    typeof cat.data?.data?.slug === 'string' && cat.data.data.slug.startsWith('home-living-'),
    cat.data?.data
  );
  const categoryId = cat.data?.data?._id;

  const tooShort = await request('POST', '/categories', { name: 'Hi' });
  check('POST /categories name < 3 chars -> 400', tooShort.status === 400, tooShort);

  const empty = await request('POST', '/categories', {});
  check('POST /categories empty name -> 400', empty.status === 400, empty);

  const duplicate = await request('POST', '/categories', { name: catName });
  check('POST /categories duplicate -> 409', duplicate.status === 409, duplicate);

  const catList = await request('GET', '/categories?page=1&limit=5&sort=name&order=asc');
  check('GET /categories -> 200 with pagination', catList.status === 200 && !!catList.data?.pagination, catList);

  const catOne = await request('GET', `/categories/${categoryId}`);
  check('GET /categories/:id -> 200', catOne.status === 200, catOne);

  const catMalformed = await request('GET', '/categories/bad-id');
  check('GET /categories/:id malformed -> 400', catMalformed.status === 400, catMalformed);

  const catMissing = await request('GET', '/categories/64b7f0c2a1b2c3d4e5f60718');
  check('GET /categories/:id missing -> 404', catMissing.status === 404, catMissing);

  // PATCH only description -> slug unchanged
  const patchDesc = await request('PATCH', `/categories/${categoryId}`, {
    description: 'Only the description changed'
  });
  check(
    'PATCH /categories/:id description only -> 200, slug unchanged',
    patchDesc.status === 200 && patchDesc.data?.data?.slug === cat.data?.data?.slug,
    patchDesc.data?.data
  );

  // PATCH name -> slug regenerated
  const newName = `Smart Home ${Date.now()}`;
  const patchName = await request('PATCH', `/categories/${categoryId}`, { name: newName });
  const expectedSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  check(
    'PATCH /categories/:id name change -> slug regenerated',
    patchName.status === 200 && patchName.data?.data?.slug === expectedSlug,
    { got: patchName.data?.data?.slug, expected: expectedSlug }
  );

  const patchInvalid = await request('PATCH', `/categories/${categoryId}`, { name: 'ab' });
  check('PATCH /categories/:id name < 3 chars -> 400', patchInvalid.status === 400, patchInvalid);

  // ---------------------------------------------------------------------
  section('CLEANUP');
  // ---------------------------------------------------------------------
  const delProduct = await request('DELETE', `/products/${productId}`);
  check('DELETE /products/:id -> 200', delProduct.status === 200, delProduct);
  const delProductAgain = await request('DELETE', `/products/${productId}`);
  check('DELETE /products/:id twice -> 404', delProductAgain.status === 404, delProductAgain);

  const delCategory = await request('DELETE', `/categories/${categoryId}`);
  check('DELETE /categories/:id -> 200', delCategory.status === 200, delCategory);
  const delCategoryAgain = await request('DELETE', `/categories/${categoryId}`);
  check('DELETE /categories/:id twice -> 404', delCategoryAgain.status === 404, delCategoryAgain);

  // ---------------------------------------------------------------------
  section('SWAGGER');
  // ---------------------------------------------------------------------
  const docs = await fetch('http://localhost:3000/api-docs/');
  check('GET /api-docs -> 200', docs.status === 200, { status: docs.status });
  const spec = await fetch(`${BASE}/../api-docs/swagger-ui-init.js`);
  check('Swagger UI init script served', spec.status === 200, { status: spec.status });

  console.log(`\n---------------------------------------------`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  console.log(`---------------------------------------------`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
