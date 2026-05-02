import { sql } from "../db.js";

export type CodexTaskInput = {
  orgId: string;
  agentId?: string | null;
  title: string;
  prompt: string;
  riskLevel?: "low" | "medium" | "high";
};

export async function ensureSymphonyIntegration(orgId: string): Promise<string> {
  const id = "int_symphony_codex";
  const now = Date.now();
  await sql`
    INSERT INTO integrations(id, org_id, provider, category, status, environment, scopes_json, created_at, updated_at)
    VALUES (
      ${id}, ${orgId}, 'symphony_codex_tasks', 'workflow', 'mock', 'sandbox',
      ${JSON.stringify(["codex_tasks:create", "codex_tasks:read", "codex_tasks:cancel"])},
      ${now}, ${now}
    )
    ON CONFLICT(id) DO UPDATE SET scopes_json = EXCLUDED.scopes_json, updated_at = EXCLUDED.updated_at
  `;
  return id;
}

export async function listCodexTasks(orgId: string) {
  await ensureSymphonyIntegration(orgId);
  return sql`SELECT * FROM codex_tasks WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 100`;
}

export async function createCodexTask(input: CodexTaskInput) {
  const integrationId = await ensureSymphonyIntegration(input.orgId);
  const now = Date.now();
  const id = "ctask_" + crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  const externalTaskId = "sym_" + crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  await sql`
    INSERT INTO codex_tasks(
      id, org_id, integration_id, agent_id, title, prompt, status, risk_level,
      external_task_id, result_json, created_at, updated_at
    ) VALUES (
      ${id}, ${input.orgId}, ${integrationId}, ${input.agentId ?? null},
      ${input.title}, ${input.prompt},
      ${input.riskLevel === "high" ? "queued_for_approval" : "prepared"},
      ${input.riskLevel ?? "medium"}, ${externalTaskId},
      ${JSON.stringify({
        provider: "symphony_codex_tasks",
        mode: "mock",
        externalTaskId,
        note: "Provider adapter shape is ready; real Symphony credentials are not configured in local dev.",
      })},
      ${now}, ${now}
    )
  `;
  const [task] = await sql`SELECT * FROM codex_tasks WHERE id = ${id}`;
  return task;
}
