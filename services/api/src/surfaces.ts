import type { Surface } from "@runpane/prism";
import { sql } from "./db.js";
import { QBO } from "./integrations/qbo.js";

export async function listSurfacesFor(orgId: string, agentId: string) {
  const [agent] = await sql<{ kind: string }[]>`
    SELECT kind FROM agents WHERE id = ${agentId} AND org_id = ${orgId}
  `;
  const kind = agent?.kind ?? "operations";
  const invoices = await QBO.listOpenInvoices(orgId);
  const surfaces = invoices.map((inv) => ({
    id: `invoice_review_${inv.id}`,
    title: `Review invoice ${inv.number}`,
    category: "finance",
  }));
  if (kind === "support" || kind === "operations") {
    surfaces.push({ id: "support_refund_demo", title: "Review support refund", category: "support" });
  }
  if (kind === "operations" || kind === "support") {
    surfaces.push({ id: "ops_vendor_task_demo", title: "Approve vendor task", category: "operations" });
  }
  return surfaces;
}

export async function getSurface(orgId: string, agentId: string, surfaceId: string): Promise<Surface | null> {
  if (surfaceId.startsWith("invoice_review_")) {
    const invoiceId = surfaceId.replace("invoice_review_", "");
    const [row] = await sql<any[]>`
      SELECT i.*, COALESCE(v.name, 'Unknown vendor') AS vendor, COALESCE(v.on_allowlist, 0) AS on_allowlist
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.id = ${invoiceId} AND i.org_id = ${orgId}
    `;
    if (!row) return null;
    return {
      id: surfaceId,
      title: `Invoice ${row.number} — ${row.vendor}`,
      description: `${(row.amount_cents / 100).toFixed(2)} ${row.currency} due ${row.due_date}`,
      fields: [
        { name: "invoiceId", label: "Invoice", type: { kind: "invoiceRef" }, readonly: true, value: row.id },
        { name: "vendor", label: "Vendor", type: { kind: "vendor" }, readonly: true, value: row.vendor },
        { name: "amount", label: "Amount", type: { kind: "money", currency: row.currency }, readonly: true, value: row.amount_cents },
        { name: "dueDate", label: "Due", type: { kind: "date" }, readonly: true, value: row.due_date },
        { name: "memo", label: "Memo", type: { kind: "string", maxLength: 140 }, required: false },
      ],
      actions: [
        { id: "pay", label: "Pay invoice", capability: "finance.payment.execute", monetary: true, bind: { invoiceId: "invoiceId", vendor: "vendor", amount: "amount", memo: "memo" } },
        { id: "flag", label: "Flag for review", capability: "finance.invoice.flag", bind: { invoiceId: "invoiceId", memo: "memo" } },
      ],
      context: { orgId, agentId, surfaceVersion: 1 },
    };
  }
  if (surfaceId === "support_refund_demo") {
    return {
      id: surfaceId,
      title: "Support refund review",
      description: "Customer requested a refund for duplicate billing on ticket SUP-1042.",
      fields: [
        { name: "ticketId", label: "Ticket", type: { kind: "string", maxLength: 32 }, readonly: true, value: "SUP-1042" },
        { name: "customer", label: "Customer", type: { kind: "string", maxLength: 80 }, readonly: true, value: "Northstar Labs" },
        { name: "amount", label: "Refund amount", type: { kind: "money", currency: "USD" }, readonly: true, value: 32000 },
        { name: "reason", label: "Reason", type: { kind: "string", maxLength: 140 }, required: true },
      ],
      actions: [
        { id: "prepare_refund", label: "Prepare refund", capability: "support.refund.prepare", monetary: true, bind: { ticketId: "ticketId", customer: "customer", amount: "amount", reason: "reason" } },
        { id: "update_account", label: "Update account note", capability: "support.account.update", bind: { ticketId: "ticketId", reason: "reason" } },
      ],
      context: { orgId, agentId, surfaceVersion: 1 },
    };
  }
  if (surfaceId === "ops_vendor_task_demo") {
    return {
      id: surfaceId,
      title: "Vendor onboarding task",
      description: "Prepare a vendor setup workflow with approval controls before credentials or payments are issued.",
      fields: [
        { name: "vendor", label: "Vendor", type: { kind: "vendor" }, readonly: true, value: "Atlas Fulfillment" },
        { name: "taskId", label: "Task", type: { kind: "string", maxLength: 32 }, readonly: true, value: "OPS-2291" },
        { name: "amount", label: "Budget exposure", type: { kind: "money", currency: "USD" }, readonly: true, value: 250000 },
        { name: "memo", label: "Memo", type: { kind: "string", maxLength: 140 }, required: false },
      ],
      actions: [
        { id: "prepare_purchase", label: "Prepare purchase", capability: "ops.purchase.prepare", monetary: true, bind: { vendor: "vendor", taskId: "taskId", amount: "amount", memo: "memo" } },
        { id: "trigger_workflow", label: "Trigger onboarding workflow", capability: "ops.workflow.trigger", bind: { vendor: "vendor", taskId: "taskId", memo: "memo" } },
      ],
      context: { orgId, agentId, surfaceVersion: 1 },
    };
  }
  return null;
}
