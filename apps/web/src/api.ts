import { createClient } from "./lib/supabase/client";

const BASE = "/api";

async function getHumanId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function req<T = any>(path: string, init?: RequestInit): Promise<T> {
  const humanId = await getHumanId();
  const r = await fetch(BASE + path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(humanId ? { "x-human-id": humanId } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

export const api = {
  ping: () => req("/"),
  orgs: () => req<{ orgs: any[] }>("/orgs"),
  createOrg: (name: string) =>
    req("/orgs", { method: "POST", body: JSON.stringify({ name }) }),
  orgSummary: (orgId: string) => req(`/orgs/${orgId}/summary`),
  agents: (orgId: string) => req<{ agents: any[] }>(`/orgs/${orgId}/agents`),
  createAgent: (
    orgId: string,
    agent: {
      name: string;
      kind?: string;
      connectionMode?: "managed" | "sdk";
      runtimeUrl?: string;
      publicKey?: string;
    },
  ) => req(`/orgs/${orgId}/agents`, { method: "POST", body: JSON.stringify(agent) }),
  agent: (id: string) => req(`/agents/${id}`),
  passport: (id: string) => req(`/agents/${id}/passport`),
  issueGrant: (agentId: string, capability: string, constraints: any[] = []) =>
    req(`/agents/${agentId}/grants`, { method: "POST", body: JSON.stringify({ capability, constraints }) }),
  revokeGrant: (agentId: string, grantId: string) =>
    req(`/agents/${agentId}/grants/${grantId}/revoke`, { method: "POST", body: JSON.stringify({}) }),
  approvals: (orgId: string) => req<{ approvals: any[] }>(`/orgs/${orgId}/approvals`),
  approve: (id: string) =>
    req(`/approvals/${id}/approve`, { method: "POST", body: JSON.stringify({}) }),
  reject: (id: string) =>
    req(`/approvals/${id}/reject`, { method: "POST", body: JSON.stringify({}) }),
  receipts: (orgId: string) => req<{ receipts: any[] }>(`/orgs/${orgId}/receipts`),
  receipt: (orgId: string, id: string) => req<{ receipt: any }>(`/orgs/${orgId}/receipts/${id}`),
  verifyChain: (orgId: string) => req<{ ok: boolean; brokenAt?: string }>(`/orgs/${orgId}/audit/verify`),
  auditEvents: (orgId: string) => req<{ events: any[] }>(`/orgs/${orgId}/audit/events`),
  apiKeys: (orgId: string) => req<{ keys: any[] }>(`/orgs/${orgId}/api-keys`),
  createApiKey: (orgId: string, key: { label: string; environment: string; role: string }) =>
    req(`/orgs/${orgId}/api-keys`, { method: "POST", body: JSON.stringify(key) }),
  revokeApiKey: (orgId: string, id: string) =>
    req(`/orgs/${orgId}/api-keys/${id}`, { method: "DELETE" }),
  integrations: (orgId: string) => req<{ integrations: any[] }>(`/orgs/${orgId}/integrations`),
  connectIntegration: (orgId: string, id: string) =>
    req(`/orgs/${orgId}/integrations/${id}/connect`, { method: "POST", body: JSON.stringify({}) }),
  codexTasks: (orgId: string) => req<{ tasks: any[] }>(`/orgs/${orgId}/codex-tasks`),
  createCodexTask: (orgId: string, task: { title: string; prompt: string; agentId?: string; riskLevel?: string }) =>
    req(`/orgs/${orgId}/codex-tasks`, { method: "POST", body: JSON.stringify(task) }),
  billing: (orgId: string) => req(`/orgs/${orgId}/billing`),
  settings: (orgId: string) => req(`/orgs/${orgId}/settings`),
  invoices: (orgId: string) => req<{ invoices: any[] }>(`/orgs/${orgId}/invoices`),
  vendors: (orgId: string) => req<{ vendors: any[] }>(`/orgs/${orgId}/vendors`),
  revokeFacet: (agentId: string, facetHash: string) =>
    req(`/agents/${agentId}/revoke-facet`, {
      method: "POST",
      body: JSON.stringify({ facetHash }),
    }),
};
