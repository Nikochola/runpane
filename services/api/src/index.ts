import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Crystal, Ratchet, type CrystalT } from "@runpane/passport";
import { DEFAULT_FINANCE_POLICY } from "@runpane/policy";
import { config } from "./config.js";
import { sql } from "./db.js";
import * as Audit from "./audit.js";
import * as Gateway from "./gateway.js";
import { listSurfacesFor, getSurface } from "./surfaces.js";
import { createCodexTask, listCodexTasks } from "./integrations/symphony.js";
import { secretProvider } from "./secrets.js";

const app = new Hono();
app.use("/*", cors());

app.get("/", (c) => c.json({ name: "runpane", version: "0.1.0", status: "ok" }));
app.get("/health", (c) => c.json({ ok: true, db: "up", mode: config.nodeEnv, dbProvider: config.dbProvider }));

// ─── HELPERS ───────────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<string, number> = {
  viewer: 1, developer: 2, operator: 3, admin: 4, owner: 5,
};

async function assertRole(orgId: string, humanId: string, minRole: keyof typeof ROLE_LEVEL): Promise<boolean> {
  const [membership] = await sql<{ role: string }[]>`
    SELECT role FROM memberships WHERE org_id = ${orgId} AND human_id = ${humanId} AND status = 'active'
  `;
  if (!membership) return false;
  return (ROLE_LEVEL[membership.role as keyof typeof ROLE_LEVEL] ?? 0) >= (ROLE_LEVEL[minRole] ?? Infinity);
}

function humanIdFrom(c: any): string {
  return c.req.header("x-human-id") ?? "human_demo";
}

async function auditEvent(
  orgId: string, actorType: string, actorId: string, action: string,
  targetType?: string, targetId?: string, metadata?: unknown,
) {
  await sql`
    INSERT INTO audit_events(id, org_id, actor_type, actor_id, action, target_type, target_id, metadata_json, created_at)
    VALUES (
      ${"evt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20)},
      ${orgId}, ${actorType}, ${actorId}, ${action},
      ${targetType ?? null}, ${targetId ?? null},
      ${JSON.stringify(metadata ?? {})}, ${Date.now()}
    )
  `;
}

async function ensureDefaultOrgData(orgId: string) {
  const now = Date.now();
  await sql`
    INSERT INTO billing_customers(org_id, provider, external_customer_id, plan, status, created_at, updated_at)
    VALUES (${orgId}, 'stripe', ${"cus_" + orgId.slice(-8)}, 'founder', 'trialing', ${now}, ${now})
    ON CONFLICT(org_id) DO NOTHING
  `;

  const integrations = [
    { id: "stripe", provider: "stripe_treasury", category: "payments", scopes: ["payments:execute", "payments:reverse"] },
    { id: "qbo", provider: "quickbooks_online", category: "accounting", scopes: ["bills:read", "bill_payments:write"] },
    { id: "zendesk", provider: "zendesk", category: "support", scopes: ["tickets:read", "refunds:prepare"] },
    { id: "workflows", provider: "runpane_workflows", category: "workflow", scopes: ["workflows:trigger"] },
  ];
  for (const integration of integrations) {
    await sql`
      INSERT INTO integrations(id, org_id, provider, category, status, environment, scopes_json, created_at, updated_at)
      VALUES (
        ${"int_" + orgId + "_" + integration.id}, ${orgId}, ${integration.provider}, ${integration.category},
        'mock', 'sandbox', ${JSON.stringify(integration.scopes)}, ${now}, ${now}
      )
      ON CONFLICT(id) DO NOTHING
    `;
  }

  const vendorRows = await sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM vendors WHERE org_id = ${orgId}`;
  if (Number(vendorRows[0]!.count) === 0) {
    const vendors = [
      { id: "aws", name: "Amazon Web Services", allow: 1, ext: "qbo_v_001" },
      { id: "stripe", name: "Stripe", allow: 1, ext: "qbo_v_002" },
      { id: "acme", name: "Acme Office Supplies", allow: 1, ext: "qbo_v_003" },
      { id: "globex", name: "Globex Consulting", allow: 0, ext: "qbo_v_004" },
    ];
    for (const vendor of vendors) {
      await sql`
        INSERT INTO vendors(id, org_id, name, on_allowlist, external_id)
        VALUES (${"ven_" + orgId + "_" + vendor.id}, ${orgId}, ${vendor.name}, ${vendor.allow}, ${vendor.ext})
        ON CONFLICT(id) DO NOTHING
      `;
    }
  }

  const invoiceRows = await sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM invoices WHERE org_id = ${orgId}`;
  if (Number(invoiceRows[0]!.count) === 0) {
    const invoices = [
      { id: "aws_a", vendor: "aws", number: "AWS-2026-04-A", amount: 28400, due: "2026-05-15" },
      { id: "stripe_44219", vendor: "stripe", number: "STR-44219", amount: 12999, due: "2026-05-12" },
      { id: "acme_1182", vendor: "acme", number: "ACME-1182", amount: 4250, due: "2026-05-10" },
      { id: "globex_882", vendor: "globex", number: "GLBX-882", amount: 312000, due: "2026-05-20" },
      { id: "aws_b", vendor: "aws", number: "AWS-2026-04-B", amount: 78000, due: "2026-05-18" },
    ];
    for (const invoice of invoices) {
      await sql`
        INSERT INTO invoices(id, org_id, vendor_id, number, amount_cents, currency, due_date, status, created_at)
        VALUES (
          ${"inv_" + orgId + "_" + invoice.id}, ${orgId}, ${"ven_" + orgId + "_" + invoice.vendor},
          ${invoice.number}, ${invoice.amount}, 'USD', ${invoice.due}, 'pending', ${now}
        )
        ON CONFLICT(id) DO NOTHING
      `;
    }
  }
}

