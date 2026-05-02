import {
  Crystal,
  Intent,
  Ratchet,
  type CrystalT,
  type IntentRequest,
  type SealedIntent,
} from "@runpane/passport";
import { DEFAULT_FINANCE_POLICY, evaluate, type Policy } from "@runpane/policy";
import { sql } from "./db.js";
import * as Audit from "./audit.js";
import * as Ledger from "./ledger.js";
import { StripeRail } from "./integrations/stripe.js";
import { QBO } from "./integrations/qbo.js";
import { secretProvider } from "./secrets.js";

export type GatewayResult =
  | { status: "executed"; receiptId: string; receiptHash: string; result: unknown; newPublicKey: string; newRatchetN: number }
  | { status: "pending_approval"; approvalId: string; intentHash: string }
  | { status: "denied"; reason: string };

export async function issueNonce(agentId: string): Promise<{ nonce: string; expiresAt: number }> {
  const nonce = "nce_" + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = Date.now() + 60_000;
  await sql`INSERT INTO nonces(nonce, agent_id, expires_at, consumed) VALUES (${nonce}, ${agentId}, ${expiresAt}, 0)`;
  return { nonce, expiresAt };
}

async function consumeNonce(agentId: string, nonce: string): Promise<boolean> {
  const [row] = await sql<any[]>`SELECT * FROM nonces WHERE nonce = ${nonce} AND agent_id = ${agentId}`;
  if (!row) return false;
  if (row.consumed) return false;
  if (row.expires_at < Date.now()) return false;
  await sql`UPDATE nonces SET consumed = 1 WHERE nonce = ${nonce}`;
  return true;
}

async function loadAgent(agentId: string) {
  const [row] = await sql<any[]>`SELECT * FROM agents WHERE id = ${agentId}`;
  if (!row) throw new Error("agent_not_found");
  const crystal = JSON.parse(row.crystal_json) as CrystalT;
  return { row, crystal };
}

async function loadOrg(orgId: string) {
  const [row] = await sql<any[]>`SELECT * FROM orgs WHERE id = ${orgId}`;
  if (!row) throw new Error("org_not_found");
  const policy = (JSON.parse(row.policy_json) as Policy) ?? DEFAULT_FINANCE_POLICY;
  return { row, policy };
}

async function vendorAllowlist(orgId: string): Promise<string[]> {
  const rows = await sql<{ name: string }[]>`
    SELECT name FROM vendors WHERE org_id = ${orgId} AND on_allowlist = 1
  `;
  return rows.map((r) => r.name);
}

