import { AgentCreationPage } from "../../../../src/views/AgentCreationPage";

export default function BuildAgentPage({
  searchParams,
}: {
  searchParams?: { template?: string };
}) {
  return <AgentCreationPage mode="build" initialKind={searchParams?.template} />;
}