async function syncPassportRecords(agentId: string, crystal: CrystalT) {
  const hash = Crystal.crystalHash(crystal);
  await sql`
    INSERT INTO agent_passports(agent_id, passport_hash, crystal_json, exported_at)
    VALUES (${agentId}, ${hash}, ${JSON.stringify(crystal)}, null)
    ON CONFLICT(agent_id) DO UPDATE SET passport_hash = EXCLUDED.passport_hash, crystal_json = EXCLUDED.crystal_json
  `;
  for (const facet of crystal.facets) {
    await sql`
      INSERT INTO capability_grants(id, agent_id, facet_hash, capability, constraints_json, status, issued_at)
      VALUES (
        ${facet.hash}, ${agentId}, ${facet.hash}, ${facet.grant.capability},
        ${JSON.stringify(facet.grant.constraints)},
        ${crystal.tombstones.includes(facet.hash) ? "revoked" : "active"},
        ${facet.issuedAt}
      )
      ON CONFLICT(id) DO UPDATE SET status = EXCLUDED.status, constraints_json = EXCLUDED.constraints_json
    `;
  }
}

// ─── ORG / AGENT MGMT ──────────────────────────────────────────────────────

app.post("/orgs", async (c) => {
  const { name } = await c.req.json();
  const humanId = humanIdFrom(c);
  const id = "org_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = Date.now();

  await sql`
    INSERT INTO orgs(id, name, created_at, vendor_allowlist_version, policy_json)
    VALUES (${id}, ${name}, ${now}, 1, ${JSON.stringify(DEFAULT_FINANCE_POLICY)})
  `;
  await sql`
    INSERT INTO humans(id, org_id, email, name, role, created_at)
    VALUES (${humanId}, ${id}, 'founder@runpane.ai', 'Founder', 'owner', ${now})
    ON CONFLICT(id) DO NOTHING
  `;
  await sql`
    INSERT INTO memberships(id, org_id, human_id, role, status, created_at)
    VALUES (${"mem_" + id + "_owner"}, ${id}, ${humanId}, 'owner', 'active', ${now})
    ON CONFLICT(org_id, human_id) DO NOTHING
  `;
  await ensureDefaultOrgData(id);
  return c.json({ id, name });
});

