const Product = require('../models/Product');
const Category = require('../models/Category');

// Make sure the referenced category exists before saving a product
async function ensureCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    const error = new Error('categoryId does not reference an existing category');
    error.status = 400;
    throw error;
  }
}

// GET /api/v1/products?categoryId=...
exports.list = async (req, res) => {
  const filter = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;

  const products = await Product.find(filter).sort({ name: 1 });
  res.json({ success: true, count: products.length, data: products });
};

// POST /api/v1/products (admin)
exports.create = async (req, res) => {
  const { categoryId, name, quantity, price } = req.body;
  if (!categoryId || !name || price === undefined) {
    return res.status(400).json({ success: false, message: 'categoryId, name and price are required' });
  }
  await ensureCategoryExists(categoryId);

  const product = await Product.create({ categoryId, name, quantity, price });
  res.status(201).json({ success: true, message: 'Product created', data: product });
};

// PUT /api/v1/products/:id (admin)
exports.update = async (req, res) => {
  const { categoryId, name, quantity, price } = req.body;
  const updates = { categoryId, name, quantity, price };
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

  if (updates.categoryId) await ensureCategoryExists(updates.categoryId);

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, message: 'Product updated', data: product });
};

// DELETE /api/v1/products/:id (admin)
exports.remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
};
