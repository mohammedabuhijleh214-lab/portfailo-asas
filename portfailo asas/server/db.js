/**
 * PostgreSQL pool + helpers
 */
import pg from 'pg';

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required in server/.env');
    }
    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function withClient(fn) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
