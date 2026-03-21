const express = require('express');
const { getAllProducts, getProductById, createProduct, archiveProduct } = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllProducts);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), createProduct);
router.patch('/:id/archive', authenticate, authorize([ROLES.ADMIN]), archiveProduct);

module.exports = router;
