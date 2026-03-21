const { prisma } = require('../lib/prisma');
const { mapECO } = require('./_mappers');

const stageNameToStatus = {
  New: 'NEW',
  'In Review': 'IN_REVIEW',
  Done: 'DONE',
};

const TITLE_MAX = 255;
const COMMENT_MAX = 1000;
const FIELD_MAX = 100;

const serverError = (res, error) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error.message || 'Internal server error');
  return res.status(500).json({ error: message });
};

const hasMeaningfulChanges = (type, productChanges, bomComponentChanges) => {
  if (type === 'PRODUCT') return Array.isArray(productChanges) && productChanges.length > 0;
  if (type === 'BOM') return Array.isArray(bomComponentChanges) && bomComponentChanges.length > 0;
  return false;
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
  try {
    const ecos = await prisma.eCO.findMany({
      include: includeShape,
      orderBy: { createdAt: 'desc' },
    });

    const data = ecos.map(mapECO);
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getECOById = async (req, res) => {
  try {
    const eco = await prisma.eCO.findUnique({
      where: { id: req.params.id },
      include: includeShape,
    });

    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    return res.json({ data: mapECO(eco) });
  } catch (error) {
    return serverError(res, error);
  }
};

const createECO = async (req, res) => {
  try {
    const {
      title,
      type,
      productId,
      bomId,
      assignedTo,
      effectiveDate,
      versionUpdate,
      productChanges,
      bomComponentChanges,
    } = req.body;

    const normalizedTitle = String(title || '').trim();
    if (!normalizedTitle) return res.status(400).json({ error: 'title is required' });
    if (normalizedTitle.length > TITLE_MAX) return res.status(400).json({ error: 'title must be at most 255 characters' });
    if (!['PRODUCT', 'BOM'].includes(type)) return res.status(400).json({ error: 'Invalid ECO type' });
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    // If frontend sends 'NEW', they want to initialize a BOM via ECO
    const actualBomId = bomId === 'NEW' ? null : bomId;

    if (type === 'BOM' && !actualBomId && bomId !== 'NEW') {
      return res.status(400).json({ error: 'BOM selection is required for BOM type ECOs' });
    }
    if (!hasMeaningfulChanges(type, productChanges, bomComponentChanges)) {
      return res.status(400).json({ error: 'ECO must include at least one proposed change' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot raise ECO for an archived product' });
    }

    if (Array.isArray(productChanges)) {
      for (const change of productChanges) {
        const field = String(change.field || '').trim();
        if (!field || field.length > FIELD_MAX) {
          return res.status(400).json({ error: 'fieldName in changes must be at most 100 characters' });
        }
      }
    }

    if (Array.isArray(bomComponentChanges)) {
      const seenNames = new Set();
      for (const change of bomComponentChanges) {
        const componentName = String(change.componentName || '').trim();
        if (!componentName || componentName.length > FIELD_MAX) {
          return res.status(400).json({ error: 'fieldName in changes must be at most 100 characters' });
        }
        const lowered = componentName.toLowerCase();
        if (seenNames.has(lowered)) {
          return res.status(400).json({ error: 'Duplicate component names are not allowed' });
        }
        seenNames.add(lowered);

        if (change.changeType === 'ADDED' || change.changeType === 'CHANGED') {
          const quantity = Number(change.newQty);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({ error: 'Component quantity must be greater than zero' });
          }
        }
      }
    }

    let selectedBom = null;
    if (type === 'BOM' && actualBomId) {
      selectedBom = await prisma.bOM.findUnique({ where: { id: actualBomId } });
      if (!selectedBom) return res.status(404).json({ error: 'BOM not found' });
      if (selectedBom.productId !== productId) {
        return res.status(400).json({ error: 'BOM does not belong to the selected product' });
      }
      if (selectedBom.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Source BOM has been archived — ECO cannot be applied' });
      }
    }

    const isAdmin = req.user.role === 'ADMIN';
    const initialStatus = isAdmin ? 'APPROVED' : 'NEW';
    const stage = await findStageByStatus(initialStatus);
    const createdBy = req.user.id;

    const effective = effectiveDate ? new Date(effectiveDate) : null;
    const warning = effective && effective < new Date() ? 'Effective date is in the past' : null;

    const eco = await prisma.eCO.create({
      data: {
        title: normalizedTitle,
        type,
        productId,
        bomId: type === 'BOM' ? actualBomId : null,
        userId: createdBy,
        assignedToId: assignedTo || createdBy,
        effectiveDate: effective,
        versionUpdate: versionUpdate !== false,
        stageId: stage.id,
        status: initialStatus,
        productChanges: productChanges || null,
        bomComponentChanges: bomComponentChanges || null,
        auditLogs: {
          create: isAdmin ? [
            {
              userId: createdBy,
              action: `ECO '${normalizedTitle}' created (${type}) by ${req.user.email}`,
              actionType: 'CREATE',
              newValue: JSON.stringify({ type, productId, bomId: actualBomId || null }),
            },
            {
              userId: createdBy,
              action: `'${normalizedTitle}' approved by ${req.user.email}. Comment: System auto-approval via Admin privileges`,
              actionType: 'APPROVE',
              newValue: 'System auto-approval via Admin privileges',
            }
          ] : [
            {
              userId: createdBy,
              action: `ECO '${normalizedTitle}' created (${type}) by ${req.user.email}`,
              actionType: 'CREATE',
              newValue: JSON.stringify({ type, productId, bomId: actualBomId || null }),
            },
          ],
        },
        approvals: isAdmin ? {
          create: [{
            userId: createdBy,
            approved: true,
            comment: 'System auto-approval via Admin privileges'
          }]
        } : undefined,
      },
      include: includeShape,
    });

    return res.status(201).json({
      data: mapECO(eco),
      message: warning || 'ECO created successfully',
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const submitForReview = async (req, res) => {
  try {
    const id = req.params.id;
    const stage = await findStageByStatus('IN_REVIEW');

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status !== 'NEW') return res.status(400).json({ error: 'Only NEW ECOs can be submitted for review' });

    await prisma.$transaction([
      prisma.eCO.update({ where: { id }, data: { stageId: stage.id, status: 'IN_REVIEW' } }),
      prisma.auditLog.create({
        data: {
          ecoId: id,
          userId: req.user.id,
          action: `'${eco.title}' submitted for review by ${req.user.email}`,
          actionType: 'UPDATE',
          oldValue: JSON.stringify({ status: eco.status }),
          newValue: JSON.stringify({ status: 'IN_REVIEW' }),
        },
      }),
    ]);

    return res.json({ data: { id }, message: 'ECO submitted for review' });
  } catch (error) {
    return serverError(res, error);
  }
};

const approveECO = async (req, res) => {
  try {
    const id = req.params.id;
    const comment = String(req.body.comment || '').trim();
    if (comment.length > COMMENT_MAX) {
      return res.status(400).json({ error: 'comment must be at most 1000 characters' });
    }

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status !== 'IN_REVIEW') {
      return res.status(400).json({ error: 'ECO must be submitted for review before approval' });
    }
    if (eco.userId === req.user.id) {
      return res.status(403).json({ error: 'You cannot approve your own ECO' });
    }

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
          action: `'${eco.title}' approved by ${req.user.email}. Comment: ${comment || 'No comment'}`,
          actionType: 'APPROVE',
          oldValue: JSON.stringify({ status: eco.status }),
          newValue: JSON.stringify({ status: 'APPROVED', comment: comment || null }),
        },
      }),
    ]);

    return res.json({ data: { id }, message: 'ECO approved successfully' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reviewed this ECO' });
    }
    return serverError(res, error);
  }
};

const rejectECO = async (req, res) => {
  try {
    const id = req.params.id;
    const comment = String(req.body.comment || '').trim();
    const stage = await findStageByStatus('NEW');
    if (comment.length > COMMENT_MAX) {
      return res.status(400).json({ error: 'comment must be at most 1000 characters' });
    }

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status !== 'IN_REVIEW') {
      return res.status(400).json({ error: 'ECO must be in review before rejection' });
    }

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
          action: `'${eco.title}' rejected by ${req.user.email}. Reason: ${comment || 'No reason given'}`,
          actionType: 'REJECT',
          oldValue: JSON.stringify({ status: eco.status }),
          newValue: JSON.stringify({ status: 'NEW', comment: comment || null }),
        },
      }),
    ]);

    return res.json({ data: { id }, message: 'ECO rejected successfully' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reviewed this ECO' });
    }
    return serverError(res, error);
  }
};

