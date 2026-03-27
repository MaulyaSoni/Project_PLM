const toDateOnly = (dateValue) => {
  if (!dateValue) return null;
  return new Date(dateValue).toISOString().split('T')[0];
};

const mapProduct = (product) => {
  const sortedVersions = [...product.versions].sort((a, b) => b.version - a.version);
  const activeVersion = sortedVersions.find((v) => v.status === 'ACTIVE') || sortedVersions[0];

  return {
    id: product.id,
    name: product.name,
    currentVersion: product.currentVersion,
    salePrice: activeVersion?.salePrice || 0,
    costPrice: activeVersion?.costPrice || 0,
    status: product.status,
    createdAt: toDateOnly(product.createdAt),
    versions: sortedVersions
      .sort((a, b) => a.version - b.version)
      .map((v) => ({
        version: v.version,
        salePrice: v.salePrice,
        costPrice: v.costPrice,
        status: v.status,
        createdAt: toDateOnly(v.createdAt),
        createdVia: v.createdVia || undefined,
      })),
  };
};

const mapBOM = (bom) => {
  return {
    id: bom.id,
    productId: bom.productId,
    productName: bom.product.name,
    currentVersion: bom.version,
    status: bom.status,
    createdAt: toDateOnly(bom.createdAt),
    components: bom.components.map((c) => ({
      id: c.id,
      name: c.componentName,
      quantity: c.quantity,
      unit: c.unit,
    })),
    operations: bom.operations.map((o) => ({
      id: o.id,
      name: o.name,
      duration: o.duration,
      workCenter: o.workCenter,
    })),
    versions: [{
      version: bom.version,
      status: bom.status,
      createdAt: toDateOnly(bom.createdAt),
      components: [],
      operations: [],
    }],
  };
};

const mapECO = (eco) => {
  return {
    id: eco.id,
    title: eco.title,
    type: eco.type,
    productId: eco.productId,
    productName: eco.product.name,
    bomId: eco.bomId || undefined,
    assignedTo: eco.assignedToId || eco.userId,
    assignedToName: eco.assignedTo ? eco.assignedTo.name : eco.user.name,
    stage: eco.stage.name === 'In Review' ? 'IN_REVIEW' : eco.stage.name.toUpperCase().replace(' ', '_'),
    status: eco.status,
    effectiveDate: toDateOnly(eco.effectiveDate),
    versionUpdate: eco.versionUpdate,
    createdBy: eco.userId,
    createdByName: eco.user.name,
    createdAt: toDateOnly(eco.createdAt),
    productChanges: eco.productChanges || undefined,
    bomComponentChanges: eco.bomComponentChanges || undefined,
    aiAnalysis: eco.aiAnalysis || undefined,
    aiQualityScore: eco.aiQualityScore || undefined,
    aiComplexityData: eco.aiComplexityData || undefined,
    aiTemplateSuggestion: eco.aiTemplateSuggestion || undefined,
    aiPrecedents: eco.aiPrecedents || undefined,
    aiSummary: eco.aiSummary || undefined,
    aiTags: eco.aiTags ? JSON.parse(eco.aiTags) : undefined,
    description: eco.description || undefined,
    approvals: eco.approvals.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      action: a.approved ? 'APPROVED' : 'REJECTED',
      comment: a.comment || '',
      date: toDateOnly(a.createdAt),
      checklistCompleted: a.checklistCompleted || false,
    })),
    auditLog: eco.auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      actionType: l.actionType,
      ecoId: l.ecoId || undefined,
      ecoTitle: eco.title,
      userId: l.userId,
      userName: l.user.name,
      oldValue: l.oldValue || undefined,
      newValue: l.newValue || undefined,
      timestamp: l.createdAt.toISOString(),
    })),
  };
};

module.exports = {
  toDateOnly,
  mapProduct,
  mapBOM,
  mapECO,
};
