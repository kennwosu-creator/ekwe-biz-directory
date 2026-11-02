import { Pool } from 'pg';

// Global singleton pattern to prevent pool connection leaks
const globalForDb = global;

export const pool =
  globalForDb.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production' ||
      (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase'))
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', {
        text: text.substring(0, 80),
        duration,
        rows: res.rowCount,
      });
    }
    return res;
  } catch (err) {
    console.error('[Database Query Error]:', err);
    throw err;
  }
}

export default pool;