const applyECO = async (req, res) => {
  try {
    const id = req.params.id;
    const doneStage = await findStageByStatus('DONE');

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status === 'DONE') return res.status(400).json({ error: 'This ECO has already been applied' });
    if (eco.status !== 'APPROVED') return res.status(400).json({ error: 'ECO must be approved before applying' });

    const conflictingEco = await prisma.eCO.findFirst({
      where: {
        productId: eco.productId,
        id: { not: id },
        status: { in: ['IN_REVIEW', 'APPROVED'] },
      },
      select: { id: true, title: true, status: true },
    });

    if (conflictingEco) {
      return res.status(409).json({ error: 'Another ECO is pending for this product', data: conflictingEco });
    }

    await prisma.$transaction(async (tx) => {
      const locked = await tx.eCO.updateMany({
        where: { id, status: 'APPROVED' },
        data: { status: 'DONE', stageId: doneStage.id },
      });
      if (locked.count === 0) {
        throw new Error('This ECO has already been applied');
      }

      if (eco.type === 'PRODUCT') {
        const changes = Array.isArray(eco.productChanges) ? eco.productChanges : [];
        if (changes.length === 0) {
          throw new Error('No product changes detected in this ECO');
        }

        const product = await tx.product.findUnique({ where: { id: eco.productId } });
        if (!product) throw new Error('Product not found');

        const oldActive = await tx.productVersion.findFirst({
          where: { productId: eco.productId, status: 'ACTIVE' },
          orderBy: { version: 'desc' },
        });
        if (!oldActive) throw new Error('Active product version not found');

        const nextVersion = product.currentVersion + 1;
        const salePrice = Number(changes.find((c) => c.field === 'Sale Price')?.newValue ?? oldActive.salePrice);
        const costPrice = Number(changes.find((c) => c.field === 'Cost Price')?.newValue ?? oldActive.costPrice);

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

      if (eco.type === 'BOM') {
        const changes = Array.isArray(eco.bomComponentChanges) ? eco.bomComponentChanges : [];
        let newVersion = 1;
        let updatedComponents = [];
        let updatedOperations = [];
        let currentBomId = null;

        if (eco.bomId) {
          const currentBom = await tx.bOM.findUnique({
            where: { id: eco.bomId },
            include: { components: true, operations: true },
          });

          if (!currentBom) throw new Error('Source BOM not found');
          if (currentBom.status !== 'ACTIVE') {
            throw new Error('Source BOM has been archived — ECO cannot be applied');
          }

          currentBomId = currentBom.id;
          newVersion = currentBom.version + 1;

          const baseComponents = currentBom.components.map((c) => ({
            componentName: c.componentName,
            quantity: c.quantity,
            unit: c.unit,
          }));

          updatedComponents = baseComponents
            .map((c) => {
              const change = changes.find((x) => x.componentName === c.componentName);
              if (!change) return c;
              if (change.changeType === 'REMOVED') return null;
              if (change.changeType === 'CHANGED') return { ...c, quantity: Number(change.newQty || c.quantity) };
              return c;
            })
            .filter(Boolean);

          updatedOperations = currentBom.operations.map((o) => ({
            name: o.name,
            duration: o.duration,
            workCenter: o.workCenter,
          }));
        }

        // Add newly added components
        changes
          .filter((c) => c.changeType === 'ADDED')
          .forEach((c) => {
            updatedComponents.push({
              componentName: c.componentName,
              quantity: Number(c.newQty || 0),
              unit: 'pcs',
            });
          });

        if (currentBomId) {
          await tx.bOM.update({
            where: { id: currentBomId },
            data: { status: 'ARCHIVED' },
          });
        }

        await tx.bOM.create({
          data: {
            productId: eco.productId,
            version: newVersion,
            status: 'ACTIVE',
            components: { create: updatedComponents },
            operations: updatedOperations.length > 0 ? { create: updatedOperations } : undefined,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          ecoId: id,
          userId: req.user.id,
          action: `'${eco.title}' applied. ${eco.type === 'PRODUCT' ? 'Product' : 'BOM'} update committed`,
          actionType: 'UPDATE',
          oldValue: JSON.stringify({ status: 'APPROVED' }),
          newValue: JSON.stringify({ status: 'DONE' }),
        },
      });
    }, { isolationLevel: 'Serializable' });

    return res.json({ data: { id }, message: 'ECO applied successfully' });
  } catch (error) {
    if (error.message === 'This ECO has already been applied') {
      return res.status(409).json({ error: 'This ECO has already been applied' });
    }
    if (error.message === 'No product changes detected in this ECO') {
      return res.status(400).json({ error: 'No product changes detected in this ECO' });
    }
    if (error.message === 'Source BOM has been archived — ECO cannot be applied') {
      return res.status(400).json({ error: 'Source BOM has been archived — ECO cannot be applied' });
    }
    return serverError(res, error);
  }
};

const updateECO = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, effectiveDate, versionUpdate, productChanges, bomComponentChanges } = req.body;

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status !== 'NEW') {
      return res.status(400).json({ error: 'ECO is locked and cannot be edited after submission' });
    }

    const normalizedTitle = title == null ? eco.title : String(title).trim();
    if (!normalizedTitle) return res.status(400).json({ error: 'title is required' });
    if (normalizedTitle.length > TITLE_MAX) return res.status(400).json({ error: 'title must be at most 255 characters' });

    const updated = await prisma.eCO.update({
      where: { id },
      data: {
        title: normalizedTitle,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : eco.effectiveDate,
        versionUpdate: versionUpdate !== undefined ? versionUpdate : eco.versionUpdate,
        productChanges: productChanges ?? eco.productChanges,
        bomComponentChanges: bomComponentChanges ?? eco.bomComponentChanges,
      },
      include: includeShape,
    });

    await prisma.auditLog.create({
      data: {
        ecoId: id,
        userId: req.user.id,
        action: `ECO '${updated.title}' updated by ${req.user.email}`,
        actionType: 'UPDATE',
        oldValue: JSON.stringify({ title: eco.title, effectiveDate: eco.effectiveDate }),
        newValue: JSON.stringify({ title: updated.title, effectiveDate: updated.effectiveDate }),
      },
    });

    return res.json({ data: mapECO(updated), message: 'ECO updated successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

const deleteECO = async (req, res) => {
  try {
    const id = req.params.id;
    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) return res.status(404).json({ error: 'ECO not found' });
    if (eco.status === 'DONE') {
      return res.status(400).json({ error: 'Applied ECOs cannot be deleted — audit trail required' });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          ecoId: id,
          userId: req.user.id,
          action: `ECO '${eco.title}' deleted by ${req.user.email}`,
          actionType: 'UPDATE',
          oldValue: JSON.stringify({ status: eco.status }),
          newValue: 'Deleted',
        },
      }),
      prisma.eCO.delete({ where: { id } }),
    ]);
    return res.json({ data: { id }, message: 'ECO deleted successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  getAllECOs,
  getECOById,
  createECO,
  updateECO,
  deleteECO,
  submitForReview,
  approveECO,
  rejectECO,
  applyECO,
  stageNameToStatus,
};
