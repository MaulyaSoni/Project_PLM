const express = require('express');
const { getAllBOMs, getBOMById, createBOM, archiveBOM } = require('../controllers/bom.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllBOMs);
router.get('/:id', authenticate, getBOMById);
router.post('/', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), createBOM);
router.patch('/:id/archive', authenticate, authorize([ROLES.ADMIN]), archiveBOM);

module.exports = router;
