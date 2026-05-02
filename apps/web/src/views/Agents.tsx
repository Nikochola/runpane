import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api";
import { capabilityLabel, decisionLabel, policyLabel, statusLabel } from "../display";
import { CrystalViewer } from "./CrystalViewer";
import { NeonDrift } from "../components/NeonDrift";
import { fireNavigationStart } from "../components/NavigationProgress";
import { Button } from "../components/ui/Button";

export function Agents({
  orgId,
  selectedAgentId,
  initialPassportPage = false,
  onSelect,
}: {
  orgId: string;
  selectedAgentId: string | null;
  initialPassportPage?: boolean;
  onSelect: (id: string | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [agents, setAgents] = useState<any[]>([]);
  const [passportOpen, setPassportOpen] = useState(false);
  const [passportPage, setPassportPage] = useState(initialPassportPage);
  const [agentDetail, setAgentDetail] = useState<any | null>(null);
  const [agentReceipts, setAgentReceipts] = useState<any[]>([]);
  const [agentApprovals, setAgentApprovals] = useState<any[]>([]);

  async function refresh() {
    const r = await api.agents(orgId);
    setAgents(r.agents);
  }
  useEffect(() => {
    refresh();
  }, [orgId]);

  useEffect(() => {
    setPassportPage(initialPassportPage);
  }, [initialPassportPage, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) {
      setAgentDetail(null);
      setAgentReceipts([]);
      setAgentApprovals([]);
      return;
    }
    const agentId = selectedAgentId;
    let active = true;
    async function loadDetail() {
      const [detail, receipts, approvals] = await Promise.all([
        api.agent(agentId),
        api.receipts(orgId),
        api.approvals(orgId),
      ]);
      if (!active) return;
      setAgentDetail(detail);
      setAgentReceipts(receipts.receipts.filter((r: any) => r.agent_id === agentId));
      setAgentApprovals(approvals.approvals.filter((a: any) => a.agent_id === agentId));
    }
    loadDetail();
    const i = setInterval(loadDetail, 2000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [orgId, selectedAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  if (selectedAgentId && !selectedAgent) {
    return <div className="text-sm text-zinc-500">Loading agent…</div>;
  }

  if (selectedAgent) {
    const facets = (agentDetail?.crystal?.facets ?? []) as any[];
    const tombstones = new Set<string>(agentDetail?.crystal?.tombstones ?? []);
    const activeFacets = facets.filter((facet) => !tombstones.has(facet.hash));
    const pendingApprovals = agentApprovals.filter((a) => a.status === "pending").length;
    const executedActions = agentReceipts.filter((r) => r.decision === "executed").length;

    if (passportPage) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-500">
                <button
                  onClick={() => { fireNavigationStart(); startTransition(() => { onSelect(null); setPassportPage(false); router.push("/app/agents"); }); }}
                  className="hover:text-zinc-200"
                >
                  Agents
                </button>
                <span className="mx-1 text-zinc-700">/</span>{" "}
                <button
                  onClick={() => { fireNavigationStart(); startTransition(() => { setPassportPage(false); router.push(`/app/agents/${selectedAgent.id}`); }); }}
                  className="hover:text-zinc-200"
                >
                  {selectedAgent.name}
                </button>
                <span className="mx-1 text-zinc-700">/</span>{" "}
                <span className="text-zinc-300">Passport</span>
              </div>
            </div>
            <button
              onClick={() => { fireNavigationStart(); startTransition(() => { setPassportPage(false); router.push(`/app/agents/${selectedAgent.id}`); }); }}
              className="btn"
            >
              Back to agent
            </button>
          </div>
          <CrystalViewer agentId={selectedAgent.id} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500">
              <button
                onClick={() => { fireNavigationStart(); startTransition(() => { onSelect(null); router.push("/app/agents"); }); }}
                className="hover:text-zinc-200"
              >
                Agents
              </button>
              <span className="mx-1 text-zinc-700">/</span>{" "}
              <span className="text-zinc-300">{selectedAgent.name}</span>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{selectedAgent.name}</h2>
          </div>
          <button onClick={() => setPassportOpen(true)} className="btn btn-primary">
            View Passport
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <section className="card col-span-8 p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Worker profile</h3>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <AgentInfo label="Status" value={statusLabel(selectedAgent.status)} tone="ok" />
              <AgentInfo label="Worker type" value={selectedAgent.kind} />
              <AgentInfo label="Connection" value={selectedAgent.connection_mode === "sdk" ? "SDK connected" : "Managed by Runpane"} />
              <AgentInfo label="Protocol ratchet" value={`n = ${selectedAgent.ratchet_n}`} />
              <AgentInfo label="Agent id" value={selectedAgent.id} mono />
              <AgentInfo label="Current public key" value={selectedAgent.current_pubkey} mono wide />
            </div>
          </section>

          <section className="card col-span-4 p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Execution posture</h3>
            <div className="mt-5 space-y-3">
              <PostureItem label="Identity" value="Verified" />
              <PostureItem label="Runtime" value={selectedAgent.connection_mode === "sdk" ? "External SDK" : "Runpane managed"} />
              <PostureItem label="Permissions" value="Open Passport scoped" />
              <PostureItem label="Approvals" value="Policy gated" />
              <PostureItem label="Audit" value="Receipts chained" />
              <PostureItem label="Pending approvals" value={String(pendingApprovals)} />
              <PostureItem label="Executed actions" value={String(executedActions)} />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <section className="card col-span-7 p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Allowed work</h3>
            <div className="mt-4 space-y-2">
              {activeFacets.map((facet) => (
                <div key={facet.hash} className="rounded-lg border border-line bg-ink/50 p-3">
                  <div className="font-medium">{capabilityLabel(facet.grant.capability)}</div>
                  <div className="mt-1 text-xs text-zinc-500 mono">{facet.grant.capability}</div>
                </div>
              ))}
              {activeFacets.length === 0 && (
                <div className="text-sm text-zinc-500">No active permissions found.</div>
              )}
            </div>
          </section>

          <section className="card col-span-5 p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Recent activity</h3>
            <div className="mt-4 space-y-2">
              {agentReceipts.slice(0, 5).map((receipt) => (
                <div key={receipt.id} className="rounded-lg border border-line bg-ink/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate font-medium">{policyLabel(receipt.policy_rule)}</div>
                    <span className="tag tag-ok">{decisionLabel(receipt.decision)}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 mono">
                    {new Date(receipt.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {agentReceipts.length === 0 && (
                <div className="text-sm text-zinc-500">No receipts yet for this worker.</div>
              )}
            </div>
          </section>
        </div>

        <section className="card p-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-400">Assigned surfaces</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <SurfaceCard title="Finance surface" text="Invoice review and payment execution template." />
            <SurfaceCard title="Approval queue" text="Human checkpoints for policy-gated actions." />
            <SurfaceCard title="Audit log" text="Receipt-backed history of every action." />
          </div>
        </section>

        {passportOpen && (
          <PassportPanel
            agentId={selectedAgent.id}
            onClose={() => {
              setPassportOpen(false);
            }}
            onExpand={() => {
              setPassportOpen(false);
              fireNavigationStart();
              startTransition(() => {
                setPassportPage(true);
                router.push(`/app/agents/${selectedAgent.id}/passport`);
              });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="py-10 text-center">
        <h1 className="text-3xl font-medium tracking-normal text-zinc-100 md:text-4xl">
          Build or Connect your AI Agent
        </h1>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="agentPathSolid"
            onClick={() => {
              fireNavigationStart();
              startTransition(() => router.push("/app/agents/build"));
            }}
          >
            Build
          </Button>
          <Button
            variant="agentPathOutline"
            onClick={() => {
              fireNavigationStart();
              startTransition(() => router.push("/app/agents/connect"));
            }}
          >
            Connect
          </Button>
        </div>
      </section>

      <div className="space-y-3">
        <h2 className="text-lg font-medium tracking-normal text-white">Agents</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setPassportOpen(false);
                setPassportPage(false);
                onSelect(a.id);
                fireNavigationStart();
                startTransition(() => router.push(`/app/agents/${a.id}`));
              }}
              className="relative min-h-36 rounded-xl bg-[#1e1e1e] p-5 pr-24 text-left shadow-none transition hover:bg-[#272727]"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div
                  className="font-medium text-zinc-100"
                  style={{
                    fontFamily:
                      "var(--font-1955), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {a.name}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="tag border-line bg-black/10 text-zinc-400">{a.connection_mode === "sdk" ? "SDK connected" : "Managed"}</span>
                  <span className="tag border-line bg-black/10 text-zinc-400">{a.kind}</span>
                  <span className="mono min-w-0 truncate">{a.id} · n={a.ratchet_n} · pk {a.current_pubkey.slice(0, 16)}…</span>
                </div>
              </div>
              <span className="tag tag-ok absolute right-4 top-4 shrink-0">{statusLabel(a.status)}</span>
            </button>
          ))}
          {agents.length === 0 && <div className="text-sm text-zinc-500">No agents yet.</div>}
        </div>
      </div>
    </div>
  );
}

function AgentInfo({
  label,
  value,
  tone,
  mono,
  wide,
}: {
  label: string;
  value: string;
  tone?: "ok";
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-line bg-ink/50 p-4 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div
        className={`mt-1 truncate text-sm ${tone === "ok" ? "text-ok" : "text-zinc-200"} ${mono ? "mono" : ""
          }`}
      >
        {value}
      </div>
    </div>
  );
}

function PostureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SurfaceCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink/50 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm leading-6 text-zinc-500">{text}</div>
    </div>
  );
}

function PassportPanel({
  agentId,
  onClose,
  onExpand,
}: {
  agentId: string;
  onClose: () => void;
  onExpand: () => void;
}) {
  const [agent, setAgent] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const next = await api.agent(agentId);
      if (active) setAgent(next);
    })();
    return () => {
      active = false;
    };
  }, [agentId]);

  return (
    <div className="fixed right-6 top-6 z-50 w-[420px] overflow-hidden rounded-2xl border border-line bg-ink">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Agent Passport</div>
          <div className="text-sm text-zinc-500">Credential preview</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onExpand} className="btn">Expand</button>
          <button onClick={onClose} className="btn">Close</button>
        </div>
      </div>
      {agent ? <CompactPassport agent={agent} /> : <div className="p-5 text-sm text-zinc-500">Loading…</div>}
    </div>
  );
}

function CompactPassport({ agent }: { agent: any }) {
  const facets = agent.crystal.facets as any[];
  const dead = new Set<string>(agent.crystal.tombstones ?? []);
  const activeFacets = facets.filter((f) => !dead.has(f.hash));

  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-accent/40 bg-accent/10">
          <div className="h-5 w-5 rounded bg-accent" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{agent.name}</div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">{agent.kind} worker</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <MiniField label="Identity" value="Verified" />
        <MiniField label="Signing key" value="Current" />
        <MiniField label="Permissions" value={`${activeFacets.length} active`} />
        <MiniField label="Ratchet" value={`n = ${agent.ratchetN}`} />
      </div>
      <div className="mt-5">
        <div className="text-xs uppercase tracking-wider text-zinc-500">Allowed work</div>
        <div className="mt-2 space-y-2">
          {activeFacets.slice(0, 4).map((facet) => (
            <div key={facet.hash} className="rounded-lg border border-line px-3 py-2 text-sm">
              {capabilityLabel(facet.grant.capability)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
