import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, loading, isAgent, isTeamMember } = useAuth();
  const hasAccess = isAgent || isTeamMember;
  const redirectPath = `${location.pathname}${location.search}`;
  const loginPath = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      toast.error("Please sign in with an invited Agent Portal account.");
    }
  }, [loading, user, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  if (!hasAccess) {
    return <Navigate to={`/login?status=access-denied&redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  return <>{children}</>;
}
