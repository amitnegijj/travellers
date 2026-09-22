// Connection settings shared by migrate, seed and wait.
//
// Local Docker Postgres has no SSL; hosted Postgres (Supabase, Neon, …)
// refuses connections without it. SSL is therefore on for any host that isn't
// this machine, unless DATABASE_SSL=true|false says otherwise.
const DEFAULT_URL = "postgresql://travel:travel_dev_password@localhost:5544/travel";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function connectionConfig(extra = {}) {
  const url = new URL(process.env.DATABASE_URL ?? DEFAULT_URL);

  const override = process.env.DATABASE_SSL;
  const useSsl = override === "true" ? true : override === "false" ? false : !LOCAL_HOSTS.has(url.hostname);

  // node-postgres lets `sslmode` in the URL override the `ssl` option below,
  // and treats `require` as full certificate verification, which rejects
  // Supabase's pooler certificate chain. The option here is the one that counts.
  url.searchParams.delete("sslmode");

  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    ...extra,
  };
}

/** Host and database only — safe to print, never includes the password. */
export function describeTarget() {
  const url = new URL(process.env.DATABASE_URL ?? DEFAULT_URL);
  return `${url.hostname}:${url.port || 5432}${url.pathname}`;
}
