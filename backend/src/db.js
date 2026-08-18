import { Pool } from 'pg';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl += `${separator}connection_limit=10&pool_timeout=30`;
}

const poolConfig = dbUrl
  ? { connectionString: dbUrl, ssl: isProduction ? { rejectUnauthorized: false } : false }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const db = {
  query: (text, params) => pool.query(text, params),
  getConnection: () => pool.connect(),
  end: () => pool.end(),
};

export default db;