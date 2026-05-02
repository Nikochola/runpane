const CAPABILITY_LABELS: Record<string, string> = {
  "finance.invoice.read": "Read invoices",
  "finance.payment.execute": "Execute payments",
  "finance.invoice.flag": "Flag invoices",
  "support.ticket.read": "Read support tickets",
  "support.refund.prepare": "Prepare refunds",
  "support.account.update": "Update customer accounts",
  "ops.vendor.read": "Read vendors",
  "ops.purchase.prepare": "Prepare purchases",
  "ops.workflow.trigger": "Trigger operations workflows",
};

const POLICY_LABELS: Record<string, string> = {
  "auto-pay-small-known": "Auto-paid trusted vendor",
  "pay-needs-approval": "Needs approval",
  human_approved: "Approved by human",
};

const DECISION_LABELS: Record<string, string> = {
  executed: "Executed",
  approve: "Needs approval",
  allow: "Allowed",
  deny: "Denied",
  rejected: "Rejected",
  pending: "Pending",
  approved: "Approved",
};

export function capabilityLabel(capability?: string) {
  if (!capability) return "Unknown capability";
  return CAPABILITY_LABELS[capability] ?? titleFromToken(capability);
}

export function policyLabel(rule?: string | null) {
  if (!rule) return "Manual action";
  return POLICY_LABELS[rule] ?? titleFromToken(rule);
}

export function decisionLabel(decision?: string) {
  if (!decision) return "Unknown";
  return DECISION_LABELS[decision] ?? titleFromToken(decision);
}

export function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return DECISION_LABELS[status] ?? titleFromToken(status);
}

export function constraintLabel(c: any): string {
  switch (c.kind) {
    case "amount_lte":
      return `Up to ${formatMoney(c.value)}`;
    case "amount_gte":
      return `At least ${formatMoney(c.value)}`;
    case "vendor_in":
      return `Only ${c.values.join(", ")}`;
    case "resource_glob":
      return c.pattern === "*" ? "Any resource" : `Resource matches ${c.pattern}`;
    case "daily_spend_lte":
      return `Daily spend up to ${formatMoney(c.value)}`;
    default:
      return titleFromToken(String(c.kind ?? "constraint"));
  }
}

export function amountLabel(cents?: number) {
  if (typeof cents !== "number") return "";
  return formatMoney(cents);
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function titleFromToken(value: string) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
