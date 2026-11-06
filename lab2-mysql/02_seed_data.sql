-- =====================================================================
-- Exercise 2 - Step 2: DML (Data Manipulation Language) - sample data
-- Run AFTER 01_schema.sql
--
-- Rule used in this file: order_items.price is the unit price at the time
-- of purchase (snapshot of products.price), and orders.total_amount always
-- equals SUM(order_items.quantity * order_items.price).
-- =====================================================================

USE ecommerce_db;

-- ---------- 1. Insert users ----------
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Nguyen Van Admin', 'admin@gmail.com', 'hashed_pwd_123', 'admin'),
  ('Tran Thi User',    'user@gmail.com',  'hashed_pwd_456', 'user'),
  ('Le Quoc Bao',      'bao.le@gmail.com', 'hashed_pwd_789', 'user');

-- ---------- 2. Insert products ----------
INSERT INTO products (title, price, stock, category) VALUES
  ('Laptop Dell XPS 15',          35000000.00, 10, 'Electronics'),
  ('Keychron K2',                  2200000.00, 25, 'Accessories'),
  ('Logitech MX Master 3S Mouse',  2500000.00, 15, 'Accessories'),
  ('XL Gaming Mouse Pad',           200000.00, 100, 'Accessories'),
  ('Logitech G102 LIGHTSYNC',      590000.00, 60, 'Accessories'),
  ('Anker USB-C Hub 7-in-1',       890000.00, 40, 'Accessories'),
  ('Apple Watch Series 9',       12900000.00, 20, 'Wearables');

-- ---------- 3. Extended requirement - Q1: insert sample orders ----------
-- Order 1 (user 1): 35,000,000 + 2,500,000 = 37,500,000
INSERT INTO orders (user_id, total_amount, status) VALUES
  (1, 37500000.00, 'completed'),
  -- Order 2 (user 2): 2,200,000 + 890,000 + 200,000 x 2 = 3,490,000
  (2,  3490000.00, 'pending'),
  -- Order 3 (user 3): 590,000 + 200,000 x 3 + 890,000 x 2 = 2,970,000
  (3,  2970000.00, 'completed'),
  -- Order 4 (user 1): 2,500,000 x 2 + 12,900,000 = 17,900,000
  (1, 17900000.00, 'cancelled');

-- ---------- 4. Extended requirement - Q1: insert the matching order items ----------
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  -- Order 1
  (1, 1, 1, 35000000.00),
  (1, 3, 1,  2500000.00),
  -- Order 2
  (2, 2, 1,  2200000.00),
  (2, 6, 1,   890000.00),
  (2, 4, 2,   200000.00),
  -- Order 3
  (3, 5, 1,   590000.00),
  (3, 4, 3,   200000.00),
  (3, 6, 2,   890000.00),
  -- Order 4
  (4, 3, 2,  2500000.00),
  (4, 7, 1, 12900000.00);

-- ---------- 5. Verify the inserted data ----------
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM orders;
SELECT * FROM order_items;

-- Data integrity check: orders.total_amount must match the sum of its items
SELECT o.id                AS order_id,
       o.total_amount,
       SUM(i.quantity * i.price) AS items_total
FROM orders o
JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.total_amount
HAVING o.total_amount <> SUM(i.quantity * i.price);
-- Expected result: 0 rows (all orders are consistent)
