// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Import all route files
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart.routes');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment.routes');
const profileRoutes = require('./routes/profile.routes');
const addressRoutes = require('./routes/address.routes');
const inventoryRoutes = require('./routes/inventory');

const app = express();

// ────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────
app.use(cors({
  origin: '*', // In production → change to your frontend URL(s)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check / welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'AAGAM Backend API is running (MySQL + Sequelize)',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ────────────────────────────────────────────────
// Database connection & server start
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL connection established successfully.');
    return sequelize.sync({ alter: true }); // alter: true = safe schema updates
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`╔════════════════════════════════════════════╗`);
      console.log(`║   AAGAM Backend Server                    ║`);
      console.log(`║   Running on http://localhost:${PORT}         ║`);
      console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}                  ║`);
      console.log(`╚════════════════════════════════════════════╝`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Optional: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  sequelize.close().then(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
