const { prisma } = require('../lib/prisma');
const { mapBOM } = require('./_mappers');

const getAllBOMs = async (_req, res) => {
  const boms = await prisma.bOM.findMany({
    include: {
      product: true,
      components: true,
      operations: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(boms.map(mapBOM));
};

const getBOMById = async (req, res) => {
  const bom = await prisma.bOM.findUnique({
    where: { id: req.params.id },
    include: {
      product: true,
      components: true,
      operations: true,
    },
  });

  if (!bom) return res.status(404).json({ error: 'BOM not found' });
  return res.json(mapBOM(bom));
};

const createBOM = async (req, res) => {
  const { productId, components = [], operations = [] } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

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
        create: components.map((c) => ({
          componentName: c.name,
          quantity: Number(c.quantity || 0),
          unit: c.unit || 'pcs',
        })),
      },
      operations: {
        create: operations.map((o) => ({
          name: o.name,
          duration: Number(o.duration || 0),
          workCenter: o.workCenter || '',
        })),
      },
    },
    include: {
      product: true,
      components: true,
      operations: true,
    },
  });

  return res.status(201).json(mapBOM(bom));
};

const archiveBOM = async (req, res) => {
  const id = req.params.id;
  const bom = await prisma.bOM.findUnique({ where: { id } });
  if (!bom) return res.status(404).json({ error: 'BOM not found' });

  await prisma.bOM.update({ where: { id }, data: { status: 'ARCHIVED' } });
  return res.json({ ok: true });
};

module.exports = {
  getAllBOMs,
  getBOMById,
  createBOM,
  archiveBOM,
};
