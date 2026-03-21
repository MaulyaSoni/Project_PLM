const express = require('express');
const { getAllProducts, getProductById, createProduct, archiveProduct } = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllProducts);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, authorize('ADMIN', 'ENGINEERING'), createProduct);
router.patch('/:id/archive', authenticate, authorize('ADMIN'), archiveProduct);

module.exports = router;
