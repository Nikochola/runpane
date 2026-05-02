"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

export function Settings({ orgId }: { orgId: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [settingsRes, summaryRes] = await Promise.all([api.settings(orgId), api.orgSummary(orgId)]);
      setSettings(settingsRes);
      setSummary(summaryRes);
    })();
  }, [orgId]);

  if (!settings || !summary) return <div className="h-64 animate-pulse rounded-2xl border border-line bg-panel" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/70 p-7">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Organization controls</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{settings.org.name}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Human permissions, active organization state, and production readiness checks live here.
            Every sensitive action is enforced server-side against membership role.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Status label="Agents" value={summary.counts.agents} />
        <Status label="Pending approvals" value={summary.counts.pendingApprovals} />
        <Status label="Receipts" value={summary.counts.receipts} />
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">Members</h3>
        <div className="mt-4 space-y-3">
          {settings.members.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between rounded-xl border border-line bg-ink/50 p-4">
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-zinc-500">{member.email}</div>
              </div>
              <span className="tag">{member.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">Readiness</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {settings.readiness.map((item: any) => (
            <div key={item.label} className="rounded-xl border border-line bg-ink/50 p-4">
              <div className={item.ok ? "text-emerald-400" : "text-zinc-400"}>{item.ok ? "Ready" : "Needs setup"}</div>
              <div className="mt-1 font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Status({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}
