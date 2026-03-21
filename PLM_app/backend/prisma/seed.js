const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureProduct({ name, currentVersion, status, versions }) {
  const existing = await prisma.product.findFirst({ where: { name } });
  if (existing) return existing;

  return prisma.product.create({
    data: {
      name,
      currentVersion,
      status,
      versions: { create: versions },
    },
  });
}

async function ensureBom({ productId, version, status, components, operations }) {
  const existing = await prisma.bOM.findFirst({ where: { productId, version } });
  if (existing) return existing;

  return prisma.bOM.create({
    data: {
      productId,
      version,
      status,
      components: { create: components },
      operations: { create: operations },
    },
  });
}

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('Admin@123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@plm.com' },
    update: { name: 'Alice Johnson', role: 'ADMIN', password: hash },
    create: { name: 'Alice Johnson', email: 'alice@plm.com', password: hash, role: 'ADMIN' },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@plm.com' },
    update: { name: 'Bob Smith', role: 'ENGINEERING', password: hash },
    create: { name: 'Bob Smith', email: 'bob@plm.com', password: hash, role: 'ENGINEERING' },
  });
  const carol = await prisma.user.upsert({
    where: { email: 'carol@plm.com' },
    update: { name: 'Carol White', role: 'APPROVER', password: hash },
    create: { name: 'Carol White', email: 'carol@plm.com', password: hash, role: 'APPROVER' },
  });
  const david = await prisma.user.upsert({
    where: { email: 'david@plm.com' },
    update: { name: 'David Lee', role: 'OPERATIONS', password: hash },
    create: { name: 'David Lee', email: 'david@plm.com', password: hash, role: 'OPERATIONS' },
  });
  console.log('Users seeded');

  const stageNew = await prisma.eCOStage.upsert({
    where: { name: 'New' },
    update: { order: 1, requiresApproval: false },
    create: { name: 'New', order: 1, requiresApproval: false },
  });
  const stageReview = await prisma.eCOStage.upsert({
    where: { name: 'In Review' },
    update: { order: 2, requiresApproval: true },
    create: { name: 'In Review', order: 2, requiresApproval: true },
  });
  const stageDone = await prisma.eCOStage.upsert({
    where: { name: 'Done' },
    update: { order: 3, requiresApproval: false },
    create: { name: 'Done', order: 3, requiresApproval: false },
  });
  console.log('ECO stages seeded');

  const iphone = await ensureProduct({
    name: 'iPhone 17',
    currentVersion: 2,
    status: 'ACTIVE',
    versions: [
      { version: 1, salePrice: 899, costPrice: 380, status: 'ARCHIVED' },
      { version: 2, salePrice: 999, costPrice: 420, status: 'ACTIVE' },
    ],
  });
  const table = await ensureProduct({
    name: 'Wooden Table',
    currentVersion: 1,
    status: 'ACTIVE',
    versions: [{ version: 1, salePrice: 299, costPrice: 89, status: 'ACTIVE' }],
  });
  await ensureProduct({
    name: 'Legacy Speaker',
    currentVersion: 3,
    status: 'ARCHIVED',
    versions: [
      { version: 1, salePrice: 199, costPrice: 60, status: 'ARCHIVED' },
      { version: 2, salePrice: 169, costPrice: 52, status: 'ARCHIVED' },
      { version: 3, salePrice: 149, costPrice: 45, status: 'ARCHIVED' },
    ],
  });
  console.log('Products seeded');

  const tableBOM = await ensureBom({
    productId: table.id,
    version: 1,
    status: 'ACTIVE',
    components: [
      { componentName: 'Wooden Legs', quantity: 4, unit: 'pcs' },
      { componentName: 'Wooden Top', quantity: 1, unit: 'pcs' },
      { componentName: 'Screws', quantity: 12, unit: 'pcs' },
      { componentName: 'Varnish', quantity: 1, unit: 'bottle' },
    ],
    operations: [
      { name: 'Assembly', duration: 60, workCenter: 'Assembly Line' },
      { name: 'Painting', duration: 30, workCenter: 'Paint Floor' },
      { name: 'Packing', duration: 20, workCenter: 'Packaging Line' },
    ],
  });
  const iphoneBOM = await ensureBom({
    productId: iphone.id,
    version: 1,
    status: 'ACTIVE',
    components: [
      { componentName: 'OLED Display', quantity: 1, unit: 'pcs' },
      { componentName: 'A18 Chip', quantity: 1, unit: 'pcs' },
      { componentName: 'Battery 4000mAh', quantity: 1, unit: 'pcs' },
      { componentName: 'Camera Module', quantity: 3, unit: 'pcs' },
      { componentName: 'Titanium Frame', quantity: 1, unit: 'pcs' },
      { componentName: 'Screws M1', quantity: 24, unit: 'pcs' },
    ],
    operations: [
      { name: 'PCB Assembly', duration: 45, workCenter: 'Clean Room' },
      { name: 'Display Mount', duration: 20, workCenter: 'Assembly Line' },
      { name: 'QA Testing', duration: 30, workCenter: 'Testing Lab' },
      { name: 'Packaging', duration: 15, workCenter: 'Packaging Line' },
    ],
  });
  console.log('BOMs seeded');

  const eco1Title = 'ECO-001: Increase Screws for Structural Strength';
  const eco2Title = 'ECO-002: Update iPhone 17 Cost for Premium Finish';
  const eco3Title = 'ECO-003: Add Graphene Battery Component';

  const eco1Exists = await prisma.eCO.findFirst({ where: { title: eco1Title } });
  if (!eco1Exists) {
    await prisma.eCO.create({
      data: {
        title: eco1Title,
        type: 'BOM',
        productId: table.id,
        bomId: tableBOM.id,
        userId: bob.id,
        assignedToId: carol.id,
        effectiveDate: new Date('2024-11-01'),
        versionUpdate: true,
        stageId: stageDone.id,
        status: 'DONE',
        bomComponentChanges: [
          { fieldName: 'Screws', oldValue: '12', newValue: '16', changeType: 'CHANGED' },
          { fieldName: 'Quality Inspection', oldValue: '0', newValue: '10 mins', changeType: 'ADDED' },
        ],
        approvals: { create: [{ userId: carol.id, approved: true, comment: 'Reviewed feasibility - approved.' }] },
        auditLogs: {
          create: [
            { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' },
            { userId: bob.id, action: 'Moved to In Review by Bob Smith', actionType: 'UPDATE' },
            { userId: carol.id, action: 'Approved by Carol White', actionType: 'APPROVE' },
            { userId: bob.id, action: 'ECO Applied - BOM v2 created', actionType: 'UPDATE' },
          ],
        },
      },
    });
  }

  const eco2Exists = await prisma.eCO.findFirst({ where: { title: eco2Title } });
  if (!eco2Exists) {
    await prisma.eCO.create({
      data: {
        title: eco2Title,
        type: 'PRODUCT',
        productId: iphone.id,
        userId: bob.id,
        assignedToId: carol.id,
        effectiveDate: new Date('2024-12-15'),
        versionUpdate: true,
        stageId: stageReview.id,
        status: 'IN_REVIEW',
        productChanges: [
          { fieldName: 'sale_price', oldValue: '999.00', newValue: '1099.00', changeType: 'CHANGED' },
          { fieldName: 'cost_price', oldValue: '420.00', newValue: '475.00', changeType: 'CHANGED' },
        ],
        auditLogs: {
          create: [
            { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' },
            { userId: bob.id, action: 'Submitted for Review by Bob Smith', actionType: 'UPDATE' },
          ],
        },
      },
    });
  }

  const eco3Exists = await prisma.eCO.findFirst({ where: { title: eco3Title } });
  if (!eco3Exists) {
    await prisma.eCO.create({
      data: {
        title: eco3Title,
        type: 'BOM',
        productId: iphone.id,
        bomId: iphoneBOM.id,
        userId: bob.id,
        effectiveDate: new Date('2025-01-10'),
        versionUpdate: true,
        stageId: stageNew.id,
        status: 'NEW',
        bomComponentChanges: [
          { fieldName: 'Battery 4000mAh', oldValue: '1', newValue: '0', changeType: 'REMOVED' },
          { fieldName: 'Graphene Battery', oldValue: '0', newValue: '1', changeType: 'ADDED' },
          { fieldName: 'Screws M1', oldValue: '24', newValue: '28', changeType: 'CHANGED' },
        ],
        auditLogs: { create: [{ userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' }] },
      },
    });
  }

  console.log('ECOs seeded');
  console.log('Database fully seeded');
  console.log('Login credentials:');
  console.log('alice@plm.com / Admin@123');
  console.log('bob@plm.com / Admin@123');
  console.log('carol@plm.com / Admin@123');
  console.log('david@plm.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
