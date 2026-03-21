const express = require('express');
const { getAllBOMs, getBOMById, createBOM, archiveBOM } = require('../controllers/bom.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllBOMs);
router.get('/:id', authenticate, getBOMById);
router.post('/', authenticate, authorize('ADMIN', 'ENGINEERING'), createBOM);
router.patch('/:id/archive', authenticate, authorize('ADMIN'), archiveBOM);

module.exports = router;