app.get("/orgs", async (c) => {
  const humanId = humanIdFrom(c);
  const orgs = await sql<any[]>`
    SELECT o.* FROM orgs o
    JOIN memberships m ON m.org_id = o.id
    WHERE m.human_id = ${humanId} AND m.status = 'active'
  `;
  for (const org of orgs) await ensureDefaultOrgData(org.id);
  return c.json({ orgs });
});

app.get("/orgs/:orgId/summary", async (c) => {
  const orgId = c.req.param("orgId");
  const [org] = await sql`SELECT * FROM orgs WHERE id = ${orgId}`;
  if (!org) return c.json({ error: "not_found" }, 404);
  const [agentsR, approvalsR, receiptsR, apiKeysR, integrationsR] = await Promise.all([
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM agents WHERE org_id = ${orgId}`,
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM approvals WHERE org_id = ${orgId} AND status = 'pending'`,
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM receipts WHERE org_id = ${orgId}`,
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM api_keys WHERE org_id = ${orgId} AND revoked_at IS NULL`,
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM integrations WHERE org_id = ${orgId}`,
  ]);
  return c.json({
    org,
    counts: {
      agents: Number(agentsR[0]!.count),
      pendingApprovals: Number(approvalsR[0]!.count),
      receipts: Number(receiptsR[0]!.count),
      apiKeys: Number(apiKeysR[0]!.count),
      integrations: Number(integrationsR[0]!.count),
    },
  });
});

type AgentKind = "finance" | "support" | "operations";

const KIND_CAPABILITIES: Record<AgentKind, Array<{ capability: string; constraints: any[] }>> = {
  finance: [
    { capability: "finance.invoice.read", constraints: [{ kind: "resource_glob" as const, pattern: "*" }] },
    { capability: "finance.payment.execute", constraints: [{ kind: "amount_lte" as const, value: 1000000 }, { kind: "resource_glob" as const, pattern: "*" }] },
    { capability: "finance.invoice.flag", constraints: [] },
  ],
  support: [
    { capability: "support.ticket.read", constraints: [{ kind: "resource_glob" as const, pattern: "*" }] },
    { capability: "support.refund.prepare", constraints: [{ kind: "amount_lte" as const, value: 50000 }] },
    { capability: "support.account.update", constraints: [{ kind: "resource_glob" as const, pattern: "*" }] },
  ],
  operations: [
    { capability: "ops.vendor.read", constraints: [{ kind: "resource_glob" as const, pattern: "*" }] },
    { capability: "ops.purchase.prepare", constraints: [{ kind: "amount_lte" as const, value: 250000 }] },
    { capability: "ops.workflow.trigger", constraints: [{ kind: "resource_glob" as const, pattern: "*" }] },
  ],
};

function normalizeKind(kind: string): AgentKind {
  return kind === "finance" || kind === "support" || kind === "operations" ? kind : "operations";
}

function sdkSnippet({ agentId, seedHex, baseUrl }: { agentId: string; seedHex?: string; baseUrl: string }) {
  return `import { RunpaneAgent } from "@runpane/agent-sdk";

const agent = await new RunpaneAgent({
  baseUrl: "${baseUrl}",
  agentId: "${agentId}",
  seedHex: process.env.RUNPANE_AGENT_SEED!,
  onRatchetAdvance: async (state) => {
    await persistRunpaneState(state);
  },
}).ready();

const { surfaces } = await agent.listSurfaces();`;
}

app.post("/orgs/:orgId/agents", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "developer"))) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json();
  const { name, connectionMode = "managed", runtimeUrl = null, publicKey } = body;
  const kind = normalizeKind(body.kind ?? "operations");
  if (!name || typeof name !== "string") return c.json({ error: "name_required" }, 400);
  if (publicKey && !/^[a-f0-9]{64}$/i.test(publicKey)) {
    return c.json({ error: "public_key_must_be_64_hex_chars" }, 400);
  }
  const id = "agt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const generatedState = publicKey ? null : await Ratchet.genesis();
  const currentPublicKey = publicKey ?? generatedState!.publicKeyHex;
  const mode = connectionMode === "sdk" || publicKey ? "sdk" : "managed";

  const founderState = await Ratchet.genesis();
  const crystal: CrystalT = { agentId: id, facets: [], tombstones: [] };
  const issuedAt = Date.now();
  const facets = KIND_CAPABILITIES[kind].map((grant) => ({
    parent: "ROOT", issuerPubKey: founderState.publicKeyHex, subjectAgentId: id, grant, issuedAt, expiresAt: 0,
  }));
  for (const f of facets) {
    const sealed = await Crystal.signFacet(f, founderState.seedHex);
    crystal.facets.push(sealed);
  }

  await sql`
    INSERT INTO agents(id, org_id, name, kind, current_pubkey, ratchet_n, crystal_json, connection_mode, runtime_url, status, created_at)
    VALUES (${id}, ${orgId}, ${name}, ${kind}, ${currentPublicKey}, 0, ${JSON.stringify(crystal)}, ${mode}, ${runtimeUrl}, 'active', ${Date.now()})
  `;
  await sql`
    INSERT INTO agent_keys(id, agent_id, public_key, ratchet_n, proof_json, created_at)
    VALUES (${"key_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20)}, ${id}, ${currentPublicKey}, 0, null, ${Date.now()})
  `;
  if (generatedState) await secretProvider.storeAgentSeed(id, generatedState.seedHex);
  await syncPassportRecords(id, crystal);
  await auditEvent(orgId, "human", humanIdFrom(c), mode === "sdk" ? "agent.registered" : "agent.created", "agent", id, { kind, connectionMode: mode });

  const appOrigin = c.req.header("origin")?.replace(/\/$/, "") ?? "https://runpane.localhost";
  return c.json({
    id, name, kind, connectionMode: mode, runtimeUrl, publicKey: currentPublicKey,
    seedHex: generatedState?.seedHex,
    sdk: {
      package: "@runpane/agent-sdk",
      baseUrl: `${appOrigin}/api`,
      env: generatedState ? { RUNPANE_AGENT_ID: id, RUNPANE_AGENT_SEED: generatedState.seedHex } : { RUNPANE_AGENT_ID: id },
      snippet: sdkSnippet({ agentId: id, seedHex: generatedState?.seedHex, baseUrl: `${appOrigin}/api` }),
    },
    crystalHash: Crystal.crystalHash(crystal),
    crystal,
  });
});

app.get("/orgs/:orgId/agents", async (c) => {
  const rows = await sql`
    SELECT id, name, kind, connection_mode, runtime_url, current_pubkey, ratchet_n, status, created_at
    FROM agents WHERE org_id = ${c.req.param("orgId")} ORDER BY created_at DESC
  `;
  return c.json({ agents: rows });
});

app.get("/agents/:agentId", async (c) => {
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${c.req.param("agentId")}`;
  if (!a) return c.json({ error: "not_found" }, 404);
  return c.json({
    id: a.id, orgId: a.org_id, name: a.name, kind: a.kind,
    connectionMode: a.connection_mode, runtimeUrl: a.runtime_url,
    publicKey: a.current_pubkey, ratchetN: a.ratchet_n, status: a.status,
    crystal: JSON.parse(a.crystal_json),
    crystalHash: Crystal.crystalHash(JSON.parse(a.crystal_json)),
  });
});

app.get("/agents/:agentId/passport", async (c) => {
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${c.req.param("agentId")}`;
  if (!a) return c.json({ error: "not_found" }, 404);
  if (!(await assertRole(a.org_id, humanIdFrom(c), "viewer"))) return c.json({ error: "forbidden" }, 403);
  const crystal = JSON.parse(a.crystal_json) as CrystalT;
  return c.json({
    agent: {
      id: a.id, orgId: a.org_id, name: a.name, kind: a.kind,
      connectionMode: a.connection_mode, status: a.status,
      currentPublicKey: a.current_pubkey, ratchetN: a.ratchet_n,
    },
    passport: {
      hash: Crystal.crystalHash(crystal),
      crystal,
      grants: crystal.facets.map((facet) => ({
        id: facet.hash, capability: facet.grant.capability, constraints: facet.grant.constraints,
        status: crystal.tombstones.includes(facet.hash) ? "revoked" : "active", issuedAt: facet.issuedAt,
      })),
      revocations: crystal.tombstones,
    },
  });
});

app.post("/agents/:agentId/grants", async (c) => {
  const agentId = c.req.param("agentId");
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${agentId}`;
  if (!a) return c.json({ error: "not_found" }, 404);
  if (!(await assertRole(a.org_id, humanIdFrom(c), "admin"))) return c.json({ error: "forbidden" }, 403);
  const { capability, constraints = [] } = await c.req.json();
  if (!capability || typeof capability !== "string") return c.json({ error: "capability_required" }, 400);
  const founderState = await Ratchet.genesis();
  const crystal = JSON.parse(a.crystal_json) as CrystalT;
  const sealed = await Crystal.signFacet(
    { parent: "ROOT", issuerPubKey: founderState.publicKeyHex, subjectAgentId: agentId, grant: { capability, constraints }, issuedAt: Date.now(), expiresAt: 0 },
    founderState.seedHex,
  );
  crystal.facets.push(sealed);
  await sql`UPDATE agents SET crystal_json = ${JSON.stringify(crystal)} WHERE id = ${agentId}`;
  await syncPassportRecords(agentId, crystal);
  await auditEvent(a.org_id, "human", humanIdFrom(c), "grant.issued", "agent", agentId, { capability });
  return c.json({ grant: sealed, crystalHash: Crystal.crystalHash(crystal) });
});

app.post("/agents/:agentId/grants/:grantId/revoke", async (c) => {
  const agentId = c.req.param("agentId");
  const grantId = c.req.param("grantId");
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${agentId}`;
  if (!a) return c.json({ error: "not_found" }, 404);
  if (!(await assertRole(a.org_id, humanIdFrom(c), "admin"))) return c.json({ error: "forbidden" }, 403);
  const crystal = Crystal.revokeFacet(JSON.parse(a.crystal_json), grantId);
  await sql`UPDATE agents SET crystal_json = ${JSON.stringify(crystal)} WHERE id = ${agentId}`;
  await sql`UPDATE capability_grants SET status = 'revoked', revoked_at = ${Date.now()} WHERE id = ${grantId}`;
  await syncPassportRecords(agentId, crystal);
  await auditEvent(a.org_id, "human", humanIdFrom(c), "grant.revoked", "agent", agentId, { grantId });
  return c.json({ ok: true, crystalHash: Crystal.crystalHash(crystal) });
});

app.post("/agents/:agentId/revoke-facet", async (c) => {
  const id = c.req.param("agentId");
  const { facetHash } = await c.req.json();
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${id}`;
  const crystal = Crystal.revokeFacet(JSON.parse(a.crystal_json), facetHash);
  await sql`UPDATE agents SET crystal_json = ${JSON.stringify(crystal)} WHERE id = ${id}`;
  await syncPassportRecords(id, crystal);
  return c.json({ ok: true, crystalHash: Crystal.crystalHash(crystal) });
});

// ─── INTENT FLOW ───────────────────────────────────────────────────────────

app.post("/intents/begin", async (c) => {
  const { agentId } = await c.req.json();
  const [a] = await sql<any[]>`SELECT * FROM agents WHERE id = ${agentId}`;
  if (!a) return c.json({ error: "agent_not_found" }, 404);
  const { nonce, expiresAt } = await Gateway.issueNonce(agentId);
  return c.json({ nonce, expiresAt, crystalHash: Crystal.crystalHash(JSON.parse(a.crystal_json)) });
});

app.post("/intents/execute", async (c) => {
  const { sealed } = await c.req.json();
  const result = await Gateway.executeSealedIntent(sealed);
  return c.json(result);
});

// ─── SURFACES (Prism) ──────────────────────────────────────────────────────

app.get("/surfaces", async (c) => {
  const agentId = c.req.header("x-agent-id");
  if (!agentId) return c.json({ error: "missing_x_agent_id" }, 400);
  const [a] = await sql<any[]>`SELECT org_id FROM agents WHERE id = ${agentId}`;
  if (!a) return c.json({ error: "agent_not_found" }, 404);
  return c.json({ surfaces: await listSurfacesFor(a.org_id, agentId) });
});

app.get("/surfaces/:id", async (c) => {
  const agentId = c.req.header("x-agent-id");
  if (!agentId) return c.json({ error: "missing_x_agent_id" }, 400);
  const [a] = await sql<any[]>`SELECT org_id FROM agents WHERE id = ${agentId}`;
  const s = await getSurface(a.org_id, agentId, c.req.param("id"));
  if (!s) return c.json({ error: "not_found" }, 404);
  return c.json({ surface: s });
});

// ─── APPROVALS ─────────────────────────────────────────────────────────────

app.get("/orgs/:orgId/approvals", async (c) => {
  const rows = await sql`SELECT * FROM approvals WHERE org_id = ${c.req.param("orgId")} ORDER BY created_at DESC`;
  return c.json({ approvals: rows });
});

app.post("/approvals/:id/approve", async (c) => {
  const { approverId = "human_admin", approverSignature = "demo_sig" } = await c.req.json();
  const result = await Gateway.approveIntent(c.req.param("id"), approverId, approverSignature);
  return c.json(result);
});

app.post("/approvals/:id/reject", async (c) => {
  const { approverId = "human_admin", note = "rejected" } = await c.req.json();
  return c.json(await Gateway.rejectIntent(c.req.param("id"), approverId, note));
});

// ─── AUDIT ─────────────────────────────────────────────────────────────────

app.get("/orgs/:orgId/receipts", async (c) => {
  return c.json({ receipts: await Audit.listReceipts(c.req.param("orgId")) });
});

app.get("/orgs/:orgId/receipts/:id", async (c) => {
  const [row] = await sql`SELECT * FROM receipts WHERE org_id = ${c.req.param("orgId")} AND id = ${c.req.param("id")}`;
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ receipt: row });
});

app.get("/orgs/:orgId/audit/verify", async (c) => {
  return c.json(await Audit.verifyChain(c.req.param("orgId")));
});

app.get("/orgs/:orgId/audit/events", async (c) => {
  const events = await sql`
    SELECT * FROM audit_events WHERE org_id = ${c.req.param("orgId")} ORDER BY created_at DESC LIMIT 200
  `;
  return c.json({ events });
});

// ─── API KEYS / SETTINGS / BILLING / INTEGRATIONS ─────────────────────────

app.get("/orgs/:orgId/api-keys", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "developer"))) return c.json({ error: "forbidden" }, 403);
  const keys = await sql`
    SELECT id, label, environment, prefix, role, revoked_at, last_used_at, created_at
    FROM api_keys WHERE org_id = ${orgId} ORDER BY created_at DESC
  `;
  return c.json({ keys });
});

