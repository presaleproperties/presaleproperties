import AdminEmailBuilderPage from "@/pages/admin/AdminAiEmailBuilder";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMode } from "@/components/team/TeamModeContext";

export default function DashboardEmailBuilder() {
  const { user } = useAuth();
  const teamMode = useTeamMode();
  // teamMode behaves the same as agentMode for now (own-templates scope, signature locked).
  // Future enhancement: pass an explicit `lockSignature` flag to hide the agent picker.
  return <AdminEmailBuilderPage agentMode agentUserId={user?.id} />;
}
