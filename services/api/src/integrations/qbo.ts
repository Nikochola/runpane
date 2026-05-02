/**
 * Mock QuickBooks Online integration. Real impl swaps fetch calls; interface stays.
 * In production this would proxy through the gateway so calls are policy-checked + logged.
 */
import { sql } from "../db.js";

export type QBOInvoice = {
  id: string;
  number: string;
  vendor: string;
  amountCents: number;
  currency: string;
  dueDate: string;
};

export const QBO = {
  async listOpenInvoices(orgId: string): Promise<QBOInvoice[]> {
    const rows = await sql<any[]>`
      WITH ranked AS (
        SELECT
          i.id, i.number,
          COALESCE(v.name, 'Unknown vendor') AS vendor,
          i.amount_cents, i.currency, i.due_date,
          ROW_NUMBER() OVER (
            PARTITION BY i.number, i.amount_cents, COALESCE(v.name, 'Unknown vendor')
            ORDER BY i.created_at DESC, i.id DESC
          ) AS row_number
        FROM invoices i
        LEFT JOIN vendors v ON v.id = i.vendor_id
        WHERE i.org_id = ${orgId} AND i.status = 'pending'
      )
      SELECT id, number, vendor, amount_cents, currency, due_date
      FROM ranked WHERE row_number = 1
    `;
    return rows.map((r) => ({
      id: r.id,
      number: r.number,
      vendor: r.vendor,
      amountCents: r.amount_cents,
      currency: r.currency,
      dueDate: r.due_date,
    }));
  },
  async writeBillPayment(orgId: string, invoiceId: string, externalCallId: string) {
    await sql`UPDATE invoices SET status = 'paid' WHERE id = ${invoiceId} AND org_id = ${orgId}`;
    return { ok: true, externalCallId, postedAt: Date.now() };
  },
};
