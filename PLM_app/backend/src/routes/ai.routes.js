const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const c = require('../controllers/ai.controller');
const { prisma } = require('../lib/prisma');

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

// Quality score — Engineering + Admin
router.post(
  '/quality-score',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.scoreECODraft
);

// Complexity estimate — authenticated users
router.get(
  '/complexity/:ecoId',
  authenticate,
  c.estimateComplexity
);

// Template suggestion — Engineering + Admin
router.get(
  '/template-suggestion',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.getTemplateSuggestion
);

// Precedent finder — Approver + Admin + Engineering
router.get(
  '/precedents/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.findPrecedents
);

// AI Results history — Admin only
router.get(
  '/results',
  authenticate,
  authorize([ROLES.ADMIN]),
  async (req, res) => {
    const { featureType, ecoId } = req.query;
    const results = await prisma.aiResult.findMany({
      where: {
        ...(featureType ? { featureType: String(featureType) } : {}),
        ...(ecoId ? { ecoId: String(ecoId) } : {}),
      },
      include: {
        eco: { select: { title: true, status: true } },
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(results);
  }
);

module.exports = router;
