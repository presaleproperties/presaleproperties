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
  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto">
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
