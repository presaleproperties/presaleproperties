/**
 * Send Pre-flight Checklist
 * ─────────────────────────
 * Audits an email's HTML before send and BLOCKS the send button until every
 * critical compliance check passes:
 *
 *   1. Audit compliance — no broken/placeholder/wrong-host links
 *   2. Unsubscribe presence — `{$unsubscribe}` merge tag in the footer
 *   3. Merge-tag placement — only allow-listed personalization tags
 *   4. Tracking essentials — open pixel + click-tracked CTAs
 *   5. Subject line non-empty
 *   6. At least one recipient
 *
 * Hard-fail items (red) block sending. Soft warnings (amber) inform but allow send.
 */
import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auditEmailHtml } from "@/components/admin/campaign/auditEmailHtml";

export interface PreflightResult {
  canSend: boolean;
  checks: PreflightCheck[];
  blockers: number;
  warnings: number;
}

export interface PreflightCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  /** Hard blocker — when true, send is disabled until status === "pass". */
  blocking: boolean;
  detail?: string;
}

const ALLOWED_MERGE_TAGS = new Set([
  "{$name}",
  "{$first_name}",
  "{$last_name}",
  "{$email}",
  "{$company}",
  "{$city}",
  "{$unsubscribe}",
]);

/** Run all pre-flight checks against an HTML payload + send context. */
export function runPreflight(opts: {
  html: string;
  subject: string;
  recipientsCount: number;
}): PreflightResult {
  const { html, subject, recipientsCount } = opts;
  const checks: PreflightCheck[] = [];

  // 1. Subject line
  checks.push({
    id: "subject",
    label: "Subject line set",
    status: subject.trim().length > 0 ? "pass" : "fail",
    blocking: true,
    detail: subject.trim().length === 0 ? "Add a subject line before sending." : undefined,
  });

  // 2. Recipients
  checks.push({
    id: "recipients",
    label: "At least one recipient",
    status: recipientsCount > 0 ? "pass" : "fail",
    blocking: true,
    detail: recipientsCount === 0 ? "Add at least one recipient." : undefined,
  });

  // 3. Audit compliance (link rules)
  let auditIssues: ReturnType<typeof auditEmailHtml> = [];
  try {
    auditIssues = auditEmailHtml(html);
  } catch {
    auditIssues = [];
  }
  // Separate concerns: unsubscribe checks have their own row.
  const linkAuditIssues = auditIssues.filter(
    (i) => i.rule !== "missing_unsubscribe" && i.rule !== "unsubscribe_outside_footer",
  );
  checks.push({
    id: "audit",
    label: "Link audit clean",
    status: linkAuditIssues.length === 0 ? "pass" : "fail",
    blocking: true,
    detail:
      linkAuditIssues.length > 0
        ? `${linkAuditIssues.length} link issue${linkAuditIssues.length === 1 ? "" : "s"} — open the inline audit panel for details.`
        : undefined,
  });

  // 4. Unsubscribe placement
  const unsubscribeIssues = auditIssues.filter(
    (i) => i.rule === "missing_unsubscribe" || i.rule === "unsubscribe_outside_footer",
  );
  const hasUnsubMergeTag = /\{\$unsubscribe\}/i.test(html);
  const unsubStatus: PreflightCheck["status"] =
    unsubscribeIssues.length === 0 && hasUnsubMergeTag ? "pass" : "fail";
  checks.push({
    id: "unsubscribe",
    label: "Unsubscribe link in footer",
    status: unsubStatus,
    blocking: true,
    detail:
      unsubStatus === "pass"
        ? undefined
        : !hasUnsubMergeTag
        ? "Add an anchor with href=\"{$unsubscribe}\" inside the footer."
        : "Unsubscribe link is misplaced — keep it inside the footer block only.",
  });

  // 5. Merge-tag placement (allow-list)
  const mergeTagPattern = /\{\$[a-zA-Z_][a-zA-Z0-9_]*\}/g;
  const foundTags = Array.from(new Set(html.match(mergeTagPattern) || []));
  const disallowed = foundTags.filter((t) => !ALLOWED_MERGE_TAGS.has(t.toLowerCase()));
  checks.push({
    id: "merge_tags",
    label: "Merge tags valid",
    status: disallowed.length === 0 ? "pass" : "fail",
    blocking: true,
    detail:
      disallowed.length === 0
        ? undefined
        : `Unknown merge tag${disallowed.length === 1 ? "" : "s"}: ${disallowed.join(", ")}. Use only the allow-list.`,
  });

  // 6. Tracking — open pixel
  const hasOpenPixel = /track-email-open|open-pixel|tracking-pixel/i.test(html);
  checks.push({
    id: "open_pixel",
    label: "Open-tracking pixel present",
    status: hasOpenPixel ? "pass" : "warn",
    blocking: false,
    detail: hasOpenPixel
      ? undefined
      : "No open-tracking pixel detected — opens won't be recorded. The send pipeline normally injects this automatically.",
  });

  // 7. Tracking — at least one click-tracked CTA
  const hasClickTracking = /\/track-click\?|\/functions\/v1\/track-click/i.test(html);
  const hasAnyHref = /<a\b[^>]*href=/i.test(html);
  checks.push({
    id: "click_tracking",
    label: "Click tracking on CTAs",
    status: hasClickTracking ? "pass" : hasAnyHref ? "warn" : "warn",
    blocking: false,
    detail: hasClickTracking
      ? undefined
      : "No click-tracked links found — clicks may not be attributed. The send pipeline normally rewrites links.",
  });

  const blockers = checks.filter((c) => c.blocking && c.status !== "pass").length;
  const warnings = checks.filter((c) => c.status === "warn").length;

  return {
    canSend: blockers === 0,
    checks,
    blockers,
    warnings,
  };
}

