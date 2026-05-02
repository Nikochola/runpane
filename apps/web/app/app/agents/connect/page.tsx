import { AgentCreationPage } from "../../../../src/views/AgentCreationPage";

export default function ConnectAgentPage({
  searchParams,
}: {
  searchParams?: { template?: string };
}) {
  return <AgentCreationPage mode="connect" initialKind={searchParams?.template} />;
}
