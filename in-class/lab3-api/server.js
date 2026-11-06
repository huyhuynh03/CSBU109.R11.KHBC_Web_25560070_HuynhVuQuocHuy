// Main server entry point
const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const setupSwagger = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_lab3_db';

app.use(express.json());

// Register API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Swagger UI
setupSwagger(app);

// Global error handler (must be registered AFTER the routes)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  let status = err.status || 500;
  if (err.name === 'ValidationError') status = 400; // schema validation failed
  if (err.name === 'CastError') status = 400; // malformed ObjectId
  if (err.code === 11000) status = 409; // duplicate unique key

  const message =
    err.code === 11000
      ? `Duplicate value for ${
          Object.keys(err.keyPattern || {}).join(', ') || 'a unique field'
        }`
      : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server API is running at: http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = app;
