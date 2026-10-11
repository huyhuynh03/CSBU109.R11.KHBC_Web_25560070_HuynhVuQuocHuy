-- ============================================================
-- Homework 1 (Set A): store_transaction_db
-- 4 tables: customers / products / orders / order_items
-- Chay: mysql -u root -p < sql/store_transaction_db.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS store_transaction_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE store_transaction_db;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- (1) customers (id INT PK, full_name, balance)
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  CHECK (balance >= 0)
);

-- (2) products (id INT PK, product_name, price, stock)
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  CHECK (stock >= 0),
  CHECK (price >= 0)
);

-- (3) orders (id INT PK, customer_id FK, total_amount, created_at)
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- (4) order_items (id INT PK, order_id FK, product_id FK, quantity, price)
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (quantity > 0)
);

-- ---------------- Seed data ----------------
INSERT INTO customers (full_name, balance) VALUES
  ('Nguyen Van An', 50000000.00),
  ('Tran Thi Bich', 10000000.00),
  ('Le Van Cuong', 2000000.00);

INSERT INTO products (product_name, price, stock) VALUES
  ('Laptop Dell XPS 15', 35000000.00, 10),
  ('Logitech MX Master 3S Mouse', 2500000.00, 50),
  ('Keychron K2 Mechanical Keyboard', 1800000.00, 30);
