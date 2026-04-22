/**
 * Annotates rendered email HTML with inline visual highlights for audit issues.
 * Designed to run inside the sandboxed preview iframe via `srcDoc`.
 *
 * Highlight types:
 *   - Broken / non-compliant links (any anchor flagged by `auditEmailHtml`)
 *   - Missing {$unsubscribe} → injects a banner at the top of the body
 *   - Unknown merge tags in body copy → wraps each occurrence in a marker span
 *
 * The annotator never throws — if anything goes wrong it falls back to the
 * original HTML so the preview keeps rendering.
 */
import {
  auditEmailHtml,
  type AuditIssue,
} from "@/components/admin/campaign/auditEmailHtml";

/** Allow-list mirrored from auditEmailHtml.ts (kept in sync deliberately). */
const ALLOWED_BODY_MERGE_TAGS = new Set([
  "{$name}",
  "{$first_name}",
  "{$last_name}",
  "{$email}",
  "{$company}",
  "{$city}",
]);
const ALLOWED_HREF_MERGE_TAGS = new Set([
  "{$unsubscribe}",
  "{$webversion}",
  "{$forward}",
]);

/** Escape HTML special chars so dynamic strings injected into attributes/text are safe. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** CSS injected once into the preview document. */
const HIGHLIGHT_STYLES = `
<style id="lvbl-audit-highlight-styles">
  .lvbl-audit-bad-link {
    outline: 2px dashed #dc2626 !important;
    outline-offset: 2px !important;
    background: rgba(220, 38, 38, 0.08) !important;
    position: relative !important;
  }
  .lvbl-audit-bad-link::after {
    content: attr(data-lvbl-rule);
    position: absolute;
    top: -10px;
    right: -4px;
    background: #dc2626;
    color: #fff;
    font: 700 9px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 5px;
    border-radius: 3px;
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lvbl-audit-bad-tag {
    display: inline-block;
    background: rgba(217, 119, 6, 0.18);
    color: #92400e;
    border-bottom: 2px dashed #d97706;
    padding: 0 3px;
    border-radius: 2px;
    font-weight: 700;
  }
  .lvbl-audit-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 4px solid #dc2626;
    color: #991b1b;
    padding: 10px 14px;
    margin: 0 0 12px 0;
    font: 600 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    border-radius: 4px;
  }
  .lvbl-audit-banner strong { display: block; margin-bottom: 2px; font-size: 13px; }
  .lvbl-audit-banner small { display: block; font-weight: 400; font-size: 11px; opacity: 0.85; margin-top: 2px; }
</style>
`;

interface AnnotateResult {
  html: string;
  /** Number of anchors highlighted. */
  anchorIssues: number;
  /** Number of unknown body merge tags wrapped. */
  tagIssues: number;
  /** True if the unsubscribe banner was injected. */
  unsubBannerInjected: boolean;
}

