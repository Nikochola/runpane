import { useEffect, useState } from "react";
import { api } from "../api";
import { decisionLabel, policyLabel, statusLabel } from "../display";

export function Overview({
  orgId,
  onOpenAgent,
}: {
  orgId: string;
  onOpenAgent: (id: string) => void;
}) {
  const [agents, setAgents] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [chain, setChain] = useState<{ ok: boolean; brokenAt?: string } | null>(null);

  async function refresh() {
    const [a, ap, r, v] = await Promise.all([
      api.agents(orgId),
      api.approvals(orgId),
      api.receipts(orgId),
      api.verifyChain(orgId),
    ]);
    setAgents(a.agents);
    setApprovals(ap.approvals);
    setReceipts(r.receipts);
    setChain(v);
  }
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, [orgId]);

  const pending = approvals.filter((a) => a.status === "pending").length;
  const executed = receipts.filter((r) => r.decision === "executed").length;
  const passportChecks = receipts.length + agents.length;

  return (
    <div className="grid grid-cols-12 gap-6">
      <section className="col-span-12 rounded-2xl border border-line bg-panel/70 p-7">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">runpane control plane</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Give AI workers a Passport and an Agent Experience.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Agent Passport is the trust system for AI workers: verified identity, scoped access,
            budgets, approval rules, delegated authentication, and audit logs. Prism AX is the
            execution layer: structured, machine-readable actions instead of fragile dashboards
            built for humans.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <LayerCard
            title="Open Agent Passport"
            text="Identity, permissions, budgets, approvals, delegated auth, and receipts."
          />
          <LayerCard
            title="Prism AX"
            text="Agent Experience: typed operations agents can execute predictably."
          />
          <LayerCard
            title="Finance template"
            text="The first loaded worker template: invoice review, payment approval, and controlled execution."
          />
        </div>
      </section>

      <section className="card col-span-12 p-6">
        <SectionHeader title="How teams use Runpane" />
        <div className="mt-4 grid grid-cols-5 gap-3">
          <UseStep title="Adopt Passport" text="Use the open Passport protocol in your own agent stack or through Runpane." />
          <UseStep title="Register worker" text="Connect a worker identity, signing state, scopes, budgets, and revocation." />
          <UseStep title="Attach Prism" text="Expose safe typed surfaces instead of letting agents click through random SaaS UI." />
          <UseStep title="Gate actions" text="Let low-risk work execute and route sensitive actions to approval." />
          <UseStep title="Audit receipts" text="Review every action with signed receipts and chain verification." />
        </div>
      </section>

      <section className="card col-span-12 p-6">
        <SectionHeader title="Operating model" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          <OperatingStep title="Create identity" text="Register a managed or SDK-connected worker and issue an Agent Passport." />
          <OperatingStep title="Attach authority" text="Scope capabilities, budgets, approval policy, delegated auth, and revocation." />
          <OperatingStep title="Expose Prism AX" text="Give agents typed execution surfaces instead of brittle human dashboards." />
          <OperatingStep title="Prove every action" text="Route sensitive work to approval and write signed, verifiable receipts." />
        </div>
      </section>

      <Stat label="Active agents" value={agents.filter((a) => a.status === "active").length} hint="passport-linked" />
      <Stat label="Pending approvals" value={pending} tone={pending ? "warn" : "ok"} hint="human gate" />
      <Stat label="Executed actions" value={executed} hint="receipt-backed" />
      <Stat
        label="Audit chain"
        value={chain?.ok ? "intact" : chain ? "broken" : "…"}
        tone={chain?.ok ? "ok" : "err"}
        hint={chain?.ok ? `${passportChecks} checks` : chain?.brokenAt ?? "checking"}
      />

      <section className="card col-span-7 p-6">
        <SectionHeader title="AI workers" />
        <div className="mt-4 space-y-2">
          {agents.length === 0 && (
            <div className="text-sm text-zinc-500">No workers yet. Register one with an Agent Passport from the Agents tab.</div>
          )}
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpenAgent(a.id)}
              className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-line hover:bg-zinc-900/50 transition"
            >
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-zinc-500 mono">
                  {a.id} · protocol n={a.ratchet_n} · pk {a.current_pubkey.slice(0, 14)}…
                </div>
              </div>
              <span className={`tag ${a.status === "active" ? "tag-ok" : "tag-err"}`}>
                {statusLabel(a.status)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card col-span-5 p-6">
        <SectionHeader title="Recent receipts" />
        <div className="mt-4 space-y-2 max-h-[420px] overflow-auto">
          {receipts.slice(0, 12).map((r) => (
            <div key={r.id} className="rounded-lg border border-line px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 truncate font-medium">{policyLabel(r.policy_rule)}</div>
                <DecisionTag decision={r.decision} />
              </div>
              <div className="mt-1 mono text-xs text-zinc-500">
                {new Date(r.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LayerCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 text-xs leading-5 text-zinc-500">{text}</div>
    </div>
  );
}

function UseStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-xs leading-5 text-zinc-500">{text}</div>
    </div>
  );
}

function OperatingStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-xs leading-5 text-zinc-500">{text}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: any;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "err";
}) {
  const toneCls =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "err" ? "text-err" : "";
  return (
    <div className="card col-span-3 p-5">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-3xl font-semibold mt-2 ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1 mono">{hint}</div>}
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm uppercase tracking-wider text-zinc-400">{title}</h2>
    </div>
  );
}

export function DecisionTag({ decision }: { decision: string }) {
  const cls =
    decision === "executed" || decision === "allow"
      ? "tag-ok"
      : decision === "approve"
      ? "tag-warn"
      : "tag-err";
  return <span className={`tag ${cls}`}>{decisionLabel(decision)}</span>;
}
