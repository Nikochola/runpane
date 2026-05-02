"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

type Integration = {
  id: string;
  provider: string;
  category: string;
  status: string;
  environment: string;
  external_account_id?: string | null;
  scopes?: string | null;
};

const CATEGORY_COPY: Record<string, string> = {
  payments: "Payment execution, reversals, and transaction status.",
  accounting: "Invoice, vendor, and payment record synchronization.",
  support: "Refund review, account actions, and customer context.",
  workflow: "Internal task handoffs and reversible operations.",
};

export function Integrations({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.integrations(orgId);
      setRows(res.integrations);
    } catch (e: any) {
      setError(e.message ?? "Unable to load integrations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orgId]);

  async function connect(id: string) {
    await api.connectIntegration(orgId, id);
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/70 p-7">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Execution rails</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Connect the systems agents can act inside.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Runpane keeps integrations behind Passport policy. Agents receive typed Prism AX actions;
            adapters handle provider credentials, scopes, execution state, and audit history.
          </p>
        </div>
      </section>

      {error && (
        <button type="button" onClick={load} className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left text-sm text-red-200">
          {error}. Click to retry.
        </button>
      )}

      <section className="grid grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl border border-line bg-panel" />)
          : rows.map((integration) => (
              <div key={integration.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{integration.category}</div>
                    <h3 className="mt-2 text-xl font-semibold capitalize">{integration.provider.replaceAll("_", " ")}</h3>
                  </div>
                  <span className={integration.status === "connected" ? "tag tag-ok" : "tag"}>
                    {integration.status}
                  </span>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-500">
                  {CATEGORY_COPY[integration.category] ?? "Scoped business software connection."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Meta label="Environment" value={integration.environment} />
                  <Meta label="Scopes" value={integration.scopes ? JSON.parse(integration.scopes).join(", ") : "none"} />
                </div>
                <button
                  type="button"
                  onClick={() => connect(integration.id)}
                  className="mt-5 h-10 rounded-xl border border-line px-4 text-sm text-zinc-200 hover:bg-white/5"
                >
                  {integration.status === "connected" ? "Refresh connection" : "Connect"}
                </button>
              </div>
            ))}
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-3">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-zinc-300">{value}</div>
    </div>
  );
}
