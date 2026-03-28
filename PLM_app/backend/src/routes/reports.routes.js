const express = require('express');
const {
  getECOReport,
  getVersionHistory,
  getBOMHistory,
  getBOMChangeHistory,
  getArchivedProducts,
  getActiveMatrix,
  getAuditLog,
  getUsers,
  getLifecycleAgentAlerts,
  runLifecycleAgentNow,
} = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/eco', authenticate, authorize([ROLES.ADMIN]), getECOReport);
router.get('/versions/:productId', authenticate, authorize([ROLES.ADMIN]), getVersionHistory);
router.get('/bom-history/:productId', authenticate, authorize([ROLES.ADMIN]), getBOMChangeHistory);
router.get('/bom-versions/:productId', authenticate, authorize([ROLES.ADMIN]), getBOMHistory);
router.get('/archived-products', authenticate, authorize([ROLES.ADMIN]), getArchivedProducts);
router.get('/active-matrix', authenticate, authorize([ROLES.ADMIN]), getActiveMatrix);
router.get('/audit-log', authenticate, authorize([ROLES.ADMIN]), getAuditLog);
router.get('/users', authenticate, authorize([ROLES.ADMIN]), getUsers);
router.get('/agent-alerts', authenticate, authorize([ROLES.ADMIN]), getLifecycleAgentAlerts);
router.post('/agent/run', authenticate, authorize([ROLES.ADMIN]), runLifecycleAgentNow);

module.exports = router;
