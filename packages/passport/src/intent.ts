import { sign as ratchetSign, verify as ratchetVerify, type RatchetState } from "./ratchet.js";
import { canonical, enc, hashObject } from "./util.js";

export type Precondition =
  | { kind: "ledger_balance_gte"; value: number }
  | { kind: "vendor_allowlist_version"; version: number }
  | { kind: "policy_version"; version: number };

export type SealedIntent = {
  agentId: string;
  /** Hash of the crystal at sealing time. */
  crystalHash: string;
  /** Generation of the ratchet that signed this. */
  ratchetN: number;
  /** Public key at generation N (for verification). */
  publicKey: string;
  /** What the agent is asking to do. Free-form description plus structured request. */
  intent: {
    capability: string;
    description: string;
    amount?: number;
    currency?: string;
    vendor?: string;
    resource?: string;
    payload?: Record<string, unknown>;
  };
  preconditions: Precondition[];
  /** Server-issued nonce; intents expire fast. */
  nonce: string;
  /** Unix ms. */
  issuedAt: number;
  /** Unix ms; reject after this. */
  expiresAt: number;
  /** Ed25519 sig over canonical(intent without `signature` and `hash`). */
  signature: string;
  /** Content hash of the unsigned intent. Approvers sign over this. */
  hash: string;
};

export async function sealIntent(
  state: RatchetState,
  agentId: string,
  crystalHash: string,
  intent: SealedIntent["intent"],
  opts: { nonce: string; ttlMs?: number; preconditions?: Precondition[] },
): Promise<SealedIntent> {
  const now = Date.now();
  const unsigned = {
    agentId,
    crystalHash,
    ratchetN: state.n,
    publicKey: state.publicKeyHex,
    intent,
    preconditions: opts.preconditions ?? [],
    nonce: opts.nonce,
    issuedAt: now,
    expiresAt: now + (opts.ttlMs ?? 30_000),
  };
  const hash = hashObject(unsigned);
  const sig = await ratchetSign(state, enc.encode(hash));
  return { ...unsigned, hash, signature: sig };
}

export async function verifySealedIntent(si: SealedIntent): Promise<boolean> {
  const { signature, hash, ...unsigned } = si;
  if (hashObject(unsigned) !== hash) return false;
  if (Date.now() > si.expiresAt) return false;
  return await ratchetVerify(si.publicKey, signature, enc.encode(hash));
}

export function intentDigest(si: SealedIntent): string {
  // Stable digest used by approvers and the audit chain.
  return si.hash;
}

export function canonicalIntent(si: SealedIntent): string {
  return canonical(si);
}
