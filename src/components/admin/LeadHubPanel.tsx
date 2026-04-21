/**
 * LeadHubPanel
 * ────────────────────────────────────────────────────────────────────────────
 * Marketing & Email Hub integration surfaced inside the Lead drawer.
 *
 *  • Lists active campaign templates (one-click send to this lead)
 *  • Lists active email workflows (manual enroll → schedules first step)
 *  • All sends/enrollments are logged — visible in the Email tab afterwards
 *
 * No business-logic changes: reuses existing `send-template-email` edge
 * function and the existing `email_jobs` queue picked up by the dispatcher.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  Workflow,
  Loader2,
  CheckCircle2,
  Mail,
  Clock,
  Tag,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CampaignTemplate {
  id: string;
  name: string;
  project_name: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  updated_at: string;
}

interface EmailWorkflow {
  id: string;
  name: string;
  description: string | null;
  audience_type: string;
  trigger_event: string;
  is_active: boolean;
  workflow_key: string;
}

interface LeadHubPanelProps {
  leadId: string;
  leadEmail: string;
  leadName: string;
}

export function LeadHubPanel({ leadId, leadEmail, leadName }: LeadHubPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Templates (Marketing Hub) ────────────────────────────────────────────
  const { data: templates, isLoading: tplLoading } = useQuery({
    queryKey: ["lead-hub-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaign_templates")
        .select("id, name, project_name, thumbnail_url, tags, updated_at")
        .order("updated_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []) as CampaignTemplate[];
    },
  });

  // ── Workflows (Email Hub auto-flows) ─────────────────────────────────────
  const { data: workflows, isLoading: wfLoading } = useQuery({
    queryKey: ["lead-hub-workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_workflows")
        .select("id, name, description, audience_type, trigger_event, is_active, workflow_key")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as EmailWorkflow[];
    },
  });

  const firstName = (leadName || "").split(" ")[0] || leadName;

  const sendTemplate = async (tpl: CampaignTemplate) => {
    setBusyId(`tpl-${tpl.id}`);
    try {
      const { error } = await supabase.functions.invoke("send-template-email", {
        body: {
          templateId: tpl.id,
          recipient: { email: leadEmail, firstName, name: leadName },
        },
      });
      if (error) throw error;
      toast.success(`Sent "${tpl.name}" to ${leadEmail}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send template");
    } finally {
      setBusyId(null);
    }
  };

  const enrollWorkflow = async (wf: EmailWorkflow) => {
    setBusyId(`wf-${wf.id}`);
    try {
      // Look up the first step
      const { data: step, error: stepErr } = await supabase
        .from("email_workflow_steps")
        .select("id, template_id, delay_minutes")
        .eq("workflow_id", wf.id)
        .eq("is_active", true)
        .order("step_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stepErr) throw stepErr;
      if (!step) {
        toast.error(`"${wf.name}" has no active steps yet`);
        return;
      }

      const scheduledAt = new Date(Date.now() + (step.delay_minutes ?? 0) * 60 * 1000);
      const { error: jobErr } = await (supabase as any).from("email_jobs").insert({
        to_email: leadEmail,
        to_name: leadName,
        template_id: step.template_id,
        workflow_id: wf.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "queued",
        variables: { firstName, name: leadName },
        meta: { source: "lead_hub_panel", lead_id: leadId, step_id: step.id },
      });
      if (jobErr) throw jobErr;

      toast.success(
        step.delay_minutes
          ? `Enrolled in "${wf.name}" — first email in ${step.delay_minutes}m`
          : `Enrolled in "${wf.name}" — first email queued now`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to enroll");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Templates ──────────────────────────────────────────────────────── */}
      <section className="space-y-2.5">
        <header className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Send a template
          </h4>
          {templates && (
            <span className="text-[10px] text-muted-foreground">{templates.length} available</span>
          )}
        </header>

        {tplLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !templates || templates.length === 0 ? (
          <EmptyMsg icon={Mail}>
            No templates yet. Build one in <strong>Marketing Hub → Templates</strong>.
          </EmptyMsg>
        ) : (
          <ScrollArea className="max-h-[260px] pr-2">
            <ul className="space-y-1.5">
              {templates.map((tpl) => {
                const busy = busyId === `tpl-${tpl.id}`;
                return (
                  <li
                    key={tpl.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {tpl.thumbnail_url ? (
                        <img
                          src={tpl.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tpl.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {tpl.project_name && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {tpl.project_name}
                          </span>
                        )}
                        {tpl.tags?.slice(0, 2).map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="h-4 gap-0.5 px-1 text-[9px] font-normal"
                          >
                            <Tag className="h-2 w-2" />
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                      disabled={busy}
                      onClick={() => sendTemplate(tpl)}
                    >
                      {busy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Send
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </section>

      {/* ── Workflows ──────────────────────────────────────────────────────── */}
      <section className="space-y-2.5">
        <header className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Workflow className="h-3 w-3" />
            Enroll in an auto-flow
          </h4>
          {workflows && (
            <span className="text-[10px] text-muted-foreground">{workflows.length} active</span>
          )}
        </header>

        {wfLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !workflows || workflows.length === 0 ? (
          <EmptyMsg icon={Workflow}>
            No active workflows. Create one in <strong>Email Hub → Workflows</strong>.
          </EmptyMsg>
        ) : (
          <ul className="space-y-1.5">
            {workflows.map((wf) => {
              const busy = busyId === `wf-${wf.id}`;
              return (
                <li
                  key={wf.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <PlayCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{wf.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[9px] font-normal capitalize"
                      >
                        {wf.audience_type}
                      </Badge>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {wf.trigger_event}
                      </span>
                      {wf.description && (
                        <span className="truncate">· {wf.description}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                    disabled={busy}
                    onClick={() => enrollWorkflow(wf)}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Enroll
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyMsg({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-6 text-center text-muted-foreground">
      <Icon className="mb-2 h-6 w-6 opacity-40" />
      <p className="max-w-[280px] text-[11px]">{children}</p>
    </div>
  );
}
