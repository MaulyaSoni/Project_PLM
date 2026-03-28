const cron = require('node-cron');
const { runEcoLifecycleAgent } = require('./lifecycleAgent.service');

let schedulerTask = null;

function startAgentScheduler() {
  if (process.env.AGENT_SCHEDULER_ENABLED === 'false') {
    console.log('[AgentScheduler] Disabled via AGENT_SCHEDULER_ENABLED=false');
    return null;
  }

  if (schedulerTask) {
    return schedulerTask;
  }

  const schedule = process.env.AGENT_CRON || '*/10 * * * *';

  schedulerTask = cron.schedule(schedule, async () => {
    try {
      const result = await runEcoLifecycleAgent({ source: 'scheduler' });
      if (result.created > 0) {
        console.log(`[AgentScheduler] Created ${result.created} review nudge action(s).`);
      }
    } catch (error) {
      console.error('[AgentScheduler] Tick failed:', error.message);
    }
  });

  console.log(`[AgentScheduler] Started with cron: ${schedule}`);
  return schedulerTask;
}

module.exports = {
  startAgentScheduler,
};
