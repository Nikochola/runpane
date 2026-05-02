"use client";

import { useEffect, useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { Sidebar, type RunpaneTab } from "./components/layout/Sidebar";
import { appPathByTab } from "./routes";
import { Agents } from "./views/Agents";
import { Approvals } from "./views/Approvals";
import { Audit } from "./views/Audit";
import { Billing } from "./views/Billing";
import { Developers } from "./views/Developers";
import { Invoices } from "./views/Invoices";
import { Integrations } from "./views/Integrations";
import { Overview } from "./views/Overview";
import { Settings } from "./views/Settings";
import { NeonDrift } from "./components/NeonDrift";
import { fireNavigationStart } from "./components/NavigationProgress";

export default function App({
  initialTab = "overview",
  initialSelectedAgent = null,
  initialPassportPage = false,
}: {
  initialTab?: RunpaneTab;
  initialSelectedAgent?: string | null;
  initialPassportPage?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  const [bootError, setBootError] = useState<string | null>(null);
  const [tab, setTabState] = useState<RunpaneTab>(initialTab);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(initialSelectedAgent);

  useEffect(() => {
    setTabState(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSelectedAgent(initialSelectedAgent);
  }, [initialSelectedAgent]);

  // Keep loader visible for at least 600ms so it doesn't flash
  useEffect(() => {
    if (isPending) {
      startedAt.current = Date.now();
      setShowLoader(true);
      if (loaderTimer.current) clearTimeout(loaderTimer.current);
    } else {
      const elapsed = Date.now() - startedAt.current;
      const remaining = Math.max(0, 600 - elapsed);
      loaderTimer.current = setTimeout(() => setShowLoader(false), remaining);
    }
  }, [isPending]);

  function setTab(next: RunpaneTab) {
    fireNavigationStart();
    startTransition(() => {
      if (next === "agents") setSelectedAgent(null);
      setTabState(next);
      router.push(appPathByTab[next]);
    });
  }

  async function boot() {
    setBootError(null);
    try {
      const { orgs } = await api.orgs();
      if (orgs.length === 0) {
        const created = await api.createOrg("Acme Demo");
        setOrgId(created.id);
      } else {
        setOrgId((orgs.find((o: any) => o.id === "org_demo") ?? orgs[0]).id);
      }
    } catch (error) {
      setBootError(error instanceof Error ? error.message : "Could not connect to Runpane");
    }
  }

  useEffect(() => {
    boot();
  }, []);

  // Render nothing on server; let client mount cleanly to avoid hydration mismatch
  if (!mounted)
    return <div className="min-h-screen bg-[#0d0d0d]" />;

  if (bootError)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-6 text-zinc-100">
        <div className="w-full max-w-md rounded-xl bg-[#1e1e1e] p-6">
          <h1 className="text-xl font-medium">Runpane is not reachable</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{bootError}</p>
          <button type="button" onClick={boot} className="mt-5 rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-950 transition hover:bg-white">
            Retry
          </button>
        </div>
      </div>
    );

  if (!orgId)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]" suppressHydrationWarning>
        <NeonDrift size={40} color="rgba(255,255,255,0.7)" speed={1.1} />
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      <Sidebar tab={tab} setTab={setTab} />
      <main className="relative max-w-[1400px] flex-1 bg-[#0d0d0d] p-8">
        {showLoader && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0d]/60 backdrop-blur-[1px]">
            <NeonDrift size={40} color="rgba(255,255,255,0.7)" speed={1.1} />
          </div>
        )}
        <div style={{ opacity: showLoader ? 0.4 : 1, transition: "opacity 0.15s" }}>
          {tab === "overview" && (
            <Overview orgId={orgId} onOpenAgent={(a) => {
              fireNavigationStart();
              startTransition(() => {
                setSelectedAgent(a);
                setTabState("agents");
                router.push(appPathByTab.agents);
              });
            }} />
          )}
          {tab === "agents" && (
            <Agents
              orgId={orgId}
              selectedAgentId={selectedAgent}
              initialPassportPage={initialPassportPage}
              onSelect={setSelectedAgent}
            />
          )}
          {tab === "approvals" && <Approvals orgId={orgId} />}
          {tab === "surfaces" && <Invoices orgId={orgId} />}
          {tab === "audit" && <Audit orgId={orgId} />}
          {tab === "integrations" && <Integrations orgId={orgId} />}
          {tab === "billing" && <Billing orgId={orgId} />}
          {tab === "settings" && <Settings orgId={orgId} />}
          {tab === "developers" && <Developers orgId={orgId} />}
        </div>
      </main>
    </div>
  );
}
