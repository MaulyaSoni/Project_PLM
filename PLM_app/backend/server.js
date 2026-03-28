const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const app = require('./src/app');
const { PORT } = require('./src/config/env');
const { startAgentScheduler } = require('./src/services/agentScheduler.service');

const server = app.listen(PORT, () => {
  console.log(`PLM Backend started successfully on port ${PORT}.`);
  startAgentScheduler();
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the old process or run a different PORT.`);
    process.exit(1);
  }
  throw error;
});
