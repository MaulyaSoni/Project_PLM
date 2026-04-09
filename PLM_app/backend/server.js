const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const app = require('./src/app');
const { PORT } = require('./src/config/env');
const { startAgentScheduler: startLegacyAgentScheduler } = require('./src/services/agentScheduler.service');
const { startAgentScheduler } = require('./src/services/agent.service');

const server = app.listen(PORT, () => {
  console.log(`NIYANTRAK AI backend started successfully on port ${PORT}.`);
  if (process.env.NODE_ENV !== 'test') {
    startLegacyAgentScheduler();
    startAgentScheduler();
  }
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the old process or run a different PORT.`);
    process.exit(1);
  }
  throw error;
});
