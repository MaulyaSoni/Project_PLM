const { prisma } = require('../lib/prisma');

function expertiseScoreForApprover(approver, eco) {
  const text = `${eco.title || ''} ${eco.description || ''}`.toLowerCase();
  const typeHint = eco.type === 'BOM' ? ['bom', 'component', 'routing', 'material'] : ['price', 'cost', 'product', 'version'];
  const matches = typeHint.filter((token) => text.includes(token)).length;
  return Math.min(1, matches / Math.max(1, typeHint.length));
}

async function averageDecisionSpeedDays(userId) {
  const approvals = await prisma.eCOApproval.findMany({
    where: { userId },
    include: {
      eco: { select: { createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  if (approvals.length === 0) return 3;

  const spans = approvals
    .map((a) => (new Date(a.createdAt).getTime() - new Date(a.eco.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    .filter((v) => Number.isFinite(v) && v >= 0);

  if (spans.length === 0) return 3;
  return spans.reduce((sum, d) => sum + d, 0) / spans.length;
}

async function pickOptimalApprover({ ecoId }) {
  const eco = await prisma.eCO.findUnique({ where: { id: ecoId } });
  if (!eco) throw new Error('ECO not found');

  const approvers = await prisma.user.findMany({
    where: { role: 'APPROVER', isActive: true },
    select: { id: true, name: true, email: true },
  });

  if (approvers.length === 0) {
    return { assigned: null, reasoning: 'No active approvers available' };
  }

  const scored = [];
  for (const approver of approvers) {
    const queueDepth = await prisma.eCO.count({
      where: {
        assignedToId: approver.id,
        status: { in: ['IN_REVIEW', 'APPROVED'] },
      },
    });

    const expertiseMatch = expertiseScoreForApprover(approver, eco);
    const avgDecisionDays = await averageDecisionSpeedDays(approver.id);

    const score = (expertiseMatch * 0.45) + ((1 / (1 + queueDepth)) * 0.30) + ((1 / (1 + avgDecisionDays)) * 0.25);

    scored.push({
      approver,
      queueDepth,
      expertiseMatch,
      avgDecisionDays,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const reasoning = [
    `Assigned ${best.approver.name} with composite score ${best.score.toFixed(3)}.`,
    `Queue depth: ${best.queueDepth}.`,
    `Expertise match: ${(best.expertiseMatch * 100).toFixed(0)}%.`,
    `Average decision speed: ${best.avgDecisionDays.toFixed(1)} day(s).`,
  ].join(' ');

  await prisma.eCO.update({
    where: { id: ecoId },
    data: { assignedToId: best.approver.id },
  });

  await prisma.agentAction.create({
    data: {
      ecoId,
      targetUserId: best.approver.id,
      actionType: 'AUTO_ASSIGNED',
      reasoning,
      context: JSON.stringify({
        queueDepth: best.queueDepth,
        expertiseMatch: best.expertiseMatch,
        avgDecisionDays: best.avgDecisionDays,
        score: best.score,
      }),
      message: `Auto-assigned approver ${best.approver.name}`,
      source: 'approval-assignment-agent',
      status: 'EXECUTED',
      executedAt: new Date(),
    },
  });

  return {
    assigned: best.approver,
    reasoning,
    candidates: scored.map((c) => ({
      id: c.approver.id,
      name: c.approver.name,
      queueDepth: c.queueDepth,
      expertiseMatch: c.expertiseMatch,
      avgDecisionDays: c.avgDecisionDays,
      score: c.score,
    })),
  };
}

async function overrideApproverAssignment({ ecoId, approverId, adminId, reason }) {
  const approver = await prisma.user.findFirst({
    where: { id: approverId, role: 'APPROVER', isActive: true },
    select: { id: true, name: true },
  });

  if (!approver) throw new Error('Approver not found or inactive');

  await prisma.eCO.update({
    where: { id: ecoId },
    data: { assignedToId: approver.id },
  });

  await prisma.agentAction.create({
    data: {
      ecoId,
      targetUserId: approver.id,
      actionType: 'ASSIGNMENT_OVERRIDE',
      reasoning: reason || 'Admin override',
      context: JSON.stringify({ adminId, approverId }),
      message: `Admin overrode assignment to ${approver.name}`,
      source: 'admin-override',
      status: 'EXECUTED',
      executedAt: new Date(),
    },
  });

  return approver;
}

module.exports = {
  pickOptimalApprover,
  overrideApproverAssignment,
};
