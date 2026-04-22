/**
 * Send Pre-flight Checklist
 * ─────────────────────────────────────────────────────────────────────────────
 * Compact checklist shown above the "Send" button in the quick-send flow.
 * Runs hard blockers (subject, recipients, audit errors, unsubscribe placement,
 * merge-tag allow-list) and soft warnings (open pixel, tracked links).
 *
 * Reports `canSend` upward so the caller can disable the Send button until
 * every blocker passes. Exposes a "View full audit report" link that opens
 * `<FullAuditReportDialog>` with the exact failing URLs, rules, and fixes.
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { auditEmailHtml } from "@/components/admin/campaign/auditEmailHtml";
import { FullAuditReportDialog } from "@/components/admin/campaign/FullAuditReportDialog";
import { cn } from "@/lib/utils";

export interface PreflightContext {
  html: string;
  subject: string;
  recipientCount: number;
  /** Optional label shown in the audit dialog header. */
  label?: string;
}

interface CheckResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  blocking: boolean;
  detail?: string;
}

interface SendPreflightChecklistProps {
  ctx: PreflightContext;
  /** Called whenever readiness changes so the caller can gate the Send button. */
  onReadyChange?: (ready: boolean) => void;
  className?: string;
}

const TRACK_PATH = "/functions/v1/track-email-open";

function runChecks(ctx: PreflightContext): CheckResult[] {
  const checks: CheckResult[] = [];

  // Subject
  checks.push({
    id: "subject",
    label: "Subject line set",
    status: ctx.subject.trim() ? "pass" : "fail",
    blocking: true,
    detail: ctx.subject.trim() ? undefined : "Subject line cannot be empty.",
  });

  // Recipients
  checks.push({
    id: "recipients",
    label: "At least one recipient",
    status: ctx.recipientCount > 0 ? "pass" : "fail",
    blocking: true,
    detail:
      ctx.recipientCount > 0
        ? `${ctx.recipientCount} recipient${ctx.recipientCount === 1 ? "" : "s"} added.`
        : "Add at least one recipient before sending.",
  });

  // Audit (links + unsubscribe + merge tags all in one)
  if (!ctx.html) {
    checks.push({
      id: "audit",
      label: "Link audit clean",
      status: "fail",
      blocking: true,
      detail: "No rendered HTML available for auditing.",
    });
  } else {
    let report;
    try {
      report = auditEmailHtml(ctx.html, { requireProjectRoute: true });
    } catch {
      report = null;
    }
    if (!report) {
      checks.push({
        id: "audit",
        label: "Link audit clean",
        status: "fail",
        blocking: true,
        detail: "Audit failed to run on this template.",
      });
    } else {
      const hasUnsub = report.errors.some(
        (e) => e.rule === "missing_unsubscribe" || e.rule === "unsubscribe_outside_footer",
      );
      const hasMerge = report.errors.some(
        (e) => e.rule === "merge_tag_in_href_path" || e.rule === "merge_tag_outside_allowed_zone",
      );
      const linkErrors = report.errors.filter(
        (e) =>
          e.rule !== "missing_unsubscribe" &&
          e.rule !== "unsubscribe_outside_footer" &&
          e.rule !== "merge_tag_in_href_path" &&
          e.rule !== "merge_tag_outside_allowed_zone",
      );

      checks.push({
        id: "audit",
        label: "Link audit clean",
        status: linkErrors.length === 0 ? "pass" : "fail",
        blocking: true,
        detail:
          linkErrors.length === 0
            ? `${report.total} link${report.total === 1 ? "" : "s"} validated.`
            : `${linkErrors.length} link issue${linkErrors.length === 1 ? "" : "s"} detected.`,
      });
      checks.push({
        id: "unsubscribe",
        label: "Unsubscribe in footer ({$unsubscribe})",
        status: hasUnsub ? "fail" : "pass",
        blocking: true,
        detail: hasUnsub
          ? "Unsubscribe link missing or placed outside the footer."
          : "Unsubscribe merge tag found in footer.",
      });
      checks.push({
        id: "merge_tags",
        label: "Merge tags valid",
        status: hasMerge ? "fail" : "pass",
        blocking: true,
        detail: hasMerge
          ? "Disallowed merge tag detected in body or href path."
          : "All merge tags on the allow-list.",
      });
    }
  }

  // Soft warnings
  const hasPixel = /track-email-open/i.test(ctx.html) || /pixel/i.test(ctx.html);
  checks.push({
    id: "open_pixel",
    label: "Open-tracking pixel present",
    status: hasPixel ? "pass" : "warn",
    blocking: false,
    detail: hasPixel
      ? "Pixel detected — opens will be tracked."
      : "No open-tracking pixel found. Opens won't be tracked, but the email will still send.",
  });

  const hasTracked = ctx.html.includes(TRACK_PATH);
  checks.push({
    id: "click_tracking",
    label: "Click-tracking on CTAs",
    status: hasTracked ? "pass" : "warn",
    blocking: false,
    detail: hasTracked
      ? "CTAs route through the redirect tracker."
      : "No tracked CTA links found. Clicks won't attribute back to the campaign.",
  });

  return checks;
}

