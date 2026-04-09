import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import { DailySummaryWidget } from "@/components/dashboard/DailySummaryWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Inline error boundary to isolate LeadOnboardHub crashes */
class HubErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[DashboardOverview] LeadOnboardHub crashed:", error.message, "\nStack:", error.stack?.slice(0, 400), "\nComponent:", info.componentStack?.slice(0, 300));
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Unable to load dashboard</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Something went wrong loading this section. Try refreshing.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs text-destructive max-w-lg mx-auto text-left overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [agentName, setAgentName] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.resolve(
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
    ).then(({ data }) => {
      if (data?.full_name) setAgentName(data.full_name);
    }).catch((err) => console.error("[DashboardOverview] profile fetch error:", err));
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {agentName ? `${greeting()}, ${agentName.split(" ")[0]}` : greeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your pipeline today.
          </p>
        </div>


        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Lead Onboard Hub — isolated with error boundary */}
        <div id="lead-onboard-section">
          <HubErrorBoundary>
            <LeadOnboardHub />
          </HubErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  );
}
