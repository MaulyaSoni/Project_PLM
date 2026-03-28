const { prisma } = require('../lib/prisma');
const { mapECO, mapBOM, toDateOnly } = require('./_mappers');
const { runEcoLifecycleAgent, getAgentAlerts } = require('../services/lifecycleAgent.service');

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

const getBOMChangeHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const ecos = await prisma.eCO.findMany({
      where: {
        productId,
        type: 'BOM',
        status: 'DONE',
      },
      include: {
        user: true,
        assignedTo: true,
        stage: true,
        product: true,
        bom: { include: { components: true, operations: true } },
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

const getArchivedProducts = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ARCHIVED' },
      include: {
        versions: { orderBy: { version: 'desc' } },
        ecos: {
          where: { status: 'DONE' },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = products.map((p) => {
      const latestVersion = p.versions[0] || null;
      const archivedVia = p.ecos[0] || null;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        createdAt: toDateOnly(p.createdAt),
        totalVersions: p.versions.length,
        lastVersion: latestVersion ? latestVersion.version : null,
        finalSalePrice: latestVersion ? latestVersion.salePrice : null,
        finalCostPrice: latestVersion ? latestVersion.costPrice : null,
        versions: p.versions.map((v) => ({
          version: v.version,
          salePrice: v.salePrice,
          costPrice: v.costPrice,
          status: v.status,
          createdAt: toDateOnly(v.createdAt),
        })),
        archivedVia: archivedVia
          ? {
              id: archivedVia.id,
              title: archivedVia.title,
              type: archivedVia.type,
              userName: archivedVia.user?.name || null,
              createdAt: toDateOnly(archivedVia.createdAt),
            }
          : null,
      };
    });

    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getActiveMatrix = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        versions: {
          where: { status: 'ACTIVE' },
          orderBy: { version: 'desc' },
        },
        boms: {
          where: { status: 'ACTIVE' },
          orderBy: { version: 'desc' },
          include: {
            components: true,
            operations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      productStatus: p.status,
      activeVersion: p.versions[0]
        ? {
            version: p.versions[0].version,
            salePrice: p.versions[0].salePrice,
            costPrice: p.versions[0].costPrice,
            status: p.versions[0].status,
          }
        : null,
      activeBOM: p.boms[0]
        ? {
            id: p.boms[0].id,
            version: p.boms[0].version,
            status: p.boms[0].status,
            components: p.boms[0].components,
            operations: p.boms[0].operations,
          }
        : null,
      hasVersion: p.versions.length > 0,
      hasBOM: p.boms.length > 0,
      isComplete: p.versions.length > 0 && p.boms.length > 0,
      componentCount: p.boms[0]?.components?.length || 0,
      operationCount: p.boms[0]?.operations?.length || 0,
    }));

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

const getUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const data = users.map((u) => ({
      ...u,
      createdAt: toDateOnly(u.createdAt),
    }));
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getLifecycleAgentAlerts = async (_req, res) => {
  try {
    const data = await getAgentAlerts();
    return res.json({ data });
  } catch (error) {
    return serverError(res, error);
  }
};

const runLifecycleAgentNow = async (_req, res) => {
  try {
    const result = await runEcoLifecycleAgent({ source: 'manual' });
    return res.json({ data: result, message: 'Lifecycle agent execution completed' });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
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
};
