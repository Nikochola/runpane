"use client";

import Link from "next/link";
import { useState } from "react";
import { AsciiShader } from "./components/AsciiShader";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-black"
        onMouseLeave={() => setResourcesOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-2.5">
          <Link href="/" className="flex items-center font-light">
            <img
              src="/runpane-logo.png"
              alt="Runpane"
              className="h-5 object-contain brightness-0 invert"
            />
          </Link>
          <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-1 text-sm text-white font-light md:flex">
            <div>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                onMouseEnter={() => setResourcesOpen(true)}
                className={`rounded-full px-4 py-2 transition ${
                  resourcesOpen ? "bg-white/[0.1] text-white" : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                Resources
              </button>
            </div>
            <Link
              href="/security"
              className="rounded-md px-3.5 py-2 transition hover:bg-white/[0.06]"
            >
              Security
            </Link>
            <Link
              href="/developers"
              className="rounded-md px-3.5 py-2 transition hover:bg-white/[0.06]"
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-3.5 py-2 transition hover:bg-white/[0.06]"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-light text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-light text-zinc-950 transition hover:bg-zinc-200"
            >
              Try Runpane
            </Link>
          </div>
        </div>
        {resourcesOpen && (
          <div
            className="absolute left-0 right-0 top-full border-t border-white/[0.04] bg-black"
            onMouseEnter={() => setResourcesOpen(true)}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[1.25fr_1fr] gap-24 px-8 pb-14 pt-12">
              <div>
                <div className="mb-6 text-sm font-medium text-zinc-500">Explore Resources</div>
                <div className="space-y-5">
                  <MegaMenuLink href="/security" title="Security" />
                  <MegaMenuLink href="/developers" title="Developer documentation" />
                  <MegaMenuLink href="/docs" title="Agent Passport protocol" />
                  <MegaMenuLink href="/pricing" title="Pricing" />
                </div>
              </div>
              <div>
                <div className="mb-7 text-sm font-medium text-zinc-500">Use cases</div>
                <div className="space-y-4">
                  <MegaMenuSmallLink title="Finance Agents" description="Payments, approvals, receipts" />
                  <MegaMenuSmallLink title="Support Agents" description="Refunds and account actions" />
                  <MegaMenuSmallLink title="Operations Agents" description="Vendor work and internal workflows" />
                  <MegaMenuSmallLink title="Custom Workflows" description="Any capability domain" />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

function MegaMenuLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block max-w-xl text-4xl font-medium leading-tight text-white transition hover:text-zinc-400"
    >
      {title}
    </Link>
  );
}

function MegaMenuSmallLink({ title, description }: { title: string; description: string }) {
  return (
    <div className="group">
      <div className="text-lg font-medium text-white transition group-hover:text-zinc-400">{title}</div>
      <div className="mt-1 text-sm text-zinc-500">{description}</div>
    </div>
  );
}

export function HomeMarketingPage() {
  return (
    <MarketingShell>
      <main>
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
          {/* Full-bleed ASCII background */}
          <div
            className="pointer-events-none absolute inset-0 z-0 text-zinc-400"
            style={{
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%)",
              opacity: 0.45,
              mixBlendMode: "screen",
            }}
          >
            <AsciiShader />
          </div>

          {/* Vignette edges */}
          <div className="pointer-events-none absolute inset-0 z-0" style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, #0a0a0a 100%)",
          }} />

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            {/* Status chip */}
            <div className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-mono tracking-widest text-zinc-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              Agent Passport · Preview
            </div>

            <h1 className="mx-auto max-w-4xl text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[1.0] tracking-tight text-zinc-50">
              The operating layer<br />
              <span className="text-zinc-500">for AI workers.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-zinc-500">
              Agent Passport gives every AI worker verified identity, scoped permissions,
              and a tamper-proof audit chain. Prism AX replaces brittle UI scraping with
              typed machine actions.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Launch control plane
              </Link>
              <Link
                href="/developers"
                className="rounded-lg border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
              >
                Read the docs
              </Link>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </section>

        {/* ── ACTIVITY TICKER ────────────────────────────────────────── */}
        <TickerStrip />

        {/* ── THREE PILLARS ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">Capabilities</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Infrastructure, not a wrapper.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px border border-white/[0.06] md:grid-cols-3">
            <PillarCard
              index="01"
              title="Agent Passport"
              body="Verified identity, capability crystals, spending budgets, approval rules, and cryptographically-chained receipts — before any action reaches production."
              tag="Trust"
            />
            <PillarCard
              index="02"
              title="Prism AX"
              body="Typed, versioned action surfaces that agents can call directly. No more parsing HTML. No more fragile scraping. Structured operations from day one."
              tag="Execution"
            />
            <PillarCard
              index="03"
              title="Runpane OS"
              body="The hosted environment that binds Passport and Prism AX into a live control plane. Policy engine, ledger, approval queue, and audit trail in one place."
              tag="Platform"
            />
          </div>
        </section>

        {/* ── APPROVAL GATES ──────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-0 px-6 md:grid-cols-2">
            <div className="py-20 pr-0 md:pr-16">
              <SectionEyebrow>Approval gates</SectionEyebrow>
              <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                Agents prepare the work.<br />
                Policy decides if it runs.
              </h3>
              <p className="mt-5 text-[15px] leading-7 text-zinc-500">
                Every intent is evaluated against scoped capability grants before execution.
                High-risk actions queue for human review — complete with full context, signed
                by the agent's ratchet key.
              </p>
              <ul className="mt-7 space-y-2.5">
                {[
                  "Amount caps, vendor allowlists, time windows",
                  "One-click approve-and-execute",
                  "Full intent JSON and signature in the queue",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="mt-0.5 font-mono text-zinc-600">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-l border-white/[0.05] py-10 pl-0 md:pl-16">
              <ApprovalMockup />
            </div>
          </div>
        </section>

        {/* ── AUDIT CHAIN ─────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-0 px-6 md:grid-cols-2">
            <div className="border-r border-white/[0.05] py-10 pr-0 md:pr-16">
              <AuditMockup />
            </div>
            <div className="py-20 pl-0 md:pl-16">
              <SectionEyebrow>Cryptographic receipts</SectionEyebrow>
              <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                Every action leaves<br />
                a verifiable trace.
              </h3>
              <p className="mt-5 text-[15px] leading-7 text-zinc-500">
                Approved intents become BLAKE3-chained receipts. Each one carries the
                agent's ratchet position, the policy rule that fired, and a hash anchored
                to the previous receipt. Tamper anything — the chain breaks.
              </p>
              <ul className="mt-7 space-y-2.5">
                {[
                  "Hash-linked, append-only receipt log",
                  "Ratchet advance on every execution",
                  "One-click chain verification",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="mt-0.5 font-mono text-zinc-600">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ───────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.05] bg-white/[0.015]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/[0.05] px-6 md:grid-cols-4">
            <StatCell value="Ed25519" label="Signing algorithm" />
            <StatCell value="BLAKE3" label="Receipt hash" />
            <StatCell value="HKDF" label="Ratchet KDF" />
            <StatCell value="< 60s" label="Nonce TTL" />
          </div>
        </section>

        {/* ── DASHBOARD PREVIEW ───────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 flex items-end justify-between gap-8">
            <div>
              <SectionEyebrow>Control plane</SectionEyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                One view for every agent in your org.
              </h2>
            </div>
            <Link href="/login" className="hidden shrink-0 rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 md:block">
              Open the app →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5 shadow-2xl md:p-2">
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d0d]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <div className="ml-4 font-mono text-xs text-zinc-600">runpane / agents / passport</div>
              </div>
              <div className="grid divide-x divide-white/[0.05] md:grid-cols-3">
                <DashCell label="Identity">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-indigo-500/20 bg-indigo-500/10 font-mono text-xs text-indigo-400">AG</div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Finance Agent #402</div>
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-600">id_94b2…8f1a · n=12</div>
                    </div>
                  </div>
                </DashCell>
                <DashCell label="Authority">
                  <div className="space-y-2">
                    {[
                      { cap: "stripe.payment.create", allow: true },
                      { cap: "db.write", allow: false },
                      { cap: "refund.issue", allow: true },
                    ].map(({ cap, allow }) => (
                      <div key={cap} className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-zinc-500">{cap}</span>
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${allow ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {allow ? "allow" : "deny"}
                        </span>
                      </div>
                    ))}
                  </div>
                </DashCell>
                <DashCell label="Activity">
                  <div className="space-y-3">
                    {[
                      { text: "Issued $45.00 refund", time: "2m ago", ok: true },
                      { text: "Approval pending · $500", time: "15m ago", ok: false },
                      { text: "Chain verified · n=11", time: "1h ago", ok: true },
                    ].map(({ text, time, ok }) => (
                      <div key={text} className="flex items-start gap-2">
                        <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
                        <div>
                          <div className="text-[12px] text-zinc-300">{text}</div>
                          <div className="font-mono text-[10px] text-zinc-600">{time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DashCell>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <div
              className="absolute left-0 right-0 h-px opacity-20"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
            />
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Deploy agents you can<br />
              <span className="text-zinc-500">actually control.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-zinc-500">
              Get the control plane running in minutes. The crypto is done. The audit trail is done. You just plug in your agents.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-zinc-100 px-7 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Start for free
              </Link>
              <Link
                href="/developers"
                className="rounded-lg border border-white/10 px-7 py-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <img src="/runpane-logo.png" alt="Runpane" className="h-4 object-contain brightness-0 invert opacity-30" />
          <div className="flex gap-6 text-xs text-zinc-700">
            <Link href="/security" className="hover:text-zinc-400">Security</Link>
            <Link href="/pricing" className="hover:text-zinc-400">Pricing</Link>
            <Link href="/developers" className="hover:text-zinc-400">Developers</Link>
          </div>
        </div>
      </footer>
    </MarketingShell>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function TickerStrip() {
  const events = [
    "agent:agt_cf80 · intent sealed · n=47",
    "policy:allow · rule=refund_under_500 · $312.00",
    "receipt:r_9a2b · blake3=8f2a1c… · chain intact",
    "approval:approved · human_id=niko · latency=4.1s",
    "ratchet:advance · n=47→48 · new_pk=ed25519:a7f3…",
    "agent:agt_d441 · crystal loaded · facets=6 · tombstones=1",
    "policy:deny · rule=db.write.blocked · intent rejected",
    "receipt:r_9a3c · prev=8f2a1c… · chained",
  ];

  return (
    <div className="overflow-hidden border-y border-white/[0.05] bg-white/[0.015] py-3">
      <div
        className="flex gap-12 whitespace-nowrap font-mono text-[11px] text-zinc-600"
        style={{
          animation: "marquee 30s linear infinite",
        }}
      >
        {[...events, ...events].map((e, i) => (
          <span key={i} className="shrink-0">
            <span className="mr-3 text-zinc-800">·</span>
            {e}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function PillarCard({ index, title, body, tag }: { index: string; title: string; body: string; tag: string }) {
  return (
    <div className="group flex flex-col gap-5 bg-transparent p-8 transition hover:bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-700">{index}</span>
        <span className="rounded border border-white/[0.07] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600">{tag}</span>
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm leading-7 text-zinc-500">{body}</p>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">{children}</div>
  );
}

function ApprovalMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-indigo-500/20 bg-indigo-500/10 font-mono text-xs text-indigo-400">AG</div>
            <div>
              <div className="text-sm font-medium text-zinc-200">Issue $120.00 refund</div>
              <div className="font-mono text-[10px] text-zinc-600">Stripe · Agent #402 · intent sealed</div>
            </div>
          </div>
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400">pending</span>
        </div>
        <div className="mb-4 rounded-lg border border-white/[0.06] bg-black/20 p-3 font-mono text-[10px] text-zinc-600">
          <div>capability: stripe.payment.create</div>
          <div>amount_cents: 12000</div>
          <div>vendor: acme_corp</div>
          <div className="text-zinc-700">hash: 8f2a1c9d…</div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-500">Reject</button>
          <button className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-950">Approve & execute</button>
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 bg-zinc-800 font-mono text-xs text-zinc-500">AG</div>
            <div className="text-sm text-zinc-500">Update vendor record</div>
          </div>
          <span className="rounded border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-600">queued</span>
        </div>
      </div>
    </div>
  );
}

function AuditMockup() {
  const receipts = [
    { id: "r_9a3c", decision: "executed", rule: "refund_under_500", hash: "b41e9…", prev: "8f2a1…", n: 12 },
    { id: "r_9a2b", decision: "approved", rule: "human_approved", hash: "8f2a1…", prev: "c39f0…", n: 11 },
    { id: "r_9a1a", decision: "denied", rule: "db.write.blocked", hash: "c39f0…", prev: "4d8e2…", n: 10 },
  ];

  return (
    <div className="space-y-2">
      {receipts.map((r) => (
        <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-500">{r.id}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-700">n={r.n}</span>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                r.decision === "executed" ? "bg-emerald-500/10 text-emerald-400" :
                r.decision === "approved" ? "bg-blue-500/10 text-blue-400" :
                "bg-red-500/10 text-red-400"
              }`}>{r.decision}</span>
            </div>
          </div>
          <div className="space-y-1 font-mono text-[10px] text-zinc-700">
            <div>rule: <span className="text-zinc-500">{r.rule}</span></div>
            <div>hash: <span className="text-zinc-500">{r.hash}</span></div>
            <div>prev: <span className="text-zinc-600">{r.prev}</span></div>
          </div>
        </div>
      ))}
      <div className="pt-1 text-center font-mono text-[10px] text-emerald-500/60">
        ✓ chain intact · 3 receipts verified
      </div>
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 py-7">
      <div className="font-mono text-xl font-semibold text-zinc-200">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
    </div>
  );
}

function DashCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-7">
      <div className="mb-5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">{label}</div>
      {children}
    </div>
  );
}

/* ─── Sub-pages ──────────────────────────────────────────────────────── */

export function SecurityMarketingPage() {
  return (
    <MarketingShell>
      <MarketingContent
        eyebrow="Security"
        title="Agent Passport is the trust system for AI workers."
        body="It gives every agent verified identity and strictly defined boundaries for what it can access and do. Every action is logged, scoped, and auditable."
        cards={[
          ["Boundaries", "Permissions, budgets, approval rules, and delegated authentication are enforced before action."],
          ["Control", "Agents can perform real tasks such as payments, refunds, and system updates without broad access."],
          ["Auditability", "Every action records scope, policy decision, result, and receipt chain position."],
        ]}
      />
    </MarketingShell>
  );
}

export function DevelopersMarketingPage() {
  return (
    <MarketingShell>
      <MarketingContent
        eyebrow="Developers"
        title="Build agents for Passport and Prism AX."
        body="Use Agent Passport for trust boundaries and Prism AX for typed execution surfaces that agents can use directly."
        cards={[
          ["Passport", "Register identity, seal intents, request approvals, and read receipts from code."],
          ["Prism AX", "Expose typed actions instead of making agents navigate human-designed interfaces."],
          ["Execution", "Agents submit predictable operations such as refunds, record updates, and workflow triggers."],
        ]}
      />
    </MarketingShell>
  );
}

export function PricingMarketingPage() {
  return (
    <MarketingShell>
      <MarketingContent
        eyebrow="Pricing"
        title="Simple SaaS pricing for trusted AI work."
        body="Start with a founder/operator plan and expand by active worker, approval volume, and connected systems."
        cards={[
          ["Starter", "One company workspace, finance template, basic approvals, and receipt history."],
          ["Team", "Multiple workers, richer policy controls, Prism integrations, and admin roles."],
          ["Enterprise", "Custom controls, private deployment options, SSO, and compliance support."],
        ]}
      />
    </MarketingShell>
  );
}

function MarketingContent({
  eyebrow,
  title,
  body,
  cards,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cards: [string, string][];
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-32">
      <div className="max-w-3xl">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-600">{eyebrow}</div>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-tight">{title}</h1>
        <p className="mt-5 text-base leading-7 text-zinc-500">{body}</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map(([cardTitle, cardBody]) => (
          <div key={cardTitle} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="font-medium text-zinc-200">{cardTitle}</div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{cardBody}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
