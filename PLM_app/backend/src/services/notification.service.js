const nodemailer = require('nodemailer');
const { prisma } = require('../lib/prisma');

function getMailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function createInAppNotification({ userId, ecoId, title, message, metadata = null }) {
  return prisma.notification.create({
    data: {
      userId,
      ecoId: ecoId || null,
      channel: 'IN_APP',
      title,
      message,
      metadata,
    },
  });
}

async function sendEmailNotification({ to, subject, text }) {
  const transport = getMailTransport();
  if (!transport) {
    console.log('[NIYANTRAK AI Notify] SMTP not configured. Skipping email:', subject);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
  return { sent: true };
}

async function notifyUser({ userId, ecoId, title, message, email }) {
  const inApp = await createInAppNotification({ userId, ecoId, title, message });
  let emailResult = { sent: false, reason: 'NO_EMAIL' };

  if (email) {
    try {
      emailResult = await sendEmailNotification({
        to: email,
        subject: title,
        text: message,
      });
    } catch (error) {
      emailResult = { sent: false, reason: error.message };
    }
  }

  return { inApp, emailResult };
}

async function notifyOperationsBriefing({ ecoId, productId, productName, ecoTitle, changeSummary }) {
  const operationsUsers = await prisma.user.findMany({
    where: { role: 'OPERATIONS', isActive: true },
    select: { id: true, email: true, name: true },
  });

  const title = `NIYANTRAK AI Operations Briefing: BOM Update ${productName}`;
  const message = [
    `ECO ${ecoTitle} has been applied for product ${productName}.`,
    `Product ID: ${productId}`,
    `Summary: ${changeSummary}`,
    'Please validate floor-routing, material staging, and work-center readiness.',
  ].join(' ');

  const results = [];
  for (const user of operationsUsers) {
    const result = await notifyUser({
      userId: user.id,
      ecoId,
      title,
      message,
      email: user.email,
    });
    results.push({ userId: user.id, ...result });
  }

  return { notified: results.length, results };
}

module.exports = {
  createInAppNotification,
  notifyUser,
  notifyOperationsBriefing,
};
