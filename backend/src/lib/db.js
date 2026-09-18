import { Pool } from "pg";

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://travel:travel_dev_password@localhost:5544/travel",
  max: 10,
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function transaction(fn) {
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
