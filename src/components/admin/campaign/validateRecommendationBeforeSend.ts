/**
 * Pre-send validator for the Recommendation email.
 * ─────────────────────────────────────────────────────────────────────────────
 * Blocks sending if:
 *   1. Any project card is missing a valid `projectUrl` (must be http/https).
 *   2. The rendered HTML contains any tracked CTA whose redirect destination
 *      would be invalid (empty, unparseable, wrong host, or not a real
 *      /presale-projects/<slug> route) — surfaced via auditEmailHtml().
 *
 * Returns a structured result so the UI can render a clear blocking dialog
 * instead of a generic toast. Use `formatValidationErrors()` for a one-shot
 * string suitable for `toast.error()`.
 */

import {
  auditEmailHtml,
  type AuditIssue,
} from "@/components/admin/campaign/auditEmailHtml";
import {
  buildRecommendationEmailHtml,
  type RecommendationEmailOptions,
  type RecommendationProject,
} from "@/components/admin/campaign/buildRecommendationEmailHtml";

export interface RecommendationValidationError {
  /** Stable code so UI can branch / log. */
  code:
    | "no_projects"
    | "missing_project_url"
    | "invalid_project_url"
    | "render_failed"
    | "audit_failed";
  /** Human-readable message safe to show in a toast. */
  message: string;
  /** Optional 1-based project index when the error is project-scoped. */
  projectIndex?: number;
  /** Underlying audit issue, when applicable. */
  issue?: AuditIssue;
}

export interface RecommendationValidationResult {
  ok: boolean;
  errors: RecommendationValidationError[];
  /** The HTML that *would* be sent — only populated when render succeeded. */
  html?: string;
}

const URL_RE = /^https?:\/\//i;

/**
 * Run all pre-send checks for a Recommendation email.
 *
 * Pass the same options object you'd pass to `buildRecommendationEmailHtml`.
 */
export function validateRecommendationBeforeSend(
  options: RecommendationEmailOptions,
): RecommendationValidationResult {
  const errors: RecommendationValidationError[] = [];
  const projects: RecommendationProject[] = options.projects || [];

  // ── 1. Per-project projectUrl checks ───────────────────────────────────────
  if (projects.length === 0) {
    errors.push({
      code: "no_projects",
      message: "Add at least one project before sending.",
    });
  }

  projects.forEach((p, i) => {
    const idx = i + 1;
    const label = p.projectName || `Project #${idx}`;
    if (!p.projectUrl || !p.projectUrl.trim()) {
      errors.push({
        code: "missing_project_url",
        message: `“${label}” is missing a projectUrl. Every recommended project must link to a /presale-projects/<slug> page.`,
        projectIndex: idx,
      });
      return;
    }
    if (!URL_RE.test(p.projectUrl.trim())) {
      errors.push({
        code: "invalid_project_url",
        message: `“${label}” has an invalid projectUrl (${p.projectUrl}). It must be a full https:// URL.`,
        projectIndex: idx,
      });
    }
  });

  // If basic project data is broken, skip the render step entirely — the
  // builder would just throw on the same checks.
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // ── 2. Render + audit the full HTML ────────────────────────────────────────
  let html: string;
  try {
    html = buildRecommendationEmailHtml(options);
  } catch (e) {
    errors.push({
      code: "render_failed",
      message:
        e instanceof Error
          ? e.message
          : "Failed to render the recommendation email.",
    });
    return { ok: false, errors };
  }

  const report = auditEmailHtml(html, { requireProjectRoute: true });
  for (const issue of report.errors) {
    errors.push({
      code: "audit_failed",
      message: formatAuditIssue(issue),
      issue,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    html,
  };
}

function formatAuditIssue(issue: AuditIssue): string {
  const ctx = issue.context ? `“${issue.context}” → ` : "";
  switch (issue.rule) {
    case "empty_href":
      return `${ctx}link has an empty href.`;
    case "placeholder_href":
      return `${ctx}link still uses a placeholder href (${issue.href}).`;
    case "wrong_scheme":
      return `${ctx}link uses the wrong URL scheme (got ${issue.href}, expected ${issue.expected}).`;
    case "tracked_url_unparseable":
      return `${ctx}tracked CTA has an unparseable URL (${issue.href}).`;
    case "tracked_url_missing_destination":
      return `${ctx}tracked CTA is missing its destination URL.`;
    case "destination_unparseable":
      return `${ctx}tracked CTA destination is unparseable (${issue.href}).`;
    case "project_route_wrong_host":
      return `${ctx}project CTA points to the wrong host (${issue.href}). Expected ${issue.expected}.`;
    case "project_route_invalid":
      return `${ctx}project CTA does not resolve to a valid /presale-projects/<slug> route (${issue.href}).`;
    case "missing_unsubscribe":
      return issue.href
        ? `unsubscribe link must use the merge tag ${issue.expected} (got ${issue.href}).`
        : `email is missing a required unsubscribe link in the footer.`;
    case "unsubscribe_outside_footer":
      return `unsubscribe link appears outside the footer block — move it into the footer only.`;
    case "merge_tag_in_href_path":
      return `${ctx}merge tag ${issue.href} is embedded inside a URL — ESPs only resolve merge tags that are the entire href.`;
    case "merge_tag_outside_allowed_zone":
      return `merge tag ${issue.href} is not on the allow-list and won't be substituted at send time.`;
    default:
      return `${ctx}${issue.rule}: ${issue.href}`;
  }
}

/**
 * Convert a failed validation result into a single string for `toast.error()`.
 * Caps at 4 lines so the toast stays readable.
 */
export function formatValidationErrors(
  result: RecommendationValidationResult,
  max = 4,
): string {
  if (result.ok) return "";
  const lines = result.errors.slice(0, max).map((e, i) => `${i + 1}. ${e.message}`);
  const overflow = result.errors.length - max;
  if (overflow > 0) lines.push(`…and ${overflow} more issue${overflow === 1 ? "" : "s"}.`);
  return lines.join("\n");
}
