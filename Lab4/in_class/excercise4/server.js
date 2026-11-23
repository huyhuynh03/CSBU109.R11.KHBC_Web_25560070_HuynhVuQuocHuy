// server.js - Task Manager REST API (in-memory storage)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

// Allow the Web UI to call this API from another origin.
// The exercise may be served from localhost or 127.0.0.1 on Live Server.
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ---------- In-memory "database" ----------
let tasks = [
  { id: 1, title: 'Read the Express routing docs', done: true, createdAt: '2026-09-20T08:00:00.000Z' },
  { id: 2, title: 'Install Postman', done: false, createdAt: '2026-09-21T09:30:00.000Z' },
  { id: 3, title: 'Finish Lab 4 exercise 3', done: false, createdAt: '2026-09-22T14:15:00.000Z' },
  { id: 4, title: 'Review HTTP status codes', done: false, createdAt: '2026-09-23T10:45:00.000Z' }
];
let nextId = 5;

// Shape a task for the API response
const toDto = (task) => ({
  id: task.id,
  title: task.title,
  done: task.done,
  createdAt: task.createdAt
});

// ---------- Routes ----------

// GET /api/tasks?status=all|active|done
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;

  if (status === 'active') {
    return res.json({ success: true, data: tasks.filter((task) => !task.done).map(toDto) });
  }

  if (status === 'done') {
    return res.json({ success: true, data: tasks.filter((task) => task.done).map(toDto) });
  }

  if (!status || status === 'all') {
    return res.json({ success: true, data: tasks.map(toDto) });
  }

  return res.status(400).json({ success: false, message: 'Invalid status filter' });
});

// GET /api/tasks/stats
app.get('/api/tasks/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const active = total - done;
  res.json({ success: true, data: { total, active, done } });
});

// POST /api/tasks  body: { title }
app.post('/api/tasks', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const task = {
    id: nextId++,
    title,
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  return res.status(201).json({ success: true, data: toDto(task) });
});

// PUT /api/tasks/:id  body: { title?, done? }
app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    task.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'done')) {
    if (typeof req.body.done !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Done must be a boolean' });
    }
    task.done = req.body.done;
  }

  return res.json({ success: true, data: toDto(task) });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks.splice(index, 1);
  return res.json({ success: true, message: 'Task deleted' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});
