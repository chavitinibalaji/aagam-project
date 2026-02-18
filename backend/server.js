require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/address', require('./routes/address.routes'));

// Test route
app.get('/', (req, res) => res.send('AAGAM Backend (MySQL) is running'));

// Start server
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => console.log('MySQL Connected'))
  .then(() => sequelize.sync({ alter: true })) // creates/updates tables
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.log('Database connection error:', err));
