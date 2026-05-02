import { sql } from "./db.js";

export type SecretProvider = {
  storeAgentSeed(agentId: string, seedHex: string): Promise<void>;
  readAgentSeed(agentId: string): Promise<string | null>;
};

class PostgresSecretProvider implements SecretProvider {
  async storeAgentSeed(agentId: string, seedHex: string) {
    await sql`
      INSERT INTO agent_secrets(agent_id, seed_hex) VALUES (${agentId}, ${seedHex})
      ON CONFLICT(agent_id) DO UPDATE SET seed_hex = EXCLUDED.seed_hex
    `;
  }

  async readAgentSeed(agentId: string) {
    const [row] = await sql<{ seed_hex: string }[]>`
      SELECT seed_hex FROM agent_secrets WHERE agent_id = ${agentId}
    `;
    return row?.seed_hex ?? null;
  }
}

export const secretProvider: SecretProvider = new PostgresSecretProvider();
