const Category = require('../models/Category');

// GET /api/v1/categories
exports.list = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, count: categories.length, data: categories });
};

// POST /api/v1/categories (admin)
exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }
  const category = await Category.create({ name: req.body.name });
  res.status(201).json({ success: true, message: 'Category created', data: category });
};

// PUT /api/v1/categories/:id (admin)
exports.update = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, message: 'Category updated', data: category });
};

// DELETE /api/v1/categories/:id (admin)
exports.remove = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, message: 'Category deleted' });
};
