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
const { runECOLifecycleAgent, runBottleneckDetector } = require('../services/agent.service');
const { overrideApproverAssignment } = require('../services/approverAssignment.service');
const { prisma } = require('../lib/prisma');
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

router.get('/agent-actions', authenticate, authorize([ROLES.ADMIN]), async (_req, res) => {
  try {
    const actions = await prisma.agentAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(actions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/agent/run-now', authenticate, authorize([ROLES.ADMIN]), async (_req, res) => {
  try {
    const bottleneck = await runBottleneckDetector();
    await runECOLifecycleAgent();
    res.json({
      message: 'Agent runs completed',
      bottleneckAnalysis: bottleneck,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/agent/override-approver', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const { ecoId, approverId, reason } = req.body || {};
    if (!ecoId || !approverId) {
      return res.status(400).json({ error: 'ecoId and approverId are required' });
    }

    const assigned = await overrideApproverAssignment({
      ecoId,
      approverId,
      adminId: req.user.id,
      reason: reason || 'Manual override by admin',
    });

    res.json({ message: 'Approver assignment overridden', data: assigned });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ data: notifications });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
