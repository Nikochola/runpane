/**
 * Policy DSL — evaluated by the gateway AFTER crystal authorization.
 * Crystal says "agent has the right to ask"; policy says "and the request is currently OK".
 *
 * Decisions: "allow", "approve" (needs human), "deny".
 */

export type PolicyContext = {
  capability: string;
  amount?: number;
  vendor?: string;
  /** spend windows in cents */
  spendToday: number;
  spendMonth: number;
  /** Vendor allowlist version the agent committed to. */
  vendorAllowlistVersion?: number;
  currentVendorAllowlistVersion: number;
  /** Counterparty allowlist for this org. */
  vendorAllowlist: string[];
};

export type Rule =
  | { id: string; if: Cond; then: "allow" | "approve" | "deny"; reason: string };

export type Cond =
  | { op: "always" }
  | { op: "and"; conds: Cond[] }
  | { op: "or"; conds: Cond[] }
  | { op: "not"; cond: Cond }
  | { op: "capability_eq"; value: string }
  | { op: "capability_prefix"; value: string }
  | { op: "amount_lte"; value: number }
  | { op: "amount_gt"; value: number }
  | { op: "vendor_in_allowlist" }
  | { op: "vendor_eq"; value: string }
  | { op: "spend_today_plus_amount_gt"; value: number }
  | { op: "spend_month_plus_amount_gt"; value: number }
  | { op: "stale_allowlist_version" };

export type Policy = {
  version: number;
  rules: Rule[];
  /** If no rule matches, default decision. */
  default: "allow" | "approve" | "deny";
};

export type Decision = {
  decision: "allow" | "approve" | "deny";
  reason: string;
  ruleId: string;
};

export function evalCond(c: Cond, ctx: PolicyContext): boolean {
  switch (c.op) {
    case "always":
      return true;
    case "and":
      return c.conds.every((x) => evalCond(x, ctx));
    case "or":
      return c.conds.some((x) => evalCond(x, ctx));
    case "not":
      return !evalCond(c.cond, ctx);
    case "capability_eq":
      return ctx.capability === c.value;
    case "capability_prefix":
      return ctx.capability.startsWith(c.value);
    case "amount_lte":
      return (ctx.amount ?? 0) <= c.value;
    case "amount_gt":
      return (ctx.amount ?? 0) > c.value;
    case "vendor_in_allowlist":
      return !!ctx.vendor && ctx.vendorAllowlist.includes(ctx.vendor);
    case "vendor_eq":
      return ctx.vendor === c.value;
    case "spend_today_plus_amount_gt":
      return ctx.spendToday + (ctx.amount ?? 0) > c.value;
    case "spend_month_plus_amount_gt":
      return ctx.spendMonth + (ctx.amount ?? 0) > c.value;
    case "stale_allowlist_version":
      return ctx.vendorAllowlistVersion !== ctx.currentVendorAllowlistVersion;
  }
}

export function evaluate(policy: Policy, ctx: PolicyContext): Decision {
  for (const r of policy.rules) {
    if (evalCond(r.if, ctx)) {
      return { decision: r.then, reason: r.reason, ruleId: r.id };
    }
  }
  return { decision: policy.default, reason: "default_policy", ruleId: "default" };
}

/** Default Finance Agent policy — used when an org hasn't customized. */
export const DEFAULT_FINANCE_POLICY: Policy = {
  version: 1,
  default: "deny",
  rules: [
    {
      id: "stale-allowlist",
      if: { op: "stale_allowlist_version" },
      then: "approve",
      reason: "vendor_allowlist_changed_since_intent",
    },
    {
      id: "read-allowed",
      if: { op: "capability_prefix", value: "finance.invoice.read" },
      then: "allow",
      reason: "read_only",
    },
    {
      id: "auto-pay-small-known",
      if: {
        op: "and",
        conds: [
          { op: "capability_eq", value: "finance.payment.execute" },
          { op: "amount_lte", value: 50000 }, // $500.00 in cents
          { op: "vendor_in_allowlist" },
          { op: "not", cond: { op: "spend_today_plus_amount_gt", value: 200000 } }, // $2k/day
          { op: "not", cond: { op: "spend_month_plus_amount_gt", value: 2000000 } }, // $20k/mo
        ],
      },
      then: "allow",
      reason: "small_payment_to_allowlisted_vendor_within_caps",
    },
    {
      id: "pay-needs-approval",
      if: { op: "capability_eq", value: "finance.payment.execute" },
      then: "approve",
      reason: "payment_outside_auto_band",
    },
  ],
};
