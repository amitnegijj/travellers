import { Pool } from "pg";

// Reuse the pool across HMR reloads in dev, or you exhaust connections fast.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://travel:travel_dev_password@localhost:5544/travel",
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function transaction<T>(
  fn: (q: (text: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(async (text, params = []) => {
      const r = await client.query(text, params);
      return r.rows;
    });
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
