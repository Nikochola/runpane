import { useEffect, useState } from "react";
import { api } from "../api";
import { amountLabel, statusLabel } from "../display";

export function Invoices({ orgId }: { orgId: string }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  async function refresh() {
    const [i, v] = await Promise.all([api.invoices(orgId), api.vendors(orgId)]);
    setInvoices(i.invoices);
    setVendors(v.vendors);
  }
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [orgId]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Prism AX</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Agent execution surfaces</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Prism AX gives AI workers structured, machine-readable operations with typed actions,
              policy-aware controls, and approval widgets. The invoice surface below is a first
              template, not the product boundary.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="tag tag-ok">typed schema</span>
            <span className="tag tag-ok">safe actions</span>
            <span className="tag tag-warn">approval gates</span>
            <span className="tag">template</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
      <div className="card col-span-8 p-6">
        <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">
          Invoice execution surface
        </h2>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-zinc-500 text-left">
            <tr>
              <th className="py-2 pr-4 w-28">Invoice</th>
              <th>Vendor</th>
              <th className="text-right pr-4 w-28">Amount</th>
              <th className="w-28">Due</th>
              <th className="w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="py-2 pr-4 mono text-xs">{i.number}</td>
                <td>
                  {i.vendor_name}
                  {i.on_allowlist ? (
                    <span className="tag tag-ok ml-2">trusted</span>
                  ) : (
                    <span className="tag tag-warn ml-2">needs review</span>
                  )}
                </td>
                <td className="text-right pr-4 mono whitespace-nowrap">{amountLabel(i.amount_cents)}</td>
                <td className="mono text-xs whitespace-nowrap">{i.due_date}</td>
                <td>
                  <span className={`tag ${i.status === "paid" ? "tag-ok" : ""}`}>
                    {statusLabel(i.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card col-span-4 p-6">
        <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Policy context</h2>
        <div className="mb-4 rounded-lg border border-line bg-ink/50 p-3 text-xs leading-5 text-zinc-500">
          Payment execution is available only through Passport permissions and policy checks.
          Unknown vendors and larger payments route to approval.
        </div>
        <div className="space-y-2">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between text-sm border border-line rounded-lg p-2.5"
            >
              <span>{v.name}</span>
              <span className={`tag ${v.on_allowlist ? "tag-ok" : "tag-warn"}`}>
                {v.on_allowlist ? "trusted" : "review"}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
