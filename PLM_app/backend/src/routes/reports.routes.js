const express = require('express');
const { getECOReport, getVersionHistory, getBOMHistory, getAuditLog } = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/eco', authenticate, authorize('ADMIN', 'APPROVER'), getECOReport);
router.get('/versions/:productId', authenticate, getVersionHistory);
router.get('/bom-history/:productId', authenticate, getBOMHistory);
router.get('/audit-log', authenticate, authorize('ADMIN', 'APPROVER'), getAuditLog);

module.exports = router;
