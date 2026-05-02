"use client";

import dynamic from "next/dynamic";
import type { RunpaneTab } from "./components/layout/Sidebar";

const AppDynamic = dynamic(() => import("./App"), { ssr: false });

export function AppClient({
  initialTab = "overview",
  initialSelectedAgent = null,
  initialPassportPage = false,
}: {
  initialTab?: RunpaneTab;
  initialSelectedAgent?: string | null;
  initialPassportPage?: boolean;
}) {
  return (
    <AppDynamic
      initialTab={initialTab}
      initialSelectedAgent={initialSelectedAgent}
      initialPassportPage={initialPassportPage}
    />
  );
}
