export type DbProvider = "sqlite" | "postgres";

export type ApiConfig = {
  nodeEnv: string;
  port: number;
  dbProvider: DbProvider;
  sqlitePath: string;
  databaseUrl?: string;
  secretProvider: "local";
};

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Invalid config value "${value}". Expected one of: ${allowed.join(", ")}`);
}

export function loadConfig(): ApiConfig {
  const dbProvider = oneOf(process.env.RUNPANE_DB_PROVIDER, ["sqlite", "postgres"] as const, "sqlite");
  if (dbProvider === "postgres" && !process.env.DATABASE_URL) {
    throw new Error("RUNPANE_DB_PROVIDER=postgres requires DATABASE_URL");
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 4000),
    dbProvider,
    sqlitePath: process.env.RUNPANE_DB ?? "./runpane.db",
    databaseUrl: process.env.DATABASE_URL,
    secretProvider: "local",
  };
}

export const config = loadConfig();
