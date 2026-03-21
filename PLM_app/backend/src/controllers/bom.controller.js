const { prisma } = require('../lib/prisma');
const { mapBOM } = require('./_mappers');

const serverError = (res, error) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error.message || 'Internal server error');
  return res.status(500).json({ error: message });
};

const getAllBOMs = async (_req, res) => {
  try {
    const boms = await prisma.bOM.findMany({
      include: {
        product: true,
        components: true,
        operations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = boms.map(mapBOM);
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getBOMById = async (req, res) => {
  try {
    const bom = await prisma.bOM.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        components: true,
        operations: true,
      },
    });

    if (!bom) return res.status(404).json({ error: 'BOM not found' });
    return res.json({ data: mapBOM(bom) });
  } catch (error) {
    return serverError(res, error);
  }
};

const createBOM = async (req, res) => {
  try {
    const { productId, components = [], operations = [] } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.status !== 'ACTIVE') return res.status(400).json({ error: 'Cannot create BOM for archived product' });

    const normalizedComponents = components
      .filter((c) => c && String(c.name || '').trim())
      .map((c) => ({
        componentName: String(c.name).trim(),
        quantity: Number(c.quantity),
        unit: String(c.unit || 'pcs').trim(),
      }));

    const duplicateNames = new Set();
    for (const component of normalizedComponents) {
      if (component.componentName.length > 100) {
        return res.status(400).json({ error: 'fieldName in changes must be at most 100 characters' });
      }
      if (!Number.isFinite(component.quantity) || component.quantity <= 0) {
        return res.status(400).json({ error: 'Component quantity must be greater than zero' });
      }
      const lowered = component.componentName.toLowerCase();
      if (duplicateNames.has(lowered)) {
        return res.status(400).json({ error: 'Duplicate component names are not allowed' });
      }
      duplicateNames.add(lowered);
    }

    const maxBom = await prisma.bOM.findFirst({
      where: { productId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (maxBom?.version || 0) + 1;

    const bom = await prisma.bOM.create({
      data: {
        productId,
        version: newVersion,
        status: 'ACTIVE',
        components: {
          create: normalizedComponents,
        },
        operations: {
          create: operations.map((o) => ({
            name: String(o.name || '').trim(),
            duration: Number(o.duration || 0),
            workCenter: String(o.workCenter || '').trim(),
          })),
        },
      },
      include: {
        product: true,
        components: true,
        operations: true,
      },
    });

    return res.status(201).json({ data: mapBOM(bom), message: 'BOM created successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

const archiveBOM = async (req, res) => {
  try {
    const id = req.params.id;
    const bom = await prisma.bOM.findUnique({ where: { id } });
    if (!bom) return res.status(404).json({ error: 'BOM not found' });

    const pendingRef = await prisma.eCO.findFirst({
      where: {
        bomId: id,
        status: { not: 'DONE' },
      },
      select: { id: true, title: true, status: true },
    });

    if (pendingRef) {
      return res.status(409).json({
        error: 'Cannot archive BOM referenced by active ECO',
        data: pendingRef,
      });
    }

    await prisma.bOM.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return res.json({ data: { id }, message: 'BOM archived successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  getAllBOMs,
  getBOMById,
  createBOM,
  archiveBOM,
};
