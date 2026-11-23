const express = require('express');
const products = require('../controllers/product.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, products.list);
router.post('/', authenticate, requireAdmin, products.create);
router.put('/:id', authenticate, requireAdmin, products.update);
router.delete('/:id', authenticate, requireAdmin, products.remove);

module.exports = router;
