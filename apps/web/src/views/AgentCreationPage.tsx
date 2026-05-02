"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api";

type AgentKind = "finance" | "support" | "operations";
type CreationMode = "build" | "connect";

const templates: Array<{
  kind: AgentKind;
  title: string;
  subtitle: string;
  permissions: string;
  surfaces: string;
}> = [
  {
    kind: "finance",
    title: "Finance Agent",
    subtitle: "Invoices, payment preparation, approvals, and receipts.",
    permissions: "Invoice read, payment prepare, payment execute with policy limits.",
    surfaces: "Invoice Review, Payment Approval, Payment Receipt",
  },
  {
    kind: "support",
    title: "Support Agent",
    subtitle: "Refunds, account updates, escalations, and support receipts.",
    permissions: "Customer lookup, refund request, account update with approval gates.",
    surfaces: "Refund Review, Account Update, Escalation",
  },
  {
    kind: "operations",
    title: "Operations Agent",
    subtitle: "Vendor tasks, procurement requests, and internal workflow updates.",
    permissions: "Vendor read, task update, purchase request with budget checks.",
    surfaces: "Vendor Task, Procurement Request, Workflow Update",
  },
];

function normalizeKind(value: unknown): AgentKind {
  return value === "support" || value === "operations" || value === "finance" ? value : "finance";
}

export function AgentCreationPage({
  mode,
  initialKind = "finance",
}: {
  mode: CreationMode;
  initialKind?: string;
}) {
  const router = useRouter();
  const startingKind = normalizeKind(initialKind);
  const startingTemplate = templates.find((template) => template.kind === startingKind)!;
  const [orgId, setOrgId] = useState<string | null>(null);
  const [kind, setKind] = useState<AgentKind>(startingKind);
  const [name, setName] = useState(
    mode === "build" ? startingTemplate.title : "",
  );
  const [runtimeUrl, setRuntimeUrl] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { orgs } = await api.orgs();
      const org = orgs.find((o: any) => o.id === "org_demo") ?? orgs[0] ?? (await api.createOrg("Acme Demo"));
      if (active) setOrgId(org.id);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit() {
    if (!orgId) return;
    setCreating(true);
    setError(null);
    try {
      const result = await api.createAgent(orgId, {
        name,
        kind,
        connectionMode: mode === "build" ? "managed" : "sdk",
        runtimeUrl: mode === "connect" ? runtimeUrl.trim() || undefined : undefined,
        publicKey: mode === "connect" ? publicKey.trim() || undefined : undefined,
      });
      setCreated(result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not create agent");
    } finally {
      setCreating(false);
    }
  }

  function selectTemplate(nextKind: AgentKind) {
    const template = templates.find((item) => item.kind === nextKind)!;
    setKind(nextKind);
    if (mode === "build") setName(template.title);
  }

  const selected = templates.find((template) => template.kind === kind)!;
  const title = mode === "build" ? "Build a managed AI Agent" : "Connect an SDK Agent";
  const actionLabel = mode === "build" ? "Create managed agent" : "Register SDK agent";

  return (
    <main className="min-h-screen bg-[#0d0d0d] px-8 py-7 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/app/agents")}
            className="rounded-md border border-line px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Back to agents
          </button>
        </header>

        <section className="pt-16 text-center">
          <h1
            className="text-4xl font-medium tracking-normal md:text-5xl"
            style={{
              fontFamily:
                "var(--font-1955), ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
            {mode === "build"
              ? "Runpane creates the worker, issues its Agent Passport, attaches starting permissions, and prepares Prism AX surfaces."
              : "Register an agent you run yourself, then govern it with Agent Passport permissions, approval policy, receipts, and Prism AX actions."}
          </p>
        </section>

        <section className="mt-12 grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateChoice
              key={template.kind}
              template={template}
              selected={template.kind === kind}
              onClick={() => selectTemplate(template.kind)}
            />
          ))}
        </section>

        <section className="mt-12 grid grid-cols-12 gap-6">
          <div
            className={`rounded-2xl border border-line bg-ink/50 p-6 ${
              mode === "connect" ? "col-span-12 mx-auto w-full max-w-3xl" : "col-span-7"
            }`}
          >
            <h2 className="text-lg font-medium">{mode === "build" ? "Managed setup" : "Runtime identity"}</h2>
            <div className="mt-5 space-y-4">
              <LabeledInput label="Agent name" value={name} onChange={setName} />
              {mode === "connect" && (
                <>
                  <LabeledInput
                    label="Runtime URL"
                    value={runtimeUrl}
                    onChange={setRuntimeUrl}
                    placeholder="https://agent.company.com"
                  />
                  <LabeledInput
                    label="Current public key"
                    value={publicKey}
                    onChange={setPublicKey}
                    placeholder="Optional 64-char hex key. Blank creates one-time SDK seed credentials."
                    mono
                  />
                </>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-err/40 bg-err/5 p-3 text-sm text-err">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-xs leading-5 text-zinc-500">
                {mode === "build"
                  ? "The managed worker receives a one-time seed held by Runpane for this demo runtime."
                  : "If you provide a key, Runpane stores only public key material and ratchet state."}
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={!orgId || creating || !name.trim()}
                className="btn btn-primary min-w-44"
              >
                {creating ? "Creating..." : actionLabel}
              </button>
            </div>
          </div>

          {mode === "build" && (
            <aside className="col-span-5 rounded-2xl border border-line bg-panel/50 p-6">
              <h2 className="text-lg font-medium">What gets attached</h2>
              <div className="mt-5 space-y-3 text-sm">
                <SetupRow label="Agent Passport" value="Identity, public key, ratchet index, passport hash." />
                <SetupRow label="Permissions" value={selected.permissions} />
                <SetupRow label="Approval rules" value="Budget and risk checks before sensitive actions execute." />
                <SetupRow label="Prism AX" value={selected.surfaces} />
              </div>
            </aside>
          )}
        </section>

        {created && <CreationReceipt agent={created} onOpen={() => router.push(`/app/agents/${created.id}`)} />}
      </div>
    </main>
  );
}

