import type { RunpaneTab } from "./components/layout/Sidebar";

export const appPathByTab: Record<RunpaneTab, string> = {
  overview: "/app/overview",
  agents: "/app/agents",
  approvals: "/app/approvals",
  surfaces: "/app/prism",
  audit: "/app/audit",
  integrations: "/app/integrations",
  billing: "/app/billing",
  settings: "/app/settings",
  developers: "/app/developers",
};

export const tabByAppPath: Record<string, RunpaneTab> = Object.fromEntries(
  Object.entries(appPathByTab).map(([tab, path]) => [path, tab]),
) as Record<string, RunpaneTab>;
