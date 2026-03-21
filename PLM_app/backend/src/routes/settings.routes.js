const express = require('express');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/stages', authenticate, authorize([ROLES.ADMIN]), async (_req, res) => {
  try {
    const stages = await prisma.eCOStage.findMany({
      orderBy: { order: 'asc' },
    });
    return res.json({ data: stages, total: stages.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.patch('/stages/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const { name, requiresApproval, sortOrder, order } = req.body;
    const stage = await prisma.eCOStage.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(requiresApproval !== undefined ? { requiresApproval: Boolean(requiresApproval) } : {}),
        ...(sortOrder !== undefined ? { order: Number(sortOrder) } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
      },
    });
    return res.json({ data: stage, message: 'Stage updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
