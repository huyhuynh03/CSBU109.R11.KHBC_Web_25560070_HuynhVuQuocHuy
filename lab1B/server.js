const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World from lab1-backend!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'lab1-backend' });
});

app.listen(PORT, () => {
  console.log(`lab1-backend listening on port ${PORT}`);
});

module.exports = app;
