const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const c = require('../controllers/ai.controller');

// Description generator — ENGINEERING + ADMIN
router.post(
  '/eco-description',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.generateDescription
);

// Impact analysis — APPROVER + ADMIN (they are the ones who need it)
router.get(
  '/impact-analysis/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.generateImpactAnalysis
);

// Conflict detection — ENGINEERING + ADMIN (on ECO create/submit)
router.post(
  '/conflict-detection',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.detectConflicts
);

module.exports = router;
