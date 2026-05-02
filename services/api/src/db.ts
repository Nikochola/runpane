import postgres from "postgres";
import { config } from "./config.js";

if (config.dbProvider !== "postgres") {
  throw new Error(
    "SQLite support has been removed. Set RUNPANE_DB_PROVIDER=postgres and DATABASE_URL in .env",
  );
}

export const sql = postgres(config.databaseUrl!);
