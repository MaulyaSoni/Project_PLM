const { prisma } = require('../lib/prisma');
const { mapProduct } = require('./_mappers');

const serverError = (res, error) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error.message || 'Internal server error');
  return res.status(500).json({ error: message });
};

const getAllProducts = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = products.map(mapProduct);
    return res.json({ data, total: data.length });
  } catch (error) {
    return serverError(res, error);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { versions: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ data: mapProduct(product) });
  } catch (error) {
    return serverError(res, error);
  }
};

const createProduct = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const salePrice = Number(req.body.salePrice);
    const costPrice = Number(req.body.costPrice);

    if (!name || name.length < 2) return res.status(400).json({ error: 'Product name is required' });
    if (name.length > 255) return res.status(400).json({ error: 'Product name must be at most 255 characters' });
    if (!Number.isFinite(salePrice)) return res.status(400).json({ error: 'Sale price must be a valid number' });
    if (!Number.isFinite(costPrice)) return res.status(400).json({ error: 'Cost price must be a valid number' });
    if (salePrice < 0 || costPrice < 0) return res.status(400).json({ error: 'Prices cannot be negative' });

    const product = await prisma.product.create({
      data: {
        name,
        currentVersion: 1,
        status: 'ACTIVE',
        versions: {
          create: {
            version: 1,
            salePrice,
            costPrice,
            status: 'ACTIVE',
          },
        },
      },
      include: { versions: true },
    });

    return res.status(201).json({ data: mapProduct(product), message: 'Product created successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

const archiveProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const pendingEcos = await prisma.eCO.findMany({
      where: {
        productId: id,
        status: { in: ['NEW', 'IN_REVIEW', 'APPROVED'] },
      },
      select: { id: true, title: true, status: true },
    });

    if (pendingEcos.length > 0) {
      return res.status(409).json({
        error: 'Cannot archive product with pending ECOs',
        data: pendingEcos,
      });
    }

    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } }),
      prisma.productVersion.updateMany({ where: { productId: id, status: 'ACTIVE' }, data: { status: 'ARCHIVED' } }),
    ]);

    return res.json({ data: { id }, message: 'Product archived successfully' });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  archiveProduct,
};