function TemplateChoice({
  template,
  selected,
  onClick,
}: {
  template: (typeof templates)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-48 rounded-xl p-5 text-left transition ${
        selected ? "bg-[#272727]" : "bg-[#1e1e1e] hover:bg-[#272727]"
      }`}
    >
      <div
        className="text-lg font-medium text-zinc-100"
        style={{
          fontFamily:
            "var(--font-1955), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {template.title}
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-500">{template.subtitle}</p>
      <div className="mt-8 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Template
      </div>
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-lg border border-line bg-[#0d0d0d] px-3 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-accent/50 ${
          mono ? "mono" : ""
        }`}
      />
    </label>
  );
}

function SetupRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink/50 p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-1 leading-6 text-zinc-300">{value}</div>
    </div>
  );
}

function CreationReceipt({ agent, onOpen }: { agent: any; onOpen: () => void }) {
  return (
    <section className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Agent Passport issued</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {agent.connectionMode === "sdk" ? "SDK-connected runtime" : "Managed Runpane worker"} · {agent.kind}
          </p>
        </div>
        <button type="button" onClick={onOpen} className="btn">
          View registered agents
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ReceiptField label="Agent ID" value={agent.id} />
        <ReceiptField label="Passport hash" value={agent.crystalHash} />
        <ReceiptField label="Public key" value={agent.publicKey} wide />
        {agent.seedHex && (
          <ReceiptField
            label="One-time SDK seed"
            value={agent.seedHex}
            wide
            tone="warn"
            hint="Shown once. Persist it in the runtime before leaving this page."
          />
        )}
      </div>

      {agent.sdk && (
        <div className="mt-5 overflow-hidden rounded-lg border border-line bg-ink">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500">SDK setup</div>
            <span className="tag">{agent.sdk.package}</span>
          </div>
          <pre className="overflow-x-auto p-3 text-xs leading-5 text-zinc-300">
            {agent.sdk.snippet}
          </pre>
        </div>
      )}
    </section>
  );
}

function ReceiptField({
  label,
  value,
  hint,
  tone,
  wide,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warn";
  wide?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-line bg-ink/70 p-3 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className={`mt-1 break-all text-xs mono ${tone === "warn" ? "text-warn" : "text-zinc-300"}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs leading-5 text-zinc-500">{hint}</div>}
    </div>
  );
}
