-- ============================================================
-- Homework 1 (Set B): Design a Library Management Database
-- Database: library_db | 3 tables: authors / books / borrow_records
-- Chay: mysql -u root -p < sql/library_db.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS library_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

DROP TABLE IF EXISTS borrow_records;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS authors;

CREATE TABLE authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_name VARCHAR(150) NOT NULL,
  nationality VARCHAR(100)
);

CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  author_id INT NOT NULL,
  category VARCHAR(100),
  publish_year INT,
  CONSTRAINT fk_books_author FOREIGN KEY (author_id)
    REFERENCES authors(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE borrow_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  book_id INT NOT NULL,
  borrower_name VARCHAR(150) NOT NULL,
  borrow_date DATE NOT NULL,
  return_date DATE,
  CONSTRAINT fk_borrow_book FOREIGN KEY (book_id)
    REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Insert at least 3 sample records into each table
INSERT INTO authors (author_name, nationality) VALUES
  ('Nguyen Nhat Anh', 'Vietnamese'),
  ('J.K. Rowling', 'British'),
  ('Haruki Murakami', 'Japanese');

INSERT INTO books (title, author_id, category, publish_year) VALUES
  ('Mat Biec', 1, 'Fiction', 2019),
  ('Harry Potter and the Sorcerer''s Stone', 2, 'Fantasy', 1997),
  ('Norwegian Wood', 3, 'Novel', 1987);

INSERT INTO borrow_records (book_id, borrower_name, borrow_date, return_date) VALUES
  (1, 'Tran Van Binh', '2026-09-01', '2026-09-15'),
  (2, 'Le Thi Hoa', '2026-09-05', NULL),
  (3, 'Pham Quoc Dat', '2026-09-10', '2026-09-20');

-- SQL JOIN across all 3 tables:
-- Book Title, Author Name, Borrower Name, Borrow Date
SELECT
  b.title AS book_title,
  a.author_name AS author_name,
  br.borrower_name AS borrower_name,
  br.borrow_date AS borrow_date
FROM borrow_records br
JOIN books b ON b.id = br.book_id
JOIN authors a ON a.id = b.author_id
ORDER BY br.borrow_date;
