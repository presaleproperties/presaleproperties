import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAgent } = useAuth();

  useEffect(() => {
    if (!loading && user && !isAgent) {
      toast.error("You don't have access to the Agent Hub.");
    }
  }, [loading, user, isAgent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAgent) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
