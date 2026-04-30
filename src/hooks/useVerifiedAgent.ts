import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to check if the current user is a verified agent.
 * Returns { isVerified, loading } where isVerified is true only if
 * the user has an agent_profile with verification_status = 'verified'.
 */
export function useVerifiedAgent() {
  const { user, isTeamMember } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsVerified(false);
      setLoading(false);
      return;
    }

    if (isTeamMember) {
      setIsVerified(true);
      setLoading(false);
      return;
    }

    const checkVerification = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("agent_profiles")
          .select("verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking agent verification:", error);
          setIsVerified(false);
        } else {
          setIsVerified(data?.verification_status === "verified");
        }
      } catch (err) {
        console.error("Error in useVerifiedAgent:", err);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [user, isTeamMember]);

  return { isVerified, loading };
}
