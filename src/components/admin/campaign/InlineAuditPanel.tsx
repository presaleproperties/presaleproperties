/**
 * Inline link-audit panel shown directly in the email builder.
 * Surfaces every failing link in the rendered email HTML with:
 *   - the visible CTA text (context),
 *   - the offending href,
 *   - a plain-English reason,
 *   - a concrete suggested fix.
 *
 * Runs `validateRecommendationBeforeSend()` reactively so editors see issues
 * as they edit — no need to wait for the Send button.
 */
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  validateRecommendationBeforeSend,
  type RecommendationValidationError,
} from "@/components/admin/campaign/validateRecommendationBeforeSend";
import type { RecommendationEmailOptions } from "@/components/admin/campaign/buildRecommendationEmailHtml";
import { cn } from "@/lib/utils";

interface InlineAuditPanelProps {
  options: RecommendationEmailOptions;
  className?: string;
}

/** Map every error code/audit rule to a concrete, actionable fix. */
function suggestFix(err: RecommendationValidationError): string {
  if (err.code === "no_projects") {
    return "Add at least one project card before sending.";
  }
  if (err.code === "missing_project_url") {
    return "Open the project card and paste a full https://presaleproperties.com/presale-projects/<slug> URL into the projectUrl field.";
  }
  if (err.code === "invalid_project_url") {
    return "Replace the projectUrl with a full URL starting with https:// (e.g. https://presaleproperties.com/presale-projects/your-slug).";
  }
  if (err.code === "render_failed") {
    return "Fix the project card data flagged in the message above, then re-render.";
  }
  // audit_failed → drill into the underlying audit rule
  switch (err.issue?.rule) {
    case "empty_href":
      return "Set a real destination URL on this CTA — empty href values get stripped by most email clients.";
    case "placeholder_href":
      return 'Replace "#" or "javascript:void(0)" with the real destination URL.';
    case "wrong_scheme":
      return `Change the link's URL scheme to ${err.issue.expected} so the CTA actually works in mail clients.`;
    case "tracked_url_unparseable":
      return "The tracked URL is malformed. Re-render the email — if the issue persists, the project card data has invalid characters.";
    case "tracked_url_missing_destination":
      return "The tracked redirect is missing its `url` parameter. Re-render the email after fixing the project card.";
    case "destination_unparseable":
      return "The destination URL inside the tracked link is malformed. Check the project card's projectUrl for typos or stray spaces.";
    case "project_route_wrong_host":
      return `Point the projectUrl at ${err.issue.expected} (no other domains are allowed for tracked card CTAs).`;
    case "project_route_invalid":
      return "The destination must look like /presale-projects/<slug>. Update the projectUrl to a real project page route.";
    case "missing_unsubscribe":
      return 'Add an unsubscribe anchor in the footer with href="{$unsubscribe}". The ESP swaps this for the recipient\'s real unsubscribe URL at send time.';
    case "unsubscribe_outside_footer":
      return "Keep the unsubscribe link inside the footer block only. Extra unsubscribe links in the body confuse mailbox providers and hurt deliverability.";
    case "merge_tag_in_href_path":
      return "Don't embed merge tags inside URL paths or query strings. Either move the merge tag to be the full href value, or pre-resolve the value before rendering.";
    case "merge_tag_outside_allowed_zone":
      return "Use only allow-listed personalization tags in body copy ({$name}, {$first_name}, {$last_name}, {$email}, {$company}, {$city}). Anything else won't be substituted.";
    default:
      return "Review and fix this link before sending.";
  }
}

/** Short, human-readable reason for the issue. */
function describeReason(err: RecommendationValidationError): string {
  if (err.code !== "audit_failed") return err.message;
  switch (err.issue?.rule) {
    case "empty_href":
      return "Link has an empty href.";
    case "placeholder_href":
      return `Placeholder href (${err.issue.href}).`;
    case "wrong_scheme":
      return `Wrong URL scheme — got ${err.issue.href}, expected ${err.issue.expected}.`;
    case "tracked_url_unparseable":
      return "Tracked redirect URL is unparseable.";
    case "tracked_url_missing_destination":
      return "Tracked redirect is missing its destination URL.";
    case "destination_unparseable":
      return "Destination inside the tracked link is unparseable.";
    case "project_route_wrong_host":
      return `Destination points to wrong host (expected ${err.issue.expected}).`;
    case "project_route_invalid":
      return "Destination is not a valid /presale-projects/<slug> route.";
    case "missing_unsubscribe":
      return err.issue?.href
        ? "Unsubscribe link uses a literal URL instead of the {$unsubscribe} merge tag."
        : "No unsubscribe link found in the footer.";
    case "unsubscribe_outside_footer":
      return "Unsubscribe link found outside the footer block.";
    case "merge_tag_in_href_path":
      return `Merge tag ${err.issue?.href} is embedded inside a URL path.`;
    case "merge_tag_outside_allowed_zone":
      return `Merge tag ${err.issue?.href} is not on the allow-list.`;
    default:
      return err.message;
  }
}

export function InlineAuditPanel({ options, className }: InlineAuditPanelProps) {
  const result = useMemo(() => {
    try {
      return validateRecommendationBeforeSend(options);
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            code: "render_failed" as const,
            message: e instanceof Error ? e.message : "Failed to render email.",
          },
        ],
      };
    }
  }, [options]);

  const errorCount = result.errors.length;

  if (result.ok) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2",
          className,
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
        <span className="text-[11px] font-medium text-success-strong dark:text-success">
          All links valid — safe to send.
        </span>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen className={cn("rounded-md border border-destructive/40 bg-destructive/5", className)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-[11px] font-bold text-destructive truncate">
            {errorCount} link {errorCount === 1 ? "issue" : "issues"} — fix before sending
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-destructive shrink-0 transition-transform data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="space-y-2 px-3 pb-3 pt-1">
          {result.errors.map((err, i) => {
            const ctx = err.issue?.context;
            const href = err.issue?.href;
            return (
              <li
                key={i}
                className="rounded border border-destructive/20 bg-background/60 p-2 text-[10.5px] leading-relaxed"
              >
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-destructive shrink-0">#{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1">
                    {ctx && (
                      <div className="font-semibold text-foreground truncate" title={ctx}>
                        “{ctx}”
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Reason: </span>
                      {describeReason(err)}
                    </div>
                    {href && (
                      <div className="text-muted-foreground break-all">
                        <span className="font-semibold text-foreground">Link: </span>
                        <code className="rounded bg-muted/60 px-1 py-0.5 text-[9.5px]">{href}</code>
                      </div>
                    )}
                    <div className="text-success-strong dark:text-success">
                      <span className="font-semibold">Fix: </span>
                      {suggestFix(err)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