app.post("/orgs/:orgId/api-keys", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "developer"))) return c.json({ error: "forbidden" }, 403);
  const { label = "Development key", environment = "development", role = "developer" } = await c.req.json();
  const secret = "rp_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const prefix = secret.slice(0, 10);
  const keyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const hashHex = Array.from(new Uint8Array(keyHash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const id = "key_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  await sql`
    INSERT INTO api_keys(id, org_id, label, environment, key_hash, prefix, role, created_at)
    VALUES (${id}, ${orgId}, ${label}, ${environment}, ${hashHex}, ${prefix}, ${role}, ${Date.now()})
  `;
  await auditEvent(orgId, "human", humanIdFrom(c), "api_key.created", "api_key", id, { environment, role });
  return c.json({ id, label, environment, role, prefix, secret });
});

app.delete("/orgs/:orgId/api-keys/:id", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "developer"))) return c.json({ error: "forbidden" }, 403);
  await sql`UPDATE api_keys SET revoked_at = ${Date.now()} WHERE org_id = ${orgId} AND id = ${c.req.param("id")}`;
  await auditEvent(orgId, "human", humanIdFrom(c), "api_key.revoked", "api_key", c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/orgs/:orgId/integrations", async (c) => {
  const orgId = c.req.param("orgId");
  const integrations = await sql`SELECT * FROM integrations WHERE org_id = ${orgId} ORDER BY category, provider`;
  return c.json({ integrations });
});

app.get("/orgs/:orgId/codex-tasks", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "operator"))) return c.json({ error: "forbidden" }, 403);
  return c.json({ tasks: await listCodexTasks(orgId) });
});

app.post("/orgs/:orgId/codex-tasks", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "operator"))) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json();
  if (!body.title || !body.prompt) return c.json({ error: "title_and_prompt_required" }, 400);
  const task = await createCodexTask({ orgId, agentId: body.agentId ?? null, title: body.title, prompt: body.prompt, riskLevel: body.riskLevel });
  await auditEvent(orgId, "human", humanIdFrom(c), "codex_task.created", "codex_task", (task as any).id, { riskLevel: body.riskLevel ?? "medium", provider: "symphony_codex_tasks" });
  return c.json({ task });
});

app.post("/orgs/:orgId/integrations/:id/connect", async (c) => {
  const orgId = c.req.param("orgId");
  if (!(await assertRole(orgId, humanIdFrom(c), "admin"))) return c.json({ error: "forbidden" }, 403);
  await sql`UPDATE integrations SET status = 'connected', updated_at = ${Date.now()} WHERE org_id = ${orgId} AND id = ${c.req.param("id")}`;
  await auditEvent(orgId, "human", humanIdFrom(c), "integration.connected", "integration", c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/orgs/:orgId/billing", async (c) => {
  const orgId = c.req.param("orgId");
  const [billing] = await sql`SELECT * FROM billing_customers WHERE org_id = ${orgId}`;
  return c.json({ billing: billing ?? { org_id: orgId, provider: "stripe", plan: "founder", status: "trialing" } });
});

app.get("/orgs/:orgId/settings", async (c) => {
  const orgId = c.req.param("orgId");
  const [org] = await sql`SELECT id, name, billing_status, active, vendor_allowlist_version FROM orgs WHERE id = ${orgId}`;
  const members = await sql`
    SELECT m.id, m.role, m.status, h.email, h.name
    FROM memberships m JOIN humans h ON h.id = m.human_id
    WHERE m.org_id = ${orgId} ORDER BY m.created_at
  `;
  const [connIntR, agentsR2] = await Promise.all([
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM integrations WHERE org_id = ${orgId} AND status = 'connected'`,
    sql<{ count: string }[]>`SELECT COUNT(*)::bigint AS count FROM agents WHERE org_id = ${orgId}`,
  ]);
  return c.json({
    org, members,
    roles: Object.keys(ROLE_LEVEL),
    readiness: [
      { label: "At least one Agent Passport", ok: Number(agentsR2[0]!.count) > 0 },
      { label: "Execution rail connected", ok: Number(connIntR[0]!.count) > 0 },
      { label: "Owner membership configured", ok: members.some((m: any) => m.role === "owner") },
      { label: "Receipt chain enabled", ok: true },
    ],
  });
});

app.get("/orgs/:orgId/invoices", async (c) => {
  const rows = await sql`
    WITH ranked AS (
      SELECT
        i.*,
        COALESCE(v.name, 'Unknown vendor') AS vendor_name,
        COALESCE(v.on_allowlist, 0) AS on_allowlist,
        ROW_NUMBER() OVER (
          PARTITION BY i.number, i.amount_cents, COALESCE(v.name, 'Unknown vendor')
          ORDER BY i.created_at DESC, i.id DESC
        ) AS row_number
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.org_id = ${c.req.param("orgId")}
    )
    SELECT * FROM ranked WHERE row_number = 1 ORDER BY created_at DESC
  `;
  return c.json({ invoices: rows });
});

app.get("/orgs/:orgId/vendors", async (c) => {
  const vendors = await sql`SELECT * FROM vendors WHERE org_id = ${c.req.param("orgId")}`;
  return c.json({ vendors });
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`runpane API listening on http://localhost:${info.port}`);
});
