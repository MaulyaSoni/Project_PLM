const { prisma } = require('../lib/prisma');
const { mapECO } = require('./_mappers');

const stageNameToStatus = {
  New: 'NEW',
  'In Review': 'IN_REVIEW',
  Done: 'DONE',
};

const findStageByStatus = async (status) => {
  const lookup = {
    NEW: 'New',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    APPROVED: 'In Review',
  };
  return prisma.eCOStage.findFirst({ where: { name: lookup[status] || 'New' } });
};

const includeShape = {
  product: true,
  bom: true,
  user: true,
  assignedTo: true,
  stage: true,
  approvals: { include: { user: true }, orderBy: { createdAt: 'desc' } },
  auditLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } },
};

const getAllECOs = async (_req, res) => {
  const ecos = await prisma.eCO.findMany({
    include: includeShape,
    orderBy: { createdAt: 'desc' },
  });

  return res.json(ecos.map(mapECO));
};

const getECOById = async (req, res) => {
  const eco = await prisma.eCO.findUnique({
    where: { id: req.params.id },
    include: includeShape,
  });

  if (!eco) return res.status(404).json({ error: 'ECO not found' });
  return res.json(mapECO(eco));
};

const createECO = async (req, res) => {
  const {
    title,
    type,
    productId,
    bomId,
    assignedTo,
    effectiveDate,
    versionUpdate,
    createdBy,
    productChanges,
    bomComponentChanges,
  } = req.body;

  if (!title || !type || !productId || !createdBy) {
    return res.status(400).json({ error: 'title, type, productId, createdBy are required' });
  }

  const stage = await findStageByStatus('NEW');

  const eco = await prisma.eCO.create({
    data: {
      title,
      type,
      productId,
      bomId: bomId || null,
      userId: createdBy,
      assignedToId: assignedTo || createdBy,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
      versionUpdate: versionUpdate !== false,
      stageId: stage.id,
      status: 'NEW',
      productChanges: productChanges || null,
      bomComponentChanges: bomComponentChanges || null,
      auditLogs: {
        create: {
          userId: createdBy,
          action: 'ECO Created',
          actionType: 'CREATE',
        },
      },
    },
    include: includeShape,
  });

  return res.status(201).json(mapECO(eco));
};

const submitForReview = async (req, res) => {
  const id = req.params.id;
  const stage = await findStageByStatus('IN_REVIEW');

  const eco = await prisma.eCO.findUnique({ where: { id } });
  if (!eco) return res.status(404).json({ error: 'ECO not found' });

  await prisma.$transaction([
    prisma.eCO.update({ where: { id }, data: { stageId: stage.id, status: 'IN_REVIEW' } }),
    prisma.auditLog.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        action: 'Moved to In Review',
        actionType: 'UPDATE',
      },
    }),
  ]);

  return res.json({ ok: true });
};

const approveECO = async (req, res) => {
  const id = req.params.id;
  const { comment } = req.body;

  const eco = await prisma.eCO.findUnique({ where: { id } });
  if (!eco) return res.status(404).json({ error: 'ECO not found' });

  await prisma.$transaction([
    prisma.eCO.update({ where: { id }, data: { status: 'APPROVED' } }),
    prisma.eCOApproval.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        approved: true,
        comment: comment || null,
      },
    }),
    prisma.auditLog.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        action: 'Approved ECO',
        actionType: 'APPROVE',
        newValue: comment || null,
      },
    }),
  ]);

  return res.json({ ok: true });
};

const rejectECO = async (req, res) => {
  const id = req.params.id;
  const { comment } = req.body;
  const stage = await findStageByStatus('NEW');

  const eco = await prisma.eCO.findUnique({ where: { id } });
  if (!eco) return res.status(404).json({ error: 'ECO not found' });

  await prisma.$transaction([
    prisma.eCO.update({ where: { id }, data: { status: 'NEW', stageId: stage.id } }),
    prisma.eCOApproval.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        approved: false,
        comment: comment || null,
      },
    }),
    prisma.auditLog.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        action: 'Rejected ECO',
        actionType: 'REJECT',
        newValue: comment || null,
      },
    }),
  ]);

  return res.json({ ok: true });
};

