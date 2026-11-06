// server.js - Simple Express Server
require('dotenv').config();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

// Student information - used by the /api/greeting extended endpoint
const STUDENT = {
  fullName: 'Huynh Vu Quoc Huy',
  studentId: '25560070',
  class: 'CSBU109.R11.KHBC',
};

// Middleware to read JSON data
app.use(express.json());

// Health-check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Web Backend & Database Lab 1 API',
    status: 'Success',
    timestamp: new Date(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Extended requirement: return the student's personal information as JSON
app.get('/api/greeting', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hello, this is my information',
    student: {
      fullName: STUDENT.fullName,
      studentId: STUDENT.studentId,
      class: STUDENT.class,
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[ERROR] Port ${PORT} is already in use. Please choose a different port or close the application currently using it.`
    );
  } else {
    console.error(`[ERROR] Failed to start server:`, err.message);
  }
  process.exit(1);
});
