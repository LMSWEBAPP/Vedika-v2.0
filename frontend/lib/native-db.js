import { Pool } from 'pg';

let pool = null;

export function getNativePool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[NativeDB] Unexpected idle client error:', err.message);
    });
  }

  return pool;
}

export async function nativeQuery(text, params = []) {
  const p = getNativePool();
  if (!p) {
    return null;
  }
  const start = Date.now();
  const client = await p.connect();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    if (duration > 150) {
      console.warn(`[NativeDB] Slow query (${duration}ms): ${text.slice(0, 60)}...`);
    }
    return res;
  } finally {
    client.release();
  }
}

export default { getNativePool, nativeQuery };
