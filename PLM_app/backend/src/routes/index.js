const authRoutes = require('./auth.routes');
const productsRoutes = require('./products.routes');
const bomRoutes = require('./bom.routes');
const ecoRoutes = require('./eco.routes');
const reportsRoutes = require('./reports.routes');
const settingsRoutes = require('./settings.routes');
const aiRoutes = require('./ai.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/boms', bomRoutes);
  app.use('/api/eco', ecoRoutes);
  app.use('/api/ecos', ecoRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/ai', aiRoutes);
};

module.exports = { registerRoutes };
