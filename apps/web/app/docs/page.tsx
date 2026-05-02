const sections = [
  {
    title: "Agent Passport",
    text: "Agent Passport is the open trust protocol for AI workers: identity, current public key, ratchet index, capability grants, revocations, approval policy links, budgets, receipts, and audit metadata.",
    items: ["Create or register an agent", "Issue scoped grants", "Rotate key state", "Export Passport JSON", "Verify receipt chains"],
  },
  {
    title: "Prism AX",
    text: "Prism AX turns business software into typed, machine-readable execution surfaces. Humans and agents render from the same schema, so actions are predictable and policy-bound.",
    items: ["Typed fields", "Bound actions", "Capability requirements", "Preconditions", "Approval widgets"],
  },
  {
    title: "Sealed Intents",
    text: "Agents begin with a nonce and current Passport hash, sign an intent, and receive executed, denied, or pending approval. Executed actions produce receipts.",
    items: ["POST /intents/begin", "POST /intents/execute", "Approval pending state", "Receipt handling"],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] px-8 py-10 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="text-xs uppercase tracking-[0.22em] text-accent">runpane docs</div>
        <h1 className="mt-4 text-5xl font-semibold">Build trustworthy AI workers.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
          Runpane is the hosted control plane for Agent Passport and Prism AX. Passport is protocol-oriented;
          Runpane operates the SaaS permissions, approvals, integrations, billing, and audit trail around it.
        </p>

        <div className="mt-10 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-line bg-panel/70 p-6">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{section.text}</p>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {section.items.map((item) => (
                  <div key={item} className="rounded-xl border border-line bg-ink/50 p-3 text-sm text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-line bg-panel/70 p-6">
          <h2 className="text-2xl font-semibold">SDK shape</h2>
          <pre className="mt-5 overflow-auto rounded-xl border border-line bg-ink p-4 text-sm leading-6 text-zinc-300">
{`const agent = await runpane.register({
  mode: "sdk",
  publicKey,
  capabilities: ["support.refund.prepare"]
})

const { nonce, passportHash } = await agent.beginIntent()
const receipt = await agent.execute({
  nonce,
  passportHash,
  capability: "support.refund.prepare",
  resource: "ticket:SUP-1042",
  amount: 32000
})`}
          </pre>
        </section>
      </div>
    </main>
  );
}
