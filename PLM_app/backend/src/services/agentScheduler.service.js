const cron = require('node-cron');
const { runEcoLifecycleAgent } = require('./lifecycleAgent.service');

let schedulerTask = null;

function formatScheduleLabel(schedule) {
  if (schedule === '*/10 * * * *') return 'every 10 minutes';
  if (schedule === '*/5 * * * *') return 'every 5 minutes';
  if (schedule === '* * * * *') return 'every minute';
  return `cron: ${schedule}`;
}

function startAgentScheduler() {
  if (process.env.AGENT_SCHEDULER_ENABLED === 'false') {
    console.log('[ECO Agent Scheduler] Disabled (AGENT_SCHEDULER_ENABLED=false).');
    return null;
  }

  if (schedulerTask) {
    return schedulerTask;
  }

  const schedule = process.env.AGENT_CRON || '*/10 * * * *';
  const scheduleLabel = formatScheduleLabel(schedule);

  schedulerTask = cron.schedule(schedule, async () => {
    try {
      const result = await runEcoLifecycleAgent({ source: 'scheduler' });
      if (result.created > 0) {
        console.log(`[ECO Agent Scheduler] Created ${result.created} review nudge action(s).`);
      }
    } catch (error) {
      console.error('[ECO Agent Scheduler] Tick failed:', error.message);
    }
  });

  console.log(`[ECO Agent Scheduler] Active (${scheduleLabel}).`);
  return schedulerTask;
}

module.exports = {
  startAgentScheduler,
};
