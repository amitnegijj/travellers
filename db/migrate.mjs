// Forward-only migration runner. Applies every unapplied file in migrations/
// inside a transaction, recording it in schema_migrations.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "migrations");

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://travel:travel_dev_password@localhost:5544/travel";

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);

  const { rows } = await client.query("select name from schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  let count = 0;

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`  applying ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log("ok");
      count++;
    } catch (err) {
      await client.query("rollback");
      console.log("FAILED");
      console.error(`\n${file}: ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log(count === 0 ? "  already up to date" : `  ${count} migration(s) applied`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
