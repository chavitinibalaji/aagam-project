// backend/config/db.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Load environment variables with fallback values
const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
};

console.log('[DB Config] Connecting with:', {
  database: dbConfig.database,
  username: dbConfig.username,
  host: dbConfig.host,
  port: dbConfig.port,
  // do NOT log password in production!
});

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,               // set to console.log for debugging queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,           // automatically add createdAt/updatedAt
      underscored: true,          // use snake_case for columns (optional)
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    // Important: ensure database is selected
    dialectOptions: {
      multipleStatements: true,
      connectTimeout: 30000
    }
  }
);

// Test connection immediately (very useful for debugging)
sequelize.authenticate()
  .then(() => {
    console.log('MySQL connection has been established successfully.');
    console.log('Database name:', dbConfig.database);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    console.error('Please check:');
    console.error('  1. Is MySQL running? → sudo systemctl status mysql');
    console.error('  2. Correct DB_NAME, DB_USER, DB_PASSWORD in .env?');
    console.error('  3. bind-address in my.cnf set to 127.0.0.1 or 0.0.0.0?');
    console.error('  4. Port 3306 open? → sudo netstat -tuln | grep 3306');
  });

// Optional: sync models (uncomment only in development)
// sequelize.sync({ alter: true })
//   .then(() => console.log('Database synced successfully'))
//   .catch(err => console.error('Sync failed:', err));

module.exports = sequelize;
