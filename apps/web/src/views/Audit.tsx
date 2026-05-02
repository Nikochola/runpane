import { useEffect, useState } from "react";
import { api } from "../api";
import { policyLabel } from "../display";
import { DecisionTag } from "./Overview";

export function Audit({ orgId }: { orgId: string }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [chain, setChain] = useState<any | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function refresh() {
    const [r, c] = await Promise.all([api.receipts(orgId), api.verifyChain(orgId)]);
    setReceipts(r.receipts);
    setChain(c);
  }
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, [orgId]);

  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Action receipts</div>
          <div className="text-sm">
            {receipts.length} receipts · signed intents · blake3-linked · prev-hash anchored
          </div>
        </div>
        <span className={`tag ${chain?.ok ? "tag-ok" : "tag-err"}`}>
          {chain ? (chain.ok ? "Intact" : `Broken at ${chain.brokenAt}`) : "…"}
        </span>
      </div>

      <div className="card divide-y divide-line">
        {receipts.map((r) => {
          const intent = (() => {
            try {
              return JSON.parse(r.intent_json);
            } catch {
              return null;
            }
          })();
          return (
            <div key={r.id}>
              <button
                onClick={() => setOpen(open === r.id ? null : r.id)}
                className="w-full text-left p-4 flex items-center gap-4 hover:bg-zinc-900/40"
              >
                <div className="mono text-xs text-zinc-500 w-32">
                  {new Date(r.created_at).toLocaleTimeString()}
                </div>
                <div className="flex-1 truncate">
                  <div>{intent?.intent?.description ?? policyLabel(r.policy_rule)}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {policyLabel(r.policy_rule)}
                    <span className="mx-2 text-zinc-700">·</span>
                    <span className="mono">{String(r.receipt_hash).slice(0, 10)}…</span>
                  </div>
                </div>
                <DecisionTag decision={r.decision} />
              </button>
              {open === r.id && (
                <pre className="px-4 pb-4 text-[11px] mono text-zinc-400 overflow-x-auto">
{JSON.stringify(
  {
    id: r.id,
    decision: r.decision,
    rule: r.policy_rule,
    facet: r.facet_hash,
    approval: r.approval_id,
    prev: r.prev_receipt_hash,
    hash: r.receipt_hash,
    ratchet: { before: r.ratchet_n_before, after: r.ratchet_n_after },
    intent: intent?.intent,
    external: r.external_call_json && JSON.parse(r.external_call_json),
    result: r.result_json && JSON.parse(r.result_json),
  },
  null,
  2,
)}
                </pre>
              )}
            </div>
          );
        })}
        {receipts.length === 0 && (
          <div className="p-10 text-center text-sm text-zinc-500">
            No receipts yet. Approve an intent or run the demo.
          </div>
        )}
      </div>
    </div>
  );
}
