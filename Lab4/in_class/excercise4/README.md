# Exercise 4 – Diagnosing Common API Bugs with DevTools

You are given a small **Task Manager** app:

```
ex4/
├── be/   Express REST API (port 5002, data kept in memory)
└── fe/   Web UI (plain HTML + CSS + JavaScript)
```

The **frontend is correct**. The **backend contains 10 bugs**. Your job is to find each one using the
browser DevTools (and the server terminal), explain the root cause, and fix it **in the backend only**.

## Setup

```bash
cd ex4/be
npm install
npm start          # -> Task API running at http://localhost:5002
```

Open `fe/index.html` with Live Server / Five Server (e.g. `http://127.0.0.1:5500/ex4/fe/index.html`),
then open DevTools (`F12` or `Cmd+Option+I`).

> The data is stored in memory, so restarting the server resets all tasks to the 4 seed tasks.

## API contract (this is the source of truth)

Every response body is JSON with a `success` field.

| Method | URL | Request body | Success response |
|---|---|---|---|
| `GET` | `/api/tasks` | – | `200` `{ success, data: Task[] }` (all tasks) |
| `GET` | `/api/tasks?status=active` | – | `200` `{ success, data: Task[] }` (tasks with `done: false`) |
| `GET` | `/api/tasks?status=done` | – | `200` `{ success, data: Task[] }` (tasks with `done: true`) |
| `GET` | `/api/tasks/stats` | – | `200` `{ success, data: { total, active, done } }` |
| `POST` | `/api/tasks` | `{ title }` | `201` `{ success, data: Task }` |
| `PUT` | `/api/tasks/:id` | `{ title?, done? }` | `200` `{ success, data: Task }` |
| `DELETE` | `/api/tasks/:id` | – | `200` `{ success, message }` |

```ts
Task = { id: number, title: string, done: boolean, createdAt: string /* ISO date */ }
```

Error responses:

- `400` `{ success: false, message }` when `title` is missing or blank – **nothing may be created**.
- `404` `{ success: false, message }` when no task has the given `id`.

The Web UI must be able to call **every** endpoint above from its own origin (e.g. `http://127.0.0.1:5500`).

## What to do

1. Use the app like a normal user: load the page, add, edit, tick/untick, delete tasks, switch filters,
   try adding an empty task. Compare what you see with the API contract.
2. For every problem, collect evidence in DevTools:
   - **Console** – red errors (e.g. CORS messages), logged exceptions.
   - **Network** – status code, request headers/payload, response headers, response body (Preview/Response tabs),
     requests stuck in *(pending)*, `OPTIONS` preflight requests.
   - **Server terminal** – stack traces printed by Express.
3. Find the root cause in `be/server.js`, fix it, restart the server, and confirm the fix.

> Tip: some bugs are hidden behind others – you will only see them after fixing the one in front.

## Deliverable

Fill in a bug report table like this one, plus your fixed `be/server.js`:

| # | Symptom in the UI | Evidence in DevTools / terminal | Root cause | Fix |
|---|---|---|---|---|
| 1 | Page shows "Cannot reach the API" | Console: `... has been blocked by CORS policy ...` | ... | ... |
