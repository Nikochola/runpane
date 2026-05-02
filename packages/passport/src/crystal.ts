import * as ed from "@noble/ed25519";
import { fromHex, hashObject, toHex } from "./util.js";

/**
 * A capability constraint. Tiny DSL — extend as needed.
 * Examples:
 *   { kind: "amount_lte", value: 500 }
 *   { kind: "vendor_in", values: ["acme", "globex"] }
 *   { kind: "resource_glob", pattern: "invoice:*" }
 */
export type Constraint =
  | { kind: "amount_lte"; value: number }
  | { kind: "amount_gte"; value: number }
  | { kind: "vendor_in"; values: string[] }
  | { kind: "resource_glob"; pattern: string }
  | { kind: "daily_spend_lte"; value: number };

export type Grant = {
  /** Resource verb, e.g. "finance.invoice.read", "finance.payment.execute". */
  capability: string;
  constraints: Constraint[];
};

export type Facet = {
  /** Hash of parent facet, or "ROOT" for the founding facet. */
  parent: string;
  /** Hex pubkey of the granter. */
  issuerPubKey: string;
  /** Hex pubkey of the receiver (agent or sub-agent). */
  subjectAgentId: string;
  grant: Grant;
  /** Optional: this facet attenuates an ancestor — must be a strict subset. */
  attenuates?: string;
  /** Unix ms. */
  issuedAt: number;
  /** Unix ms; 0 = never. */
  expiresAt: number;
  /** Hex Ed25519 sig over canonical(facet without `signature` and `hash`). */
  signature: string;
};

export type SealedFacet = Facet & { hash: string };

export type Crystal = {
  /** Org-scoped identifier. */
  agentId: string;
  /** Append-only DAG of facets. */
  facets: SealedFacet[];
  /** Tombstoned facet hashes (revoked). */
  tombstones: string[];
};

function stripSignature(f: Facet | SealedFacet): Omit<Facet, "signature"> {
  const { signature, ...rest } = f as any;
  delete (rest as any).hash;
  return rest as Omit<Facet, "signature">;
}

function stripHash(f: SealedFacet): Facet {
  const { hash, ...rest } = f;
  return rest as Facet;
}

export async function signFacet(
  unsigned: Omit<Facet, "signature">,
  issuerSeedHex: string,
): Promise<SealedFacet> {
  const msg = new TextEncoder().encode(hashObject(unsigned));
  const sig = await ed.signAsync(msg, fromHex(issuerSeedHex));
  const facet: Facet = { ...unsigned, signature: toHex(sig) };
  return { ...facet, hash: hashObject(facet) };
}

export async function verifyFacet(f: SealedFacet): Promise<boolean> {
  if (hashObject(stripHash(f)) !== f.hash) return false;
  const msg = new TextEncoder().encode(hashObject(stripSignature(f)));
  try {
    return await ed.verifyAsync(fromHex(f.signature), msg, fromHex(f.issuerPubKey));
  } catch {
    return false;
  }
}

export function appendFacet(crystal: Crystal, facet: SealedFacet): Crystal {
  return { ...crystal, facets: [...crystal.facets, facet] };
}

export function revokeFacet(crystal: Crystal, hash: string): Crystal {
  return { ...crystal, tombstones: [...crystal.tombstones, hash] };
}

/**
 * Walk the crystal and find all facets that:
 *  - belong to subject
 *  - are not tombstoned (and no ancestor is)
 *  - have not expired
 *  - chain back to ROOT through valid signed parents
 */
export async function liveFacets(
  crystal: Crystal,
  subjectId: string,
  now = Date.now(),
): Promise<SealedFacet[]> {
  const dead = new Set(crystal.tombstones);
  const byHash = new Map(crystal.facets.map((f) => [f.hash, f]));

  function ancestorDead(h: string): boolean {
    let cur: SealedFacet | undefined = byHash.get(h);
    while (cur) {
      if (dead.has(cur.hash)) return true;
      if (cur.parent === "ROOT") return false;
      cur = byHash.get(cur.parent);
    }
    return false;
  }

  const out: SealedFacet[] = [];
  for (const f of crystal.facets) {
    if (f.subjectAgentId !== subjectId) continue;
    if (f.expiresAt && f.expiresAt < now) continue;
    if (ancestorDead(f.hash)) continue;
    if (!(await verifyFacet(f))) continue;
    out.push(f);
  }
  return out;
}

export type IntentRequest = {
  capability: string;
  amount?: number;
  vendor?: string;
  resource?: string;
};

function globMatch(pattern: string, value: string): boolean {
  const re = new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  return re.test(value);
}

export function constraintAllows(c: Constraint, req: IntentRequest): boolean {
  switch (c.kind) {
    case "amount_lte":
      return req.amount === undefined || req.amount <= c.value;
    case "amount_gte":
      return req.amount === undefined || req.amount >= c.value;
    case "vendor_in":
      return req.vendor === undefined || c.values.includes(req.vendor);
    case "resource_glob":
      return req.resource === undefined || globMatch(c.pattern, req.resource);
    case "daily_spend_lte":
      return true; // checked at ledger level, not facet level
  }
}

export function facetCovers(facet: SealedFacet, req: IntentRequest): boolean {
  if (facet.grant.capability !== req.capability) return false;
  return facet.grant.constraints.every((c) => constraintAllows(c, req));
}

/** Find any live facet that covers the intent request. Returns the facet hash if covered. */
export async function authorize(
  crystal: Crystal,
  subjectId: string,
  req: IntentRequest,
): Promise<{ ok: true; facetHash: string } | { ok: false; reason: string }> {
  const live = await liveFacets(crystal, subjectId);
  if (live.length === 0) return { ok: false, reason: "no_live_facets" };
  for (const f of live) if (facetCovers(f, req)) return { ok: true, facetHash: f.hash };
  return { ok: false, reason: "no_facet_covers_request" };
}

/** Serialize the crystal to a content-addressed hash (fingerprint). */
export function crystalHash(crystal: Crystal): string {
  return hashObject({
    agentId: crystal.agentId,
    facets: crystal.facets.map((f) => f.hash),
    tombstones: crystal.tombstones,
  });
}
