/**
 * Insert / relocate the {$unsubscribe} footer anchor.
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent helper used by the "Insert unsubscribe footer" quick action.
 *
 * Behavior:
 *   - If a {$unsubscribe} anchor already exists in the (heuristic) footer, do nothing.
 *   - If a {$unsubscribe} anchor exists outside the footer, remove every occurrence
 *     and re-insert a fresh one inside the footer.
 *   - If no footer is detectable, append a minimal CAN-SPAM compliant footer block
 *     just before </body> (or at the end of the HTML if no <body> exists).
 *
 * Returns both the rewritten HTML and a status describing what happened so
 * callers can render an accurate toast.
 */

const UNSUB_HREF_RE = /href\s*=\s*["']\{\$unsubscribe\}["']/i;
const UNSUB_ANCHOR_RE =
  /<a\b[^>]*\bhref\s*=\s*["']\{\$unsubscribe\}["'][^>]*>[\s\S]*?<\/a>/gi;

/** The drop-in footer anchor used when one needs to be created. */
const UNSUB_ANCHOR_HTML = `<a href="{$unsubscribe}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>`;

/**
 * Minimal CAN-SPAM footer used when the email has no detectable footer block.
 * Kept inline-styled because email clients strip <style> blocks and we don't
 * know what the surrounding template uses.
 */
const FALLBACK_FOOTER = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border-top:1px solid #e5e7eb;">
  <tr>
    <td align="center" style="padding:16px 24px;font:12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#6b7280;">
      You're receiving this because you subscribed to updates from Presale Properties.<br/>
      ${UNSUB_ANCHOR_HTML} · 3211 152 St, Surrey, BC
    </td>
  </tr>
</table>`;

export interface InsertUnsubscribeResult {
  html: string;
  status:
    | "already_in_footer"
    | "moved_into_footer"
    | "inserted_into_footer"
    | "footer_appended"
    | "noop";
  /** True if `html` differs from the input. */
  changed: boolean;
}

/**
 * Locate the heuristic footer block — the last <td> containing footer-y text
 * (unsubscribe wording, "©", "All rights reserved", "you're receiving"…).
 * Returns null if none found.
 */
function findFooterRange(html: string): { start: number; end: number } | null {
  const lower = html.toLowerCase();
  // Prefer an existing "unsubscribe" mention — that's almost certainly the footer.
  let anchor = lower.lastIndexOf("unsubscribe");
  if (anchor === -1) {
    // Fallback footer cues.
    for (const cue of ["©", "all rights reserved", "you're receiving", "you are receiving"]) {
      const i = lower.lastIndexOf(cue);
      if (i > anchor) anchor = i;
    }
  }
  if (anchor === -1) return null;
  const tdStart = lower.lastIndexOf("<td", anchor);
  const tdEnd = lower.indexOf("</td>", anchor);
  if (tdStart === -1 || tdEnd === -1) return null;
  return { start: tdStart, end: tdEnd + 5 };
}

export function insertUnsubscribeFooter(html: string): InsertUnsubscribeResult {
  if (!html) return { html, status: "noop", changed: false };

  const footer = findFooterRange(html);
  const hasUnsubAnywhere = UNSUB_HREF_RE.test(html);

  // Case A: anchor exists AND footer exists AND anchor is inside footer → done.
  if (hasUnsubAnywhere && footer) {
    UNSUB_ANCHOR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    let allInsideFooter = true;
    let foundAny = false;
    while ((m = UNSUB_ANCHOR_RE.exec(html)) !== null) {
      foundAny = true;
      if (m.index < footer.start || m.index > footer.end) {
        allInsideFooter = false;
        break;
      }
    }
    if (foundAny && allInsideFooter) {
      return { html, status: "already_in_footer", changed: false };
    }

    // Case B: anchor exists but at least one is outside the footer → strip every
    // anchor and inject a single fresh one into the footer.
    const stripped = html.replace(UNSUB_ANCHOR_RE, "");
    const newFooter = findFooterRange(stripped);
    if (newFooter) {
      const before = stripped.slice(0, newFooter.end - 5); // before </td>
      const closeAndAfter = stripped.slice(newFooter.end - 5);
      const inject = ` <span style="color:#9ca3af;">·</span> ${UNSUB_ANCHOR_HTML}`;
      return {
        html: before + inject + closeAndAfter,
        status: "moved_into_footer",
        changed: true,
      };
    }
    // Footer disappeared after stripping (rare) — fall through to append.
  }

  // Case C: footer exists, no anchor → inject anchor into existing footer.
  if (!hasUnsubAnywhere && footer) {
    const before = html.slice(0, footer.end - 5);
    const closeAndAfter = html.slice(footer.end - 5);
    const inject = ` <span style="color:#9ca3af;">·</span> ${UNSUB_ANCHOR_HTML}`;
    return {
      html: before + inject + closeAndAfter,
      status: "inserted_into_footer",
      changed: true,
    };
  }

  // Case D: no footer at all → append a minimal CAN-SPAM footer.
  if (/<\/body>/i.test(html)) {
    return {
      html: html.replace(/<\/body>/i, `${FALLBACK_FOOTER}\n</body>`),
      status: "footer_appended",
      changed: true,
    };
  }
  return {
    html: html + FALLBACK_FOOTER,
    status: "footer_appended",
    changed: true,
  };
}

export function describeInsertResult(r: InsertUnsubscribeResult): string {
  switch (r.status) {
    case "already_in_footer":
      return "Unsubscribe link already in the footer — no change needed.";
    case "moved_into_footer":
      return "Moved {$unsubscribe} into the footer block.";
    case "inserted_into_footer":
      return "Added {$unsubscribe} to the existing footer.";
    case "footer_appended":
      return "Appended a compliant footer with the {$unsubscribe} link.";
    default:
      return "No change.";
  }
}
