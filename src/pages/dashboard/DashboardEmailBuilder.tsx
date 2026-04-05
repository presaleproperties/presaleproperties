import AdminEmailBuilderPage from "@/pages/admin/AdminAiEmailBuilder";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardEmailBuilder() {
  const { user } = useAuth();
  return <AdminEmailBuilderPage agentMode agentUserId={user?.id} />;
}
