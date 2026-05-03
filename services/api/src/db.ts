import postgres from "postgres";
import { config } from "./config.js";

// Use a stub when DATABASE_URL is missing so the process doesn't crash —
// the error surfaces as a JSON 500 instead of FUNCTION_INVOCATION_FAILED.
function createSql() {
  if (!config.databaseUrl) {
    console.error("[runpane] DATABASE_URL is not set — every DB call will return an error");
    return (() =>
      Promise.reject(new Error("DATABASE_URL is not configured. Set it in Vercel → Project Settings → Environment Variables."))) as unknown as ReturnType<
      typeof postgres
    >;
  }
  return postgres(config.databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 5, // fail fast — keeps us under Vercel/Railway timeouts
    ssl: "require",     // Supabase always requires TLS
    prepare: false,     // required for Supabase Transaction Pooler (Supavisor)
  });
}

export const sql = createSql();
