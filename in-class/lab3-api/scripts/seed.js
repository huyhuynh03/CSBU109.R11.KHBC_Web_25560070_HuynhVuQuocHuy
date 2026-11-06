/**
 * Seed sample data (products + categories).
 * Usage: node scripts/seed.js
 */
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_lab3_db';

const products = [
  {
    name: 'Laptop Dell XPS 15',
    category: 'Electronics',
    price: 35000000,
    stock: 10,
    description: 'Laptop gaming'
  },
  {
    name: 'MacBook Air M3',
    category: 'Electronics',
    price: 27900000,
    stock: 8,
    description: 'Thin and light laptop'
  },
  {
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    price: 7990000,
    stock: 15,
    description: 'Noise cancelling headphones'
  },
  {
    name: 'AirPods Pro 2',
    category: 'Audio',
    price: 5990000,
    stock: 25,
    description: 'True wireless earbuds'
  },
  {
    name: 'Logitech MX Master 3S',
    category: 'Accessories',
    price: 2490000,
    stock: 30,
    description: 'Wireless ergonomic mouse'
  },
  {
    name: 'Keychron K2 Keyboard',
    category: 'Accessories',
    price: 1890000,
    stock: 0,
    description: '75% mechanical keyboard'
  }
];

const categories = [
  { name: 'Home & Living', description: 'Furniture, decor and household items' },
  { name: 'Electronics', description: 'Computers, phones and gadgets' },
  { name: 'Audio', description: 'Headphones, speakers and Hi-Fi gear' },
  { name: 'Accessories', description: 'Peripherals and everyday carry' }
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);

    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing products and categories');

    const createdProducts = await Product.insertMany(products);
    console.log(`Inserted ${createdProducts.length} products`);

    // create() (not insertMany) so the pre('validate') slug hook fires
    const createdCategories = [];
    for (const c of categories) {
      createdCategories.push(await Category.create(c));
    }
    console.log(`Inserted ${createdCategories.length} categories:`);
    createdCategories.forEach((c) => console.log(`  - ${c.name} -> ${c.slug}`));

    await mongoose.connection.close();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
})();
