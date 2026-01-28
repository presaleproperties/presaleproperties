import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AgentProfile {
  id: string;
  user_id: string;
  verification_status: "verified" | "pending" | "unverified" | "rejected";
  license_number: string;
  brokerage_name: string;
}

interface UseAgentVerificationResult {
  isVerifiedAgent: boolean;
  isLoading: boolean;
  agentProfile: AgentProfile | null;
}

/**
 * Hook to check if the current user is a verified agent.
 * Used to gate access to agent-only features like assignment details.
 */
export function useAgentVerification(): UseAgentVerificationResult {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    async function checkAgentStatus() {
      if (authLoading) return;
      
      if (!user) {
        setAgentProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("agent_profiles")
          .select("id, user_id, verification_status, license_number, brokerage_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching agent profile:", error);
          setAgentProfile(null);
        } else {
          setAgentProfile(data as AgentProfile | null);
        }
      } catch (err) {
        console.error("Error checking agent verification:", err);
        setAgentProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAgentStatus();
  }, [user, authLoading]);

  return {
    isVerifiedAgent: agentProfile?.verification_status === "verified",
    isLoading: isLoading || authLoading,
    agentProfile,
  };
}
