/**
 * End-to-end demo:
 *  1. seed
 *  2. spawn API server
 *  3. create Finance Agent
 *  4. agent lists invoices, pays small allowlisted ones (auto), large/unknown queue for approval
 *  5. human approves one, ledger advances, ratchet rolls forward
 *  6. print audit chain + verify
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { RunpaneAgent } from "@runpane/agent-sdk";

const BASE = process.env.RUNPANE_API ?? "http://localhost:4000";

async function ping(): Promise<boolean> {
  try {
    const r = await fetch(BASE + "/");
    return r.ok;
  } catch {
    return false;
  }
}

async function api(path: string, init?: RequestInit) {
  const r = await fetch(BASE + path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  // (1) seed
  console.log("─── seeding ───");
  await new Promise<void>((res, rej) => {
    const p = spawn("pnpm", ["seed"], { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error("seed failed"))));
  });

  // (2) ensure API is up
  if (!(await ping())) {
    console.log("API not running. Start with `pnpm api` in another terminal.");
    process.exit(1);
  }

  // (3) create agent
  console.log("\n─── creating Finance Agent ───");
  const agentRes = await api("/orgs/org_demo/agents", {
    method: "POST",
    body: JSON.stringify({ name: "Finance Agent v1" }),
  });
  console.log("agent id:", agentRes.id, "  pk:", agentRes.publicKey.slice(0, 16) + "…");

  const agent = await new RunpaneAgent({
    baseUrl: BASE,
    agentId: agentRes.id,
    seedHex: agentRes.seedHex,
    onRatchetAdvance: (s) => console.log(`  ↻ ratchet → n=${s.n} pk=${s.publicKeyHex.slice(0, 12)}…`),
  }).ready();

  // (4) list surfaces
  console.log("\n─── listing surfaces (open invoices) ───");
  const { surfaces } = await agent.listSurfaces();
  for (const s of surfaces) console.log(" •", s.id, "—", s.title);

  // (5) for each invoice surface, attempt payment
  for (const s of surfaces) {
    const { surface } = await agent.getSurface(s.id);
    const amt = surface.fields.find((f: any) => f.name === "amount").value;
    const vendor = surface.fields.find((f: any) => f.name === "vendor").value;
    const invoiceId = surface.fields.find((f: any) => f.name === "invoiceId").value;

    console.log(`\n→ Pay ${vendor} $${(amt / 100).toFixed(2)} (invoice ${invoiceId})`);
    const res = await agent.invoke({
      capability: "finance.payment.execute",
      description: `Pay ${vendor} for invoice ${invoiceId}`,
      amount: amt,
      currency: "USD",
      vendor,
      resource: invoiceId,
      payload: { invoiceId },
    });
    console.log("  result:", res.status, "reason" in res ? res.reason : "");
  }

  // (6) Approve one pending
  await sleep(200);
  const { approvals } = await api("/orgs/org_demo/approvals");
  const pending = approvals.filter((a: any) => a.status === "pending");
  if (pending[0]) {
    console.log(`\n─── human approves ${pending[0].id} ───`);
    const r = await api(`/approvals/${pending[0].id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approverId: "human_admin" }),
    });
    console.log("  →", r.status);
  }

  // (7) Audit chain
  console.log("\n─── audit chain ───");
  const { receipts } = await api("/orgs/org_demo/receipts");
  for (const r of receipts.slice().reverse()) {
    console.log(
      `  ${r.created_at}  ${r.decision.padEnd(10)}  rule=${r.policy_rule ?? "-"}  hash=${String(
        r.receipt_hash,
      ).slice(0, 10)}…  prev=${String(r.prev_receipt_hash).slice(0, 10)}…`,
    );
  }
  const verify = await api("/orgs/org_demo/audit/verify");
  console.log("\nchain verify:", verify);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
