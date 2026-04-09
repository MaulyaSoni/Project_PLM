const { prisma } = require('../lib/prisma');
const { normalizeText, upsertEcoEmbedding } = require('./semantic.service');

function toPattern(eco) {
  const changes = Array.isArray(eco.productChanges)
    ? eco.productChanges
    : (Array.isArray(eco.bomComponentChanges) ? eco.bomComponentChanges : []);

  return changes
    .map((c) => `${String(c.changeType || 'CHANGED').toUpperCase()}::${String(c.field || c.fieldName || c.componentName || 'field').toLowerCase()}`)
    .sort()
    .join('|');
}

async function learnFromCompletedEco({ ecoId }) {
  const eco = await prisma.eCO.findUnique({
    where: { id: ecoId },
    include: {
      approvals: { orderBy: { createdAt: 'asc' }, take: 1 },
      aiResults: {
        where: { featureType: 'QUALITY_SCORE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!eco || eco.status !== 'DONE') return null;

  const approval = eco.approvals[0] || null;
  const quality = eco.aiResults[0] || null;
  let qualityScore = null;
  try {
    const out = quality ? JSON.parse(quality.output) : null;
    qualityScore = Number(out?.total_score) || null;
  } catch {
    qualityScore = null;
  }

  const cycleDays = approval
    ? (new Date(approval.createdAt).getTime() - new Date(eco.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const record = await prisma.templateLearningRecord.upsert({
    where: { ecoId: eco.id },
    create: {
      ecoId: eco.id,
      productId: eco.productId,
      ecoType: eco.type,
      title: eco.title,
      description: eco.description || null,
      normalizedPattern: toPattern(eco),
      outcomeQualityScore: qualityScore,
      cycleTimeDays: cycleDays,
      approvedFirstPass: !!approval?.approved,
    },
    update: {
      title: eco.title,
      description: eco.description || null,
      normalizedPattern: toPattern(eco),
      outcomeQualityScore: qualityScore,
      cycleTimeDays: cycleDays,
      approvedFirstPass: !!approval?.approved,
    },
  });

  const text = normalizeText({
    title: eco.title,
    description: eco.description || '',
    changes: eco.productChanges || eco.bomComponentChanges || [],
  });

  await upsertEcoEmbedding({
    ecoId: eco.id,
    productId: eco.productId,
    text,
    source: 'done-eco-learning',
  });

  return record;
}

async function topOutcomeTemplateHints({ productId, ecoType, limit = 5 }) {
  return prisma.templateLearningRecord.findMany({
    where: { productId, ecoType },
    orderBy: [
      { outcomeQualityScore: 'desc' },
      { cycleTimeDays: 'asc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });
}

module.exports = {
  learnFromCompletedEco,
  topOutcomeTemplateHints,
};
