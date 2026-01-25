import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AgentMessagingInbox } from "@/components/agent/AgentMessagingInbox";

export default function DashboardMessages() {
  return (
    <DashboardLayout>
      <AgentMessagingInbox />
    </DashboardLayout>
  );
}
