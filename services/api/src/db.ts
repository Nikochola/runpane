import postgres from "postgres";
import { config } from "./config.js";

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = postgres(config.databaseUrl, {
  // Limit connections for serverless environments
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
