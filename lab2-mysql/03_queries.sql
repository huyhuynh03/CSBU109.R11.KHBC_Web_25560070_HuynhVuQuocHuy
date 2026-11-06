-- =====================================================================
-- Exercise 2 - Step 3: DQL queries (extended requirement)
-- Run AFTER 01_schema.sql and 02_seed_data.sql
-- =====================================================================

USE ecommerce_db;

-- =====================================================================
-- Q1 (Insert sample data)
-- Already executed in 02_seed_data.sql. Re-usable version below so this
-- file can be run on its own. Wrap it in a transaction, then ROLLBACK,
-- or delete the inserted rows afterwards, to avoid duplicates.
-- =====================================================================
-- START TRANSACTION;

-- INSERT INTO orders (user_id, total_amount, status) VALUES
--   (1,  8850000.00, 'completed'),   -- 2,500,000 x 3 + 1,350,000
--   (2,  6280000.00, 'pending'),     -- 2,200,000 x 2 + 890,000
--   (3, 10900000.00, 'completed');   -- 10,900,000

-- INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
--   (5, 3, 3,  2500000.00),
--   (5, 2, 1,  1350000.00),
--   (6, 2, 2,  2200000.00),
--   (6, 6, 2,   890000.00),
--   (7, 7, 1, 10900000.00);

-- ROLLBACK;

-- =====================================================================
-- Q2 (Filter & search products)
-- Products priced between 100,000 VND and 1,000,000 VND,
-- sorted by price from highest to lowest.
-- =====================================================================
SELECT id,
       title,
       price,
       stock,
       category
FROM products
WHERE price BETWEEN 100000.00 AND 1000000.00
ORDER BY price DESC;

-- =====================================================================
-- Q3 (Table joins) - detailed order report
-- Order ID | Customer Name | Product Name | Quantity | Unit Price | Order Status
-- =====================================================================
SELECT o.id           AS order_id,
       u.full_name    AS customer_name,
       p.title        AS product_name,
       i.quantity     AS quantity,
       i.price        AS unit_price,
       o.status       AS order_status
FROM orders o
INNER JOIN users u       ON u.id = o.user_id
INNER JOIN order_items i ON i.order_id = o.id
INNER JOIN products p    ON p.id = i.product_id
ORDER BY o.id, p.title;

-- Q3b - Report with the line total added (SUM + GROUP BY, still an INNER JOIN)
SELECT o.id                    AS order_id,
       u.full_name             AS customer_name,
       p.title                 AS product_name,
       i.quantity              AS quantity,
       i.price                 AS unit_price,
       i.quantity * i.price    AS line_total,
       o.status                AS order_status
FROM orders o
INNER JOIN users u       ON u.id = o.user_id
INNER JOIN order_items i ON i.order_id = o.id
INNER JOIN products p    ON p.id = i.product_id
ORDER BY o.id, p.title;

-- Q3c - Only the completed orders (add a WHERE filter to the join)
SELECT o.id        AS order_id,
       u.full_name AS customer_name,
       p.title     AS product_name,
       i.quantity  AS quantity,
       i.price     AS unit_price,
       o.status    AS order_status
FROM orders o
INNER JOIN users u       ON u.id = o.user_id
INNER JOIN order_items i ON i.order_id = o.id
INNER JOIN products p    ON p.id = i.product_id
WHERE o.status = 'completed'
ORDER BY o.id, p.title;

-- =====================================================================
-- Q4 (Revenue statistics - GROUP BY & aggregate)
-- =====================================================================

-- Q4a - Total revenue from all completed orders (status = 'completed')
SELECT SUM(total_amount)               AS total_revenue,
       COUNT(*)                        AS completed_order_count
FROM orders
WHERE status = 'completed';

-- Q4b - Number of orders placed by each user (GROUP BY user_id)
SELECT o.user_id,
       u.full_name,
       COUNT(o.id)    AS order_count,
       SUM(o.total_amount) AS total_spent
FROM orders o
INNER JOIN users u ON u.id = o.user_id
GROUP BY o.user_id, u.full_name
ORDER BY o.user_id;

-- Q4c - Revenue grouped by order status
SELECT status,
       COUNT(*)             AS order_count,
       SUM(total_amount)    AS total_amount
FROM orders
GROUP BY status
ORDER BY total_amount DESC;

-- Q4d - Best selling products (quantity sold, per product)
SELECT p.id,
       p.title,
       SUM(i.quantity)              AS sold_quantity,
       SUM(i.quantity * i.price)    AS revenue
FROM order_items i
INNER JOIN products p ON p.id = i.product_id
INNER JOIN orders o   ON o.id = i.order_id
WHERE o.status = 'completed'
GROUP BY p.id, p.title
ORDER BY sold_quantity DESC, revenue DESC;
