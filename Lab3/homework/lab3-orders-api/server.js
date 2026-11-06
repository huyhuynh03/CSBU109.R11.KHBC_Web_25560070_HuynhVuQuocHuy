// Main server entry point
const express = require('express');
const pool = require('./config/db');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const setupSwagger = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Register API routes (versioned prefix as required by the assignment)
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);

// Swagger UI
setupSwagger(app, PORT);

// Health check - also verifies that the MySQL pool can reach the database
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ success: true, message: 'API and database are healthy' });
  } catch (error) {
    res.status(503).json({ success: false, error: `Database unavailable: ${error.message}` });
  }
});

// 404 for anything the routers did not match
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler (must be registered AFTER the routes)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  // mysql2 error codes use SQLSTATE, not HTTP status: map the common ones so a
  // broken connection does not leak as a 500 with a raw driver message.
  let status = err.status || 500;
  if (err.code === 'ER_DUP_ENTRY') status = 409;
  if (err.code === 'ER_NO_REFERENCED_ROW_2') status = 400;
  if (err.code === 'ER_DATA_TOO_LONG') status = 400;
  if (err.code === 'ECONNREFUSED') status = 503;

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {})
  });
});

// Fail fast: a wrong DB_NAME would otherwise only surface on the first request.
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`MySQL connected: ${process.env.DB_NAME || 'ecommerce_order_db'}`);
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.error('Hint: run "npm run init-db" first and check the DB_* environment variables.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server API is running at: http://localhost:${PORT}`);
    console.log(`Orders API: http://localhost:${PORT}/api/v1/orders`);
  });
})();

module.exports = app;
