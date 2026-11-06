/**
 * Homework 1 (Set A): Managing Order Transactions with SQL Transaction Integrity
 * Database: store_transaction_db (tao san bang sql/store_transaction_db.sql)
 * Workflow 5 buoc trong 1 transaction:
 *  Step 1: Kiem tra balance >= total AND stock >= quantity
 *  Step 2: UPDATE customers SET balance = balance - total
 *  Step 3: UPDATE products SET stock = stock - quantity
 *  Step 4: INSERT INTO orders
 *  Step 5: INSERT INTO order_items
 * Thanh cong -> conn.commit() | Loi -> conn.rollback()
 *
 * Cach chay:
 *   1. Tao DB: mysql -u root -p < sql/store_transaction_db.sql
 *   2. Sua thong tin ket noi trong .env neu can
 *   3. npm install && node homework_sql_transaction.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_transaction_db',
};

// Vi du 1 don hang: customer #1 mua 1 Laptop (product #1) + 1 Mouse (product #2)
const demoOrder = {
  customerId: 1,
  items: [
    { productId: 1, quantity: 1 },
    { productId: 2, quantity: 1 },
  ],
};

async function createOrderTransaction(conn, { customerId, items }) {
  // Mo transaction
  await conn.beginTransaction();
  try {
    // ---- Step 1: Doc khoa dong customer + product (FOR UPDATE) de tranh race-condition ----
    const [[customer]] = await conn.query(
      'SELECT id, full_name, balance FROM customers WHERE id = ? FOR UPDATE',
      [customerId]
    );
    if (!customer) throw new Error(`Customer #${customerId} not found`);

    let total = 0;
    const lines = [];
    for (const { productId, quantity } of items) {
      const [[product]] = await conn.query(
        'SELECT id, product_name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      if (!product) throw new Error(`Product #${productId} not found`);
      if (product.stock < quantity) {
        throw new Error(
          `Out of stock: "${product.product_name}" (stock=${product.stock}, need=${quantity})`
        );
      }
      total += Number(product.price) * quantity;
      lines.push({ product, quantity, price: Number(product.price) });
    }

    // Kiem tra balance >= total
    if (Number(customer.balance) < total) {
      throw new Error(
        `Insufficient balance: ${customer.full_name} has ${customer.balance}, need ${total}`
      );
    }

    // ---- Step 2: Tru balance ----
    await conn.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [
      total,
      customerId,
    ]);

    // ---- Step 3: Tru stock tung product ----
    for (const { product, quantity } of lines) {
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        quantity,
        product.id,
      ]);
    }

    // ---- Step 4: Insert orders ----
    const [orderRes] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount, created_at) VALUES (?, ?, NOW())',
      [customerId, total]
    );
    const orderId = orderRes.insertId;

    // ---- Step 5: Insert order_items ----
    for (const { product, quantity, price } of lines) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, product.id, quantity, price]
      );
    }

    // Tat ca thanh cong -> commit
    await conn.commit();
    console.log(`COMMIT OK: order #${orderId} | customer #${customerId} | total=${total}`);
    return { orderId, total };
  } catch (err) {
    // Bat cu loi nao -> rollback
    await conn.rollback();
    console.error('ROLLBACK:', err.message);
    throw err;
  }
}

async function main() {
  const conn = await mysql.createConnection(dbConfig);
  try {
    await createOrderTransaction(conn, demoOrder);
  } catch (e) {
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

module.exports = { createOrderTransaction };

if (require.main === module) main();
