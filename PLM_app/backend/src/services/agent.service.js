const cron = require('node-cron');
const Groq = require('groq-sdk');
const { prisma } = require('../lib/prisma');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

async function agentReason(systemPrompt, userPrompt) {
  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error('[Agent] Reasoning failed:', e.message);
    return { action: 'none', reason: 'reasoning_failed' };
  }
}

async function recordAction({ ecoId, targetUserId, actionType, reasoning, context }) {
  return prisma.agentAction.create({
    data: {
      ecoId: ecoId || null,
      targetUserId: targetUserId || null,
      actionType,
      reasoning,
      context: JSON.stringify(context),
      message: reasoning || actionType,
      reason: reasoning || null,
      source: 'agentic',
      executedAt: new Date(),
    },
  }).catch((e) => console.error('[Agent] Record failed:', e.message));
}

async function alreadyActedRecently(ecoId, actionType, hours = 24) {
  const cutoff = new Date(Date.now() - hours * 3600000);
  const where = {
    actionType,
    createdAt: { gte: cutoff },
  };

  if (ecoId) {
    where.ecoId = ecoId;
  }

  const found = await prisma.agentAction.findFirst({ where });
  return !!found;
}

async function runECOLifecycleAgent() {
  console.log('[Agent] ECO Lifecycle check starting...');

  const openECOs = await prisma.eCO.findMany({
    where: { status: { in: ['NEW', 'IN_REVIEW', 'APPROVED'] } },
    include: {
      product: { select: { name: true } },
      user: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      approvals: true,
    },
  });

  let nudgesSent = 0;

  for (const eco of openECOs) {
    try {
      const ageDays = (Date.now() - new Date(eco.createdAt)) / (1000 * 60 * 60 * 24);

      let expectedDays = 3;
      if (eco.aiComplexityData) {
        try {
          const c = JSON.parse(eco.aiComplexityData);
          expectedDays = Number(c.estimated_approval_days || c.estimated_approval_days_range || 3) || 3;
        } catch {
          expectedDays = 3;
        }
      }

      const isOverdue = ageDays > expectedDays * 1.5;
      if (!isOverdue) continue;

      const alreadyNudged = await alreadyActedRecently(eco.id, 'NUDGE_SENT', 24);
      if (alreadyNudged) continue;

      const decision = await agentReason(
        `You monitor ECO workflows in NIYANTRAK AI.
         An ECO is overdue. Decide whether to send a nudge.

         Respond ONLY with JSON:
         {
           "action": "nudge" | "none",
           "target": "engineer" | "approver",
           "reason": "one sentence why",
           "message": "nudge message shown in UI (max 80 chars)",
           "urgency": "LOW" | "MEDIUM" | "HIGH"
         }`,
        `ECO: "${eco.title}"
         Status: ${eco.status}
         Age: ${ageDays.toFixed(1)} days
         Expected: ${expectedDays} days
         Assignee: ${eco.assignedTo?.name || 'Unassigned'}
         Approvals received: ${eco.approvals?.length || 0}`
      );

      if (decision.action !== 'nudge') continue;

      await recordAction({
        ecoId: eco.id,
        targetUserId: eco.userId,
        actionType: 'NUDGE_SENT',
        reasoning: decision.reason,
        context: {
          ecoStatus: eco.status,
          ageDays: +ageDays.toFixed(1),
          expectedDays,
          urgency: decision.urgency,
          message: decision.message,
        },
      });

      nudgesSent++;
      console.log(`[Agent] Nudge -> ECO "${eco.title}": ${decision.message}`);
    } catch (e) {
      console.error(`[Agent] ECO ${eco.id} eval error:`, e.message);
    }
  }

  console.log(`[Agent] Lifecycle done. ${openECOs.length} checked, ${nudgesSent} nudged.`);
}

async function runBottleneckDetector() {
  console.log('[Agent] Bottleneck detection starting...');

  const [inReview, approved, approverCount, recentDone] = await Promise.all([
    prisma.eCO.count({ where: { status: 'IN_REVIEW' } }),
    prisma.eCO.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'APPROVER' } }),
    prisma.eCO.count({
      where: {
        status: 'DONE',
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
  ]);

  const backlogPerApprover = approverCount > 0 ? (inReview / approverCount).toFixed(1) : inReview;

  const analysis = await agentReason(
    `You are a capacity planning agent for NIYANTRAK AI.
     Analyze ECO throughput and identify bottlenecks.

     Respond ONLY with JSON:
     {
       "has_bottleneck": true,
       "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
       "bottleneck_stage": "IN_REVIEW" | "APPROVED" | "none",
       "summary": "one sentence for admin",
       "recommendation": "specific action for admin to take",
       "days_until_critical": 7
     }`,
    `ECOs in review: ${inReview}
     ECOs approved but not applied: ${approved}
     Active approvers: ${approverCount}
     ECOs per approver: ${backlogPerApprover}
     ECOs completed this week: ${recentDone}`
  );

  if (analysis.has_bottleneck && ['HIGH', 'CRITICAL'].includes(analysis.severity)) {
    const alreadyFlagged = await alreadyActedRecently(null, 'BOTTLENECK_FLAGGED', 6);
    if (!alreadyFlagged) {
      await recordAction({
        actionType: 'BOTTLENECK_FLAGGED',
        reasoning: analysis.summary,
        context: {
          inReview,
          approved,
          approverCount,
          recentDone,
          severity: analysis.severity,
          recommendation: analysis.recommendation,
        },
      });
      console.log(`[Agent] BOTTLENECK: ${analysis.summary}`);
    }
  }

  console.log('[Agent] Bottleneck detection done.');
  return analysis;
}

function startAgentScheduler() {
  console.log('[Agent] NIYANTRAK AI Agent Scheduler starting...');

  cron.schedule('0 * * * *', async () => {
    try {
      await runECOLifecycleAgent();
    } catch (e) {
      console.error('[Agent] Lifecycle error:', e.message);
    }
  });

  cron.schedule('0 */6 * * *', async () => {
    try {
      await runBottleneckDetector();
    } catch (e) {
      console.error('[Agent] Bottleneck error:', e.message);
    }
  });

  setTimeout(async () => {
    console.log('[Agent] Running startup checks...');
    try {
      await runECOLifecycleAgent();
      await runBottleneckDetector();
    } catch (e) {
      console.error('[Agent] Startup error:', e.message);
    }
  }, 8000);

  console.log('[Agent] Scheduler active. Hourly ECO + 6h bottleneck.');
}

module.exports = {
  startAgentScheduler,
  runECOLifecycleAgent,
  runBottleneckDetector,
};