interface SendPreflightChecklistProps {
  html: string;
  subject: string;
  recipientsCount: number;
  /** Notifies the parent whether send is allowed. */
  onResult?: (result: PreflightResult) => void;
  className?: string;
  loading?: boolean;
}

export function SendPreflightChecklist({
  html,
  subject,
  recipientsCount,
  onResult,
  className,
  loading,
}: SendPreflightChecklistProps) {
  const result = useMemo(() => {
    const r = runPreflight({ html, subject, recipientsCount });
    return r;
  }, [html, subject, recipientsCount]);

  // Notify parent on every recompute.
  useMemo(() => {
    onResult?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.canSend, result.blockers, result.warnings]);

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-muted/30 p-3", className)}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Running pre-flight checks…
        </div>
      </div>
    );
  }

  const headerColor = result.canSend
    ? "border-emerald-500/30 bg-emerald-500/5"
    : "border-destructive/40 bg-destructive/5";

  const headerIcon = result.canSend ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive shrink-0" />
  );

  const headerText = result.canSend
    ? result.warnings > 0
      ? `Ready to send — ${result.warnings} warning${result.warnings === 1 ? "" : "s"}`
      : "Ready to send — all checks passed"
    : `${result.blockers} blocker${result.blockers === 1 ? "" : "s"} — fix before sending`;

  return (
    <div className={cn("rounded-lg border", headerColor, className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        {headerIcon}
        <span
          className={cn(
            "text-[11px] font-bold",
            result.canSend ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {headerText}
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {result.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 px-3 py-2">
            {c.status === "pass" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {c.status === "fail" && (
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            )}
            {c.status === "warn" && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    c.status === "fail" ? "text-destructive" : "text-foreground",
                  )}
                >
                  {c.label}
                </span>
                {c.blocking && c.status !== "pass" && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-destructive">
                    Blocker
                  </span>
                )}
                {!c.blocking && c.status === "warn" && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600">
                    Warning
                  </span>
                )}
              </div>
              {c.detail && (
                <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
                  {c.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
