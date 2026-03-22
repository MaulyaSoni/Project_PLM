// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');

// const prisma = new PrismaClient();

// async function ensureProduct({ name, currentVersion, status, versions }) {
//   const existing = await prisma.product.findFirst({ where: { name } });
//   if (existing) return existing;

//   return prisma.product.create({
//     data: {
//       name,
//       currentVersion,
//       status,
//       versions: { create: versions },
//     },
//   });
// }

// async function ensureBom({ productId, version, status, components, operations }) {
//   const existing = await prisma.bOM.findFirst({ where: { productId, version } });
//   if (existing) return existing;

//   return prisma.bOM.create({
//     data: {
//       productId,
//       version,
//       status,
//       components: { create: components },
//       operations: { create: operations },
//     },
//   });
// }

// async function main() {
//   console.log('Seeding database...');

//   const hash = await bcrypt.hash('Admin@123', 10);

//   const alice = await prisma.user.upsert({
//     where: { email: 'alice@plm.com' },
//     update: { name: 'Alice Johnson', role: 'ADMIN', password: hash },
//     create: { name: 'Alice Johnson', email: 'alice@plm.com', password: hash, role: 'ADMIN' },
//   });
//   const bob = await prisma.user.upsert({
//     where: { email: 'bob@plm.com' },
//     update: { name: 'Bob Smith', role: 'ENGINEERING', password: hash },
//     create: { name: 'Bob Smith', email: 'bob@plm.com', password: hash, role: 'ENGINEERING' },
//   });
//   const carol = await prisma.user.upsert({
//     where: { email: 'carol@plm.com' },
//     update: { name: 'Carol White', role: 'APPROVER', password: hash },
//     create: { name: 'Carol White', email: 'carol@plm.com', password: hash, role: 'APPROVER' },
//   });
//   const david = await prisma.user.upsert({
//     where: { email: 'david@plm.com' },
//     update: { name: 'David Lee', role: 'OPERATIONS', password: hash },
//     create: { name: 'David Lee', email: 'david@plm.com', password: hash, role: 'OPERATIONS' },
//   });
//   console.log('Users seeded');

//   const stageNew = await prisma.eCOStage.upsert({
//     where: { name: 'New' },
//     update: { order: 1, requiresApproval: false },
//     create: { name: 'New', order: 1, requiresApproval: false },
//   });
//   const stageReview = await prisma.eCOStage.upsert({
//     where: { name: 'In Review' },
//     update: { order: 2, requiresApproval: true },
//     create: { name: 'In Review', order: 2, requiresApproval: true },
//   });
//   const stageDone = await prisma.eCOStage.upsert({
//     where: { name: 'Done' },
//     update: { order: 3, requiresApproval: false },
//     create: { name: 'Done', order: 3, requiresApproval: false },
//   });
//   console.log('ECO stages seeded');

//   const iphone = await ensureProduct({
//     name: 'iPhone 17',
//     currentVersion: 2,
//     status: 'ACTIVE',
//     versions: [
//       { version: 1, salePrice: 899, costPrice: 380, status: 'ARCHIVED' },
//       { version: 2, salePrice: 999, costPrice: 420, status: 'ACTIVE' },
//     ],
//   });
//   const table = await ensureProduct({
//     name: 'Wooden Table',
//     currentVersion: 1,
//     status: 'ACTIVE',
//     versions: [{ version: 1, salePrice: 299, costPrice: 89, status: 'ACTIVE' }],
//   });
//   await ensureProduct({
//     name: 'Legacy Speaker',
//     currentVersion: 3,
//     status: 'ARCHIVED',
//     versions: [
//       { version: 1, salePrice: 199, costPrice: 60, status: 'ARCHIVED' },
//       { version: 2, salePrice: 169, costPrice: 52, status: 'ARCHIVED' },
//       { version: 3, salePrice: 149, costPrice: 45, status: 'ARCHIVED' },
//     ],
//   });
//   console.log('Products seeded');

//   const tableBOM = await ensureBom({
//     productId: table.id,
//     version: 1,
//     status: 'ACTIVE',
//     components: [
//       { componentName: 'Wooden Legs', quantity: 4, unit: 'pcs' },
//       { componentName: 'Wooden Top', quantity: 1, unit: 'pcs' },
//       { componentName: 'Screws', quantity: 12, unit: 'pcs' },
//       { componentName: 'Varnish', quantity: 1, unit: 'bottle' },
//     ],
//     operations: [
//       { name: 'Assembly', duration: 60, workCenter: 'Assembly Line' },
//       { name: 'Painting', duration: 30, workCenter: 'Paint Floor' },
//       { name: 'Packing', duration: 20, workCenter: 'Packaging Line' },
//     ],
//   });
//   const iphoneBOM = await ensureBom({
//     productId: iphone.id,
//     version: 1,
//     status: 'ACTIVE',
//     components: [
//       { componentName: 'OLED Display', quantity: 1, unit: 'pcs' },
//       { componentName: 'A18 Chip', quantity: 1, unit: 'pcs' },
//       { componentName: 'Battery 4000mAh', quantity: 1, unit: 'pcs' },
//       { componentName: 'Camera Module', quantity: 3, unit: 'pcs' },
//       { componentName: 'Titanium Frame', quantity: 1, unit: 'pcs' },
//       { componentName: 'Screws M1', quantity: 24, unit: 'pcs' },
//     ],
//     operations: [
//       { name: 'PCB Assembly', duration: 45, workCenter: 'Clean Room' },
//       { name: 'Display Mount', duration: 20, workCenter: 'Assembly Line' },
//       { name: 'QA Testing', duration: 30, workCenter: 'Testing Lab' },
//       { name: 'Packaging', duration: 15, workCenter: 'Packaging Line' },
//     ],
//   });
//   console.log('BOMs seeded');

//   const eco1Title = 'ECO-001: Increase Screws for Structural Strength';
//   const eco2Title = 'ECO-002: Update iPhone 17 Cost for Premium Finish';
//   const eco3Title = 'ECO-003: Add Graphene Battery Component';

//   const eco1Exists = await prisma.eCO.findFirst({ where: { title: eco1Title } });
//   if (!eco1Exists) {
//     await prisma.eCO.create({
//       data: {
//         title: eco1Title,
//         type: 'BOM',
//         productId: table.id,
//         bomId: tableBOM.id,
//         userId: bob.id,
//         assignedToId: carol.id,
//         effectiveDate: new Date('2024-11-01'),
//         versionUpdate: true,
//         stageId: stageDone.id,
//         status: 'DONE',
//         bomComponentChanges: [
//           { fieldName: 'Screws', oldValue: '12', newValue: '16', changeType: 'CHANGED' },
//           { fieldName: 'Quality Inspection', oldValue: '0', newValue: '10 mins', changeType: 'ADDED' },
//         ],
//         approvals: { create: [{ userId: carol.id, approved: true, comment: 'Reviewed feasibility - approved.' }] },
//         auditLogs: {
//           create: [
//             { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' },
//             { userId: bob.id, action: 'Moved to In Review by Bob Smith', actionType: 'UPDATE' },
//             { userId: carol.id, action: 'Approved by Carol White', actionType: 'APPROVE' },
//             { userId: bob.id, action: 'ECO Applied - BOM v2 created', actionType: 'UPDATE' },
//           ],
//         },
//       },
//     });
//   }

//   const eco2Exists = await prisma.eCO.findFirst({ where: { title: eco2Title } });
//   if (!eco2Exists) {
//     await prisma.eCO.create({
//       data: {
//         title: eco2Title,
//         type: 'PRODUCT',
//         productId: iphone.id,
//         userId: bob.id,
//         assignedToId: carol.id,
//         effectiveDate: new Date('2024-12-15'),
//         versionUpdate: true,
//         stageId: stageReview.id,
//         status: 'IN_REVIEW',
//         productChanges: [
//           { fieldName: 'sale_price', oldValue: '999.00', newValue: '1099.00', changeType: 'CHANGED' },
//           { fieldName: 'cost_price', oldValue: '420.00', newValue: '475.00', changeType: 'CHANGED' },
//         ],
//         auditLogs: {
//           create: [
//             { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' },
//             { userId: bob.id, action: 'Submitted for Review by Bob Smith', actionType: 'UPDATE' },
//           ],
//         },
//       },
//     });
//   }

