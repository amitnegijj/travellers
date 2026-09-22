// Blocks until Postgres accepts connections, so `setup` can chain safely.
import pg from "pg";
import { connectionConfig } from "./connection.mjs";

const deadline = Date.now() + 60_000;

while (Date.now() < deadline) {
  const client = new pg.Client(connectionConfig({ connectionTimeoutMillis: 2000 }));
  try {
    await client.connect();
    await client.query("select 1");
    await client.end();
    console.log("  database ready");
    process.exit(0);
  } catch {
    await client.end().catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.error("  database did not become ready within 60s");
process.exit(1);
