const { Pool } = require('pg');

// TimescaleDB Connection Configuration
// TimescaleDB is built on PostgreSQL, so we use the pg library
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Alternatively, you can use connectionString: process.env.DATABASE_URL
});

module.exports = pool;
