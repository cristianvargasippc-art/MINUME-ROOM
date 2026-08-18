import { Pool } from 'pg';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

const dbUrl = process.env.DATABASE_URL || '';

// Opciones del pool dimensionadas para picos de concurrencia (evento).
// DB_POOL_MAX permite ajustar el máximo de conexiones sin tocar código.
// Con el Transaction Pooler de Supabase (puerto 6543) puedes subirlo.
const commonPool = {
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX || 15),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
};

const poolConfig = dbUrl
  ? { connectionString: dbUrl, ...commonPool }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ...commonPool,
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