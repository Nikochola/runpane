import { hashObject } from "@runpane/passport";
import { sql } from "./db.js";

export type ReceiptInput = {
  orgId: string;
  agentId: string;
  intentHash: string;
  intentJson: string;
  decision: "allow" | "approve" | "deny" | "executed";
  policyRule?: string;
  facetHash?: string;
  approvalId?: string;
  externalCall?: unknown;
  result?: unknown;
  ratchetNBefore: number;
  ratchetNAfter: number;
};

export async function appendReceipt(input: ReceiptInput): Promise<{ id: string; receiptHash: string }> {
  const [last] = await sql<{ receipt_hash: string }[]>`
    SELECT receipt_hash FROM receipts WHERE org_id = ${input.orgId} ORDER BY created_at DESC LIMIT 1
  `;

  const prevHash = last?.receipt_hash ?? "GENESIS";
  const id = "rcpt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const createdAt = Date.now();

  const body = {
    id,
    orgId: input.orgId,
    agentId: input.agentId,
    intentHash: input.intentHash,
    intentJson: input.intentJson,
    decision: input.decision,
    policyRule: input.policyRule ?? null,
    facetHash: input.facetHash ?? null,
    approvalId: input.approvalId ?? null,
    externalCall: input.externalCall ?? null,
    result: input.result ?? null,
    ratchetNBefore: input.ratchetNBefore,
    ratchetNAfter: input.ratchetNAfter,
    prevReceiptHash: prevHash,
    createdAt,
  };
  const receiptHash = hashObject(body);

  await sql`
    INSERT INTO receipts(
      id, org_id, agent_id, intent_hash, intent_json, decision, policy_rule, facet_hash,
      approval_id, external_call_json, result_json, prev_receipt_hash, receipt_hash,
      ratchet_n_before, ratchet_n_after, created_at
    ) VALUES (
      ${id}, ${input.orgId}, ${input.agentId}, ${input.intentHash}, ${input.intentJson},
      ${input.decision}, ${input.policyRule ?? null}, ${input.facetHash ?? null},
      ${input.approvalId ?? null},
      ${input.externalCall ? JSON.stringify(input.externalCall) : null},
      ${input.result ? JSON.stringify(input.result) : null},
      ${prevHash}, ${receiptHash},
      ${input.ratchetNBefore}, ${input.ratchetNAfter}, ${createdAt}
    )
  `;

  return { id, receiptHash };
}

export async function listReceipts(orgId: string, limit = 200) {
  return sql`SELECT * FROM receipts WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function verifyChain(orgId: string): Promise<{ ok: boolean; brokenAt?: string }> {
  const rows = await sql<any[]>`
    SELECT * FROM receipts WHERE org_id = ${orgId} ORDER BY created_at ASC
  `;
  let prev = "GENESIS";
  for (const r of rows) {
    if (r.prev_receipt_hash !== prev) return { ok: false, brokenAt: r.id };
    const recomputed = hashObject({
      id: r.id,
      orgId: r.org_id,
      agentId: r.agent_id,
      intentHash: r.intent_hash,
      intentJson: r.intent_json,
      decision: r.decision,
      policyRule: r.policy_rule,
      facetHash: r.facet_hash,
      approvalId: r.approval_id,
      externalCall: r.external_call_json ? JSON.parse(r.external_call_json) : null,
      result: r.result_json ? JSON.parse(r.result_json) : null,
      ratchetNBefore: r.ratchet_n_before,
      ratchetNAfter: r.ratchet_n_after,
      prevReceiptHash: r.prev_receipt_hash,
      createdAt: r.created_at,
    });
    if (recomputed !== r.receipt_hash) return { ok: false, brokenAt: r.id };
    prev = r.receipt_hash;
  }
  return { ok: true };
}
