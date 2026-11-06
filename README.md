# Web Backend Lab 1 - Node.js, MySQL, MongoDB

Student: **Huynh Vu Quoc Huy** - Student ID **25560070** - Class **CSBU109.R11.KHBC**

```
web-backend-lab1/
├── lab1-backend/
│   ├── server.js          # Exercise 1 - Express server (+ /api/greeting endpoint)
│   ├── test-endpoints.js  # Exercise 1 - quick check of every endpoint
│   ├── package.json       # Exercise 1 - npm project (express + dotenv)
│   └── .env.example       # Exercise 1 - environment variables sample
├── lab2-mysql/
│   ├── 01_schema.sql      # Exercise 2 - DDL (database + 4 tables, foreign keys)
│   ├── 02_seed_data.sql   # Exercise 2 - DML (INSERT users/products; Q1 orders/order_items)
│   └── 03_queries.sql     # Exercise 2 - DQL (Q2 filter, Q3 JOIN, Q4 GROUP BY/SUM)
├── lab3-mongodb/
│   ├── 01_mongosh_basics.js    # Exercise 3 - shop_db/orders, insertMany, find, updateOne
│   └── 02_mongosh_extended.js  # Exercise 3 extended - Q1->Q4 (array query, $push/$inc, aggregation)
├── package.json           # Root scripts: npm start, npm run test:api
└── .gitignore             # Ignores node_modules and .env
```

## 0. Setup (run once)

```cmd
cd d:\school_exercise\2_hk1\web\web-backend-lab1\lab1-backend
npm install
copy .env.example .env
```

Connect this folder to the GitHub repository:

```cmd
cd d:\school_exercise\2_hk1\web\web-backend-lab1
git init
git remote add origin https://github.com/huyhuynh03/web-backend-lab1.git
```

If the repository already exists, use `git clone` instead of `git init`:

```cmd
git clone https://github.com/huyhuynh03/web-backend-lab1.git .
```

## 1. Exercise 1 - Node.js + Express (port 5000)

```cmd
cd d:\school_exercise\2_hk1\web\web-backend-lab1\lab1-backend
npm start
```

Open the browser:

- `http://localhost:5000/` -> `{ message: "Welcome to Web Backend & Database Lab 1 API", ... }`
- `http://localhost:5000/api/health` -> `{ status: "OK", uptime: ... }`
- `http://localhost:5000/api/greeting` (extended requirement) -> student information:

```json
{
  "success": true,
  "message": "Hello, this is my information",
  "student": {
    "fullName": "Huynh Vu Quoc Huy",
    "studentId": "25560070",
    "class": "CSBU109.R11.KHBC"
  },
  "timestamp": "2026-09-11T08:51:41.247Z"
}
```

Check every endpoint with the bundled script (run it in another terminal while the server is running):

```cmd
node test-endpoints.js
```

Change the port with an environment variable if 5000 is busy:

```cmd
set PORT=5001 && node server.js
```

## 2. Exercise 2 - MySQL (Workbench) - `ecommerce_db` database

1. Connect to MySQL Workbench and open the files in `lab2-mysql/`.
2. Run them **in this order**: `01_schema.sql` -> `02_seed_data.sql` -> `03_queries.sql`.
3. Table relationships (foreign key constraints):

| Child table      | Foreign key constraint | References    |
|------------------|------------------------|---------------|
| `orders.user_id`       | `fk_orders_user`        | `users(id)`    |
| `order_items.order_id` | `fk_order_items_order`  | `orders(id)`   |
| `order_items.product_id` | `fk_order_items_product` | `products(id)` |

4. Mapping of the extended requirements to the SQL files:

| Requirement | Location |
|-------------|----------|
| Q1 - INSERT 3+ `orders` plus their `order_items` | `02_seed_data.sql` (sections 3-4) |
| Q2 - Products priced 100,000 - 1,000,000 VND, ORDER BY price DESC | `03_queries.sql` (Q2) |
| Q3 - INNER JOIN of 4 tables: Order ID, Customer Name, Product Name, Quantity, Unit Price, Order Status | `03_queries.sql` (Q3; Q3b adds a line total, Q3c filters completed orders) |
| Q4a - Total revenue of completed orders | `03_queries.sql` (Q4a) |
| Q4b - Number of orders per user (GROUP BY user_id) | `03_queries.sql` (Q4b; Q4c and Q4d are extra statistics) |

Sample `orders` data inserted by `02_seed_data.sql`. The file also runs a
consistency check: every `total_amount` must equal `SUM(quantity * price)` of its items.

| id | user_id | total_amount | status    |
|----|---------|--------------|-----------|
| 1  | 1       | 37,500,000   | completed |
| 2  | 2       | 3,490,000    | pending   |
| 3  | 3       | 2,970,000    | completed |
| 4  | 1       | 17,900,000   | cancelled |

## 3. Exercise 3 - MongoDB (Compass / mongosh) - `shop_db` database

Connection string: `mongodb://localhost:27017` (or your own Atlas connection string).

### 3a. Basic part (file `01_mongosh_basics.js`)

```cmd
mongosh "mongodb://localhost:27017" lab3-mongodb\01_mongosh_basics.js
```

Alternatively open MongoDB Compass, connect, open the Mongosh panel at the bottom,
then paste each command block from the file.

The file covers exactly what the task asks for:

1. Switch to the `shop_db` database: `use shop_db;` (inside an IDE use the
   equivalent `db = db.getSiblingDB('shop_db');`),
2. `db.orders.insertMany([...])` inserts orders `ORD-2026-001/002`, each with an
   `items` array of embedded sub-documents,
3. `db.orders.find({ status: "completed" }).pretty()`,
4. `db.orders.updateOne({ order_code: "ORD-2026-002" }, { $set: { status: "processing" } })`.

### 3b. Extended part (file `02_mongosh_extended.js`)

```cmd
mongosh "mongodb://localhost:27017" lab3-mongodb\02_mongosh_extended.js
```

| Requirement | Statement in the file |
|-------------|-----------------------|
| Q1 - Insert `ORD-2026-003` (completed, 3 products in `items`) and `ORD-2026-004` (cancelled) | `insertMany` at the top of the file |
| Q2 - `total_amount >= 5,000,000` AND `status: "completed"` | `find({ total_amount: { $gte: 5000000 }, status: "completed" })` |
| Q2 - Orders containing `"Logitech MX Master 3S Mouse"` in `items` | `find({ "items.product_name": "..." })` (plus an `$elemMatch` variant that projects only the matching element) |
| Q3 - Push `{ product_name: "XL Gaming Mouse Pad", quantity: 1, price: 200000 }` into `ORD-2026-002` and add 200,000 to `total_amount` | `updateOne({ order_code: "ORD-2026-002" }, { $push: ..., $inc: ... })` |
| Q4 - Total revenue of completed orders ($match + $group) | `aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total_revenue: { $sum: "$total_amount" } } }])` |
| Q4 - Number of orders grouped by `status` | `aggregate([{ $group: { _id: "$status", order_count: { $sum: 1 } } }])` |

## 4. Push the lab to GitHub

```cmd
cd d:\school_exercise\2_hk1\web\web-backend-lab1
git add .
git commit -m "Lab 1: Express API + MySQL schema/queries + MongoDB scripts"
git branch -M main
git push -u origin main
```
