-- =====================================================================
-- Exercise 2 - Step 1: DDL (Data Definition Language)
-- Database: ecommerce_db
-- Run this whole script in MySQL Workbench.
-- Note: CHECK constraints require MySQL 8.0.16 or newer.
-- =====================================================================

-- ---------- 1. Create the database ----------
CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- Drop the tables in reverse dependency order so the script can be re-run.
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ---------- 2. Create the users table ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,          -- UNIQUE constraint
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'user') DEFAULT 'user',  -- ENUM constraint
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ---------- 3. Create the products table ----------
CREATE TABLE IF NOT EXISTS products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(150) NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,
  stock      INT DEFAULT 0,
  category   VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_products_stock CHECK (stock >= 0)
) ENGINE = InnoDB;

-- ---------- 4. Extended requirement: orders table ----------
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status       ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Foreign key -> users(id)
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_orders_total_amount CHECK (total_amount >= 0),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status)
) ENGINE = InnoDB;

-- ---------- 5. Extended requirement: order_items table ----------
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,   -- unit price at the time of purchase
  -- Foreign key -> orders(id)
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  -- Foreign key -> products(id)
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),   -- must be > 0
  CONSTRAINT chk_order_items_price CHECK (price >= 0),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE = InnoDB;

-- ---------- 6. Show the created schema ----------
SHOW TABLES;
DESCRIBE users;
DESCRIBE products;
DESCRIBE orders;
DESCRIBE order_items;
