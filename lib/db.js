import { Pool } from 'pg';
import { unstable_noStore as noStore } from 'next/cache';

// Detect if running in production or connecting to a remote cloud DB (Supabase)
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/local_directory_db';

const isProduction = process.env.NODE_ENV === 'production' || connectionString.includes('supabase');

const pool = new Pool({
  connectionString,
  ssl: isProduction
    ? {
        rejectUnauthorized: false, // Required for Netlify serverless functions to connect to Supabase
      }
    : false,
  connectionTimeoutMillis: 10000, // 10s connection timeout for serverless functions
  idleTimeoutMillis: 30000,
  max: 10,
});

export async function query(text, params) {
  noStore();

  const start = performance.now();
  const res = await pool.query(text, params);
  const duration = Math.round(performance.now() - start);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DB QUERY] Executed in ${duration}ms:`, text);
  }

  return res;
}

export default pool;