const applyECO = async (req, res) => {
  const id = req.params.id;
  const doneStage = await findStageByStatus('DONE');

  const eco = await prisma.eCO.findUnique({ where: { id } });
  if (!eco) return res.status(404).json({ error: 'ECO not found' });
  if (eco.status !== 'APPROVED') return res.status(400).json({ error: 'Only approved ECO can be applied' });

  await prisma.$transaction(async (tx) => {
    if (eco.type === 'PRODUCT' && Array.isArray(eco.productChanges) && eco.productChanges.length) {
      const product = await tx.product.findUnique({ where: { id: eco.productId } });
      const nextVersion = product.currentVersion + 1;

      const oldActive = await tx.productVersion.findFirst({
        where: { productId: eco.productId, status: 'ACTIVE' },
        orderBy: { version: 'desc' },
      });

      const salePrice = Number(eco.productChanges.find((c) => c.field === 'Sale Price')?.newValue ?? oldActive.salePrice);
      const costPrice = Number(eco.productChanges.find((c) => c.field === 'Cost Price')?.newValue ?? oldActive.costPrice);

      await tx.productVersion.updateMany({
        where: { productId: eco.productId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      await tx.productVersion.create({
        data: {
          productId: eco.productId,
          version: nextVersion,
          salePrice,
          costPrice,
          status: 'ACTIVE',
          createdVia: eco.id,
        },
      });

      await tx.product.update({
        where: { id: eco.productId },
        data: { currentVersion: nextVersion },
      });
    }

    if (eco.type === 'BOM' && eco.bomId) {
      const currentBom = await tx.bOM.findUnique({
        where: { id: eco.bomId },
        include: { components: true, operations: true },
      });

      if (currentBom) {
        const newVersion = currentBom.version + 1;
        const changes = Array.isArray(eco.bomComponentChanges) ? eco.bomComponentChanges : [];

        const baseComponents = currentBom.components.map((c) => ({
          componentName: c.componentName,
          quantity: c.quantity,
          unit: c.unit,
        }));

        const updatedComponents = baseComponents
          .map((c) => {
            const change = changes.find((x) => x.componentName === c.componentName);
            if (!change) return c;
            if (change.changeType === 'REMOVED') return null;
            if (change.changeType === 'CHANGED') return { ...c, quantity: Number(change.newQty || c.quantity) };
            return c;
          })
          .filter(Boolean);

        changes
          .filter((c) => c.changeType === 'ADDED')
          .forEach((c) => {
            updatedComponents.push({
              componentName: c.componentName,
              quantity: Number(c.newQty || 0),
              unit: 'pcs',
            });
          });

        await tx.bOM.update({
          where: { id: currentBom.id },
          data: { status: 'ARCHIVED' },
        });

        await tx.bOM.create({
          data: {
            productId: currentBom.productId,
            version: newVersion,
            status: 'ACTIVE',
            components: {
              create: updatedComponents,
            },
            operations: {
              create: currentBom.operations.map((o) => ({
                name: o.name,
                duration: o.duration,
                workCenter: o.workCenter,
              })),
            },
          },
        });
      }
    }

    await tx.eCO.update({ where: { id }, data: { status: 'DONE', stageId: doneStage.id } });
    await tx.auditLog.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        action: 'Applied ECO and created next version',
        actionType: 'UPDATE',
      },
    });
  });

  return res.json({ ok: true });
};

module.exports = {
  getAllECOs,
  getECOById,
  createECO,
  submitForReview,
  approveECO,
  rejectECO,
  applyECO,
  stageNameToStatus,
};
