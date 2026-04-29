// Optional brand header bar for emails — logo on left, wordmark on right.
// Inspired by the lululemon header reference. Email-safe (table-based, inline styles).

const LOGO_EMAIL_URL =
  "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Femail-header-logo.png";

/**
 * Returns an email-safe header bar HTML block.
 * Designed to be injected immediately AFTER the opening <body> tag of any email.
 */
export function buildEmailHeaderHtml(): string {
  return `<!-- ─── BRAND HEADER ─── -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border-bottom:1px solid #ececec;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td align="left" valign="middle" style="padding:14px 24px;width:50%;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="40" height="40" style="display:block;width:40px;height:40px;border:0;outline:none;text-decoration:none;" />
          </td>
          <td align="right" valign="middle" style="padding:14px 24px;width:50%;font-family:'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#0d1f18;line-height:1;">
            Presale Properties
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

/**
 * Injects the header right after the opening <body ...> tag.
 * Falls back to prepending if no <body> tag is found.
 */
export function withEmailHeader(html: string, enabled: boolean): string {
  if (!enabled) return html;
  const header = buildEmailHeaderHtml();
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const idx = (bodyMatch.index ?? 0) + bodyMatch[0].length;
    return html.slice(0, idx) + "\n" + header + html.slice(idx);
  }
  return header + html;
}
