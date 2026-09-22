// The one connection pool. Repositories import from here; nothing else does.
import { Pool } from "pg";
import { env } from "./env.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Local Docker Postgres has no SSL; hosted Postgres (Supabase, Neon, …)
 * refuses connections without it, so SSL is on for any non-local host.
 *
 * `sslmode` is stripped from the URL because node-postgres lets it override
 * the `ssl` option, and treats `require` as full certificate verification —
 * which rejects Supabase's pooler certificate chain.
 */
function connectionOptions() {
  const url = new URL(env.databaseUrl);
  const useSsl =
    env.databaseSsl === "true" ? true
      : env.databaseSsl === "false" ? false
        : !LOCAL_HOSTS.has(url.hostname);

  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}

export const pool = new Pool({
  ...connectionOptions(),
  // Every serverless instance opens its own pool; keep each one small so a
  // burst of instances can't exhaust the database's connection limit.
  max: env.isServerless ? 2 : 10,
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
