const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// CORS: allow the Web UI on another origin (e.g. Live Server on port 5500)
app.use(cors({
  origin: '*', // in production, list the exact origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simulated in-memory database
let products = [
  { id: 1, name: 'Laptop Dell XPS 15', price: 35000000, category: 'Electronics' },
  { id: 2, name: 'Logitech MX Master 3S Mouse', price: 2400000, category: 'Accessories' }
];

// Returns an error message, or null when the body is valid
function validateProduct(body) {
  const { name, price } = body;
  if (!name || !String(name).trim() || price === undefined || price === null || price === '') {
    return 'Product name and price are required!';
  }
  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    return 'Price must be a non-negative number!';
  }
  return null;
}

// GET - list all products, optionally filtered: /api/v1/products?category=Electronics
app.get('/api/v1/products', (req, res) => {
  const { category } = req.query;
  const data = category ? products.filter(p => p.category === category) : products;
  res.json({ success: true, count: data.length, data });
});

// POST - create a product
app.post('/api/v1/products', (req, res) => {
  const body = req.body || {};
  const error = validateProduct(body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  const newProduct = {
    id: Date.now(),
    name: body.name.trim(),
    price: Number(body.price),
    category: body.category ? String(body.category).trim() : 'General'
  };
  products.push(newProduct);
  res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

// PUT - update a product by id
app.put('/api/v1/products/:id', (req, res) => {
  const body = req.body || {};
  const error = validateProduct(body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  const id = Number(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `Product ID ${id} not found` });
  }
  products[index] = {
    ...products[index],
    name: body.name.trim(),
    price: Number(body.price),
    category: body.category ? String(body.category).trim() : products[index].category
  };
  res.json({ success: true, message: 'Product updated successfully', data: products[index] });
});

// DELETE - remove a product by id
app.delete('/api/v1/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const exists = products.some(p => p.id === productId);
  if (!exists) {
    return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
  }
  products = products.filter(p => p.id !== productId);
  res.json({ success: true, message: `Deleted product ID ${productId}` });
});

app.listen(PORT, () => {
  console.log(`Backend API running at: http://localhost:${PORT}`);
});
