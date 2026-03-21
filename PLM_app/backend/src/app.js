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
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'PLM API running' });
});

registerRoutes(app);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
