# runpane

The operating environment for AI workers. Identity, permissions, approvals, and safe execution
inside real businesses.

This repo is the MVP: a hardened **Agent Passport Layer** + a **Prism execution layer**, with one
end-to-end vertical — a **Finance Agent** that reviews invoices, auto-pays small ones to
allowlisted vendors, and escalates the rest for human approval. Every action is signed,
hash-chained, and reversible.

---

## What's inside

```
packages/
  passport/    Living Passports — ratchet keys, capability crystals, sealed intents
  prism/       Typed surface schema (agent-safe UI primitives)
  policy/      Declarative policy DSL (allow / approve / deny)
  agent-sdk/   Tiny TS client agents use to act
services/
  api/         Hono gateway — identity, ledger, approvals, audit chain, mock Stripe + QBO
  symphony/    Linear-to-Codex issue orchestration daemon
apps/
  web/         Next.js app, marketing pages, SaaS app shell, and Passport inspector
```

## The security primitive: Living Passports

Three custom pieces designed together — see in code under `packages/passport/src/`:

1. **Ratchet Key** (`ratchet.ts`) — Ed25519 seed that *advances after every action* via HKDF over
   the action's receipt hash. A captured signature is valid for one action, in one position,
   then the key it signed with no longer exists on either side.
2. **Capability Crystal** (`crystal.ts`) — content-addressed Merkle DAG of signed grants.
   Authority is delegated by appending facets, attenuated by appending narrower ones, revoked by
   tombstoning. The crystal *is* the audit trail of who can do what.
3. **Sealed Intent** (`intent.ts`) — every action is a signed envelope binding `{intent,
   crystal_hash, ratchet_n, public_key, preconditions, nonce}`. The gateway verifies the
   signature against the agent's *current* ratchet position, walks the crystal, evaluates
   policy, and produces a hash-chained receipt. The next ratchet step is derived from that
   receipt — server and agent both move in lockstep.

A breach scenario: an attacker steals the agent's current `sk_n` and crystal. They get exactly
**one** action. The next legitimate action invalidates the stolen key. They cannot widen the
crystal — every facet is parent-signed and content-hashed.

No HSM, no third-party token format, no external CA required. Pure `@noble/ed25519` + BLAKE3.

---

## Run it

Requirements: Node 20+, pnpm 9+.

```bash
pnpm install
pnpm --filter @runpane/api seed       # creates org_demo with vendors + invoices
pnpm dev:local                        # API on http://localhost:4000, web on http://localhost:5173
```

Run the Symphony issue orchestrator against a workflow file:

```bash
pnpm symphony ./WORKFLOW.md --port 4317
```

For the Portless dev domain:

```bash
pnpm portless:proxy                   # starts the local HTTPS proxy with the .ai TLD
pnpm dev                              # API on localhost:4000, web at https://runpane.ai
```

If a previous Portless proxy is already running with another TLD, stop it first and restart it
with `.ai`:

```bash
sudo portless proxy stop -p 443
sudo portless proxy start --https --tld ai
pnpm dev
```

Or run the end-to-end demo (with the API already running):

```bash
pnpm demo
```

That spawns a Finance Agent, lists open invoices, attempts to pay each, watches the gateway
auto-approve small allowlisted ones (≤ $500 to known vendors), queues the rest for human
approval, advances the ratchet on each successful action, and prints the verified hash chain.

Marketing pages live at `/`, `/security`, `/developers`, and `/pricing`.

The SaaS app lives under `/app`:
- **Overview** — live stats, agents, recent activity
- **Agents** — spawn agents (seed shown ONCE)
- **Agent Passport** — inspect authority, ratchet state, and capability facets
- **Approvals** — approve/reject pending intents
- **Audit Chain** — every receipt with prev-hash, full intent expansion, chain verification
- **Prism Surfaces** — typed work surfaces and finance execution template

---

## What's mocked vs real

- **Crypto, ratchet, crystal, sealed intents, policy engine, hash chain, ledger, approvals** —
  real, end-to-end working code.
- **Stripe Treasury, QuickBooks Online** — mocked behind real interfaces in
  `services/api/src/integrations/`. Swap to live by replacing the body of those files; the
  gateway contract doesn't change.
- **Human auth** — single demo org, no SSO yet. Add WorkOS in `services/api/src/index.ts`
  before any external use.
- **HSM-backed keys** — keys live in SQLite for now. The `agent_secrets` table is the single
  swap point: replace with KMS/HSM signing without touching the protocol.

---

## What this is not

Not a chatbot. Not an agent framework. Not a marketplace. The product is the *trust plane* — the
thing that lets a company say yes to giving an AI worker a credit card and a CRM login.
