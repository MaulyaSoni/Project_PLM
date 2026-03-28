const { prisma } = require('../lib/prisma');

const ACTION_TYPE = 'REVIEW_NUDGE';

const getNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

async function runEcoLifecycleAgent({ source = 'scheduler' } = {}) {
  const reviewThresholdHours = getNumber(process.env.AGENT_STUCK_REVIEW_HOURS, 24);
  const cooldownHours = getNumber(process.env.AGENT_NUDGE_COOLDOWN_HOURS, 12);

  const thresholdDate = new Date(Date.now() - reviewThresholdHours * 60 * 60 * 1000);
  const cooldownDate = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

  const stuckEcos = await prisma.eCO.findMany({
    where: {
      status: 'IN_REVIEW',
      createdAt: { lte: thresholdDate },
    },
    include: {
      product: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const actions = [];

  for (const eco of stuckEcos) {
    const recentNudge = await prisma.agentAction.findFirst({
      where: {
        ecoId: eco.id,
        actionType: ACTION_TYPE,
        createdAt: { gte: cooldownDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentNudge) continue;

    const daysInReview = Math.max(1, Math.ceil((Date.now() - new Date(eco.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

    const openReviewCount = await prisma.eCO.count({
      where: {
        productId: eco.productId,
        status: 'IN_REVIEW',
      },
    });

    const message = [
      `ECO ${eco.title} has been in review for ${daysInReview} day(s).`,
      `Approver: ${eco.assignedTo?.name || 'Unassigned'}.`,
      `Current review queue for ${eco.product.name}: ${openReviewCount}.`,
    ].join(' ');

    const payload = {
      ecoId: eco.id,
      ecoTitle: eco.title,
      productId: eco.productId,
      productName: eco.product.name,
      assignedTo: eco.assignedTo?.name || null,
      daysInReview,
      reviewQueueSize: openReviewCount,
      thresholdHours: reviewThresholdHours,
    };

    const action = await prisma.agentAction.create({
      data: {
        ecoId: eco.id,
        actionType: ACTION_TYPE,
        status: 'EXECUTED',
        reason: `ECO stuck in IN_REVIEW for over ${reviewThresholdHours}h`,
        message,
        metadata: payload,
        source,
        executedAt: new Date(),
      },
    });

    // Feed observability stream so Admin can inspect latency/data in AI Observatory.
    await prisma.aiResult.create({
      data: {
        ecoId: eco.id,
        userId: eco.assignedToId || eco.userId,
        featureType: 'AGENT_NUDGE',
        input: JSON.stringify({ source, thresholdHours: reviewThresholdHours, cooldownHours }),
        output: JSON.stringify({ message, payload }),
        modelUsed: 'system-agent',
        latencyMs: 0,
        cached: true,
      },
    });

    actions.push(action);
  }

  return {
    scanned: stuckEcos.length,
    created: actions.length,
    actions,
    reviewThresholdHours,
    cooldownHours,
  };
}

async function getAgentAlerts() {
  const reviewThresholdHours = getNumber(process.env.AGENT_STUCK_REVIEW_HOURS, 24);
  const thresholdDate = new Date(Date.now() - reviewThresholdHours * 60 * 60 * 1000);

  const stuckEcos = await prisma.eCO.findMany({
    where: {
      status: 'IN_REVIEW',
      createdAt: { lte: thresholdDate },
    },
    include: {
      product: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  const recentActions = await prisma.agentAction.findMany({
    include: {
      eco: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const formattedStuck = stuckEcos.map((eco) => ({
    id: eco.id,
    title: eco.title,
    productName: eco.product.name,
    assignedToName: eco.assignedTo?.name || 'Unassigned',
    daysInReview: Math.max(1, Math.ceil((Date.now() - new Date(eco.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
    createdAt: eco.createdAt,
  }));

  return {
    thresholds: { reviewThresholdHours },
    stuckCount: formattedStuck.length,
    stuckEcos: formattedStuck,
    recentActions,
  };
}

module.exports = {
  ACTION_TYPE,
  runEcoLifecycleAgent,
  getAgentAlerts,
};
