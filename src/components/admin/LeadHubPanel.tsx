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
  Target,
  Info,
  CalendarClock,
  Zap,
  ChevronDown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
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

export interface LeadAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  first_touch_utm_source?: string | null;
  first_touch_utm_medium?: string | null;
  first_touch_utm_campaign?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  lead_source?: string | null;
}

interface LeadHubPanelProps {
  leadId: string;
  leadEmail: string;
  leadName: string;
  attribution?: LeadAttribution;
}

export function LeadHubPanel({ leadId, leadEmail, leadName, attribution }: LeadHubPanelProps) {
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

  // ── Outgoing attribution preview ────────────────────────────────────────
  // What we'll stamp on the email/job so downstream analytics can attribute
  // re-engagement back to the originating campaign.
  const outgoingUtm = {
    utm_source: attribution?.first_touch_utm_source || attribution?.utm_source || "lead_hub",
    utm_medium: attribution?.first_touch_utm_medium || attribution?.utm_medium || "email",
    utm_campaign:
      attribution?.first_touch_utm_campaign || attribution?.utm_campaign || "lead_followup",
    utm_content: attribution?.utm_content || "hub_panel",
    utm_term: attribution?.utm_term || null,
  };

  const attributionMeta = {
    source: "lead_hub_panel" as const,
    lead_id: leadId,
    outgoing_utm: outgoingUtm,
    original_attribution: {
      first_touch: {
        source: attribution?.first_touch_utm_source ?? null,
        medium: attribution?.first_touch_utm_medium ?? null,
        campaign: attribution?.first_touch_utm_campaign ?? null,
      },
      last_touch: {
        source: attribution?.utm_source ?? null,
        medium: attribution?.utm_medium ?? null,
        campaign: attribution?.utm_campaign ?? null,
      },
      referrer: attribution?.referrer ?? null,
      landing_page: attribution?.landing_page ?? null,
      lead_source: attribution?.lead_source ?? null,
    },
  };

  /**
   * Send a template now, or queue it for a future time via `email_jobs`.
   * - `scheduledAt = null` → invoke edge function immediately.
   * - `scheduledAt = Date` → insert queued row (dispatcher picks it up).
   */
  const sendTemplate = async (tpl: CampaignTemplate, scheduledAt: Date | null) => {
    setBusyId(`tpl-${tpl.id}`);
    try {
      if (!scheduledAt) {
        const { error } = await supabase.functions.invoke("send-template-email", {
          body: {
            templateId: tpl.id,
            recipient: { email: leadEmail, firstName, name: leadName },
            utm: outgoingUtm,
            meta: { ...attributionMeta, template_id: tpl.id, template_name: tpl.name },
          },
        });
        if (error) throw error;
        toast.success(`Sent "${tpl.name}" to ${leadEmail}`);
      } else {
        const { error: jobErr } = await (supabase as any).from("email_jobs").insert({
          to_email: leadEmail,
          to_name: leadName,
          template_id: tpl.id,
          scheduled_at: scheduledAt.toISOString(),
          status: "queued",
          variables: { firstName, name: leadName, ...outgoingUtm },
          meta: {
            ...attributionMeta,
            template_id: tpl.id,
            template_name: tpl.name,
            scheduled_via: "lead_hub_panel",
          },
        });
        if (jobErr) throw jobErr;
        toast.success(
          `Scheduled "${tpl.name}" for ${format(scheduledAt, "MMM d, h:mm a")} (in ${formatDistanceToNow(scheduledAt)})`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send template");
    } finally {
      setBusyId(null);
    }
  };

  // ── Workflow enrollment (with preview modal) ─────────────────────────────
  const [previewWf, setPreviewWf] = useState<EmailWorkflow | null>(null);

  const performEnroll = async (
    wf: EmailWorkflow,
    step: { id: string; template_id: string; delay_minutes: number | null },
  ) => {
    setBusyId(`wf-${wf.id}`);
    try {
      const scheduledAt = new Date(Date.now() + (step.delay_minutes ?? 0) * 60 * 1000);
      const { error: jobErr } = await (supabase as any).from("email_jobs").insert({
        to_email: leadEmail,
        to_name: leadName,
        template_id: step.template_id,
        workflow_id: wf.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "queued",
        variables: { firstName, name: leadName, ...outgoingUtm },
        meta: { ...attributionMeta, step_id: step.id, workflow_name: wf.name },
      });
      if (jobErr) throw jobErr;

      toast.success(
        step.delay_minutes
          ? `Enrolled in "${wf.name}" — first email in ${step.delay_minutes}m`
          : `Enrolled in "${wf.name}" — first email queued now`,
      );
      setPreviewWf(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to enroll");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Attribution preview ────────────────────────────────────────────── */}
      <section className="space-y-2">
        <header className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="h-3 w-3" />
            Attribution preview
          </h4>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="h-2.5 w-2.5" />
            Tagged on every send below
          </span>
        </header>

        <div className="rounded-lg border border-border bg-muted/30 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Outgoing UTM
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <UtmRow label="source" value={outgoingUtm.utm_source} />
            <UtmRow label="medium" value={outgoingUtm.utm_medium} />
            <UtmRow label="campaign" value={outgoingUtm.utm_campaign} wide />
            <UtmRow label="content" value={outgoingUtm.utm_content} />
            <UtmRow label="term" value={outgoingUtm.utm_term} />
          </dl>

          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Original lead attribution
            </p>
            <ul className="space-y-0.5 text-[10.5px] text-muted-foreground">
              <li className="flex gap-1.5">
                <span className="w-20 shrink-0 text-foreground/70">First touch</span>
                <span className="truncate">
                  {fmtTouch(
                    attribution?.first_touch_utm_source,
                    attribution?.first_touch_utm_medium,
                    attribution?.first_touch_utm_campaign,
                  )}
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="w-20 shrink-0 text-foreground/70">Last touch</span>
                <span className="truncate">
                  {fmtTouch(
                    attribution?.utm_source,
                    attribution?.utm_medium,
                    attribution?.utm_campaign,
                  )}
                </span>
              </li>
              {attribution?.referrer && (
                <li className="flex gap-1.5">
                  <span className="w-20 shrink-0 text-foreground/70">Referrer</span>
                  <span className="truncate">{attribution.referrer}</span>
                </li>
              )}
              {attribution?.landing_page && (
                <li className="flex gap-1.5">
                  <span className="w-20 shrink-0 text-foreground/70">Landing</span>
                  <span className="truncate">{attribution.landing_page}</span>
                </li>
              )}
              {attribution?.lead_source && (
                <li className="flex gap-1.5">
                  <span className="w-20 shrink-0 text-foreground/70">Lead source</span>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    {attribution.lead_source}
                  </Badge>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

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
                    <SchedulePopover
                      busy={busy}
                      onConfirm={(when) => sendTemplate(tpl, when)}
                    />
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
                    onClick={() => setPreviewWf(wf)}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    Preview & enroll
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <WorkflowPreviewDialog
        workflow={previewWf}
        onClose={() => setPreviewWf(null)}
        onConfirm={(step) => previewWf && performEnroll(previewWf, step)}
        busy={!!previewWf && busyId === `wf-${previewWf.id}`}
        recipient={{ email: leadEmail, firstName, name: leadName }}
      />
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

function UtmRow({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}) {
  const present = !!value;
  return (
    <div
      className={cn(
        "flex items-baseline gap-1.5 overflow-hidden",
        wide && "col-span-2",
      )}
    >
      <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "truncate font-mono text-[11px]",
          present ? "text-foreground" : "text-muted-foreground/60 italic",
        )}
        title={value || "(none)"}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function fmtTouch(
  source?: string | null,
  medium?: string | null,
  campaign?: string | null,
): string {
  const parts = [source, medium, campaign].filter(Boolean);
  return parts.length ? parts.join(" / ") : "(direct)";
}

/**
 * SchedulePopover
 * "Send now" or pick a future date + time. Confirms via `onConfirm(when)`
 * where `when` is `null` for immediate send or a Date for queued send.
 */
function SchedulePopover({
  busy,
  onConfirm,
}: {
  busy: boolean;
  onConfirm: (when: Date | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  // Default time = now + 1h, rounded
  const defaultTime = (() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  })();
  const [time, setTime] = useState<string>(defaultTime);

  const scheduledDate = (() => {
    if (!date) return null;
    const [hh, mm] = (time || "09:00").split(":").map((n) => parseInt(n, 10));
    const d = new Date(date);
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d;
  })();
  const isPast = scheduledDate ? scheduledDate.getTime() <= Date.now() : false;

  const sendNow = () => {
    setOpen(false);
    onConfirm(null);
  };
  const schedule = () => {
    if (!scheduledDate || isPast) return;
    setOpen(false);
    onConfirm(scheduledDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 gap-1 px-2 text-[11px]"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Send
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-0">
        {/* Send now */}
        <button
          type="button"
          onClick={sendNow}
          className="flex w-full items-center gap-2 border-b border-border p-2.5 text-left text-xs hover:bg-accent/50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Send now</div>
            <div className="text-[10px] text-muted-foreground">
              Delivered immediately
            </div>
          </div>
        </button>

        {/* Schedule */}
        <div className="space-y-2 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            Schedule for later
          </div>

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className={cn("rounded-md border p-2 pointer-events-auto")}
          />

          <div className="space-y-1">
            <Label htmlFor="schedule-time" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Time
            </Label>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {scheduledDate && (
            <div
              className={cn(
                "rounded-md border px-2 py-1.5 text-[10.5px]",
                isPast
                  ? "border-destructive/40 bg-destructive/5 text-destructive"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {isPast ? (
                <>That time is in the past — pick a future moment.</>
              ) : (
                <>
                  Will queue for{" "}
                  <span className="font-medium text-foreground">
                    {format(scheduledDate, "EEE MMM d, h:mm a")}
                  </span>{" "}
                  · {formatDistanceToNow(scheduledDate, { addSuffix: true })}
                </>
              )}
            </div>
          )}

          <Button
            size="sm"
            className="h-8 w-full gap-1 text-[11px]"
            disabled={!scheduledDate || isPast}
            onClick={schedule}
          >
            <CalendarClock className="h-3 w-3" />
            Schedule send
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
