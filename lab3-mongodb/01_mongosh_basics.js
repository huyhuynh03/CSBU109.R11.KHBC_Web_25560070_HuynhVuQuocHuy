// =====================================================================
// Exercise 3 - Part 1: shop_db / orders collection (mongosh script)
// Usage:  mongosh "mongodb://localhost:27017" 01_mongosh_basics.js
//         mongosh "mongodb+srv://<cluster>/" 01_mongosh_basics.js   (Atlas)
// =====================================================================

// 1. Switch to the shop_db database
// `use shop_db;` is a mongosh shell helper. Calling getSiblingDB() does the
// same thing and also works inside an IDE, so this script stays portable.
db = db.getSiblingDB('shop_db');

// Make the script re-runnable: start from a clean orders collection
db.orders.drop();

// 2. Insert 2 order documents into the orders collection (insertMany)
//    Documents embed their line items in the "items" array.
db.orders.insertMany([
  {
    order_code: 'ORD-2026-001',
    customer_name: 'Nguyen Van A',
    customer_email: 'nguyenvana@gmail.com',
    total_amount: 37500000,      // 35,000,000 + 2,500,000
    status: 'completed',
    items: [
      { product_name: 'Laptop Dell XPS 15', quantity: 1, price: 35000000 },
      { product_name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 2500000 }
    ],
    created_at: new Date()
  },
  {
    order_code: 'ORD-2026-002',
    customer_name: 'Tran Thi B',
    customer_email: 'tranthib@gmail.com',
    total_amount: 2200000,       // 2,200,000
    status: 'pending',
    items: [
      { product_name: 'Keychron K2 Mechanical Keyboard', quantity: 1, price: 2200000 }
    ],
    created_at: new Date()
  }
]);

// 3. Query documents (find)
print('--- All orders ---');
db.orders.find({}).pretty();

// 3a. Find orders with status 'completed'
print("--- Orders with status 'completed' ---");
db.orders.find({ status: 'completed' }).pretty();

// 3b. Projection: only the fields we need
print("--- Only order_code / total_amount / status ---");
db.orders.find(
  { status: 'completed' },
  { _id: 0, order_code: 1, total_amount: 1, status: 1 }
).pretty();

// 4. Update an order's status (updateOne)
db.orders.updateOne(
  { order_code: 'ORD-2026-002' },
  { $set: { status: 'processing' } }
);

// Confirm the update
print("--- ORD-2026-002 after update ---");
db.orders.find({ order_code: 'ORD-2026-002' }).pretty();

// 5. Useful extra commands
print('--- Collection stats ---');
printjson(db.orders.stats());
