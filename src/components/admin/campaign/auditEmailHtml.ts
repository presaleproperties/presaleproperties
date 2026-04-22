/**
 * Email HTML link audit
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses every <a href="..."> in a rendered email HTML string and verifies:
 *   1. href is non-empty (no `href=""`, no `href="#"`, no whitespace-only)
 *   2. scheme matches the link's intended use:
 *        - tel:   for "Call …" / phone CTAs
 *        - mailto: for "Email …" CTAs
 *        - http(s): for everything else
 *   3. Tracked project links (those routed through the track-email-open
 *      redirect endpoint) unwrap to a real /presale-projects/<slug> route
 *      on presaleproperties.com.
 *
 * Returns a structured report. Throw `assertEmailHtmlValid()` to fail loudly
 * inside builders when any error is detected.
 */

const TRACK_HOST = "thvlisplwqhtjpzpedhq.supabase.co";
const TRACK_PATH = "/functions/v1/track-email-open";
const SITE_HOST = "presaleproperties.com";
const PROJECT_PATH_RE = /^\/presale-projects\/[a-z0-9-]+(\/[a-z0-9-]+)*\/?$/i;

export type AuditSeverity = "error" | "warning";

export interface AuditIssue {
  severity: AuditSeverity;
  rule:
    | "empty_href"
    | "placeholder_href"
    | "wrong_scheme"
    | "tracked_url_unparseable"
    | "tracked_url_missing_destination"
    | "destination_unparseable"
    | "project_route_invalid"
    | "project_route_wrong_host";
  href: string;
  context?: string;
  expected?: string;
}

export interface AuditReport {
  total: number;
  errors: AuditIssue[];
  warnings: AuditIssue[];
  ok: boolean;
}

interface AnchorMatch {
  href: string;
  inner: string;
}

/** Pull every <a href="..."> ...</a> out of the HTML (cheap regex parse — emails are static, no JS). */
function extractAnchors(html: string): AnchorMatch[] {
  const out: AnchorMatch[] = [];
  const re = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push({ href: (m[1] ?? m[2] ?? "").trim(), inner: (m[3] ?? "").trim() });
  }
  return out;
}

/** Strip HTML tags + collapse whitespace to get the visible link text. */
function visibleText(inner: string): string {
  return inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Determine the expected URL scheme for a link based on its visible text.
 *  - Text mentioning "call" / phone-number-shaped → tel:
 *  - Text shaped like an email address or starting with "Email " → mailto:
 *  - everything else → http(s):
 */
function expectedScheme(text: string): "tel" | "mailto" | "http" {
  const t = text.toLowerCase().trim();
  // Phone-number-shaped text e.g. "778-231-3592", "(778) 231-3592", "+1 778..."
  const digitCount = (t.match(/\d/g) || []).length;
  if (/^[+()\-.\s\d]+$/.test(t) && digitCount >= 7) return "tel";
  // Any "call"-related CTA: "Call now", "Book a Call", "Book a 15-min Call", etc.
  if (/\bcall\b/.test(t)) return "tel";
  // Email-address-shaped text or "Email …" CTA
  if (/^email\b/.test(t)) return "mailto";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "mailto";
  return "http";
}

function getScheme(href: string): string {
  const m = href.match(/^([a-z][a-z0-9+.-]*):/i);
  return m ? m[1].toLowerCase() : "";
}

/** Decode a tracked redirect URL back to its destination param. */
function unwrapTrackedUrl(href: string): { destination?: string; error?: AuditIssue["rule"] } {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return { error: "tracked_url_unparseable" };
  }
  if (u.hostname !== TRACK_HOST || u.pathname !== TRACK_PATH) {
    // Not a tracked URL — return as-is for downstream checks.
    return { destination: href };
  }
  const dest = u.searchParams.get("url");
  if (!dest) return { error: "tracked_url_missing_destination" };
  return { destination: dest };
}

/**
 * Run the audit on a rendered email HTML string.
 *
 * @param html  Final HTML the email builder will ship.
 * @param opts.requireProjectRoute
 *   When true, every tracked link tagged with `cta=card_*` must resolve to
 *   a /presale-projects/<slug> URL on the production host. Defaults to true.
 */
