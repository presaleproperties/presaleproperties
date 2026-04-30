import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TeamProtectedRouteProps {
  children: ReactNode;
}

/**
 * Gates /team/* routes. User must be authenticated AND have an approved
 * team_member_profile (or be an admin). Pending users see a friendly screen.
 */
export function TeamProtectedRoute({ children }: TeamProtectedRouteProps) {
  const { user, loading: authLoading, isAdmin, isTeamMember } = useAuth();
  const [status, setStatus] = useState<"checking" | "approved" | "pending" | "denied" | "none">("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) { setStatus("none"); return; }
      if (isAdmin) { setStatus("approved"); return; }
      const { data } = await supabase
        .from("team_member_profiles" as any)
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const s = (data as any)?.status as string | undefined;
      if (s === "approved" && isTeamMember) setStatus("approved");
      else if (s === "approved") setStatus("pending"); // role not yet attached
      else if (s === "denied") setStatus("denied");
      else if (s === "pending") setStatus("pending");
      else setStatus("none");
    }
    if (!authLoading) check();
    return () => { cancelled = true; };
  }, [user, authLoading, isAdmin, isTeamMember]);

  if (authLoading || status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/team/login" replace />;

  if (status === "approved") return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        {status === "pending" && (
          <>
            <div className="text-4xl mb-3">🕒</div>
            <h1 className="text-xl font-bold mb-2">Awaiting approval</h1>
            <p className="text-sm text-muted-foreground">
              Your team account is pending approval. You'll get an email once it's been reviewed.
            </p>
          </>
        )}
        {status === "denied" && (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              Your team application wasn't approved. Contact info@presaleproperties.com if this is a mistake.
            </p>
          </>
        )}
        {status === "none" && (
          <>
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold mb-2">Not a team account</h1>
            <p className="text-sm text-muted-foreground">
              This area is for internal team members only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
