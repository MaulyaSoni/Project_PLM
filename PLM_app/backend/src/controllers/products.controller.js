const { prisma } = require('../lib/prisma');
const { mapProduct } = require('./_mappers');

const getAllProducts = async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      versions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(products.map(mapProduct));
};

const getProductById = async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { versions: true },
  });

  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(mapProduct(product));
};

const createProduct = async (req, res) => {
  const { name, salePrice, costPrice } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const product = await prisma.product.create({
    data: {
      name,
      currentVersion: 1,
      status: 'ACTIVE',
      versions: {
        create: {
          version: 1,
          salePrice: Number(salePrice || 0),
          costPrice: Number(costPrice || 0),
          status: 'ACTIVE',
        },
      },
    },
    include: { versions: true },
  });

  return res.status(201).json(mapProduct(product));
};

const archiveProduct = async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } }),
    prisma.productVersion.updateMany({ where: { productId: id, status: 'ACTIVE' }, data: { status: 'ARCHIVED' } }),
  ]);

  return res.json({ ok: true });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  archiveProduct,
};
