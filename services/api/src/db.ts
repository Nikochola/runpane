import postgres from "postgres";
import { config } from "./config.js";

if (!config.databaseUrl) {
  // Log loudly so Vercel's runtime log captures it before the crash
  console.error("[runpane] FATAL: DATABASE_URL environment variable is not set.");
  console.error("[runpane] Set it in Vercel → Project Settings → Environment Variables.");
  process.exit(1);
}

export const sql = postgres(config.databaseUrl, {
  // Limit connections for serverless environments
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  // Required for Supabase Transaction Pooler (PgBouncer in transaction mode)
  // Prepared statements are not supported in transaction pooling mode
  prepare: false,
});
