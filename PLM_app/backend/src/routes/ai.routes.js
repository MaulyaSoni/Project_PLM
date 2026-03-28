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

// Approval outcome predictor — Engineering + Admin (pre-submit gate)
router.post(
  '/approval-outcome-predictor',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.predictApprovalOutcome
);

// Approval outcome predictor by ECO — Approver/Admin/Engineering (detail side panel)
router.get(
  '/approval-outcome/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.getApprovalOutcomeByECO
);

// Intelligent BOM change impact graph — Engineering + Admin (pre-submit gate)
router.post(
  '/bom-impact-graph',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.generateBOMImpactGraph
);

// BOM impact graph by ECO — Approver/Admin/Engineering (detail side panel)
router.get(
  '/bom-impact/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.getBOMImpactGraphByECO
);

// Similar ECO search + reuse — Engineering + Admin (create/edit wizard)
router.post(
  '/similar-ecos',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.searchSimilarECOs
);

// Similar ECO search by ECO — Approver/Admin/Engineering (detail panel)
router.get(
  '/similar-ecos/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.getSimilarECOsByECO
);

// AI writing copilot — Engineering + Admin
router.post(
  '/eco-writing-copilot',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.rewriteECOCopy
);

// Production rollout simulator — Engineering + Admin
router.post(
  '/rollout-simulator',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.ENGINEERING]),
  c.simulateRollout
);

// Production rollout simulator by ECO — Approver/Admin/Engineering
router.get(
  '/rollout-simulator/:ecoId',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.APPROVER, ROLES.ENGINEERING]),
  c.getRolloutSimulationByECO
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
