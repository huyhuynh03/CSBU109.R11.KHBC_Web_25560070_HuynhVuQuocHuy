/**
 * End-to-end smoke test for the Orders API.
 * Requires MySQL + data seeded, and the server running:
 *   npm run init-db && npm run seed
 *   npm start          (in another terminal)
 *   npm test
 */
const BASE = process.env.BASE || 'http://localhost:3000/api/v1';
const HEALTH = process.env.HEALTH || 'http://localhost:3000/health';

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
  // Seeded fixtures: 4 customers, 5 products (product 5 has stock 0), 4 orders.
  const CUSTOMER_ID = 1;
  const PRODUCT_A = 1; // Laptop Dell XPS 15, price 35000000, stock 10
  const PRODUCT_D = 4; // Logitech MX Master 3S, price 2490000, stock 30
  const PRODUCT_OUT_OF_STOCK = 5; // Keychron K2, stock 0

  // ---------------------------------------------------------------------
  section('HEALTH');
  // ---------------------------------------------------------------------
  const health = await fetch(HEALTH).then((r) => r.json()).catch(() => null);
  check('GET /health -> database reachable', health?.success === true, health);

  // ---------------------------------------------------------------------
  section('POST /orders');
  // ---------------------------------------------------------------------
  const created = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [
      { productId: PRODUCT_A, quantity: 1 },
      { productId: PRODUCT_D, quantity: 2 }
    ]
  });
  check('POST /orders -> 201', created.status === 201, created);
  const orderId = created.data?.data?.order_id;
  // 1 x 35,000,000 + 2 x 2,490,000 = 39,980,000 (prices come from the DB)
  check(
    'total_amount computed from DB prices',
    created.data?.data?.total_amount === 39980000,
    created.data?.data
  );
  check('status defaults to pending', created.data?.data?.status === 'pending', created.data?.data);

  const emptyItems = await request('POST', '/orders', { customerId: CUSTOMER_ID, items: [] });
  check('POST /orders empty items -> 400', emptyItems.status === 400, emptyItems);

  const missingItems = await request('POST', '/orders', { customerId: CUSTOMER_ID });
  check('POST /orders missing items -> 400', missingItems.status === 400, missingItems);

  const zeroQty = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [{ productId: PRODUCT_A, quantity: 0 }]
  });
  check('POST /orders quantity 0 -> 400', zeroQty.status === 400, zeroQty);

  const negativeQty = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [{ productId: PRODUCT_A, quantity: -3 }]
  });
  check('POST /orders negative quantity -> 400', negativeQty.status === 400, negativeQty);

  const unknownCustomer = await request('POST', '/orders', {
    customerId: 9999,
    items: [{ productId: PRODUCT_A, quantity: 1 }]
  });
  check('POST /orders unknown customer -> 404', unknownCustomer.status === 404, unknownCustomer);

  const unknownProduct = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [{ productId: 8888, quantity: 1 }]
  });
  check('POST /orders unknown product -> 404', unknownProduct.status === 404, unknownProduct);

  const outOfStock = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [{ productId: PRODUCT_OUT_OF_STOCK, quantity: 1 }]
  });
  check('POST /orders out of stock -> 400', outOfStock.status === 400, outOfStock);

  // Rollback proof: the request below asks for a valid line plus an impossible
  // one, so the whole transaction must be undone - the valid line's stock must
  // stay untouched and no order row may be left behind.
  const ordersBefore = (await request('GET', '/orders?page=1&limit=1')).data?.pagination?.totalOrders;
  const stockBefore = await getStock(PRODUCT_D);
  const partial = await request('POST', '/orders', {
    customerId: CUSTOMER_ID,
    items: [
      { productId: PRODUCT_D, quantity: 1 },
      { productId: PRODUCT_OUT_OF_STOCK, quantity: 1 }
    ]
  });
  const ordersAfter = (await request('GET', '/orders?page=1&limit=1')).data?.pagination?.totalOrders;
  check('POST /orders mixed valid+invalid -> 400', partial.status === 400, partial);
  check('rollback kept stock unchanged', (await getStock(PRODUCT_D)) === stockBefore, {
    stockBefore,
    stockAfter: await getStock(PRODUCT_D)
  });
  check('rollback created no order row', ordersAfter === ordersBefore, {
    ordersBefore,
    ordersAfter
  });

  // ---------------------------------------------------------------------
  section('GET /orders');
  // ---------------------------------------------------------------------
  const list = await request('GET', '/orders?page=1&limit=5');
  check('GET /orders -> 200 with pagination', list.status === 200 && !!list.data?.pagination, list);
  check('GET /orders rows expose customer_name + total_items_count',
    typeof list.data?.data?.[0]?.customer_name === 'string' &&
      typeof list.data?.data?.[0]?.total_items_count === 'number',
    list.data?.data?.[0]
  );

  const filtered = await request('GET', '/orders?status=pending&customerId=1&page=1&limit=5');
  check('GET /orders filtered by status+customerId -> 200', filtered.status === 200, filtered);
  check('GET /orders filter only returns matching rows',
    Array.isArray(filtered.data?.data) &&
      filtered.data.data.every((row) => row.status === 'pending'),
    filtered.data?.data
  );

  const badStatus = await request('GET', '/orders?status=refunded');
  check('GET /orders unknown status -> 400', badStatus.status === 400, badStatus);

  // ---------------------------------------------------------------------
  section('GET /orders/:id');
  // ---------------------------------------------------------------------
  const detail = await request('GET', `/orders/${orderId}`);
  check('GET /orders/:id -> 200', detail.status === 200, detail);
  check('GET /orders/:id returns nested items',
    Array.isArray(detail.data?.data?.items) &&
      detail.data.data.items.length === 2 &&
      typeof detail.data.data.items[0].subtotal === 'number',
    detail.data?.data
  );
  check('GET /orders/:id includes customer info',
    typeof detail.data?.data?.customer?.email === 'string',
    detail.data?.data?.customer
  );

  const missingOrder = await request('GET', '/orders/999999');
  check('GET /orders/:id missing -> 404', missingOrder.status === 404, missingOrder);

  const badId = await request('GET', '/orders/not-a-number');
  check('GET /orders/:id non-numeric -> 400', badId.status === 400, badId);

  // ---------------------------------------------------------------------
  section('PATCH /orders/:id/status');
  // ---------------------------------------------------------------------
  const stockBeforeCancel = await getStock(PRODUCT_D);
  const cancelled = await request('PATCH', `/orders/${orderId}/status`, { status: 'cancelled' });
  check('PATCH status -> cancelled : 200', cancelled.status === 200, cancelled);
  check('cancel restored the stock', (await getStock(PRODUCT_D)) === stockBeforeCancel + 2, {
    stockBeforeCancel,
    stockAfter: await getStock(PRODUCT_D)
  });

  const cancelAgain = await request('PATCH', `/orders/${orderId}/status`, { status: 'cancelled' });
  check('PATCH on already cancelled order -> 400', cancelAgain.status === 400, cancelAgain);

  const completeAgain = await request('PATCH', `/orders/${orderId}/status`, { status: 'pending' });
  check('PATCH cancelled -> pending -> 400', completeAgain.status === 400, completeAgain);

  const badEnum = await request('PATCH', `/orders/${orderId}/status`, { status: 'shipped' });
  check('PATCH status outside ENUM -> 400', badEnum.status === 400, badEnum);

  const missingBody = await request('PATCH', `/orders/${orderId}/status`, {});
  check('PATCH without status -> 400', missingBody.status === 400, missingBody);

  const patchMissing = await request('PATCH', '/orders/999999/status', { status: 'cancelled' });
  check('PATCH unknown order -> 404', patchMissing.status === 404, patchMissing);

  // A pending order moved to completed must not touch the stock.
  const pendingOrder = await request('POST', '/orders', {
    customerId: 2,
    items: [{ productId: PRODUCT_D, quantity: 1 }]
  });
  const pendingId = pendingOrder.data?.data?.order_id;
  const stockBeforeComplete = await getStock(PRODUCT_D);
  const completed = await request('PATCH', `/orders/${pendingId}/status`, { status: 'completed' });
  check('PATCH pending -> completed : 200', completed.status === 200, completed);
  check('completing an order does not change the stock',
    (await getStock(PRODUCT_D)) === stockBeforeComplete,
    { stockBeforeComplete, stockAfter: await getStock(PRODUCT_D) }
  );

  // ---------------------------------------------------------------------
  section('DELETE /orders/:id');
  // ---------------------------------------------------------------------
  const stockBeforeDelete = await getStock(PRODUCT_D);
  const deletedPending = await request('DELETE', `/orders/${pendingId}`);
  check('DELETE a non-cancelled order -> 200', deletedPending.status === 200, deletedPending);
  check('DELETE restored the stock', (await getStock(PRODUCT_D)) === stockBeforeDelete + 1, {
    stockBeforeDelete,
    stockAfter: await getStock(PRODUCT_D)
  });
  check('DELETE removed the order', (await request('GET', `/orders/${pendingId}`)).status === 404);

  const stockBeforeDeleteCancelled = await getStock(PRODUCT_A);
  const deletedCancelled = await request('DELETE', `/orders/${orderId}`);
  check('DELETE an already cancelled order -> 200', deletedCancelled.status === 200, deletedCancelled);
  check('DELETE of a cancelled order does NOT restore stock again',
    (await getStock(PRODUCT_A)) === stockBeforeDeleteCancelled,
    { stockBeforeDeleteCancelled, stockAfter: await getStock(PRODUCT_A) }
  );

  const deleteMissing = await request('DELETE', '/orders/999999');
  check('DELETE unknown order -> 404', deleteMissing.status === 404, deleteMissing);

  // ---------------------------------------------------------------------
  section('GET /orders/analytics/sales-summary');
  // ---------------------------------------------------------------------
  const summary = await request('GET', '/orders/analytics/sales-summary');
  check('GET sales-summary -> 200', summary.status === 200, summary);
  check('sales-summary has the 4 required fields',
    typeof summary.data?.data?.totalRevenue === 'number' &&
      typeof summary.data?.data?.completedOrdersCount === 'number' &&
      typeof summary.data?.data?.averageOrderValue === 'number' &&
      Array.isArray(summary.data?.data?.topSellingProducts),
    summary.data?.data
  );
  check('topSellingProducts holds at most 3 products',
    summary.data?.data?.topSellingProducts.length <= 3,
    summary.data?.data?.topSellingProducts
  );

  // ---------------------------------------------------------------------
  section('GET /customers/:id/order-history');
  // ---------------------------------------------------------------------
  const history = await request('GET', '/customers/1/order-history');
  check('GET order-history -> 200', history.status === 200, history);
  check('order-history includes orders + totalLifetimeSpent',
    Array.isArray(history.data?.data?.orders) &&
      typeof history.data?.data?.totalLifetimeSpent === 'number',
    history.data?.data
  );

  const historyMissing = await request('GET', '/customers/999999/order-history');
  check('GET order-history unknown customer -> 404', historyMissing.status === 404, historyMissing);

  // ---------------------------------------------------------------------
  section('CONCURRENCY - last unit cannot be sold twice');
  // ---------------------------------------------------------------------
  // Product 3 (AirPods) is drained down to exactly 1 unit, then two orders try
  // to buy it simultaneously: the row lock must let exactly one of them win.
  const drained = await drainStockTo(3, 1);
  check('stock drained to exactly 1 unit', drained === 1, { stock: drained });

  const [raceA, raceB] = await Promise.all([
    request('POST', '/orders', { customerId: 1, items: [{ productId: 3, quantity: 1 }] }),
    request('POST', '/orders', { customerId: 2, items: [{ productId: 3, quantity: 1 }] })
  ]);
  const winners = [raceA, raceB].filter((r) => r.status === 201).length;
  const losers = [raceA, raceB].filter((r) => r.status === 400).length;
  check('exactly one concurrent order succeeded', winners === 1 && losers === 1, {
    a: raceA.status,
    b: raceB.status
  });
  check('stock never goes negative', (await getStock(3)) === 0, { stock: await getStock(3) });

  // ---------------------------------------------------------------------
  console.log(`\n---------------------------------------------`);
  console.log(`RESULT: ${passed} passed / ${failed} failed`);
  console.log(`---------------------------------------------`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error('\nSmoke test crashed:', error.message);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Helpers: the API exposes no product endpoint, so stock is read through the
// same service module the server uses (shared MySQL pool, same DB).
// ---------------------------------------------------------------------------
async function getStock(productId) {
  const pool = require('../config/db');
  const [[row]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
  return row ? row.stock : null;
}

async function drainStockTo(productId, targetStock) {
  const pool = require('../config/db');
  const [[row]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
  if (!row) return null;
  const excess = row.stock - targetStock;
  if (excess <= 0) return row.stock;
  await pool.query('UPDATE products SET stock = stock - ? WHERE id = ?', [excess, productId]);
  const [[updated]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
  return updated.stock;
}