/** Run the audit and inject inline visual markers into the HTML. */
export function annotateEmailHtmlWithAudit(html: string): AnnotateResult {
  if (!html) {
    return { html, anchorIssues: 0, tagIssues: 0, unsubBannerInjected: false };
  }

  let report;
  try {
    report = auditEmailHtml(html, { requireProjectRoute: true });
  } catch {
    return { html, anchorIssues: 0, tagIssues: 0, unsubBannerInjected: false };
  }

  // Group per-href issues so we only need one rewrite per anchor.
  const issuesByHref = new Map<string, AuditIssue>();
  for (const i of report.errors) {
    if (
      i.rule === "missing_unsubscribe" ||
      i.rule === "merge_tag_outside_allowed_zone"
    ) {
      // Handled separately (banner / body wrap).
      continue;
    }
    if (!i.href) continue;
    if (!issuesByHref.has(i.href)) issuesByHref.set(i.href, i);
  }

  let out = html;
  let anchorIssues = 0;

  // 1) Mark each offending <a href="..."> with a CSS class + data attribute.
  if (issuesByHref.size > 0) {
    out = out.replace(
      /<a\b([^>]*?)\bhref\s*=\s*("([^"]*)"|'([^']*)')([^>]*)>/gi,
      (full, pre: string, _hrefAttr: string, dq: string | undefined, sq: string | undefined, post: string) => {
        const href = (dq ?? sq ?? "").trim();
        const issue = issuesByHref.get(href);
        if (!issue) return full;
        anchorIssues++;
        const ruleLabel = issue.rule.replace(/_/g, " ");
        const title = `Audit: ${ruleLabel}${issue.expected ? ` — expected ${issue.expected}` : ""}`;
        // Merge into existing class/title if present; otherwise add fresh attrs.
        const merged = `${pre}href=${dq !== undefined ? `"${dq}"` : `'${sq}'`}${post}`;
        const withClass = /\bclass\s*=\s*["'][^"']*["']/.test(merged)
          ? merged.replace(/\bclass\s*=\s*(["'])([^"']*)\1/, (_m, q, v) => `class=${q}${v} lvbl-audit-bad-link${q}`)
          : `${merged} class="lvbl-audit-bad-link"`;
        const withTitle = /\btitle\s*=/.test(withClass)
          ? withClass
          : `${withClass} title="${esc(title)}"`;
        return `<a${withTitle.startsWith(" ") ? "" : " "}${withTitle.trim()} data-lvbl-rule="${esc(ruleLabel)}">`;
      },
    );
  }

  // 2) Wrap unknown merge tags in body copy. We only operate on text nodes —
  //    splitting by `<` and skipping tag chunks keeps it markup-safe.
  let tagIssues = 0;
  const MERGE_TAG_GLOBAL = /\{\$[\w.]+\}|\{\{[\w.]+\}\}|\{%[\w.\s]+%\}/g;
  out = out.replace(/(<[^>]+>)|([^<]+)/g, (_m, tag: string | undefined, text: string | undefined) => {
    if (tag) return tag; // skip markup
    if (!text) return "";
    if (!/[\{\}]/.test(text)) return text;
    return text.replace(MERGE_TAG_GLOBAL, (mt) => {
      if (ALLOWED_BODY_MERGE_TAGS.has(mt) || ALLOWED_HREF_MERGE_TAGS.has(mt)) return mt;
      tagIssues++;
      return `<span class="lvbl-audit-bad-tag" title="Unknown merge tag: ${esc(mt)} — won't be substituted by the ESP">${esc(mt)}</span>`;
    });
  });

  // 3) Inject the unsubscribe banner if the audit says it's missing/misplaced.
  const unsubMissing = report.errors.some(
    (e) => e.rule === "missing_unsubscribe" || e.rule === "unsubscribe_outside_footer",
  );
  let unsubBannerInjected = false;
  let banner = "";
  if (unsubMissing || anchorIssues > 0 || tagIssues > 0) {
    const parts: string[] = [];
    if (unsubMissing) {
      parts.push(
        `<div class="lvbl-audit-banner"><strong>⚠️ Compliance: unsubscribe link issue</strong>Add <code>&lt;a href="{$unsubscribe}"&gt;Unsubscribe&lt;/a&gt;</code> inside the footer block.<small>This banner is preview-only and won't ship with the email.</small></div>`,
      );
      unsubBannerInjected = true;
    }
    if (anchorIssues > 0 || tagIssues > 0) {
      const bits: string[] = [];
      if (anchorIssues > 0) bits.push(`${anchorIssues} broken link${anchorIssues === 1 ? "" : "s"}`);
      if (tagIssues > 0) bits.push(`${tagIssues} unknown merge tag${tagIssues === 1 ? "" : "s"}`);
      parts.push(
        `<div class="lvbl-audit-banner"><strong>🔍 ${bits.join(" + ")} highlighted below</strong>Hover any red-outlined link or amber-highlighted tag for details.<small>This banner is preview-only and won't ship with the email.</small></div>`,
      );
    }
    banner = parts.join("");
  }

  // Inject styles into <head> (or prepend if no head exists) and the banner
  // immediately after <body> (or prepend if no body exists).
  if (/<head\b[^>]*>/i.test(out)) {
    out = out.replace(/<head\b[^>]*>/i, (m) => `${m}${HIGHLIGHT_STYLES}`);
  } else {
    out = HIGHLIGHT_STYLES + out;
  }
  if (banner) {
    if (/<body\b[^>]*>/i.test(out)) {
      out = out.replace(/<body\b[^>]*>/i, (m) => `${m}${banner}`);
    } else {
      out = banner + out;
    }
  }

  return { html: out, anchorIssues, tagIssues, unsubBannerInjected };
}
