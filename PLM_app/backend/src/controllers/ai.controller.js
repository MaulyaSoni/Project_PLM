const { prisma } = require('../lib/prisma');
const ai = require('../services/ai.service');

// ── FEATURE 1: Generate ECO Description ──────────────────
exports.generateDescription = async (req, res) => {
  try {
    const {
      ecoTitle, ecoType, productId,
      changes, versionUpdate, effectiveDate
    } = req.body;

    if (!ecoTitle) {
      return res.status(400).json({ error: 'An ECO Title is required before generating a description.' });
    }
    if (!productId) {
      return res.status(400).json({ error: 'A valid Product must be selected first.' });
    }
    if (!changes || changes.length === 0) {
      return res.status(400).json({ error: 'At least one staged change is required for the AI to analyze.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await ai.generateECODescription({
      ecoId: req.body.ecoId || null,
      userId: req.user.id,
      ecoTitle,
      ecoType,
      productName: product.name,
      changes,
      versionUpdate: versionUpdate ?? true,
      effectiveDate: effectiveDate || null
    });

    res.json({
      success: true,
      data: result
    });

  } catch (e) {
    console.error('AI Description Error:', e.message);
    res.status(500).json({ error: 'AI generation failed: ' + e.message });
  }
};

// ── FEATURE 2: Impact Analysis (called when ECO enters IN_REVIEW) ──
exports.generateImpactAnalysis = async (req, res) => {
  try {
    const { ecoId } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id: ecoId },
      include: {
        product: {
          include: { versions: { where: { status: 'ACTIVE' } } }
        },
        assignedTo: { select: { name: true } },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!eco) return res.status(404).json({ error: 'ECO not found' });

    // Check if analysis already exists (avoid duplicate API calls)
    if (eco.aiAnalysis) {
      return res.json({
        success: true,
        data: JSON.parse(eco.aiAnalysis),
        cached: true
      });
    }

    // Count other open ECOs for same product
    const openECOsCount = await prisma.eCO.count({
      where: {
        productId: eco.productId,
        id: { not: ecoId },
        status: { in: ['NEW', 'IN_REVIEW', 'APPROVED'] }
      }
    });

    // Wait briefly to allow cache writing
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await ai.generateImpactAnalysis({
      ecoId,
      userId: req.user.id,
      ecoTitle: eco.title,
      ecoType: eco.type,
      productName: eco.product.name,
      productStatus: eco.product.status,
      currentVersion: eco.product.currentVersion,
      changes: eco.productChanges || eco.bomComponentChanges || [],
      versionUpdate: eco.versionUpdate,
      effectiveDate: eco.effectiveDate,
      recentAuditEvents: eco.auditLogs,
      openECOsCount,
      assignedApprover: eco.assignedTo?.name || null
    });

    // Cache is best-effort; analysis should still be returned even if cache write fails.
    try {
      await prisma.eCO.update({
        where: { id: ecoId },
        data: { aiAnalysis: JSON.stringify(result) }
      });
    } catch (cacheError) {
      console.warn('AI Impact cache write skipped:', cacheError.message);
    }

    res.json({ success: true, data: result, cached: false });

  } catch (e) {
    console.error('AI Impact Error:', e.message);
    res.status(500).json({ error: 'AI analysis failed: ' + e.message });
  }
};

// ── FEATURE 3: Conflict Detection ───────────────────────
exports.detectConflicts = async (req, res) => {
  try {
    const {
      ecoTitle, ecoType, productId, changes, currentEcoId
    } = req.body;

    if (!productId || !changes) {
      return res.status(400).json({
        error: 'productId and changes are required'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }
    });

    // Fetch all other open ECOs for same product
    const openECOsRaw = await prisma.eCO.findMany({
      where: {
        productId,
        status: { in: ['NEW', 'IN_REVIEW', 'APPROVED'] },
        ...(currentEcoId ? { id: { not: currentEcoId } } : {})
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        productChanges: true,
        bomComponentChanges: true
      }
    });

    const openECOs = openECOsRaw.map((eco) => ({
      ...eco,
      changes: eco.productChanges || eco.bomComponentChanges || []
    }));

    const result = await ai.detectECOConflicts({
      ecoId: currentEcoId || null,
      userId: req.user.id,
      currentECO: {
        title: ecoTitle,
        type: ecoType,
        productId,
        productName: product?.name || 'Unknown Product',
        changes
      },
      openECOs
    });

    res.json({ success: true, data: result });

  } catch (e) {
    console.error('AI Conflict Error:', e.message);
    res.status(500).json({ error: 'Conflict detection failed: ' + e.message });
  }
};

