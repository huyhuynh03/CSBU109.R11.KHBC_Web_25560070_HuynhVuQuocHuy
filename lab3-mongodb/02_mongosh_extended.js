// =====================================================================
// Exercise 3 - Extended requirement: array queries and aggregation
// Usage:  mongosh "mongodb://localhost:27017" 02_mongosh_extended.js
// Run AFTER 01_mongosh_basics.js
// =====================================================================

// `use shop_db;` is a mongosh shell helper. This script also runs in an IDE
// (where the helper does not exist), so we call the same API directly and
// keep the shell helper for mongosh usage.
db = db.getSiblingDB('shop_db');

// =====================================================================
// Q1 (Insert varied data)
//   - ORD-2026-003: status 'completed', 3 products in the items array
//   - ORD-2026-004: status 'cancelled'
// =====================================================================
db.orders.insertMany([
  {
    order_code: 'ORD-2026-003',
    customer_name: 'Le Quoc C',
    customer_email: 'lequocc@gmail.com',
    total_amount: 15800000,   // 12,900,000 + 2,500,000 + 200,000 x 2
    status: 'completed',
    items: [
      { product_name: 'Apple Watch Series 9', quantity: 1, price: 12900000 },
      { product_name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 2500000 },
      { product_name: 'XL Gaming Mouse Pad', quantity: 2, price: 200000 }
    ],
    created_at: new Date()
  },
  {
    order_code: 'ORD-2026-004',
    customer_name: 'Pham Thi D',
    customer_email: 'phamthid@gmail.com',
    total_amount: 2580000,    // 1,990,000 + 590,000
    status: 'cancelled',
    items: [
      { product_name: 'Samsung Galaxy Buds', quantity: 1, price: 1990000 },
      { product_name: 'Logitech G102 LIGHTSYNC', quantity: 1, price: 590000 }
    ],
    created_at: new Date()
  }
]);

print('--- Orders after Q1 ---');
db.orders.find({}, { _id: 0, order_code: 1, status: 1, total_amount: 1 }).sort({ order_code: 1 }).pretty();

// =====================================================================
// Q2 (Conditional & nested-document queries)
// =====================================================================

// Q2a - total_amount >= 5,000,000 VND AND status = 'completed'
print("--- Q2a: total_amount >= 5000000 AND status 'completed' ---");
db.orders.find({
  total_amount: { $gte: 5000000 },
  status: 'completed'
}).pretty();

// Q2b - all orders that include 'Logitech MX Master 3S Mouse' in items
print("--- Q2b: orders containing 'Logitech MX Master 3S Mouse' ---");
db.orders.find({
  'items.product_name': 'Logitech MX Master 3S Mouse'
}).pretty();

// Q2b-1 - same query, but return only the matching element of the array
print("--- Q2b-1: only the matching item of the items array ---");
db.orders.find(
  { 'items.product_name': 'Logitech MX Master 3S Mouse' },
  { _id: 0, order_code: 1, items: { $elemMatch: { product_name: 'Logitech MX Master 3S Mouse' } } }
).pretty();

// Q2c - extra: array element with more than one condition ($elemMatch)
//       orders that bought at least 2 of 'Apple Watch Series 9'
print("--- Q2c: orders with quantity >= 2 of 'Apple Watch Series 9' ---");
db.orders.find({
  items: { $elemMatch: { product_name: 'Apple Watch Series 9', quantity: { $gte: 2 } } }
}).pretty();

// =====================================================================
// Q3 (Array update) - $push a new product, $inc the total amount
// =====================================================================
db.orders.updateOne(
  { order_code: 'ORD-2026-002' },
  {
    $push: {
      // $each adds several documents, $position inserts at an index (-1 = last)
      items: {
        $each: [
          { product_name: 'XL Gaming Mouse Pad', quantity: 1, price: 200000 }
        ],
        $position: -1
      }
    },
    $inc: { total_amount: 200000 }   // 2,200,000 + 200,000 = 2,400,000
  }
);

print('--- ORD-2026-002 after $push / $inc ---');
db.orders.find({ order_code: 'ORD-2026-002' }).pretty();

// =====================================================================
// Q4 (Aggregation framework statistics)
// =====================================================================

// Q4a - Total revenue from all completed orders
print('--- Q4a: total revenue of completed orders ---');
db.orders.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
      _id: null,
      total_revenue: { $sum: '$total_amount' },
      completed_orders: { $sum: 1 },
      avg_order_value: { $avg: '$total_amount' }
  } }
]).pretty();

// Q4b - Number of orders grouped by status
print('--- Q4b: number of orders by status ---');
db.orders.aggregate([
  { $group: {
      _id: '$status',
      order_count: { $sum: 1 },
      total_amount: { $sum: '$total_amount' }
  } },
  { $sort: { order_count: -1 } }
]).pretty();

// Q4c - extra: revenue per customer
print('--- Q4c: revenue per customer ---');
db.orders.aggregate([
  { $group: {
      _id: { name: '$customer_name', email: '$customer_email' },
      order_count: { $sum: 1 },
      total_spent: { $sum: '$total_amount' }
  } },
  { $sort: { total_spent: -1 } }
]).pretty();

// Q4d - extra: unwind the items array, then aggregate revenue per product
print('--- Q4d: revenue per product (unwind + group) ---');
db.orders.aggregate([
  { $match: { status: 'completed' } },
  { $unwind: '$items' },
  { $group: {
      _id: '$items.product_name',
      sold_quantity: { $sum: '$items.quantity' },
      revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
  } },
  { $sort: { revenue: -1 } }
]).pretty();
