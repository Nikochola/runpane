export type DbProvider = "postgres";

export type ApiConfig = {
  nodeEnv: string;
  port: number;
  dbProvider: DbProvider;
  databaseUrl?: string;
  secretProvider: "local";
};

export function loadConfig(): ApiConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 4000),
    dbProvider: "postgres",
    databaseUrl: process.env.DATABASE_URL,
    secretProvider: "local",
  };
}

export const config = loadConfig();
