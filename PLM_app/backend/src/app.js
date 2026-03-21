const express = require('express');
const cors = require('cors');
const { registerRoutes } = require('./routes');
const { isAllowedOrigin } = require('./config/env');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ message: 'PLM API running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok' }, message: 'Service healthy' });
});

registerRoutes(app);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const error = process.env.NODE_ENV === 'production' && status >= 500
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(status).json({ error });
});

module.exports = app;
