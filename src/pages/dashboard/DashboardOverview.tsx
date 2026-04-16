import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = agentName ? agentName.split(" ")[0] : "";

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto">
        {/* Premium Hero Header */}
        <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-5 sm:p-8 md:p-10">
          {/* Decorative gold glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" />
              <span>{today}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {greeting()}
              {firstName && (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-primary via-primary-glow to-primary-deep bg-clip-text text-transparent">
                    {firstName}
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              Here's what's happening with your pipeline today. Stay focused on what moves the needle.
            </p>
          </div>
        </section>

        {/* Lead Onboard Hub — primary view */}
        <section id="lead-onboard-section">
          <HubErrorBoundary>
            <LeadOnboardHub />
          </HubErrorBoundary>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-[0.16em]">
              Quick Actions
            </h2>
            <div className="h-px flex-1 ml-4 bg-gradient-to-r from-border to-transparent" />
          </div>
          <QuickActions />
        </section>
      </div>
    </DashboardLayout>
  );
}