// QUALITY SCORE
exports.scoreECODraft = async (req, res) => {
  try {
    const {
      ecoId,
      title,
      type,
      productId,
      changes,
      description,
      effectiveDate,
      versionUpdate,
    } = req.body;

    if (!title || !type || !productId) {
      return res.status(400).json({ error: 'title, type, productId required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    const result = await ai.scoreECODraft({
      ecoId: ecoId || null,
      userId: req.user.id,
      title,
      type,
      productName: product?.name || 'Unknown',
      changes: changes || [],
      description: description || '',
      effectiveDate,
      versionUpdate,
    });

    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// COMPLEXITY ESTIMATE
exports.estimateComplexity = async (req, res) => {
  try {
    const { ecoId } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id: ecoId },
      include: {
        product: { include: { versions: true } },
        approvals: true,
      },
    });

    if (!eco) return res.status(404).json({ error: 'ECO not found' });

    if (eco.aiComplexityData) {
      return res.json({
        success: true,
        data: JSON.parse(eco.aiComplexityData),
        cached: true,
      });
    }

    const allProductECOs = await prisma.eCO.findMany({
      where: { productId: eco.productId },
      include: { approvals: true },
      orderBy: { createdAt: 'desc' },
    });

    const doneECOs = allProductECOs.filter((e) => e.status === 'DONE');
    let avgApprovalDays = null;

    if (doneECOs.length > 0) {
      const durations = doneECOs
        .map((e) => {
          const approval = e.approvals?.[0];
          if (!approval) return null;
          return (new Date(approval.createdAt) - new Date(e.createdAt)) / (1000 * 60 * 60 * 24);
        })
        .filter((v) => Number.isFinite(v));

      if (durations.length > 0) {
        avgApprovalDays = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }
    }

    const openECOsCount = allProductECOs.filter(
      (e) => ['NEW', 'IN_REVIEW', 'APPROVED'].includes(e.status) && e.id !== ecoId
    ).length;

    const changes = eco.bomComponentChanges || eco.productChanges || [];

    const result = await ai.estimateComplexity({
      ecoId,
      userId: req.user.id,
      title: eco.title,
      type: eco.type,
      productName: eco.product.name,
      currentVersion: eco.product.currentVersion,
      changes,
      versionUpdate: eco.versionUpdate,
      totalECOsOnProduct: allProductECOs.length,
      avgApprovalDaysHistorical: avgApprovalDays,
      openECOsOnProduct: openECOsCount,
    });

    return res.json({ success: true, data: result, cached: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// TEMPLATE SUGGESTION
exports.getTemplateSuggestion = async (req, res) => {
  try {
    const { productId, ecoType } = req.query;

    if (!productId || !ecoType) {
      return res.status(400).json({ error: 'productId and ecoType required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: String(productId) },
      include: {
        versions: { where: { status: 'ACTIVE' } },
        boms: {
          where: { status: 'ACTIVE' },
          include: { components: true },
        },
      },
    });

    if (!product) return res.status(404).json({ error: 'Not found' });

    const historicalECOs = await prisma.eCO.findMany({
      where: { productId: String(productId), status: 'DONE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const activeVersion = product.versions[0];
    const activeBOM = product.boms[0];

    const result = await ai.generateTemplateSuggestion({
      userId: req.user.id,
      productId: String(productId),
      productName: product.name,
      ecoType: String(ecoType),
      historicalECOs,
      currentBOMComponents: activeBOM?.components || [],
      currentPrices: activeVersion
        ? { salePrice: activeVersion.salePrice, costPrice: activeVersion.costPrice }
        : null,
    });

    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// PRECEDENT FINDER
exports.findPrecedents = async (req, res) => {
  try {
    const { ecoId } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id: ecoId },
      include: {
        product: true,
        approvals: { include: { user: { select: { name: true } } } },
      },
    });

    if (!eco) return res.status(404).json({ error: 'ECO not found' });

    if (eco.aiPrecedents) {
      return res.json({
        success: true,
        data: JSON.parse(eco.aiPrecedents),
        cached: true,
      });
    }

    const allDoneECOs = await prisma.eCO.findMany({
      where: { status: 'DONE' },
      include: {
        product: { select: { name: true } },
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const changes = eco.bomComponentChanges || eco.productChanges || [];

    const result = await ai.findApprovalPrecedents({
      ecoId,
      userId: req.user.id,
      title: eco.title,
      type: eco.type,
      productName: eco.product.name,
      changes,
      allDoneECOs,
    });

    return res.json({ success: true, data: result, cached: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
