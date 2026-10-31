import { Pool } from 'pg';
import { unstable_noStore as noStore } from 'next/cache';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/local_directory_db',
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