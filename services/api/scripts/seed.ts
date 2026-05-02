import { sql } from "../src/db.js";
import { DEFAULT_FINANCE_POLICY } from "@runpane/policy";

const orgId = "org_demo";
const now = Date.now();

await sql`
  INSERT INTO orgs(id, name, created_at, vendor_allowlist_version, billing_status, active, policy_json)
  VALUES (${orgId}, 'Acme Demo', ${now}, 1, 'trialing', 1, ${JSON.stringify(DEFAULT_FINANCE_POLICY)})
  ON CONFLICT(id) DO NOTHING
`;

await sql`
  INSERT INTO humans(id, org_id, email, name, role, created_at)
  VALUES ('human_demo', ${orgId}, 'niko@runpane.ai', 'Niko', 'owner', ${now})
  ON CONFLICT(id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role
`;

await sql`
  INSERT INTO memberships(id, org_id, human_id, role, status, created_at)
  VALUES ('mem_demo_owner', ${orgId}, 'human_demo', 'owner', 'active', ${now})
  ON CONFLICT(org_id, human_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status
`;

await sql`
  INSERT INTO billing_customers(org_id, provider, external_customer_id, plan, status, created_at, updated_at)
  VALUES (${orgId}, 'stripe', 'cus_demo', 'founder', 'trialing', ${now}, ${now})
  ON CONFLICT(org_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at
`;

const integrations = [
  { id: "int_stripe", provider: "stripe_treasury", category: "payments", scopes: ["payments:execute", "payments:reverse"] },
  { id: "int_qbo", provider: "quickbooks_online", category: "accounting", scopes: ["bills:read", "bill_payments:write"] },
  { id: "int_zendesk", provider: "zendesk", category: "support", scopes: ["tickets:read", "refunds:prepare"] },
  { id: "int_workflows", provider: "runpane_workflows", category: "workflow", scopes: ["workflows:trigger"] },
  { id: "int_symphony_codex", provider: "symphony_codex_tasks", category: "workflow", scopes: ["codex_tasks:create", "codex_tasks:read", "codex_tasks:cancel"] },
];

for (const integration of integrations) {
  await sql`
    INSERT INTO integrations(id, org_id, provider, category, status, environment, scopes_json, created_at, updated_at)
    VALUES (${integration.id}, ${orgId}, ${integration.provider}, ${integration.category}, 'mock', 'sandbox', ${JSON.stringify(integration.scopes)}, ${now}, ${now})
    ON CONFLICT(id) DO UPDATE SET status = EXCLUDED.status, scopes_json = EXCLUDED.scopes_json, updated_at = EXCLUDED.updated_at
  `;
}

const vendors = [
  { id: "ven_aws", name: "Amazon Web Services", allow: 1, ext: "qbo_v_001" },
  { id: "ven_stripe", name: "Stripe", allow: 1, ext: "qbo_v_002" },
  { id: "ven_acme", name: "Acme Office Supplies", allow: 1, ext: "qbo_v_003" },
  { id: "ven_globex", name: "Globex Consulting", allow: 0, ext: "qbo_v_004" },
];
for (const v of vendors) {
  await sql`
    INSERT INTO vendors(id, org_id, name, on_allowlist, external_id) VALUES (${v.id}, ${orgId}, ${v.name}, ${v.allow}, ${v.ext})
    ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, on_allowlist = EXCLUDED.on_allowlist
  `;
}

const invoices = [
  { id: "inv_001", v: "ven_aws", num: "AWS-2026-04-A", amt: 28400, due: "2026-05-15" },
  { id: "inv_002", v: "ven_stripe", num: "STR-44219", amt: 12999, due: "2026-05-12" },
  { id: "inv_003", v: "ven_acme", num: "ACME-1182", amt: 4250, due: "2026-05-10" },
  { id: "inv_004", v: "ven_globex", num: "GLBX-882", amt: 312000, due: "2026-05-20" },
  { id: "inv_005", v: "ven_aws", num: "AWS-2026-04-B", amt: 78000, due: "2026-05-18" },
];
for (const i of invoices) {
  await sql`
    INSERT INTO invoices(id, org_id, vendor_id, number, amount_cents, currency, due_date, status, created_at)
    VALUES (${i.id}, ${orgId}, ${i.v}, ${i.num}, ${i.amt}, 'USD', ${i.due}, 'pending', ${now})
    ON CONFLICT(id) DO UPDATE SET status = 'pending'
  `;
}

console.log("seeded org_demo with", vendors.length, "vendors and", invoices.length, "invoices");
await sql.end();
