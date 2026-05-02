import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");
const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set. Postgres migrations available:");
  for (const file of files) console.log(`- services/api/migrations/${file}`);
  console.log("Set DATABASE_URL and rerun `pnpm --filter @runpane/api migrate` to apply them with psql.");
  process.exit(0);
}

for (const file of files) {
  const path = join(migrationsDir, file);
  console.log(`applying ${file}`);
  const result = spawnSync("psql", [process.env.DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-f", path], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("migrations applied");
