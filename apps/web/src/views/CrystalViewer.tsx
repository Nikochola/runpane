"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { capabilityLabel, constraintLabel } from "../display";
import { NeonDrift } from "../components/NeonDrift";

export function CrystalViewer({ agentId }: { agentId: string | null }) {
  const [agent, setAgent] = useState<any | null>(null);

  async function refresh() {
    if (!agentId) return;
    setAgent(await api.agent(agentId));
  }
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, [agentId]);

  if (!agentId) {
    return (
      <div className="card p-10 text-center text-zinc-500">
        Select an AI worker to inspect its open Agent Passport.
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <NeonDrift size={36} color="rgba(255,255,255,0.7)" />
      </div>
    );
  }

  const facets = agent.crystal.facets as any[];
  const dead = new Set<string>(agent.crystal.tombstones ?? []);
  const activeFacetCount = facets.filter((f) => !dead.has(f.hash)).length;

  return (
    <div className="space-y-6">
      <PassportCard agent={agent} activeFacetCount={activeFacetCount} />

      <div>
        <div className="group relative inline-flex items-center gap-3">
          <img src="/crystal.png" alt="" className="h-10 w-10 shrink-0" style={{ filter: "drop-shadow(0 0 8px rgba(139, 109, 255, 0.6))" }} />
          <h3 className="text-2xl font-semibold tracking-tight text-white">Crystal</h3>
          <div className="pointer-events-none absolute left-0 top-full z-10 mt-3 w-[min(48rem,80vw)] opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="rounded-2xl border border-line bg-[#111111] px-4 py-3 text-sm leading-6 text-zinc-300 shadow-none">
              The worker's Passport permissions, shown in plain language. The protocol details stay
              available for inspection, but Runpane presents them as operator-readable authority.
            </div>
          </div>
        </div>
        <div className="mt-2 grid gap-2">
          {facets.map((f) => (
            <FacetCard
              key={f.hash}
              facet={f}
              agentId={agent.id}
              revoked={dead.has(f.hash)}
              onRevoke={async () => {
                await api.revokeFacet(agent.id, f.hash);
                refresh();
              }}
              onEdit={async (capability: string) => {
                await api.revokeFacet(agent.id, f.hash);
                await api.issueGrant(agent.id, capability, f.grant.constraints ?? []);
                refresh();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PassportCard({ agent, activeFacetCount }: { agent: any; activeFacetCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTilt({ x, y });
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: hovering
          ? `perspective(800px) rotateX(${-tilt.y * 4}deg) rotateY(${tilt.x * 4}deg) scale(1.005)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: hovering ? "transform 0.05s ease-out" : "transform 0.4s ease-out",
        willChange: "transform",
      }}
      className="overflow-hidden rounded-2xl border border-line bg-[linear-gradient(135deg,#121117_0%,#0b0b0e_45%,#101915_100%)] p-7"
    >
      <div className="text-xs uppercase tracking-[0.28em] text-accent">Open Agent Passport</div>
      <div className="mt-5 flex items-center gap-3">
        <img src="/passport.png" alt="" className="h-8 w-8 shrink-0 object-cover" />
        <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-1955), ui-sans-serif, system-ui, sans-serif" }}>
          {agent.name}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4 border-t border-line pt-6 text-xs">
        <PassportStat label="Status" value={agent.status ?? "active"} tone="ok" />
        <PassportStat label="Permissions" value={`${activeFacetCount} active`} />
        <PassportStat label="Ratchet" value={`n = ${agent.ratchetN}`} />
        <PassportStat label="Signing key" value="Current" />
      </div>
      <div className="mt-4 truncate text-[11px] text-zinc-600 mono">
        {agent.id} · pk {agent.publicKey}
      </div>
    </section>
  );
}

function PassportStat({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className={`mt-1 text-sm font-medium ${tone === "ok" ? "text-ok" : "text-zinc-200"}`}>
        {value}
      </div>
    </div>
  );
}

function FacetCard({
  facet,
  agentId,
  revoked,
  onRevoke,
  onEdit,
}: {
  facet: any;
  agentId: string;
  revoked: boolean;
  onRevoke: () => void;
  onEdit: (capability: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(facet.grant.capability as string);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const constraints = facet.grant.constraints as any[];

  function startEdit() {
    if (revoked) return;
    setDraft(facet.grant.capability);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function save() {
    if (draft === facet.grant.capability) { setEditing(false); return; }
    setSaving(true);
    try {
      await onEdit(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") { setEditing(false); setDraft(facet.grant.capability); }
  }

  return (
    <div className={`rounded-xl px-5 py-4 ${revoked ? "bg-err/5 opacity-60" : "bg-[#1e1e1e]"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={onKeyDown}
                disabled={saving}
                className="flex-1 rounded bg-zinc-800 px-2 py-0.5 font-medium text-zinc-100 outline-none ring-1 ring-accent/60 focus:ring-accent text-sm"
              />
            ) : (
              <button
                onClick={startEdit}
                disabled={revoked}
                className="font-medium text-zinc-100 text-left hover:text-white focus:outline-none"
                title="Click to edit capability"
              >
                {capabilityLabel(facet.grant.capability)}
              </button>
            )}
            {facet.parent === "ROOT"
              ? <span className="tag shrink-0">root</span>
              : <span className="tag mono shrink-0">child</span>}
            {revoked && <span className="tag tag-err shrink-0">revoked</span>}
            {saving && (
              <span className="shrink-0">
                <NeonDrift size={16} dotSize={2} color="rgba(255,255,255,0.7)" speed={1.4} />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="mono">{facet.grant.capability}</span>
            {constraints.length > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                {constraints.map((c: any, i: number) => (
                  <span key={i} className="tag">{constraintLabel(c)}</span>
                ))}
              </>
            )}
          </div>
        </div>
        {!revoked && !editing && (
          <button onClick={onRevoke} className="btn shrink-0 text-err border-err/40">
            Revoke
          </button>
        )}
        {editing && (
          <div className="flex shrink-0 gap-2">
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs">Save</button>
            <button onClick={() => { setEditing(false); setDraft(facet.grant.capability); }} className="btn text-xs">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
