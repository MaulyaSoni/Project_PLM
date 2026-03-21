const { prisma } = require('../lib/prisma');
const { mapECO, mapBOM, toDateOnly } = require('./_mappers');

const getECOReport = async (_req, res) => {
  const ecos = await prisma.eCO.findMany({
    include: {
      product: true,
      bom: true,
      user: true,
      assignedTo: true,
      stage: true,
      approvals: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      auditLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(ecos.map(mapECO));
};

const getVersionHistory = async (req, res) => {
  const productId = req.params.productId;
  const versions = await prisma.productVersion.findMany({
    where: { productId },
    orderBy: { version: 'asc' },
  });

  return res.json(versions.map((v) => ({
    version: v.version,
    salePrice: v.salePrice,
    costPrice: v.costPrice,
    status: v.status,
    createdAt: toDateOnly(v.createdAt),
    createdVia: v.createdVia || undefined,
  })));
};

const getBOMHistory = async (req, res) => {
  const productId = req.params.productId;

  const boms = await prisma.bOM.findMany({
    where: { productId },
    include: {
      product: true,
      components: true,
      operations: true,
    },
    orderBy: { version: 'asc' },
  });

  return res.json(boms.map(mapBOM));
};

const getAuditLog = async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: {
      eco: true,
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(logs.map((l) => ({
    id: l.id,
    action: l.action,
    actionType: l.actionType,
    ecoId: l.ecoId || undefined,
    ecoTitle: l.eco ? l.eco.title : undefined,
    userId: l.userId,
    userName: l.user.name,
    oldValue: l.oldValue || undefined,
    newValue: l.newValue || undefined,
    timestamp: l.createdAt.toISOString(),
  })));
};

module.exports = {
  getECOReport,
  getVersionHistory,
  getBOMHistory,
  getAuditLog,
};
