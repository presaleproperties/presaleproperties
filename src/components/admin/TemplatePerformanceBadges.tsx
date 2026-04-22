/**
 * TemplatePerformanceBadges
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-template badge row rendered inside `TemplateCard`. Surfaces:
 *   • Last sent date (joined via subject from `email_logs`)
 *   • Open rate %, Click rate % (computed from open_count/click_count sums)
 *   • Last audit status badge (Clean / Warning / Error) sourced from
 *     `email_audit_runs` — shared across templates because the audit covers
 *     the recommendation-email pipeline as a whole.
 *   • "Re-audit now" action invokes `scheduled-email-audit?trigger=manual_card`
 *     and refetches so the card status updates in place.
 *
 * Layout: a compact, single-row pill cluster that replaces the existing
 * “time-ago + project” line for emails. Falls back gracefully when there's no
 * send history (renders “Not sent yet”).
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send, MailOpen, MousePointerClick, ShieldCheck, ShieldAlert,
  ShieldX, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  type TemplatePerformance, type TemplateMetrics,
} from "@/hooks/useTemplatePerformance";

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function pct(num: number, denom: number): string {
  if (denom <= 0) return "—";
  return `${Math.round((num / denom) * 100)}%`;
}

interface Props {
  metrics: TemplateMetrics | null;
  audit: TemplatePerformance["latestAudit"];
  onAuditComplete?: () => void;
}

export function TemplatePerformanceBadges({ metrics, audit, onAuditComplete }: Props) {
  const [reauditing, setReauditing] = useState(false);

  const handleReaudit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setReauditing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-email-audit?trigger=manual_card",
        { method: "POST" },
      );
      if (error) throw error;
      const status = (data as { status?: string })?.status;
      if (status === "ok") toast.success("Re-audit clean — no broken links");
      else toast.warning(`Re-audit found issues (${status})`);
      onAuditComplete?.();
    } catch (err) {
      toast.error(`Re-audit failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setReauditing(false);
    }
  };

  // ── Audit indicator ──────────────────────────────────────────────────────
  const auditTone =
    !audit ? "neutral"
    : audit.status === "ok" ? "ok"
    : audit.status === "failed" ? "warn"
    : "danger";

  const auditLabel =
    !audit ? "No audit"
    : audit.status === "ok" ? "Audit clean"
    : audit.status === "failed" ? `${audit.totalErrors} link issue${audit.totalErrors === 1 ? "" : "s"}`
    : "Audit error";

  const AuditIcon =
    !audit ? ShieldX
    : audit.status === "ok" ? ShieldCheck
    : audit.status === "failed" ? ShieldAlert
    : ShieldX;

  const auditCls = {
    ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    neutral: "border-border bg-muted/40 text-muted-foreground",
  }[auditTone];

  const sent = metrics?.sent ?? 0;
  const opens = metrics?.opens ?? 0;
  const clicks = metrics?.clicks ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      {/* Last sent */}
      <Badge
        variant="outline"
        className="text-[10px] gap-1 px-1.5 py-0.5 h-5 font-normal"
        title={metrics?.lastSentAt ? `Last sent ${new Date(metrics.lastSentAt).toLocaleString()}` : "Never sent"}
      >
        <Send className="h-2.5 w-2.5" />
        {metrics?.lastSentAt ? formatRelative(metrics.lastSentAt) : "Not sent"}
      </Badge>

      {/* Open / Click rate — only when we have sends */}
      {sent > 0 && (
        <>
          <Badge
            variant="outline"
            className="text-[10px] gap-1 px-1.5 py-0.5 h-5 font-normal"
            title={`${opens} open${opens === 1 ? "" : "s"} across ${sent} send${sent === 1 ? "" : "s"}`}
          >
            <MailOpen className="h-2.5 w-2.5" />
            {pct(opens, sent)} open
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] gap-1 px-1.5 py-0.5 h-5 font-normal"
            title={`${clicks} click${clicks === 1 ? "" : "s"} across ${sent} send${sent === 1 ? "" : "s"}`}
          >
            <MousePointerClick className="h-2.5 w-2.5" />
            {pct(clicks, sent)} click
          </Badge>
        </>
      )}

      {/* Audit indicator */}
      <Badge
        variant="outline"
        className={cn("text-[10px] gap-1 px-1.5 py-0.5 h-5 font-normal", auditCls)}
        title={audit ? `Last audit ${formatRelative(audit.ranAt)} · ${audit.totalLinks} links checked` : "No audit run yet"}
      >
        <AuditIcon className="h-2.5 w-2.5" />
        {auditLabel}
      </Badge>

      {/* Re-audit action */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleReaudit}
        disabled={reauditing}
        className="h-5 px-1.5 text-[10px] gap-1 hover:bg-primary/10 hover:text-primary"
        title="Run a fresh audit of the recommendation-email pipeline"
      >
        {reauditing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
        Re-audit
      </Button>
    </div>
  );
}
