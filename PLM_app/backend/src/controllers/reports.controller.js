const { prisma } = require('../lib/prisma');
const { mapECO, mapBOM, toDateOnly } = require('./_mappers');

const serverError = (res, error) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error.message || 'Internal server error');
  return res.status(500).json({ error: message });
};

const getECOReport = async (_req, res) => {
  try {
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

    const data = ecos.map(mapECO);
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getVersionHistory = async (req, res) => {
  try {
    const productId = req.params.productId;
    const versions = await prisma.productVersion.findMany({
      where: { productId },
      orderBy: { version: 'asc' },
    });

    const ecoIds = versions.map((v) => v.createdVia).filter(Boolean);
    const ecos = await prisma.eCO.findMany({
      where: { id: { in: ecoIds } },
      include: { user: true },
    });

    const ecoCreatorMap = {};
    ecos.forEach((eco) => {
      ecoCreatorMap[eco.id] = eco.user.name;
    });

    const data = versions.map((v) => ({
      version: v.version,
      salePrice: v.salePrice,
      costPrice: v.costPrice,
      status: v.status,
      createdAt: toDateOnly(v.createdAt),
      createdVia: ecoCreatorMap[v.createdVia] || v.createdVia || undefined,
    }));

    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getBOMHistory = async (req, res) => {
  try {
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

    const data = boms.map(mapBOM);
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getAuditLog = async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        eco: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = logs.map((l) => ({
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
    }));

    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  getECOReport,
  getVersionHistory,
  getBOMHistory,
  getAuditLog,
};
