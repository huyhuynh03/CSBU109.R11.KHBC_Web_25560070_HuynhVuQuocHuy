const API_URL = 'http://localhost:5001/api/v1/products';

const errorBox = document.getElementById('error');
const addForm = document.getElementById('add-form');
const nameInput = document.getElementById('name-input');
const priceInput = document.getElementById('price-input');
const categoryInput = document.getElementById('category-input');
const filterSelect = document.getElementById('category-filter');
const tbody = document.getElementById('product-body');

let editingId = null; // id of the row currently in edit mode

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatPrice(price) {
  return `${Number(price).toLocaleString('en-US')} VND`;
}

function showError(context, error) {
  errorBox.textContent = `${context}: ${error.message}`;
  errorBox.classList.remove('hidden');
  console.error(context, error);
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

// fetch() does not reject on HTTP 4xx/5xx, so response.ok is checked explicitly
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }
  return result;
}

// Fill the dropdown with distinct categories from the full product list
async function loadCategories() {
  try {
    const { data } = await request(API_URL);
    const categories = [...new Set(data.map(p => p.category))].sort();
    const selected = filterSelect.value;
    filterSelect.innerHTML = '<option value="">All Categories</option>' +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    filterSelect.value = selected;
  } catch (error) {
    showError('Error fetching categories', error);
  }
}

async function loadProducts() {
  const category = filterSelect.value;
  const url = category ? `${API_URL}?category=${encodeURIComponent(category)}` : API_URL;
  try {
    const { data } = await request(url);
    clearError();
    renderProducts(data);
  } catch (error) {
    tbody.innerHTML = '';
    showError('Error fetching products', error);
  }
}

function renderProducts(products) {
  tbody.innerHTML = '';
  for (const p of products) {
    const tr = document.createElement('tr');

    if (p.id === editingId) {
      tr.innerHTML = `
        <td>${p.id}</td>
        <td><input class="edit-name" value="${escapeHtml(p.name)}"></td>
        <td><input class="edit-price" type="number" min="0" value="${p.price}"></td>
        <td><input class="edit-category" value="${escapeHtml(p.category)}"></td>
        <td>
          <button class="btn-save">Save</button>
          <button class="btn-cancel">Cancel</button>
        </td>`;
      tr.querySelector('.btn-save').addEventListener('click', () => saveEdit(p.id, tr));
      tr.querySelector('.btn-cancel').addEventListener('click', () => {
        editingId = null;
        loadProducts();
      });
    } else {
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </td>`;
      tr.querySelector('.btn-edit').addEventListener('click', () => {
        editingId = p.id;
        loadProducts();
      });
      tr.querySelector('.btn-delete').addEventListener('click', () => deleteProduct(p.id));
    }

    tbody.appendChild(tr);
  }
}

async function createProduct(event) {
  event.preventDefault();
  const body = {
    name: nameInput.value,
    price: priceInput.value,
    category: categoryInput.value
  };
  try {
    await request(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    addForm.reset();
    clearError();
    await loadCategories();
    await loadProducts();
  } catch (error) {
    showError('Error adding product', error);
  }
}

async function saveEdit(id, row) {
  const body = {
    name: row.querySelector('.edit-name').value,
    price: row.querySelector('.edit-price').value,
    category: row.querySelector('.edit-category').value
  };
  try {
    await request(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    editingId = null;
    await loadCategories();
    await loadProducts();
  } catch (error) {
    // Keep the row in edit mode so the user can correct the values
    showError('Error updating product', error);
  }
}

async function deleteProduct(id) {
  try {
    await request(`${API_URL}/${id}`, { method: 'DELETE' });
    await loadCategories();
    await loadProducts();
  } catch (error) {
    showError('Error deleting product', error);
  }
}

addForm.addEventListener('submit', createProduct);
filterSelect.addEventListener('change', loadProducts);

loadCategories();
loadProducts();
