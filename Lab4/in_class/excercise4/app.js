// app.js - Task Manager Web UI
const API_BASE = 'http://localhost:5002/api/tasks';

const addForm = document.getElementById('addForm');
const titleInput = document.getElementById('titleInput');
const addBtn = document.getElementById('addBtn');
const filters = document.getElementById('filters');
const messageBox = document.getElementById('message');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

let currentStatus = 'all';

// ---------- Helpers ----------

// Send a request to the API and return the parsed JSON body.
// Throws an Error with the server's message when the status is not 2xx.
async function request(url, options = {}) {
    let response;
    try {
        response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
    } catch (err) {
        // fetch only rejects on network-level failures (server down, CORS, ...)
        throw new Error('Cannot reach the API. Open DevTools (Console / Network) to see why.');
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error((body && body.message) || `Request failed with status ${response.status}`);
    }
    return body;
}

function showMessage(text, type = 'error') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message';
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

// ---------- Rendering ----------

function renderTasks(tasks) {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.textContent = 'No tasks here.';
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.done ? ' done' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.done;
        checkbox.addEventListener('change', () => toggleTask(task));

        const body = document.createElement('div');
        body.className = 'task-body';
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        const meta = document.createElement('div');
        meta.className = 'task-meta';
        meta.textContent = `#${task.id} · created ${formatDate(task.createdAt)}`;
        body.append(title, meta);

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editTask(task));
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task));
        actions.append(editBtn, deleteBtn);

        li.append(checkbox, body, actions);
        taskList.appendChild(li);
    });
}

function renderStats(stats) {
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statActive').textContent = stats.active;
    document.getElementById('statDone').textContent = stats.done;
}

// ---------- API calls ----------

async function loadTasks() {
    emptyState.textContent = 'Loading...';
    emptyState.style.display = 'block';
    const query = currentStatus === 'all' ? '' : `?status=${currentStatus}`;
    const result = await request(`${API_BASE}${query}`);
    renderTasks(result.data);
}

async function loadStats() {
    const result = await request(`${API_BASE}/stats`);
    renderStats(result.data);
}

// Reload both the list and the stats
async function refresh() {
    try {
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        console.error(err);
        emptyState.textContent = '';
        showMessage(err.message);
    }
}

async function addTask(title) {
    addBtn.disabled = true;
    try {
        await request(API_BASE, {
            method: 'POST',
            body: JSON.stringify({ title })
        });
        titleInput.value = '';
        showMessage('Task added.', 'success');
    } catch (err) {
        showMessage(err.message);
    } finally {
        addBtn.disabled = false;
        refresh();
    }
}

async function toggleTask(task) {
    try {
        await request(`${API_BASE}/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify({ done: !task.done })
        });
        clearMessage();
    } catch (err) {
        showMessage(err.message);
    }
    refresh();
}

async function editTask(task) {
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle === null) return; // Cancelled

    try {
        await request(`${API_BASE}/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: newTitle })
        });
        showMessage('Task updated.', 'success');
    } catch (err) {
        showMessage(err.message);
    }
    refresh();
}

async function deleteTask(task) {
    if (!confirm(`Delete task #${task.id} "${task.title}"?`)) return;

    try {
        await request(`${API_BASE}/${task.id}`, { method: 'DELETE' });
        showMessage(`Task #${task.id} deleted.`, 'success');
    } catch (err) {
        showMessage(err.message);
    }
    refresh();
}

// ---------- Events ----------

addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Validation is the server's job - send exactly what the user typed
    addTask(titleInput.value);
});

filters.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-status]');
    if (!button) return;

    filters.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    currentStatus = button.dataset.status;
    clearMessage();
    refresh();
});

refresh();
