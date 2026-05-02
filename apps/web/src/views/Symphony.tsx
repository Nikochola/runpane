"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

const steps = [
  ["Linear intake", "Symphony watches selected Linear teams, labels, or projects for issues that should become autonomous work."],
  ["Isolated workspace", "Each issue runs in a dedicated worktree with its own logs, branch, and execution context."],
  ["Codex execution", "The Symphony worker launches Codex app-server for the implementation loop and streams observable state."],
  ["Review handoff", "The result is traceable back to the issue, branch, logs, and review artifact before a human accepts it."],
];

export function Symphony({ orgId }: { orgId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("RUN-142: Add approval receipt export");
  const [prompt, setPrompt] = useState("Implement the issue in an isolated Symphony workspace, run relevant tests, and return branch, logs, and review notes.");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.codexTasks(orgId);
    setTasks(res.tasks);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [orgId]);

  async function createRun() {
    await api.createCodexTask(orgId, {
      title,
      prompt,
      riskLevel: "medium",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/70 p-7">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">OpenAI Symphony</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Autonomous issue execution for Codex.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Symphony is the worker orchestration layer for turning tracked issues into isolated Codex runs.
              In Runpane, it should sit behind Agent Passport policy so issue execution, credentials,
              approvals, logs, and receipts are controlled by the company.
            </p>
          </div>
          <a
            href="https://github.com/openai/symphony"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-line px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3">
        {steps.map(([title, text], index) => (
          <div key={title} className="rounded-2xl border border-line bg-panel/70 p-5">
            <div className="font-mono text-xs text-accent">0{index + 1}</div>
            <h3 className="mt-3 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Runpane control wrapper</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              This local UI records Symphony run requests with the same org scoping, audit events,
              and workflow integration records as other execution rails. The real next step is wiring
              this to a running Symphony service and mapping Linear issue ids to Passport-scoped agents.
            </p>
          </div>
          <span className="tag tag-warn">adapter mode</span>
        </div>

        <div className="mt-5 grid grid-cols-12 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-4 h-11 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-accent"
          />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="col-span-6 h-11 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-accent"
          />
          <button type="button" onClick={createRun} className="col-span-2 h-11 rounded-xl bg-accent px-4 text-sm font-medium text-white">
            Create run
          </button>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400">Tracked Symphony runs</h3>
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="h-20 animate-pulse rounded-xl border border-line bg-ink/50" />
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-line bg-ink/50 p-4 text-sm text-zinc-500">No Symphony runs tracked yet.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-line bg-ink/50 p-4">
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="mt-1 font-mono text-xs text-zinc-500">
                    {task.external_task_id} · {task.risk_level} risk · {new Date(task.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="tag">{task.status}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
