"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

export function Developers({ orgId }: { orgId: string }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [label, setLabel] = useState("Development SDK key");

  async function loadKeys() {
    const res = await api.apiKeys(orgId);
    setKeys(res.keys);
  }

  useEffect(() => {
    loadKeys();
  }, [orgId]);

  async function createKey() {
    const res = await api.createApiKey(orgId, { label, environment: "development", role: "developer" });
    setSecret(res.secret);
    await loadKeys();
  }

  async function revokeKey(id: string) {
    await api.revokeApiKey(orgId, id);
    await loadKeys();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/70 p-7">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">SDK + API</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Build agents against Passport and Prism AX.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Agent Passport gives every AI worker verified identity and strict boundaries for what
            it can access and do. Prism AX gives those workers structured, machine-readable actions
            instead of brittle dashboards and buttons built for humans.
          </p>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">Trust system + agent experience</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Principle
            title="Agent Passport"
            text="Verified identity, permissions, budgets, approval rules, delegated authentication, and auditable receipts."
          />
          <Principle
            title="Prism AX"
            text="Typed operations such as issuing refunds, updating records, or triggering workflows."
          />
          <Principle
            title="Runpane"
            text="The hosted control plane that operates Passport and Prism AX inside real companies."
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <section className="card col-span-7 p-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-400">How an external agent acts</h3>
          <div className="mt-5 space-y-3">
            <Step n="1" title="Adopt open Passport" text="The agent uses the open protocol library or compatible SDK to hold identity and signing state." />
            <Step n="2" title="Register with Runpane" text="A company links that Passport to org policy, scopes, budgets, approval rules, and Prism AX surfaces." />
            <Step n="3" title="Seal intent" text="The agent signs an action request with capability, resource, amount, preconditions, and nonce." />
            <Step n="4" title="Policy decision" text="Runpane allows, denies, or routes the action to human approval." />
            <Step n="5" title="Receipt" text="Every executed action creates a signed, hash-chained receipt and advances the Passport ratchet." />
          </div>
        </section>

        <section className="card col-span-5 p-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-400">First SDK shape</h3>
          <pre className="mt-5 overflow-auto rounded-xl border border-line bg-ink/70 p-4 text-xs leading-6 text-zinc-300">
{`const worker = runpane.agent({
  agentId,
  seed,
  apiKey
})

await worker.act({
  capability: "finance.payment.execute",
  description: "Pay invoice AWS-2026-04-B",
  amount: 78000,
  resource: "invoice:AWS-2026-04-B"
})`}
          </pre>
        </section>
      </div>

      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">API keys</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Use org-scoped keys for SDK agents, backend services, and local examples. Secrets are
              shown once; the server stores only a hash and prefix.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-10 w-64 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-accent"
            />
            <button type="button" onClick={createKey} className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-white">
              Create key
            </button>
          </div>
        </div>
        {secret && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-300">Copy once</div>
            <code className="mt-2 block break-all font-mono text-sm text-emerald-100">{secret}</code>
          </div>
        )}
        <div className="mt-5 space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between rounded-xl border border-line bg-ink/50 p-4">
              <div>
                <div className="font-medium">{key.label}</div>
                <div className="mt-1 font-mono text-sm text-zinc-500">
                  {key.prefix}... · {key.environment} · {key.role}
                </div>
              </div>
              {key.revoked_at ? (
                <span className="tag">revoked</span>
              ) : (
                <button type="button" onClick={() => revokeKey(key.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300">
                  Revoke
                </button>
              )}
            </div>
          ))}
          {keys.length === 0 && <div className="rounded-xl border border-line bg-ink/50 p-4 text-sm text-zinc-500">No API keys yet.</div>}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">API surface for v1</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Endpoint method="POST" path="/agents" text="Register a Passport-backed worker." />
          <Endpoint method="POST" path="/intents/begin" text="Return nonce and current Passport hash." />
          <Endpoint method="POST" path="/intents/execute" text="Submit sealed intent for policy decision." />
          <Endpoint method="GET" path="/surfaces" text="List Prism AX surfaces available to a worker." />
          <Endpoint method="POST" path="/approvals/:id" text="Approve or reject a gated action." />
          <Endpoint method="GET" path="/receipts" text="Read signed audit receipts and chain status." />
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-ink/50 p-4">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-accent/40 text-sm text-accent">
        {n}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm leading-6 text-zinc-500">{text}</div>
      </div>
    </div>
  );
}

function Endpoint({ method, path, text }: { method: string; path: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <div className="flex items-center gap-2">
        <span className="tag tag-ok">{method}</span>
        <span className="mono text-sm">{path}</span>
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-500">{text}</div>
    </div>
  );
}

function Principle({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-sm leading-6 text-zinc-500">{text}</div>
    </div>
  );
}