//   const eco3Exists = await prisma.eCO.findFirst({ where: { title: eco3Title } });
//   if (!eco3Exists) {
//     await prisma.eCO.create({
//       data: {
//         title: eco3Title,
//         type: 'BOM',
//         productId: iphone.id,
//         bomId: iphoneBOM.id,
//         userId: bob.id,
//         effectiveDate: new Date('2025-01-10'),
//         versionUpdate: true,
//         stageId: stageNew.id,
//         status: 'NEW',
//         bomComponentChanges: [
//           { fieldName: 'Battery 4000mAh', oldValue: '1', newValue: '0', changeType: 'REMOVED' },
//           { fieldName: 'Graphene Battery', oldValue: '0', newValue: '1', changeType: 'ADDED' },
//           { fieldName: 'Screws M1', oldValue: '24', newValue: '28', changeType: 'CHANGED' },
//         ],
//         auditLogs: { create: [{ userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE' }] },
//       },
//     });
//   }

//   console.log('ECOs seeded');
//   console.log('Database fully seeded');
//   console.log('Login credentials:');
//   console.log('alice@plm.com / Admin@123');
//   console.log('bob@plm.com / Admin@123');
//   console.log('carol@plm.com / Admin@123');
//   console.log('david@plm.com / Admin@123');
// }

// main()
//   .catch((e) => {
//     console.error('Seed failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function ensureProduct({ name, currentVersion, status, versions, createdAt }) {
  const existing = await prisma.product.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.product.create({
    data: {
      name,
      currentVersion,
      status,
      ...(createdAt && { createdAt }),
      versions: { create: versions },
    },
  });
}

async function ensureBom({ productId, version, status, components, operations, createdAt }) {
  const existing = await prisma.bOM.findFirst({ where: { productId, version } });
  if (existing) return existing;
  return prisma.bOM.create({
    data: {
      productId,
      version,
      status,
      ...(createdAt && { createdAt }),
      components: { create: components },
      operations: { create: operations },
    },
  });
}

async function ensureECO(title, data) {
  const existing = await prisma.eCO.findFirst({ where: { title } });
  if (existing) return existing;
  return prisma.eCO.create({ data: { title, ...data } });
}

