/**
 * Full Audit Report dialog
 * ─────────────────────────────────────────────────────────────────────────────
 * Opens from the Send Pre-flight Checklist (or anywhere we want to show the
 * complete link audit). Renders every failing href in the email HTML with:
 *   - the visible CTA text (context),
 *   - the offending href,
 *   - a plain-English reason,
 *   - a concrete suggested fix.
 *
 * Backed by `auditEmailHtml()` directly so it works with any rendered email
 * HTML — not just RecommendationEmailOptions.
 */
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle2, FileSearch } from "lucide-react";
import {
  auditEmailHtml,
  type AuditIssue,
} from "@/components/admin/campaign/auditEmailHtml";

interface FullAuditReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Final HTML the email would ship with. */
  html: string;
  /** Optional label shown in the dialog header (e.g. template name). */
  label?: string;
}

/** Human-readable reason for an audit issue. */
function describeReason(issue: AuditIssue): string {
  switch (issue.rule) {
    case "empty_href":
      return "Link has an empty href.";
    case "placeholder_href":
      return `Placeholder href (${issue.href}).`;
    case "wrong_scheme":
      return `Wrong URL scheme — got ${issue.href}, expected ${issue.expected}.`;
    case "tracked_url_unparseable":
      return "Tracked redirect URL is unparseable.";
    case "tracked_url_missing_destination":
      return "Tracked redirect is missing its destination URL.";
    case "destination_unparseable":
      return "Destination inside the tracked link is unparseable.";
    case "project_route_wrong_host":
      return `Destination points to wrong host (expected ${issue.expected}).`;
    case "project_route_invalid":
      return "Destination is not a valid /presale-projects/<slug> route.";
    case "missing_unsubscribe":
      return issue.href
        ? "Unsubscribe link uses a literal URL instead of the {$unsubscribe} merge tag."
        : "No unsubscribe link found in the footer.";
    case "unsubscribe_outside_footer":
      return "Unsubscribe link found outside the footer block.";
    case "merge_tag_in_href_path":
      return `Merge tag ${issue.href} is embedded inside a URL path.`;
    case "merge_tag_outside_allowed_zone":
      return `Merge tag ${issue.href} is not on the allow-list.`;
    default:
      return issue.rule;
  }
}

/** Concrete, actionable fix per audit rule. */
function suggestFix(issue: AuditIssue): string {
  switch (issue.rule) {
    case "empty_href":
      return "Set a real destination URL on this CTA — empty href values get stripped by most email clients.";
    case "placeholder_href":
      return 'Replace "#" or "javascript:void(0)" with the real destination URL.';
    case "wrong_scheme":
      return `Change the link's URL scheme to ${issue.expected} so the CTA actually works in mail clients.`;
    case "tracked_url_unparseable":
      return "The tracked URL is malformed. Re-render the email — if the issue persists, the project card data has invalid characters.";
    case "tracked_url_missing_destination":
      return "The tracked redirect is missing its `url` parameter. Re-render the email after fixing the project card.";
    case "destination_unparseable":
      return "The destination URL inside the tracked link is malformed. Check the projectUrl for typos or stray spaces.";
    case "project_route_wrong_host":
      return `Point the destination at ${issue.expected} (no other domains are allowed for tracked card CTAs).`;
    case "project_route_invalid":
      return "The destination must look like /presale-projects/<slug>. Update the projectUrl to a real project page route.";
    case "missing_unsubscribe":
      return 'Add an unsubscribe anchor in the footer with href="{$unsubscribe}". The ESP swaps this for the recipient\'s real unsubscribe URL at send time.';
    case "unsubscribe_outside_footer":
      return "Keep the unsubscribe link inside the footer block only. Extra unsubscribe links elsewhere hurt deliverability.";
    case "merge_tag_in_href_path":
      return "Don't embed merge tags inside URL paths. Either move the merge tag to be the full href value, or pre-resolve it before rendering.";
    case "merge_tag_outside_allowed_zone":
      return "Use only allow-listed personalization tags ({$name}, {$first_name}, {$last_name}, {$email}, {$company}, {$city}). Anything else won't be substituted.";
    default:
      return "Review and fix this link before sending.";
  }
}

export function FullAuditReportDialog({
  open,
  onOpenChange,
  html,
  label,
}: FullAuditReportDialogProps) {
  const report = useMemo(() => {
    if (!html) return null;
    try {
      return auditEmailHtml(html, { requireProjectRoute: true });
    } catch {
      return null;
    }
  }, [html]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" />
            Full audit report{label ? ` — ${label}` : ""}
          </DialogTitle>
          <DialogDescription>
            Every link in the rendered email HTML, with the exact failing URL,
            rule, and suggested fix.
          </DialogDescription>
        </DialogHeader>

        {!report ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't render the email HTML for auditing. Re-open after fixing
            template content.
          </div>
        ) : report.ok ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                All {report.total} link{report.total === 1 ? "" : "s"} valid.
              </p>
              <p className="text-xs text-muted-foreground">
                Safe to send — no issues detected by the link auditor.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-bold text-destructive">
                  {report.errors.length} issue{report.errors.length === 1 ? "" : "s"}
                </span>{" "}
                across {report.total} link{report.total === 1 ? "" : "s"} —
                fix before sending.
              </div>
              <Badge variant="destructive" className="text-[10px]">
                BLOCKING
              </Badge>
            </div>
            <ScrollArea className="flex-1 max-h-[55vh] pr-3">
              <ol className="space-y-2.5">
                {report.errors.map((issue, i) => (
                  <li
                    key={i}
                    className="rounded border border-destructive/20 bg-background/60 p-3 text-xs leading-relaxed"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-destructive shrink-0">
                        #{i + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[9.5px] font-mono uppercase"
                          >
                            {issue.rule.replace(/_/g, " ")}
                          </Badge>
                          {issue.context && (
                            <span
                              className="font-semibold text-foreground truncate max-w-[280px]"
                              title={issue.context}
                            >
                              “{issue.context}”
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Reason:{" "}
                          </span>
                          {describeReason(issue)}
                        </div>
                        {issue.href && (
                          <div className="text-muted-foreground break-all">
                            <span className="font-semibold text-foreground">
                              Failing URL:{" "}
                            </span>
                            <code className="rounded bg-muted/60 px-1 py-0.5 text-[10px]">
                              {issue.href}
                            </code>
                          </div>
                        )}
                        {issue.expected && (
                          <div className="text-muted-foreground break-all">
                            <span className="font-semibold text-foreground">
                              Expected:{" "}
                            </span>
                            <code className="rounded bg-muted/60 px-1 py-0.5 text-[10px]">
                              {issue.expected}
                            </code>
                          </div>
                        )}
                        <div className="text-emerald-700 dark:text-emerald-400">
                          <span className="font-semibold">Fix: </span>
                          {suggestFix(issue)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
