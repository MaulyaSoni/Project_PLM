const express = require('express');
const { getECOReport, getVersionHistory, getBOMHistory, getAuditLog } = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/eco', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), getECOReport);
router.get('/versions/:productId', authenticate, getVersionHistory);
router.get('/bom-history/:productId', authenticate, getBOMHistory);
router.get('/audit-log', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), getAuditLog);

module.exports = router;
