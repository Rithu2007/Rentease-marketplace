const { Pool } = require('pg');
const path = require('path');
// Ensure environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432'),
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'yourpassword',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'rentease',
      max: 20, // connection pool limit
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
