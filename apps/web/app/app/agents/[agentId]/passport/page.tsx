import App from "../../../../../src/App";

export default function AgentPassportPage({ params }: { params: { agentId: string } }) {
  return (
    <App
      initialTab="agents"
      initialSelectedAgent={params.agentId}
      initialPassportPage
    />
  );
}
