"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

export function Billing({ orgId }: { orgId: string }) {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.billing(orgId);
      setBilling(res.billing);
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl border border-line bg-panel" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/70 p-7">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">SaaS account</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Billing for trusted agent operations.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Billing is scoped to the organization and later ties usage to active agents, Prism AX
            executions, approvals, integration rails, and receipt retention.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Panel label="Plan" value={billing.plan ?? "Startup"} />
        <Panel label="Status" value={billing.status ?? "trialing"} />
        <Panel label="Provider" value={billing.provider ?? "demo"} />
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">Usage model</h3>
        <div className="mt-4 grid grid-cols-4 gap-3">
          <Panel label="Agents" value={String(billing.usage?.agents ?? 0)} compact />
          <Panel label="Approvals" value={String(billing.usage?.approvals ?? 0)} compact />
          <Panel label="Receipts" value={String(billing.usage?.receipts ?? 0)} compact />
          <Panel label="Integrations" value={String(billing.usage?.integrations ?? 0)} compact />
        </div>
      </section>
    </div>
  );
}

function Panel({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className={compact ? "mt-2 text-2xl font-semibold" : "mt-3 text-3xl font-semibold"}>{value}</div>
    </div>
  );
}
