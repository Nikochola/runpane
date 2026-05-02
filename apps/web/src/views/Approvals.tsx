import { useEffect, useState } from "react";
import { api } from "../api";
import { amountLabel, capabilityLabel, policyLabel, statusLabel } from "../display";

export function Approvals({ orgId }: { orgId: string }) {
  const [approvals, setApprovals] = useState<any[]>([]);

  async function refresh() {
    const r = await api.approvals(orgId);
    setApprovals(r.approvals);
  }
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 1500);
    return () => clearInterval(i);
  }, [orgId]);

  return (
    <div className="space-y-3">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Approval gates</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Human checkpoints before risky execution</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Agents can prepare work, but Passport policy decides whether the action executes now,
          requires approval, or is denied. Approved requests turn into signed receipts in the audit log.
        </p>
      </div>
      {approvals.length === 0 && (
        <div className="card p-8 text-center text-sm text-zinc-500">
          No approvals yet. Run a worker demo or trigger a policy-gated action to populate this queue.
        </div>
      )}
      {approvals.map((a) => {
        const intent = JSON.parse(a.intent_json);
        const i = intent.intent;
        return (
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500 mono">{a.id}</div>
                <div className="font-medium mt-1">{i.description}</div>
                <div className="text-sm text-zinc-400 mt-1">
                  {i.amount && (
                    <>
                      <strong>{amountLabel(i.amount)}</strong> →{" "}
                    </>
                  )}
                  {i.vendor ?? "No vendor"}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="tag tag-warn">{policyLabel(a.reason)}</span>
                  <span className="tag">{capabilityLabel(i.capability)}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  <span className="mono">{i.capability}</span>
                  <span className="mx-2 text-zinc-700">·</span>
                  <span className="mono">intent {a.intent_hash.slice(0, 14)}…</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`tag ${
                    a.status === "pending"
                      ? "tag-warn"
                      : a.status === "approved"
                      ? "tag-ok"
                      : "tag-err"
                  }`}
                >
                  {statusLabel(a.status)}
                </span>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await api.reject(a.id);
                        refresh();
                      }}
                      className="btn"
                    >
                      Reject
                    </button>
                    <button
                      onClick={async () => {
                        await api.approve(a.id);
                        refresh();
                      }}
                      className="btn btn-primary"
                    >
                      Approve & execute
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
