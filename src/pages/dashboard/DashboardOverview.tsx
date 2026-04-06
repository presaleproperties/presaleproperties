import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [agentName, setAgentName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setAgentName(data.full_name);
      })
      .catch((err) => console.error("[DashboardOverview] profile fetch error:", err));
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {agentName ? `${greeting()}, ${agentName.split(" ")[0]}` : greeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your pipeline today.
          </p>
        </div>

        {/* Lead Onboard Hub */}
        <LeadOnboardHub />
      </div>
    </DashboardLayout>
  );
}
