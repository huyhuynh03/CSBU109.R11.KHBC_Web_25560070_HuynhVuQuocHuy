/**
 * Seed sample data: 4 customers, 5 products, 4 orders, 6 order_items.
 * The order rows are created through the service layer, so the totals and the
 * stock deductions follow exactly the same path as a real POST /api/v1/orders.
 *
 * Usage: npm run seed   (run `npm run init-db` first)
 */
const pool = require('../config/db');
const orderService = require('../services/order.service');

const customers = [
  ['Nguyen Van An', 'an.nguyen@example.com', '0901234567'],
  ['Tran Thi Bich', 'bich.tran@example.com', '0912345678'],
  ['Le Hoang Cuong', 'cuong.le@example.com', '0923456789'],
  ['Pham Minh Dung', 'dung.pham@example.com', '0934567890']
];

const products = [
  ['Laptop Dell XPS 15', 35000000.0, 10],
  ['Sony WH-1000XM5', 7990000.0, 15],
  ['AirPods Pro 2', 5990000.0, 25],
  ['Logitech MX Master 3S', 2490000.0, 30],
  ['Keychron K2 Keyboard', 1890000.0, 0]
];

// [customerIndex, [ [productIndex, quantity], ... ], status]
// Product index 4 (Keychron) is intentionally left at stock 0 - it is the
// "out of stock" fixture, so it is never ordered here.
const orders = [
  [0, [[0, 1], [2, 1]], 'pending'],
  [1, [[1, 2]], 'completed'],
  [2, [[3, 1], [1, 1]], 'cancelled'],
  [0, [[2, 1]], 'completed']
];

(async () => {
  try {
    console.log('Clearing existing data...');
    // Child table first: order_items -> orders -> products -> customers
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['order_items', 'orders', 'products', 'customers']) {
      await pool.query(`TRUNCATE TABLE ${table}`);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const [customerResult] = await pool.query(
      'INSERT INTO customers (full_name, email, phone) VALUES ?',
      [customers]
    );
    console.log(`Inserted ${customerResult.affectedRows} customers`);

    const [productResult] = await pool.query(
      'INSERT INTO products (product_name, price, stock) VALUES ?',
      [products]
    );
    console.log(`Inserted ${productResult.affectedRows} products`);

    // customers and products were inserted in order, so ids are 1..N
    const orderIds = [];
    for (const [customerIndex, lines, status] of orders) {
      const created = await orderService.createOrder({
        customerId: customerIndex + 1,
        items: lines.map(([productIndex, quantity]) => ({
          productId: productIndex + 1,
          quantity
        }))
      });
      if (status !== 'pending') {
        await orderService.updateOrderStatus(created.order_id, status);
      }
      orderIds.push(created.order_id);
    }

    const [[counts]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM orders) AS orders,
              (SELECT COUNT(*) FROM order_items) AS order_items`
    );
    console.log(`Created ${counts.orders} orders with ${counts.order_items} order_items (ids: ${orderIds.join(', ')})`);

    await pool.end();
    console.log('Done.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