export function SendPreflightChecklist({
  ctx,
  onReadyChange,
  className,
}: SendPreflightChecklistProps) {
  const [auditOpen, setAuditOpen] = useState(false);

  const { checks, blockers, warnings, canSend } = useMemo(() => {
    const all = runChecks(ctx);
    const blockersN = all.filter((c) => c.blocking && c.status !== "pass").length;
    const warningsN = all.filter((c) => c.status === "warn").length;
    return {
      checks: all,
      blockers: blockersN,
      warnings: warningsN,
      canSend: blockersN === 0,
    };
  }, [ctx]);

  useEffect(() => {
    onReadyChange?.(canSend);
  }, [canSend, onReadyChange]);

  // Whether any link/unsubscribe/merge-tag check failed — drives "View full
  // audit report" link visibility.
  const hasAuditFailure = checks.some(
    (c) =>
      (c.id === "audit" || c.id === "unsubscribe" || c.id === "merge_tags") &&
      c.status === "fail",
  );

  return (
    <>
      <Collapsible
        defaultOpen={!canSend}
        className={cn(
          "rounded-md border",
          canSend
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-destructive/40 bg-destructive/5",
          className,
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
          <div className="flex items-center gap-2 min-w-0">
            {canSend ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span
              className={cn(
                "text-[11px] font-bold truncate",
                canSend
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {canSend
                ? `Pre-flight passed${warnings ? ` (${warnings} warning${warnings === 1 ? "" : "s"})` : ""} — safe to send`
                : `${blockers} blocker${blockers === 1 ? "" : "s"} — fix before sending`}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-1 px-3 pb-2 pt-1">
            {checks.map((c) => {
              const Icon =
                c.status === "pass"
                  ? CheckCircle2
                  : c.status === "warn"
                    ? CircleAlert
                    : AlertTriangle;
              const tone =
                c.status === "pass"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : c.status === "warn"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive";
              return (
                <li
                  key={c.id}
                  className="flex items-start gap-2 text-[10.5px] leading-relaxed"
                >
                  <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {c.label}
                      </span>
                      {c.blocking && c.status !== "pass" && (
                        <span className="text-[8.5px] font-bold uppercase text-destructive/80">
                          blocking
                        </span>
                      )}
                    </div>
                    {c.detail && (
                      <p className="text-muted-foreground">{c.detail}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {hasAuditFailure && (
            <div className="border-t border-destructive/20 px-3 py-2">
              <button
                type="button"
                onClick={() => setAuditOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-destructive hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View full audit report — exact URLs, rules &amp; fixes
              </button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <FullAuditReportDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        html={ctx.html}
        label={ctx.label}
      />
    </>
  );
}
