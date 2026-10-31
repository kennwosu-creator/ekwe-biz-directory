import { Pool } from 'pg';
import { unstable_noStore as noStore } from 'next/cache';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/local_directory_db';

// Enable SSL ONLY if connecting to remote databases (e.g. Supabase, AWS, Netlify)
const requiresSSL = 
  connectionString.includes('supabase') || 
  connectionString.includes('amazonaws.com') ||
  (process.env.NODE_ENV === 'production' && !connectionString.includes('localhost'));

if (requiresSSL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const pool = new Pool({
  connectionString,
  ssl: requiresSSL
    ? {
        rejectUnauthorized: false,
      }
    : false,
  connectionTimeoutMillis: 10000,
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