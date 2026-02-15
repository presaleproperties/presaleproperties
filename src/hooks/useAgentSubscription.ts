import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "none" | "core" | "pro" | "elite";

export interface AgentSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: "active" | "inactive" | "past_due" | "cancelled";
  current_period_start: string | null;
  current_period_end: string | null;
}

export function useAgentSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AgentSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("agent_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      setSubscription(data as AgentSubscription | null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = subscription?.status === "active" && subscription?.tier !== "none";
  
  // Free access for now - all agents can access assignments
  const canAccessAssignments = true;

  const tierLabel = subscription?.tier ? {
    none: "No Plan",
    core: "Core",
    pro: "Pro",
    elite: "Elite"
  }[subscription.tier] : "No Plan";

  return {
    subscription,
    loading,
    hasActiveSubscription,
    canAccessAssignments,
    tierLabel,
    refetch: fetchSubscription,
  };
}
