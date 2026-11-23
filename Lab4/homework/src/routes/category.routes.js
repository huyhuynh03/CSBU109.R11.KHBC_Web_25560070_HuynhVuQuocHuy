const express = require('express');
const categories = require('../controllers/category.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, categories.list);
router.post('/', authenticate, requireAdmin, categories.create);
router.put('/:id', authenticate, requireAdmin, categories.update);
router.delete('/:id', authenticate, requireAdmin, categories.remove);

module.exports = router;
