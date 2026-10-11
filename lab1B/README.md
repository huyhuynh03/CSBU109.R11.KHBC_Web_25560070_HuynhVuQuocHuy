# Lab1B - Homework (2 bo bai)

## 0. Cai dat
```bash
npm install
cp .env.example .env   # (neu co) roi sua thong tin MySQL/Mongo
```

## Bo A

### A1 + A2. SQL Transaction - store_transaction_db
```bash
mysql -u root -p < sql/store_transaction_db.sql
node homework_sql_transaction.js
```
- 5 buoc: check balance >= total AND stock >= quantity -> tru balance -> tru stock -> insert orders -> insert order_items.
- Thanh cong: `conn.commit()`; loi (het tien / het hang): `conn.rollback()`.

### A3. Mongoose Many-to-Many (Student & Course)
```bash
node homework_many_to_many.js
```
- `enrollCourse(studentId, courseId)`: check chua dang ky + availableSlots > 0, them 2 chieu, giam slot 1.
- `dropCourse(studentId, courseId)`: xoa khoi 2 mang, tang slot 1 (max = maxStudents).

### A4. invoices.json -> MongoDB
```bash
node homework_json_to_mongoose.js
```
- Schema Invoice: required invoiceCode/customerName/customerEmail/items/paymentMethod; email regex; items >= 1; paymentMethod enum [CreditCard, Momo, Cash, BankTransfer, ZaloPay].
- Doc invoices.json, validate tung document, insertMany vao collection invoices (invoice_db).

## Bo B

### B1. Library DB (library_db)
```bash
mysql -u root -p < sql/library_db.sql
```
- 3 bang: authors / books (author_id FK) / borrow_records (book_id FK), moi bang >= 3 dong mau.
- Cau JOIN cuoi file: Book Title, Author Name, Borrower Name, Borrow Date.

### B2. Blog MongoDB (blog_db.posts)
```bash
mongosh < mongo/blog_db.js
```
- posts: title, category, views, author{name,email}, tags[], comments[{user,content,created_at}].
- Query 1: category Tech AND views >= 100. Query 2: tags chua 'nodejs'.
- Update: $push comment theo title + $inc views 1. Aggregation: $group theo category -> totalViews, totalPosts.

### B3. Deploy lab1-backend len Render
1. Push project len GitHub (repo ca nhan).
2. Vao https://render.com -> New Web Service -> connect repo.
3. Build Command: `npm install` | Start Command: `node server.js`.
4. Doi deploy xong, copy public URL (vd https://lab1-backend-xyz.onrender.com) vao file Word nop + test GET / va /api/health.

## Checklist file nop
- homework_sql_transaction.js + sql/store_transaction_db.sql
- homework_many_to_many.js
- homework_json_to_mongoose.js + invoices.json
- sql/library_db.sql
- mongo/blog_db.js
- server.js + package.json (+ URL Render + anh minh chung endpoint)
