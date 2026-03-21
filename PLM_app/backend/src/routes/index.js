const authRoutes = require('./auth.routes');
const productsRoutes = require('./products.routes');
const bomRoutes = require('./bom.routes');
const ecoRoutes = require('./eco.routes');
const reportsRoutes = require('./reports.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/boms', bomRoutes);
  app.use('/api/eco', ecoRoutes);
  app.use('/api/reports', reportsRoutes);
};

module.exports = { registerRoutes };