async function main() {
  console.log('🌱 Seeding 300+ records...');

  // ══════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════
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
  const eve = await prisma.user.upsert({
    where: { email: 'eve@plm.com' },
    update: { name: 'Eve Martinez', role: 'ENGINEERING', password: hash },
    create: { name: 'Eve Martinez', email: 'eve@plm.com', password: hash, role: 'ENGINEERING' },
  });
  const frank = await prisma.user.upsert({
    where: { email: 'frank@plm.com' },
    update: { name: 'Frank Chen', role: 'APPROVER', password: hash },
    create: { name: 'Frank Chen', email: 'frank@plm.com', password: hash, role: 'APPROVER' },
  });
  const grace = await prisma.user.upsert({
    where: { email: 'grace@plm.com' },
    update: { name: 'Grace Kim', role: 'ENGINEERING', password: hash },
    create: { name: 'Grace Kim', email: 'grace@plm.com', password: hash, role: 'ENGINEERING' },
  });
  const henry = await prisma.user.upsert({
    where: { email: 'henry@plm.com' },
    update: { name: 'Henry Wilson', role: 'OPERATIONS', password: hash },
    create: { name: 'Henry Wilson', email: 'henry@plm.com', password: hash, role: 'OPERATIONS' },
  });

  console.log('✅ Users (8)');

  // ══════════════════════════════════════════
  // ECO STAGES
  // ══════════════════════════════════════════
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

  console.log('✅ ECO Stages (3)');

  // ══════════════════════════════════════════
  // PRODUCTS — 12 products
  // ══════════════════════════════════════════

  const iphone = await ensureProduct({
    name: 'iPhone 17',
    currentVersion: 3,
    status: 'ACTIVE',
    createdAt: daysAgo(110),
    versions: [
      { version: 1, salePrice: 899,  costPrice: 380, status: 'ARCHIVED', createdAt: daysAgo(110) },
      { version: 2, salePrice: 999,  costPrice: 420, status: 'ARCHIVED', createdAt: daysAgo(60)  },
      { version: 3, salePrice: 1099, costPrice: 475, status: 'ACTIVE',   createdAt: daysAgo(20)  },
    ],
  });

  const table = await ensureProduct({
    name: 'Wooden Table',
    currentVersion: 2,
    status: 'ACTIVE',
    createdAt: daysAgo(100),
    versions: [
      { version: 1, salePrice: 299, costPrice: 89,  status: 'ARCHIVED', createdAt: daysAgo(100) },
      { version: 2, salePrice: 349, costPrice: 102, status: 'ACTIVE',   createdAt: daysAgo(35)  },
    ],
  });

  const speaker = await ensureProduct({
    name: 'Legacy Speaker',
    currentVersion: 3,
    status: 'ARCHIVED',
    createdAt: daysAgo(200),
    versions: [
      { version: 1, salePrice: 199, costPrice: 60, status: 'ARCHIVED', createdAt: daysAgo(200) },
      { version: 2, salePrice: 169, costPrice: 52, status: 'ARCHIVED', createdAt: daysAgo(150) },
      { version: 3, salePrice: 149, costPrice: 45, status: 'ARCHIVED', createdAt: daysAgo(90)  },
    ],
  });

  const ebike = await ensureProduct({
    name: 'EcoBike Pro 500',
    currentVersion: 2,
    status: 'ACTIVE',
    createdAt: daysAgo(90),
    versions: [
      { version: 1, salePrice: 1299, costPrice: 580, status: 'ARCHIVED', createdAt: daysAgo(90) },
      { version: 2, salePrice: 1399, costPrice: 620, status: 'ACTIVE',   createdAt: daysAgo(30) },
    ],
  });

  const chair = await ensureProduct({
    name: 'ErgoChair Elite',
    currentVersion: 1,
    status: 'ACTIVE',
    createdAt: daysAgo(75),
    versions: [
      { version: 1, salePrice: 449, costPrice: 165, status: 'ACTIVE', createdAt: daysAgo(75) },
    ],
  });

  const solar = await ensureProduct({
    name: 'SolarMax 400W Panel',
    currentVersion: 2,
    status: 'ACTIVE',
    createdAt: daysAgo(85),
    versions: [
      { version: 1, salePrice: 599, costPrice: 280, status: 'ARCHIVED', createdAt: daysAgo(85) },
      { version: 2, salePrice: 649, costPrice: 295, status: 'ACTIVE',   createdAt: daysAgo(25) },
    ],
  });

  const headphones = await ensureProduct({
    name: 'SoundWave ANC Pro',
    currentVersion: 1,
    status: 'ACTIVE',
    createdAt: daysAgo(55),
    versions: [
      { version: 1, salePrice: 249, costPrice: 88, status: 'ACTIVE', createdAt: daysAgo(55) },
    ],
  });

  const coffee = await ensureProduct({
    name: 'BrewMaster Pro 3000',
    currentVersion: 3,
    status: 'ACTIVE',
    createdAt: daysAgo(150),
    versions: [
      { version: 1, salePrice: 349, costPrice: 120, status: 'ARCHIVED', createdAt: daysAgo(150) },
      { version: 2, salePrice: 379, costPrice: 132, status: 'ARCHIVED', createdAt: daysAgo(80)  },
      { version: 3, salePrice: 399, costPrice: 140, status: 'ACTIVE',   createdAt: daysAgo(15)  },
    ],
  });

  const desk = await ensureProduct({
    name: 'StandDesk Ultra 160',
    currentVersion: 2,
    status: 'ACTIVE',
    createdAt: daysAgo(95),
    versions: [
      { version: 1, salePrice: 799, costPrice: 320, status: 'ARCHIVED', createdAt: daysAgo(95) },
      { version: 2, salePrice: 849, costPrice: 338, status: 'ACTIVE',   createdAt: daysAgo(40) },
    ],
  });

  const drone = await ensureProduct({
    name: 'SkyDrone V1 Mini',
    currentVersion: 2,
    status: 'ARCHIVED',
    createdAt: daysAgo(180),
    versions: [
      { version: 1, salePrice: 499, costPrice: 195, status: 'ARCHIVED', createdAt: daysAgo(180) },
      { version: 2, salePrice: 449, costPrice: 180, status: 'ARCHIVED', createdAt: daysAgo(120) },
    ],
  });

  const purifier = await ensureProduct({
    name: 'AirClean 500 HEPA',
    currentVersion: 1,
    status: 'ACTIVE',
    createdAt: daysAgo(40),
    versions: [
      { version: 1, salePrice: 329, costPrice: 118, status: 'ACTIVE', createdAt: daysAgo(40) },
    ],
  });

  const watch = await ensureProduct({
    name: 'TimeSync Pro Watch',
    currentVersion: 2,
    status: 'ACTIVE',
    createdAt: daysAgo(70),
    versions: [
      { version: 1, salePrice: 299, costPrice: 110, status: 'ARCHIVED', createdAt: daysAgo(70) },
      { version: 2, salePrice: 349, costPrice: 128, status: 'ACTIVE',   createdAt: daysAgo(18) },
    ],
  });

  console.log('✅ Products (12, 25 versions)');

  // ══════════════════════════════════════════
  // BOMs
  // ══════════════════════════════════════════

  // iPhone BOMs — 3 versions
  const iphoneBOM1 = await ensureBom({
    productId: iphone.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(110),
    components: [
      { componentName: 'OLED Display 6.1"',  quantity: 1,  unit: 'pcs'   },
      { componentName: 'A17 Chip',           quantity: 1,  unit: 'pcs'   },
      { componentName: 'Battery 3800mAh',    quantity: 1,  unit: 'pcs'   },
      { componentName: 'Camera Module',      quantity: 1,  unit: 'pcs'   },
      { componentName: 'Aluminum Frame',     quantity: 1,  unit: 'pcs'   },
      { componentName: 'Screws M1',          quantity: 24, unit: 'pcs'   },
    ],
    operations: [
      { name: 'PCB Assembly',  duration: 45, workCenter: 'Clean Room'     },
      { name: 'Display Mount', duration: 20, workCenter: 'Assembly Line'  },
      { name: 'QA Testing',    duration: 30, workCenter: 'Testing Lab'    },
      { name: 'Packaging',     duration: 15, workCenter: 'Packaging Line' },
    ],
  });

  const iphoneBOM2 = await ensureBom({
    productId: iphone.id, version: 2,
    status: 'ARCHIVED', createdAt: daysAgo(60),
    components: [
      { componentName: 'OLED Display 6.1"',  quantity: 1,  unit: 'pcs'   },
      { componentName: 'A18 Chip',           quantity: 1,  unit: 'pcs'   },
      { componentName: 'Battery 4000mAh',    quantity: 1,  unit: 'pcs'   },
      { componentName: 'Triple Camera',      quantity: 1,  unit: 'pcs'   },
      { componentName: 'Titanium Frame',     quantity: 1,  unit: 'pcs'   },
      { componentName: 'Screws M1',          quantity: 28, unit: 'pcs'   },
      { componentName: 'NFC Antenna',        quantity: 1,  unit: 'pcs'   },
    ],
    operations: [
      { name: 'PCB Assembly',       duration: 50, workCenter: 'Clean Room'     },
      { name: 'Display Mount',      duration: 20, workCenter: 'Assembly Line'  },
      { name: 'Camera Calibration', duration: 25, workCenter: 'Optics Lab'     },
      { name: 'QA Testing',         duration: 40, workCenter: 'Testing Lab'    },
      { name: 'Packaging',          duration: 15, workCenter: 'Packaging Line' },
    ],
  });

  const iphoneBOM3 = await ensureBom({
    productId: iphone.id, version: 3,
    status: 'ACTIVE', createdAt: daysAgo(20),
    components: [
      { componentName: 'OLED Display 6.3"',      quantity: 1,  unit: 'pcs'   },
      { componentName: 'A18 Chip',               quantity: 1,  unit: 'pcs'   },
      { componentName: 'Graphene Battery 4500mAh',quantity: 1, unit: 'pcs'   },
      { componentName: 'Triple Camera',          quantity: 1,  unit: 'pcs'   },
      { componentName: 'Titanium Frame',         quantity: 1,  unit: 'pcs'   },
      { componentName: 'Screws M1',              quantity: 28, unit: 'pcs'   },
      { componentName: 'NFC Antenna',            quantity: 1,  unit: 'pcs'   },
      { componentName: 'UWB Chip',               quantity: 1,  unit: 'pcs'   },
    ],
    operations: [
      { name: 'PCB Assembly',        duration: 50, workCenter: 'Clean Room'     },
      { name: 'Display Mount',       duration: 22, workCenter: 'Assembly Line'  },
      { name: 'Camera Calibration',  duration: 25, workCenter: 'Optics Lab'     },
      { name: 'Battery Integration', duration: 18, workCenter: 'Battery Lab'    },
      { name: 'QA Testing',          duration: 45, workCenter: 'Testing Lab'    },
      { name: 'Packaging',           duration: 15, workCenter: 'Packaging Line' },
    ],
  });

  // Wooden Table BOMs — 2 versions
  const tableBOM1 = await ensureBom({
    productId: table.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(100),
    components: [
      { componentName: 'Wooden Legs',    quantity: 4,  unit: 'pcs'    },
      { componentName: 'Wooden Top',     quantity: 1,  unit: 'pcs'    },
      { componentName: 'Screws',         quantity: 12, unit: 'pcs'    },
      { componentName: 'Varnish',        quantity: 1,  unit: 'bottle' },
      { componentName: 'Sandpaper',      quantity: 4,  unit: 'pcs'    },
    ],
    operations: [
      { name: 'Assembly', duration: 60, workCenter: 'Assembly Line'  },
      { name: 'Painting', duration: 30, workCenter: 'Paint Floor'    },
      { name: 'Packing',  duration: 20, workCenter: 'Packaging Line' },
    ],
  });

  const tableBOM2 = await ensureBom({
    productId: table.id, version: 2,
    status: 'ACTIVE', createdAt: daysAgo(35),
    components: [
      { componentName: 'Wooden Legs',    quantity: 4,  unit: 'pcs'    },
      { componentName: 'Wooden Top',     quantity: 1,  unit: 'pcs'    },
      { componentName: 'Screws',         quantity: 16, unit: 'pcs'    },
      { componentName: 'Premium Varnish',quantity: 1,  unit: 'bottle' },
      { componentName: 'Sandpaper',      quantity: 4,  unit: 'pcs'    },
      { componentName: 'Corner Brackets',quantity: 4,  unit: 'pcs'    },
    ],
    operations: [
      { name: 'Assembly',           duration: 60, workCenter: 'Assembly Line'  },
      { name: 'Painting',           duration: 30, workCenter: 'Paint Floor'    },
      { name: 'Quality Inspection', duration: 10, workCenter: 'QA Lab'         },
      { name: 'Packing',            duration: 20, workCenter: 'Packaging Line' },
    ],
  });

  // EcoBike BOMs — 2 versions
  const ebikeBOM1 = await ensureBom({
    productId: ebike.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(90),
    components: [
      { componentName: 'Aluminum Frame',   quantity: 1,  unit: 'pcs' },
      { componentName: 'Motor 500W',       quantity: 1,  unit: 'pcs' },
      { componentName: 'Battery Pack 36V', quantity: 1,  unit: 'pcs' },
      { componentName: 'LCD Display',      quantity: 1,  unit: 'pcs' },
      { componentName: 'Disc Brakes',      quantity: 2,  unit: 'pcs' },
      { componentName: 'Spokes',           quantity: 36, unit: 'pcs' },
      { componentName: 'Tire 26"',         quantity: 2,  unit: 'pcs' },
    ],
    operations: [
      { name: 'Frame Assembly',  duration: 90, workCenter: 'Assembly Bay'   },
      { name: 'Motor Install',   duration: 45, workCenter: 'Electrical Bay' },
      { name: 'Battery Install', duration: 30, workCenter: 'Electrical Bay' },
      { name: 'QA Road Test',    duration: 60, workCenter: 'Test Track'     },
      { name: 'Packaging',       duration: 25, workCenter: 'Shipping Area'  },
    ],
  });

  const ebikeBOM2 = await ensureBom({
    productId: ebike.id, version: 2,
    status: 'ACTIVE', createdAt: daysAgo(30),
    components: [
      { componentName: 'Aluminum Frame',    quantity: 1,  unit: 'pcs' },
      { componentName: 'Motor 750W',        quantity: 1,  unit: 'pcs' },
      { componentName: 'Battery Pack 48V',  quantity: 1,  unit: 'pcs' },
      { componentName: 'TFT Color Display', quantity: 1,  unit: 'pcs' },
      { componentName: 'Hydraulic Brakes',  quantity: 2,  unit: 'pcs' },
      { componentName: 'Spokes',            quantity: 36, unit: 'pcs' },
      { componentName: 'Tire 27.5"',        quantity: 2,  unit: 'pcs' },
      { componentName: 'Torque Sensor',     quantity: 1,  unit: 'pcs' },
    ],
    operations: [
      { name: 'Frame Assembly',     duration: 90, workCenter: 'Assembly Bay'    },
      { name: 'Motor Install',      duration: 50, workCenter: 'Electrical Bay'  },
      { name: 'Battery Install',    duration: 30, workCenter: 'Electrical Bay'  },
      { name: 'Sensor Calibration', duration: 20, workCenter: 'Calibration Lab' },
      { name: 'QA Road Test',       duration: 75, workCenter: 'Test Track'      },
      { name: 'Packaging',          duration: 25, workCenter: 'Shipping Area'   },
    ],
  });

  // ErgoChair BOM
  const chairBOM = await ensureBom({
    productId: chair.id, version: 1,
    status: 'ACTIVE', createdAt: daysAgo(75),
    components: [
      { componentName: 'Mesh Back Panel',   quantity: 1,  unit: 'pcs' },
      { componentName: 'Seat Cushion',      quantity: 1,  unit: 'pcs' },
      { componentName: 'Aluminum Base',     quantity: 1,  unit: 'pcs' },
      { componentName: 'Gas Lift Cylinder', quantity: 1,  unit: 'pcs' },
      { componentName: 'Armrests',          quantity: 2,  unit: 'pcs' },
      { componentName: 'Casters',           quantity: 5,  unit: 'pcs' },
      { componentName: 'Bolts M8',          quantity: 16, unit: 'pcs' },
      { componentName: 'Lumbar Support',    quantity: 1,  unit: 'pcs' },
    ],
    operations: [
      { name: 'Frame Assembly', duration: 40, workCenter: 'Assembly Line'  },
      { name: 'Upholstery',     duration: 35, workCenter: 'Fabric Shop'    },
      { name: 'QA Ergonomics',  duration: 20, workCenter: 'QA Station'     },
      { name: 'Packaging',      duration: 15, workCenter: 'Packaging Area' },
    ],
  });

  // SolarMax BOMs — 2 versions
  const solarBOM1 = await ensureBom({
    productId: solar.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(85),
    components: [
      { componentName: 'Monocrystalline Cell', quantity: 60, unit: 'pcs'  },
      { componentName: 'Aluminum Frame',       quantity: 1,  unit: 'set'  },
      { componentName: 'Junction Box',         quantity: 1,  unit: 'pcs'  },
      { componentName: 'Tempered Glass',       quantity: 1,  unit: 'pcs'  },
      { componentName: 'EVA Film',             quantity: 2,  unit: 'sqm'  },
      { componentName: 'Backsheet',            quantity: 1,  unit: 'pcs'  },
      { componentName: 'MC4 Connectors',       quantity: 2,  unit: 'pcs'  },
    ],
    operations: [
      { name: 'Cell Stringing', duration: 60, workCenter: 'Solar Assembly'  },
      { name: 'Lamination',     duration: 45, workCenter: 'Lamination Press'},
      { name: 'Framing',        duration: 20, workCenter: 'Assembly Line'   },
      { name: 'EL Testing',     duration: 30, workCenter: 'Testing Lab'     },
      { name: 'Packaging',      duration: 15, workCenter: 'Shipping Area'   },
    ],
  });

  const solarBOM2 = await ensureBom({
    productId: solar.id, version: 2,
    status: 'ACTIVE', createdAt: daysAgo(25),
    components: [
      { componentName: 'PERC Solar Cell',   quantity: 60, unit: 'pcs'  },
      { componentName: 'Aluminum Frame',    quantity: 1,  unit: 'set'  },
      { componentName: 'Junction Box IP68', quantity: 1,  unit: 'pcs'  },
      { componentName: 'Tempered Glass AR', quantity: 1,  unit: 'pcs'  },
      { componentName: 'EVA Film',          quantity: 2,  unit: 'sqm'  },
      { componentName: 'Backsheet',         quantity: 1,  unit: 'pcs'  },
      { componentName: 'MC4 Connectors',    quantity: 2,  unit: 'pcs'  },
      { componentName: 'Bypass Diodes',     quantity: 3,  unit: 'pcs'  },
    ],
    operations: [
      { name: 'Cell Stringing', duration: 60, workCenter: 'Solar Assembly'  },
      { name: 'Lamination',     duration: 45, workCenter: 'Lamination Press'},
      { name: 'Framing',        duration: 20, workCenter: 'Assembly Line'   },
      { name: 'EL Testing',     duration: 30, workCenter: 'Testing Lab'     },
      { name: 'IV Curve Test',  duration: 20, workCenter: 'Testing Lab'     },
      { name: 'Packaging',      duration: 15, workCenter: 'Shipping Area'   },
    ],
  });

  // SoundWave BOM
  const headphonesBOM = await ensureBom({
    productId: headphones.id, version: 1,
    status: 'ACTIVE', createdAt: daysAgo(55),
    components: [
      { componentName: 'Driver Unit 40mm',  quantity: 2, unit: 'pcs' },
      { componentName: 'Ear Cushion',       quantity: 2, unit: 'pcs' },
      { componentName: 'Headband Cushion',  quantity: 1, unit: 'pcs' },
      { componentName: 'PCB Main Board',    quantity: 1, unit: 'pcs' },
      { componentName: 'Battery 600mAh',    quantity: 1, unit: 'pcs' },
      { componentName: 'ANC Microphone',    quantity: 4, unit: 'pcs' },
      { componentName: 'USB-C Port',        quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'PCB Soldering',   duration: 30, workCenter: 'Electronics Lab' },
      { name: 'Driver Assembly', duration: 20, workCenter: 'Assembly Line'   },
      { name: 'ANC Calibration', duration: 25, workCenter: 'Acoustic Lab'    },
      { name: 'Audio QA Test',   duration: 20, workCenter: 'Testing Lab'     },
      { name: 'Packaging',       duration: 10, workCenter: 'Packaging Area'  },
    ],
  });

  // BrewMaster BOMs — 3 versions
  const coffeeBOM1 = await ensureBom({
    productId: coffee.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(150),
    components: [
      { componentName: 'Boiler 1500W',    quantity: 1, unit: 'pcs' },
      { componentName: 'Water Tank 1.8L', quantity: 1, unit: 'pcs' },
      { componentName: 'Pump Vibratory',  quantity: 1, unit: 'pcs' },
      { componentName: 'Portafilter',     quantity: 1, unit: 'pcs' },
      { componentName: 'Control PCB',     quantity: 1, unit: 'pcs' },
      { componentName: 'Steam Wand',      quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Boiler Assembly', duration: 45, workCenter: 'Assembly Line'   },
      { name: 'PCB Install',     duration: 25, workCenter: 'Electronics Bay' },
      { name: 'Pressure Test',   duration: 30, workCenter: 'Testing Lab'     },
      { name: 'Brew QA',         duration: 20, workCenter: 'QA Kitchen'      },
      { name: 'Packaging',       duration: 15, workCenter: 'Packaging Area'  },
    ],
  });

  const coffeeBOM2 = await ensureBom({
    productId: coffee.id, version: 2,
    status: 'ARCHIVED', createdAt: daysAgo(80),
    components: [
      { componentName: 'Boiler 1800W',    quantity: 1, unit: 'pcs' },
      { componentName: 'Water Tank 2.2L', quantity: 1, unit: 'pcs' },
      { componentName: 'Pump Vibratory',  quantity: 1, unit: 'pcs' },
      { componentName: 'Portafilter Pro', quantity: 1, unit: 'pcs' },
      { componentName: 'Control PCB v2', quantity: 1, unit: 'pcs' },
      { componentName: 'Steam Wand Pro',  quantity: 1, unit: 'pcs' },
      { componentName: 'Grinder Burr',    quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Boiler Assembly', duration: 45, workCenter: 'Assembly Line'   },
      { name: 'Grinder Install', duration: 30, workCenter: 'Assembly Line'   },
      { name: 'PCB Install',     duration: 25, workCenter: 'Electronics Bay' },
      { name: 'Pressure Test',   duration: 30, workCenter: 'Testing Lab'     },
      { name: 'Brew QA',         duration: 25, workCenter: 'QA Kitchen'      },
      { name: 'Packaging',       duration: 15, workCenter: 'Packaging Area'  },
    ],
  });

  const coffeeBOM3 = await ensureBom({
    productId: coffee.id, version: 3,
    status: 'ACTIVE', createdAt: daysAgo(15),
    components: [
      { componentName: 'Boiler 1800W',         quantity: 1, unit: 'pcs' },
      { componentName: 'Water Tank 2.2L',      quantity: 1, unit: 'pcs' },
      { componentName: 'Pump Vibratory',       quantity: 1, unit: 'pcs' },
      { componentName: 'Portafilter Pro',      quantity: 1, unit: 'pcs' },
      { componentName: 'Control PCB v3',       quantity: 1, unit: 'pcs' },
      { componentName: 'Steam Wand Pro',       quantity: 1, unit: 'pcs' },
      { componentName: 'Grinder Burr Conical', quantity: 1, unit: 'pcs' },
      { componentName: 'Touch Display 3.5"',   quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Boiler Assembly',    duration: 45, workCenter: 'Assembly Line'   },
      { name: 'Grinder Install',    duration: 30, workCenter: 'Assembly Line'   },
      { name: 'PCB Install',        duration: 25, workCenter: 'Electronics Bay' },
      { name: 'Display Integration',duration: 20, workCenter: 'Electronics Bay' },
      { name: 'Pressure Test',      duration: 30, workCenter: 'Testing Lab'     },
      { name: 'Brew QA',            duration: 25, workCenter: 'QA Kitchen'      },
      { name: 'Packaging',          duration: 15, workCenter: 'Packaging Area'  },
    ],
  });

  // StandDesk BOMs — 2 versions
  const deskBOM1 = await ensureBom({
    productId: desk.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(95),
    components: [
      { componentName: 'Desktop Surface 160cm', quantity: 1, unit: 'pcs' },
      { componentName: 'Leg Frame Steel',        quantity: 1, unit: 'set' },
      { componentName: 'Motor Linear',           quantity: 2, unit: 'pcs' },
      { componentName: 'Control Box',            quantity: 1, unit: 'pcs' },
      { componentName: 'Bolt Kit M6',            quantity: 1, unit: 'kit' },
      { componentName: 'Anti-Collision Sensor',  quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Frame Welding',    duration: 60, workCenter: 'Welding Bay'   },
      { name: 'Motor Assembly',   duration: 40, workCenter: 'Assembly Line' },
      { name: 'Surface Mounting', duration: 30, workCenter: 'Assembly Line' },
      { name: 'Height Test',      duration: 25, workCenter: 'QA Station'    },
      { name: 'Packaging',        duration: 20, workCenter: 'Shipping Area' },
    ],
  });

  const deskBOM2 = await ensureBom({
    productId: desk.id, version: 2,
    status: 'ACTIVE', createdAt: daysAgo(40),
    components: [
      { componentName: 'Desktop Surface 160cm', quantity: 1, unit: 'pcs' },
      { componentName: 'Leg Frame Steel',        quantity: 1, unit: 'set' },
      { componentName: 'Motor Linear',           quantity: 2, unit: 'pcs' },
      { componentName: 'Control Box v2',         quantity: 1, unit: 'pcs' },
      { componentName: 'Bolt Kit M6',            quantity: 1, unit: 'kit' },
      { componentName: 'Anti-Collision Sensor',  quantity: 2, unit: 'pcs' },
      { componentName: 'USB Hub 4-Port',         quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Frame Welding',    duration: 60, workCenter: 'Welding Bay'    },
      { name: 'Motor Assembly',   duration: 40, workCenter: 'Assembly Line'  },
      { name: 'Surface Mounting', duration: 30, workCenter: 'Assembly Line'  },
      { name: 'USB Integration',  duration: 15, workCenter: 'Electronics Bay'},
      { name: 'Height Test',      duration: 25, workCenter: 'QA Station'     },
      { name: 'Packaging',        duration: 20, workCenter: 'Shipping Area'  },
    ],
  });

  // TimeSync BOMs — 2 versions
  const watchBOM1 = await ensureBom({
    productId: watch.id, version: 1,
    status: 'ARCHIVED', createdAt: daysAgo(70),
    components: [
      { componentName: 'AMOLED Display 1.4"', quantity: 1, unit: 'pcs' },
      { componentName: 'SoC Processor',       quantity: 1, unit: 'pcs' },
      { componentName: 'Battery 300mAh',      quantity: 1, unit: 'pcs' },
      { componentName: 'Heart Rate Sensor',   quantity: 1, unit: 'pcs' },
      { componentName: 'GPS Module',          quantity: 1, unit: 'pcs' },
      { componentName: 'Stainless Case',      quantity: 1, unit: 'pcs' },
      { componentName: 'Silicone Strap',      quantity: 1, unit: 'set' },
    ],
    operations: [
      { name: 'PCB Assembly',    duration: 35, workCenter: 'Micro Assembly' },
      { name: 'Display Bonding', duration: 20, workCenter: 'Optics Lab'     },
      { name: 'Sensor QA',       duration: 25, workCenter: 'Testing Lab'    },
      { name: 'Water Test',      duration: 20, workCenter: 'Testing Lab'    },
      { name: 'Packaging',       duration: 10, workCenter: 'Packaging Area' },
    ],
  });

  const watchBOM2 = await ensureBom({
    productId: watch.id, version: 2,
    status: 'ACTIVE', createdAt: daysAgo(18),
    components: [
      { componentName: 'AMOLED Display 1.4"', quantity: 1, unit: 'pcs' },
      { componentName: 'SoC Processor v2',    quantity: 1, unit: 'pcs' },
      { componentName: 'Battery 420mAh',      quantity: 1, unit: 'pcs' },
      { componentName: 'Heart Rate Sensor',   quantity: 1, unit: 'pcs' },
      { componentName: 'GPS + Compass',       quantity: 1, unit: 'pcs' },
      { componentName: 'Stainless Case',      quantity: 1, unit: 'pcs' },
      { componentName: 'Silicone Strap',      quantity: 1, unit: 'set' },
      { componentName: 'SpO2 Sensor',         quantity: 1, unit: 'pcs' },
      { componentName: 'ECG Module',          quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'PCB Assembly',      duration: 35, workCenter: 'Micro Assembly' },
      { name: 'Display Bonding',   duration: 20, workCenter: 'Optics Lab'     },
      { name: 'Health Sensor Cal', duration: 30, workCenter: 'Medical Lab'    },
      { name: 'Water Test IP68',   duration: 25, workCenter: 'Testing Lab'    },
      { name: 'Packaging',         duration: 10, workCenter: 'Packaging Area' },
    ],
  });

  // AirClean BOM
  const purifierBOM = await ensureBom({
    productId: purifier.id, version: 1,
    status: 'ACTIVE', createdAt: daysAgo(40),
    components: [
      { componentName: 'HEPA H13 Filter', quantity: 1, unit: 'pcs' },
      { componentName: 'Carbon Filter',   quantity: 1, unit: 'pcs' },
      { componentName: 'Pre-Filter',      quantity: 1, unit: 'pcs' },
      { componentName: 'Fan Motor 40W',   quantity: 1, unit: 'pcs' },
      { componentName: 'PM2.5 Sensor',    quantity: 1, unit: 'pcs' },
      { componentName: 'Control PCB',     quantity: 1, unit: 'pcs' },
      { componentName: 'LED Ring',        quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { name: 'Filter Assembly', duration: 25, workCenter: 'Clean Room'      },
      { name: 'Motor Install',   duration: 20, workCenter: 'Assembly Line'   },
      { name: 'PCB Install',     duration: 15, workCenter: 'Electronics Bay' },
      { name: 'Air Flow Test',   duration: 30, workCenter: 'Testing Lab'     },
      { name: 'Packaging',       duration: 10, workCenter: 'Packaging Area'  },
    ],
  });

  console.log('✅ BOMs (14 BOMs, 90+ components, 60+ operations)');

  // ══════════════════════════════════════════
  // ECOs — 20 across all statuses
  // ══════════════════════════════════════════

  // ── DONE ECOs (10) ──

  const eco1 = await ensureECO('ECO-001: Increase Screw Count for Structural Integrity', {
    type: 'BOM', productId: table.id, bomId: tableBOM1.id,
    userId: bob.id, assignedToId: carol.id,
    effectiveDate: daysAgo(36), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(50),
    bomComponentChanges: [
      { fieldName: 'Screws',          oldValue: '12', newValue: '16', changeType: 'CHANGED'  },
      { fieldName: 'Corner Brackets', oldValue: '0',  newValue: '4',  changeType: 'ADDED'    },
      { fieldName: 'Premium Varnish', oldValue: '0',  newValue: '1',  changeType: 'ADDED'    },
      { fieldName: 'Varnish',         oldValue: '1',  newValue: '0',  changeType: 'REMOVED'  },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'Structural improvement validated. Approved.',
      createdAt: daysAgo(38)
    }]},
    auditLogs: { create: [
      { userId: bob.id,   action: 'ECO Created by Bob Smith',        actionType: 'CREATE',  createdAt: daysAgo(50) },
      { userId: bob.id,   action: 'Submitted for Review by Bob',     actionType: 'UPDATE',  createdAt: daysAgo(48) },
      { userId: carol.id, action: 'Approved by Carol White',         actionType: 'APPROVE', createdAt: daysAgo(38) },
      { userId: bob.id,   action: 'ECO Applied — BOM v1 → v2',      actionType: 'UPDATE',  createdAt: daysAgo(36) },
    ]},
  });

  const eco2 = await ensureECO('ECO-002: iPhone 17 Price Update for Premium Components', {
    type: 'PRODUCT', productId: iphone.id,
    userId: bob.id, assignedToId: frank.id,
    effectiveDate: daysAgo(58), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(70),
    productChanges: [
      { fieldName: 'sale_price', oldValue: '899.00', newValue: '999.00', changeType: 'CHANGED' },
      { fieldName: 'cost_price', oldValue: '380.00', newValue: '420.00', changeType: 'CHANGED' },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'Price increase justified by component upgrade.',
      createdAt: daysAgo(62)
    }]},
    auditLogs: { create: [
      { userId: bob.id,   action: 'ECO Created by Bob Smith',        actionType: 'CREATE',  createdAt: daysAgo(70) },
      { userId: bob.id,   action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(68) },
      { userId: frank.id, action: 'Approved by Frank Chen',          actionType: 'APPROVE', createdAt: daysAgo(62) },
      { userId: bob.id,   action: 'Applied — iPhone v1 → v2 $899→$999', actionType: 'UPDATE', createdAt: daysAgo(58) },
    ]},
  });

  const eco3 = await ensureECO('ECO-003: iPhone 17 — Graphene Battery Upgrade', {
    type: 'BOM', productId: iphone.id, bomId: iphoneBOM2.id,
    userId: eve.id, assignedToId: carol.id,
    effectiveDate: daysAgo(19), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(35),
    bomComponentChanges: [
      { fieldName: 'Battery 4000mAh',        oldValue: '1', newValue: '0',  changeType: 'REMOVED' },
      { fieldName: 'Graphene Battery 4500mAh',oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'UWB Chip',               oldValue: '0', newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'OLED Display 6.1"',      oldValue: '1', newValue: '0',  changeType: 'REMOVED' },
      { fieldName: 'OLED Display 6.3"',      oldValue: '0', newValue: '1',  changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'Battery upgrade improves experience. Cleared.',
      createdAt: daysAgo(22)
    }]},
    auditLogs: { create: [
      { userId: eve.id,   action: 'ECO Created by Eve Martinez',     actionType: 'CREATE',  createdAt: daysAgo(35) },
      { userId: eve.id,   action: 'Submitted for Review by Eve',     actionType: 'UPDATE',  createdAt: daysAgo(33) },
      { userId: carol.id, action: 'Approved by Carol White',         actionType: 'APPROVE', createdAt: daysAgo(22) },
      { userId: eve.id,   action: 'Applied — iPhone BOM v2 → v3',   actionType: 'UPDATE',  createdAt: daysAgo(19) },
    ]},
  });

  const eco4 = await ensureECO('ECO-004: EcoBike — Motor and Battery Upgrade 750W/48V', {
    type: 'BOM', productId: ebike.id, bomId: ebikeBOM1.id,
    userId: grace.id, assignedToId: frank.id,
    effectiveDate: daysAgo(29), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(42),
    bomComponentChanges: [
      { fieldName: 'Motor 500W',        oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Motor 750W',        oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Battery Pack 36V',  oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Battery Pack 48V',  oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'LCD Display',       oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'TFT Color Display', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Disc Brakes',       oldValue: '2', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Hydraulic Brakes',  oldValue: '0', newValue: '2', changeType: 'ADDED'   },
      { fieldName: 'Torque Sensor',     oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'Performance upgrade complete. All safety checks passed.',
      createdAt: daysAgo(32)
    }]},
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim',        actionType: 'CREATE',  createdAt: daysAgo(42) },
      { userId: grace.id, action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(40) },
      { userId: frank.id, action: 'Approved by Frank Chen',          actionType: 'APPROVE', createdAt: daysAgo(32) },
      { userId: grace.id, action: 'Applied — EcoBike BOM v1 → v2',  actionType: 'UPDATE',  createdAt: daysAgo(29) },
    ]},
  });

  const eco5 = await ensureECO('ECO-005: BrewMaster — Add Integrated Burr Grinder', {
    type: 'BOM', productId: coffee.id, bomId: coffeeBOM1.id,
    userId: bob.id, assignedToId: carol.id,
    effectiveDate: daysAgo(79), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(95),
    bomComponentChanges: [
      { fieldName: 'Grinder Burr',    oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Portafilter',     oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Portafilter Pro', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Boiler 1500W',    oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Boiler 1800W',    oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Water Tank 1.8L', oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Water Tank 2.2L', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'Grinder integration approved.',
      createdAt: daysAgo(82)
    }]},
    auditLogs: { create: [
      { userId: bob.id,   action: 'ECO Created by Bob Smith',        actionType: 'CREATE',  createdAt: daysAgo(95) },
      { userId: bob.id,   action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(93) },
      { userId: carol.id, action: 'Approved by Carol White',         actionType: 'APPROVE', createdAt: daysAgo(82) },
      { userId: bob.id,   action: 'Applied — BrewMaster BOM v1 → v2',actionType: 'UPDATE', createdAt: daysAgo(79) },
    ]},
  });

  const eco6 = await ensureECO('ECO-006: BrewMaster — Touch Display and Conical Grinder', {
    type: 'BOM', productId: coffee.id, bomId: coffeeBOM2.id,
    userId: eve.id, assignedToId: frank.id,
    effectiveDate: daysAgo(14), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(28),
    bomComponentChanges: [
      { fieldName: 'Grinder Burr',         oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Grinder Burr Conical', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Touch Display 3.5"',   oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Control PCB v2',       oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Control PCB v3',       oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'UX upgrade approved. Touch display adds premium feel.',
      createdAt: daysAgo(17)
    }]},
    auditLogs: { create: [
      { userId: eve.id,   action: 'ECO Created by Eve Martinez',     actionType: 'CREATE',  createdAt: daysAgo(28) },
      { userId: eve.id,   action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(26) },
      { userId: frank.id, action: 'Approved by Frank Chen',          actionType: 'APPROVE', createdAt: daysAgo(17) },
      { userId: eve.id,   action: 'Applied — BrewMaster BOM v2 → v3',actionType: 'UPDATE', createdAt: daysAgo(14) },
    ]},
  });

  const eco7 = await ensureECO('ECO-007: SolarMax — Upgrade to PERC Cells and IP68 Box', {
    type: 'BOM', productId: solar.id, bomId: solarBOM1.id,
    userId: grace.id, assignedToId: carol.id,
    effectiveDate: daysAgo(24), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(38),
    bomComponentChanges: [
      { fieldName: 'Monocrystalline Cell', oldValue: '60', newValue: '0',  changeType: 'REMOVED' },
      { fieldName: 'PERC Solar Cell',      oldValue: '0',  newValue: '60', changeType: 'ADDED'   },
      { fieldName: 'Junction Box',         oldValue: '1',  newValue: '0',  changeType: 'REMOVED' },
      { fieldName: 'Junction Box IP68',    oldValue: '0',  newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'Tempered Glass',       oldValue: '1',  newValue: '0',  changeType: 'REMOVED' },
      { fieldName: 'Tempered Glass AR',    oldValue: '0',  newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'Bypass Diodes',        oldValue: '0',  newValue: '3',  changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'PERC upgrade improves efficiency by 5%. Approved.',
      createdAt: daysAgo(27)
    }]},
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim',        actionType: 'CREATE',  createdAt: daysAgo(38) },
      { userId: grace.id, action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(36) },
      { userId: carol.id, action: 'Approved by Carol White',         actionType: 'APPROVE', createdAt: daysAgo(27) },
      { userId: grace.id, action: 'Applied — SolarMax BOM v1 → v2', actionType: 'UPDATE',  createdAt: daysAgo(24) },
    ]},
  });

  const eco8 = await ensureECO('ECO-008: StandDesk — USB Hub and Dual Collision Sensor', {
    type: 'BOM', productId: desk.id, bomId: deskBOM1.id,
    userId: bob.id, assignedToId: frank.id,
    effectiveDate: daysAgo(39), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(55),
    bomComponentChanges: [
      { fieldName: 'USB Hub 4-Port',       oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Control Box',          oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Control Box v2',       oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Anti-Collision Sensor',oldValue: '1', newValue: '2', changeType: 'CHANGED' },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'USB hub and safety sensor improvements approved.',
      createdAt: daysAgo(42)
    }]},
    auditLogs: { create: [
      { userId: bob.id,   action: 'ECO Created by Bob Smith',        actionType: 'CREATE',  createdAt: daysAgo(55) },
      { userId: bob.id,   action: 'Submitted for Review',            actionType: 'UPDATE',  createdAt: daysAgo(53) },
      { userId: frank.id, action: 'Approved by Frank Chen',          actionType: 'APPROVE', createdAt: daysAgo(42) },
      { userId: bob.id,   action: 'Applied — StandDesk BOM v1 → v2',actionType: 'UPDATE',  createdAt: daysAgo(39) },
    ]},
  });

  const eco9 = await ensureECO('ECO-009: TimeSync — Add SpO2 and ECG Health Sensors', {
    type: 'BOM', productId: watch.id, bomId: watchBOM1.id,
    userId: grace.id, assignedToId: carol.id,
    effectiveDate: daysAgo(17), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(32),
    bomComponentChanges: [
      { fieldName: 'SpO2 Sensor',     oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'ECG Module',      oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'SoC Processor',   oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'SoC Processor v2',oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Battery 300mAh',  oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Battery 420mAh',  oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'GPS Module',      oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'GPS + Compass',   oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'Health sensor addition adds significant user value.',
      createdAt: daysAgo(20)
    }]},
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim',         actionType: 'CREATE',  createdAt: daysAgo(32) },
      { userId: grace.id, action: 'Submitted for Review',             actionType: 'UPDATE',  createdAt: daysAgo(30) },
      { userId: carol.id, action: 'Approved by Carol White',          actionType: 'APPROVE', createdAt: daysAgo(20) },
      { userId: grace.id, action: 'Applied — TimeSync BOM v1 → v2',  actionType: 'UPDATE',  createdAt: daysAgo(17) },
    ]},
  });

  const eco10 = await ensureECO('ECO-010: iPhone 17 — Final Price Adjustment v3', {
    type: 'PRODUCT', productId: iphone.id,
    userId: eve.id, assignedToId: frank.id,
    effectiveDate: daysAgo(19), versionUpdate: true,
    stageId: stageDone.id, status: 'DONE', createdAt: daysAgo(25),
    productChanges: [
      { fieldName: 'sale_price', oldValue: '999.00',  newValue: '1099.00', changeType: 'CHANGED' },
      { fieldName: 'cost_price', oldValue: '420.00',  newValue: '475.00',  changeType: 'CHANGED' },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'Graphene battery cost justifies price increase.',
      createdAt: daysAgo(21)
    }]},
    auditLogs: { create: [
      { userId: eve.id,   action: 'ECO Created by Eve Martinez',      actionType: 'CREATE',  createdAt: daysAgo(25) },
      { userId: eve.id,   action: 'Submitted for Review',             actionType: 'UPDATE',  createdAt: daysAgo(23) },
      { userId: frank.id, action: 'Approved by Frank Chen',           actionType: 'APPROVE', createdAt: daysAgo(21) },
      { userId: eve.id,   action: 'Applied — iPhone v2 → v3 $999→$1099', actionType: 'UPDATE', createdAt: daysAgo(19) },
    ]},
  });

  // ── IN_REVIEW ECOs (4) ──

  const eco11 = await ensureECO('ECO-011: EcoBike — Price Revision After Motor Upgrade', {
    type: 'PRODUCT', productId: ebike.id,
    userId: grace.id, assignedToId: carol.id,
    effectiveDate: daysFromNow(5), versionUpdate: true,
    stageId: stageReview.id, status: 'IN_REVIEW', createdAt: daysAgo(12),
    productChanges: [
      { fieldName: 'sale_price', oldValue: '1299.00', newValue: '1399.00', changeType: 'CHANGED' },
      { fieldName: 'cost_price', oldValue: '580.00',  newValue: '620.00',  changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim',         actionType: 'CREATE', createdAt: daysAgo(12) },
      { userId: grace.id, action: 'Submitted for Review by Grace',    actionType: 'UPDATE', createdAt: daysAgo(10) },
    ]},
  });

  const eco12 = await ensureECO('ECO-012: ErgoChair — Add Headrest and Footrest Option', {
    type: 'BOM', productId: chair.id, bomId: chairBOM.id,
    userId: bob.id, assignedToId: frank.id,
    effectiveDate: daysFromNow(3), versionUpdate: true,
    stageId: stageReview.id, status: 'IN_REVIEW', createdAt: daysAgo(8),
    bomComponentChanges: [
      { fieldName: 'Headrest Cushion', oldValue: '0', newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'Footrest Bracket', oldValue: '0', newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'Bolts M8',         oldValue: '16',newValue: '20', changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: bob.id, action: 'ECO Created by Bob Smith',           actionType: 'CREATE', createdAt: daysAgo(8) },
      { userId: bob.id, action: 'Submitted for Review',               actionType: 'UPDATE', createdAt: daysAgo(6) },
    ]},
  });

  const eco13 = await ensureECO('ECO-013: AirClean — Upgrade to Medical Grade HEPA H14', {
    type: 'BOM', productId: purifier.id, bomId: purifierBOM.id,
    userId: eve.id, assignedToId: carol.id,
    effectiveDate: daysFromNow(7), versionUpdate: true,
    stageId: stageReview.id, status: 'IN_REVIEW', createdAt: daysAgo(6),
    bomComponentChanges: [
      { fieldName: 'HEPA H13 Filter',  oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'HEPA H14 Medical', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Pre-Filter',       oldValue: '1', newValue: '2', changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: eve.id, action: 'ECO Created by Eve Martinez',        actionType: 'CREATE', createdAt: daysAgo(6) },
      { userId: eve.id, action: 'Submitted for Review',               actionType: 'UPDATE', createdAt: daysAgo(4) },
    ]},
  });

  const eco14 = await ensureECO('ECO-014: SoundWave ANC — Add Spatial Audio DSP Unit', {
    type: 'BOM', productId: headphones.id, bomId: headphonesBOM.id,
    userId: grace.id, assignedToId: frank.id,
    effectiveDate: daysFromNow(10), versionUpdate: true,
    stageId: stageReview.id, status: 'IN_REVIEW', createdAt: daysAgo(4),
    bomComponentChanges: [
      { fieldName: 'Spatial Audio DSP', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Battery 600mAh',    oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Battery 800mAh',    oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim',         actionType: 'CREATE', createdAt: daysAgo(4) },
      { userId: grace.id, action: 'Submitted for Review',             actionType: 'UPDATE', createdAt: daysAgo(3) },
    ]},
  });

  // ── APPROVED ECOs (2) ──

  const eco15 = await ensureECO('ECO-015: Wooden Table — Price Update for v2 Materials', {
    type: 'PRODUCT', productId: table.id,
    userId: bob.id, assignedToId: carol.id,
    effectiveDate: daysFromNow(3), versionUpdate: true,
    stageId: stageReview.id, status: 'APPROVED', createdAt: daysAgo(15),
    productChanges: [
      { fieldName: 'sale_price', oldValue: '299.00', newValue: '349.00', changeType: 'CHANGED' },
      { fieldName: 'cost_price', oldValue: '89.00',  newValue: '102.00', changeType: 'CHANGED' },
    ],
    approvals: { create: [{
      userId: carol.id, approved: true,
      comment: 'Premium material cost justified. Ready to apply.',
      createdAt: daysAgo(10)
    }]},
    auditLogs: { create: [
      { userId: bob.id,   action: 'ECO Created by Bob Smith',         actionType: 'CREATE',  createdAt: daysAgo(15) },
      { userId: bob.id,   action: 'Submitted for Review',             actionType: 'UPDATE',  createdAt: daysAgo(13) },
      { userId: carol.id, action: 'Approved by Carol White',          actionType: 'APPROVE', createdAt: daysAgo(10) },
    ]},
  });

  const eco16 = await ensureECO('ECO-016: EcoBike — Add Integrated LED Headlight System', {
    type: 'BOM', productId: ebike.id, bomId: ebikeBOM2.id,
    userId: eve.id, assignedToId: frank.id,
    effectiveDate: daysFromNow(7), versionUpdate: true,
    stageId: stageReview.id, status: 'APPROVED', createdAt: daysAgo(10),
    bomComponentChanges: [
      { fieldName: 'LED Headlight 80lm', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Taillight LED',      oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Light Controller',   oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Wiring Harness',     oldValue: '1', newValue: '2', changeType: 'CHANGED' },
    ],
    approvals: { create: [{
      userId: frank.id, approved: true,
      comment: 'Safety improvement. LED system approved.',
      createdAt: daysAgo(5)
    }]},
    auditLogs: { create: [
      { userId: eve.id,   action: 'ECO Created by Eve Martinez',      actionType: 'CREATE',  createdAt: daysAgo(10) },
      { userId: eve.id,   action: 'Submitted for Review',             actionType: 'UPDATE',  createdAt: daysAgo(8)  },
      { userId: frank.id, action: 'Approved by Frank Chen',           actionType: 'APPROVE', createdAt: daysAgo(5)  },
    ]},
  });

  // ── NEW ECOs (4) ──

  const eco17 = await ensureECO('ECO-017: iPhone 17 — Add Satellite Connectivity Module', {
    type: 'BOM', productId: iphone.id, bomId: iphoneBOM3.id,
    userId: bob.id,
    effectiveDate: daysFromNow(14), versionUpdate: true,
    stageId: stageNew.id, status: 'NEW', createdAt: daysAgo(3),
    bomComponentChanges: [
      { fieldName: 'Satellite Modem', oldValue: '0', newValue: '1',  changeType: 'ADDED'   },
      { fieldName: 'Screws M1',       oldValue: '28',newValue: '32', changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE', createdAt: daysAgo(3) },
    ]},
  });

  const eco18 = await ensureECO('ECO-018: SolarMax — Increase Cell Count for 500W Output', {
    type: 'BOM', productId: solar.id, bomId: solarBOM2.id,
    userId: grace.id,
    effectiveDate: daysFromNow(10), versionUpdate: true,
    stageId: stageNew.id, status: 'NEW', createdAt: daysAgo(2),
    bomComponentChanges: [
      { fieldName: 'PERC Solar Cell', oldValue: '60', newValue: '72', changeType: 'CHANGED' },
      { fieldName: 'Bypass Diodes',   oldValue: '3',  newValue: '4',  changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: grace.id, action: 'ECO Created by Grace Kim', actionType: 'CREATE', createdAt: daysAgo(2) },
    ]},
  });

  const eco19 = await ensureECO('ECO-019: ErgoChair Elite — Price Revision Q1 2025', {
    type: 'PRODUCT', productId: chair.id,
    userId: eve.id,
    effectiveDate: daysFromNow(20), versionUpdate: false,
    stageId: stageNew.id, status: 'NEW', createdAt: daysAgo(1),
    productChanges: [
      { fieldName: 'sale_price', oldValue: '449.00', newValue: '499.00', changeType: 'CHANGED' },
      { fieldName: 'cost_price', oldValue: '165.00', newValue: '178.00', changeType: 'CHANGED' },
    ],
    auditLogs: { create: [
      { userId: eve.id, action: 'ECO Created by Eve Martinez', actionType: 'CREATE', createdAt: daysAgo(1) },
    ]},
  });

  const eco20 = await ensureECO('ECO-020: AirClean 500 — Add WiFi Smart Control Module', {
    type: 'BOM', productId: purifier.id, bomId: purifierBOM.id,
    userId: bob.id,
    effectiveDate: daysFromNow(25), versionUpdate: true,
    stageId: stageNew.id, status: 'NEW', createdAt: daysAgo(1),
    bomComponentChanges: [
      { fieldName: 'WiFi Module ESP32', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
      { fieldName: 'Control PCB',       oldValue: '1', newValue: '0', changeType: 'REMOVED' },
      { fieldName: 'Smart Control PCB', oldValue: '0', newValue: '1', changeType: 'ADDED'   },
    ],
    auditLogs: { create: [
      { userId: bob.id, action: 'ECO Created by Bob Smith', actionType: 'CREATE', createdAt: daysAgo(1) },
    ]},
  });

  console.log('✅ ECOs (20 — 10 DONE, 4 IN_REVIEW, 2 APPROVED, 4 NEW)');

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('📊 Record count:');
  console.log('  Users:            8');
  console.log('  ECO Stages:       3');
  console.log('  Products:        12  (10 Active, 2 Archived)');
  console.log('  Product Versions: 25');
  console.log('  BOMs:            14  (multi-version per product)');
  console.log('  BOM Components:  90+');
  console.log('  BOM Operations:  65+');
  console.log('  ECOs:            20');
  console.log('  ECO Changes:    100+ (via bomComponentChanges/productChanges)');
  console.log('  Approvals:       12');
  console.log('  Audit Logs:      48');
  console.log('  TOTAL:          300+ records');
  console.log('');
  console.log('🔑 Login (all password: Admin@123)');
  console.log('  alice@plm.com  → ADMIN');
  console.log('  bob@plm.com    → ENGINEERING');
  console.log('  carol@plm.com  → APPROVER');
  console.log('  david@plm.com  → OPERATIONS');
  console.log('  eve@plm.com    → ENGINEERING');
  console.log('  frank@plm.com  → APPROVER');
  console.log('  grace@plm.com  → ENGINEERING');
  console.log('  henry@plm.com  → OPERATIONS');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());