export async function executeSealedIntent(sealed: SealedIntent): Promise<GatewayResult> {
  if (!(await Intent.verifySealedIntent(sealed))) {
    return { status: "denied", reason: "intent_signature_invalid_or_expired" };
  }

  const { row: agent, crystal } = await loadAgent(sealed.agentId);
  if (agent.status !== "active") return { status: "denied", reason: "agent_not_active" };
  if (agent.ratchet_n !== sealed.ratchetN) return { status: "denied", reason: "ratchet_out_of_sync" };
  if (agent.current_pubkey !== sealed.publicKey) return { status: "denied", reason: "ratchet_key_mismatch" };

  if (Crystal.crystalHash(crystal) !== sealed.crystalHash) {
    return { status: "denied", reason: "crystal_hash_mismatch" };
  }

  if (!(await consumeNonce(sealed.agentId, sealed.nonce))) {
    return { status: "denied", reason: "nonce_invalid_or_consumed" };
  }

  const req: IntentRequest = {
    capability: sealed.intent.capability,
    amount: sealed.intent.amount,
    vendor: sealed.intent.vendor,
    resource: sealed.intent.resource,
  };
  const auth = await Crystal.authorize(crystal, sealed.agentId, req);
  if (!auth.ok) return { status: "denied", reason: `crystal:${auth.reason}` };

  const { policy, row: org } = await loadOrg(agent.org_id);
  const decision = evaluate(policy, {
    capability: sealed.intent.capability,
    amount: sealed.intent.amount,
    vendor: sealed.intent.vendor,
    spendToday: await Ledger.spendToday(sealed.agentId),
    spendMonth: await Ledger.spendMonth(sealed.agentId),
    vendorAllowlist: await vendorAllowlist(agent.org_id),
    currentVendorAllowlistVersion: org.vendor_allowlist_version,
    vendorAllowlistVersion: org.vendor_allowlist_version,
  });

  const intentJson = JSON.stringify(sealed);

  if (decision.decision === "deny") {
    await Audit.appendReceipt({
      orgId: agent.org_id, agentId: sealed.agentId, intentHash: sealed.hash, intentJson,
      decision: "deny", policyRule: decision.ruleId, facetHash: auth.facetHash,
      ratchetNBefore: agent.ratchet_n, ratchetNAfter: agent.ratchet_n,
    });
    return { status: "denied", reason: decision.reason };
  }

  if (decision.decision === "approve") {
    const approvalId = "apv_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    await sql`
      INSERT INTO approvals(id, org_id, agent_id, intent_hash, intent_json, reason, status, created_at)
      VALUES (${approvalId}, ${agent.org_id}, ${sealed.agentId}, ${sealed.hash}, ${intentJson}, ${decision.reason}, 'pending', ${Date.now()})
    `;
    await Audit.appendReceipt({
      orgId: agent.org_id, agentId: sealed.agentId, intentHash: sealed.hash, intentJson,
      decision: "approve", policyRule: decision.ruleId, facetHash: auth.facetHash,
      approvalId, ratchetNBefore: agent.ratchet_n, ratchetNAfter: agent.ratchet_n,
    });
    return { status: "pending_approval", approvalId, intentHash: sealed.hash };
  }

  return await executeApproved({ sealed, agent, crystal, facetHash: auth.facetHash, policyRule: decision.ruleId, approvalId: undefined });
}

export async function executeApproved(args: {
  sealed: SealedIntent;
  agent: any;
  crystal: CrystalT;
  facetHash: string;
  policyRule: string;
  approvalId?: string;
}): Promise<GatewayResult> {
  const { sealed, agent } = args;
  const intentJson = JSON.stringify(sealed);
  const monetary = sealed.intent.capability === "finance.payment.execute";
  let reservationId: string | undefined;
  let externalCall: unknown = null;
  let result: unknown = null;

  try {
    if (monetary && sealed.intent.amount) {
      reservationId = await Ledger.reserve(sealed.agentId, sealed.intent.amount);
      externalCall = await StripeRail.executePayment({
        orgId: agent.org_id, agentId: sealed.agentId, amountCents: sealed.intent.amount,
        currency: sealed.intent.currency ?? "USD", vendor: sealed.intent.vendor ?? "unknown",
        idempotencyKey: sealed.hash,
      });
      const invoiceId = (sealed.intent.payload as any)?.invoiceId ?? sealed.intent.resource;
      if (invoiceId) {
        result = await QBO.writeBillPayment(agent.org_id, invoiceId, (externalCall as any).id);
      } else {
        result = externalCall;
      }
      await Ledger.commit(reservationId);
    } else if (sealed.intent.capability.startsWith("finance.invoice.read")) {
      result = { ok: true };
    } else if (sealed.intent.capability === "finance.invoice.flag") {
      result = { flagged: true };
    } else {
      result = { ok: true };
    }
  } catch (err: any) {
    if (reservationId) await Ledger.release(reservationId);
    await Audit.appendReceipt({
      orgId: agent.org_id, agentId: sealed.agentId, intentHash: sealed.hash, intentJson,
      decision: "deny", policyRule: args.policyRule, facetHash: args.facetHash,
      approvalId: args.approvalId, externalCall, result: { error: String(err?.message ?? err) },
      ratchetNBefore: agent.ratchet_n, ratchetNAfter: agent.ratchet_n,
    });
    return { status: "denied", reason: "execution_error:" + String(err?.message ?? err) };
  }

  const receipt = await Audit.appendReceipt({
    orgId: agent.org_id, agentId: sealed.agentId, intentHash: sealed.hash, intentJson,
    decision: "executed", policyRule: args.policyRule, facetHash: args.facetHash,
    approvalId: args.approvalId, externalCall, result,
    ratchetNBefore: agent.ratchet_n, ratchetNAfter: agent.ratchet_n + 1,
  });

  const nextSeed = await deriveNextPublicKeyFromAgent(agent, receipt.receiptHash);
  await sql`UPDATE agents SET current_pubkey = ${nextSeed.publicKeyHex}, ratchet_n = ratchet_n + 1 WHERE id = ${sealed.agentId}`;

  return {
    status: "executed", receiptId: receipt.id, receiptHash: receipt.receiptHash,
    result, newPublicKey: nextSeed.publicKeyHex, newRatchetN: agent.ratchet_n + 1,
  };
}

async function deriveNextPublicKeyFromAgent(agent: any, receiptHash: string) {
  const seedHex = await secretProvider.readAgentSeed(agent.id);
  if (!seedHex) throw new Error("agent_secret_missing");
  const current = await Ratchet.fromSeed(seedHex, agent.ratchet_n);
  const next = await Ratchet.advance(current, receiptHash);
  await secretProvider.storeAgentSeed(agent.id, next.seedHex);
  return next;
}

export async function approveIntent(approvalId: string, approverId: string, approverSignature: string): Promise<GatewayResult> {
  const [a] = await sql<any[]>`SELECT * FROM approvals WHERE id = ${approvalId}`;
  if (!a) return { status: "denied", reason: "approval_not_found" };
  if (a.status !== "pending") return { status: "denied", reason: "approval_not_pending" };

  await sql`
    UPDATE approvals SET status = 'approved', approver_id = ${approverId}, approver_signature = ${approverSignature}, decided_at = ${Date.now()}
    WHERE id = ${approvalId}
  `;

  const sealed = JSON.parse(a.intent_json) as SealedIntent;
  const { row: agentRow, crystal } = await loadAgent(sealed.agentId);

  const auth = await Crystal.authorize(crystal, sealed.agentId, {
    capability: sealed.intent.capability,
    amount: sealed.intent.amount,
    vendor: sealed.intent.vendor,
  });
  if (!auth.ok) return { status: "denied", reason: `crystal:${auth.reason}` };

  return await executeApproved({ sealed, agent: agentRow, crystal, facetHash: auth.facetHash, policyRule: "human_approved", approvalId });
}

export async function rejectIntent(approvalId: string, approverId: string, note: string) {
  const [a] = await sql<any[]>`SELECT * FROM approvals WHERE id = ${approvalId}`;
  if (!a) return { ok: false, reason: "not_found" };
  await sql`
    UPDATE approvals SET status = 'rejected', approver_id = ${approverId}, decided_at = ${Date.now()}, reason = ${note}
    WHERE id = ${approvalId}
  `;
  await Audit.appendReceipt({
    orgId: a.org_id, agentId: a.agent_id, intentHash: a.intent_hash, intentJson: a.intent_json,
    decision: "deny", policyRule: "human_rejected", approvalId, ratchetNBefore: 0, ratchetNAfter: 0,
  });
  return { ok: true };
}