export function auditEmailHtml(
  html: string,
  opts: { requireProjectRoute?: boolean } = {},
): AuditReport {
  const requireProjectRoute = opts.requireProjectRoute ?? true;
  const anchors = extractAnchors(html);
  const errors: AuditIssue[] = [];
  const warnings: AuditIssue[] = [];

  for (const a of anchors) {
    const text = visibleText(a.inner) || "(no text)";
    const ctx = text.length > 60 ? `${text.slice(0, 57)}…` : text;

    // Skip ESP merge tags (e.g. {$unsubscribe}, {{tracking_id}}) — those
    // are resolved server-side by the email platform at send time.
    if (/^\{[\$%{]?[\w.]+[}%]?\}$/.test(a.href) || /^\{\{[^}]+\}\}$/.test(a.href)) {
      continue;
    }

    // 1) Empty / placeholder href
    if (!a.href) {
      errors.push({ severity: "error", rule: "empty_href", href: a.href, context: ctx });
      continue;
    }
    if (a.href === "#" || a.href.toLowerCase() === "javascript:void(0)") {
      errors.push({
        severity: "error",
        rule: "placeholder_href",
        href: a.href,
        context: ctx,
      });
      continue;
    }

    // 2) Scheme matches intent
    const want = expectedScheme(text);
    const got = getScheme(a.href);
    if (want === "tel" && got !== "tel") {
      errors.push({
        severity: "error",
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "tel:",
      });
      continue;
    }
    if (want === "mailto" && got !== "mailto") {
      errors.push({
        severity: "error",
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "mailto:",
      });
      continue;
    }
    if (want === "http" && got !== "http" && got !== "https") {
      errors.push({
        severity: "error",
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "https:",
      });
      continue;
    }

    // tel:/mailto: links don't get tracked-url unwrapping or project-route checks
    if (got === "tel" || got === "mailto") continue;

    // 3) Unwrap tracked URL
    const { destination, error: unwrapErr } = unwrapTrackedUrl(a.href);
    if (unwrapErr) {
      errors.push({ severity: "error", rule: unwrapErr, href: a.href, context: ctx });
      continue;
    }
    if (!destination) continue;

    // 4) Validate destination is parseable
    let destUrl: URL;
    try {
      destUrl = new URL(destination);
    } catch {
      errors.push({
        severity: "error",
        rule: "destination_unparseable",
        href: destination,
        context: ctx,
      });
      continue;
    }

    // 5) If this is a tracked card link (ie, came from project_grid section),
    //    enforce that destination is a real /presale-projects/... route on prod.
    const isTrackedCard = /[?&]section=project_grid\b/.test(a.href) || /[?&]cta=card_/.test(a.href);
    if (requireProjectRoute && isTrackedCard) {
      if (destUrl.hostname !== SITE_HOST && destUrl.hostname !== `www.${SITE_HOST}`) {
        errors.push({
          severity: "error",
          rule: "project_route_wrong_host",
          href: destination,
          context: ctx,
          expected: SITE_HOST,
        });
        continue;
      }
      if (!PROJECT_PATH_RE.test(destUrl.pathname)) {
        errors.push({
          severity: "error",
          rule: "project_route_invalid",
          href: destination,
          context: ctx,
          expected: "/presale-projects/<slug>",
        });
        continue;
      }
    }
  }

  return {
    total: anchors.length,
    errors,
    warnings,
    ok: errors.length === 0,
  };
}

/** Throw a readable error with all findings if the report has any errors. */
export function assertEmailHtmlValid(report: AuditReport, label = "Email"): void {
  if (report.ok) return;
  const lines = report.errors.map(
    (e, i) =>
      `  ${i + 1}. [${e.rule}] "${e.context ?? ""}" → ${e.href}${
        e.expected ? ` (expected ${e.expected})` : ""
      }`,
  );
  throw new Error(
    `${label} link audit failed — ${report.errors.length} issue(s) across ${report.total} link(s):\n${lines.join("\n")}`,
  );
}

/** Format a report for logging / UI display. */
export function formatAuditReport(report: AuditReport): string {
  if (report.ok) return `✓ ${report.total} links — all valid`;
  return `✗ ${report.errors.length} error(s) / ${report.warnings.length} warning(s) across ${report.total} links`;
}
