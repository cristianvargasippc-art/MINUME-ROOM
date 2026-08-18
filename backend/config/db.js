const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.PGHOST || process.env.RAILWAY_PGHOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.PGPORT || process.env.RAILWAY_PGPORT || 5432),
  user: process.env.DB_USER || process.env.PGUSER || process.env.RAILWAY_PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || process.env.RAILWAY_PGPASSWORD || '',
  database: process.env.DB_NAME || process.env.PGDATABASE || process.env.RAILWAY_PGDATABASE || 'minume_xvii',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const sslMode = (process.env.DB_SSL || '').toLowerCase();
if (sslMode === 'true' || sslMode === '1' || sslMode === 'required' || sslMode === 'require') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(dbConfig);

const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end()
};

module.exports = db;
