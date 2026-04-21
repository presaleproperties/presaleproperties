/**
 * Shared email signature builder
 * ──────────────────────────────────────────────────────────────────────────
 * Mirrors the agent card used in our campaign / AI email templates:
 *   round photo → name → title → phone → email → brand logo.
 *
 * Used by the in-app composer (Lead Hub, Bulk email) so manually-written
 * emails carry the exact same signature as our templated sends.
 */

export interface SignatureAgent {
  full_name: string;
  title?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
}

const LOGO_EMAIL_URL =
  "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";
const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";

// Optional per-agent personal landing pages (matches campaign builders)
const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

export function getAgentWebsiteUrl(fullName: string): string | undefined {
  return AGENT_WEBSITE_URLS[fullName.split(" ")[0]];
}

/** Fallback contact info when an agent record is missing fields. */
const FALLBACK_PHONE = "(672) 258-1100";
const FALLBACK_EMAIL = "info@presaleproperties.com";

/**
 * Render the standard agent signature block (table-based, email-safe HTML).
 * Drop this into the bottom of any composed email.
 */
export function buildAgentSignatureHtml(agent: SignatureAgent): string {
  const name = agent.full_name || "Presale Properties Team";
  const title = agent.title || "Presale Specialist";
  const phone = agent.phone || FALLBACK_PHONE;
  const email = agent.email || FALLBACK_EMAIL;
  const photo = agent.photo_url || "";
  const websiteUrl = getAgentWebsiteUrl(name);
  const cleanPhone = phone.replace(/\D/g, "");

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;background:#ffffff;border-top:2px solid ${ACCENT};">
  ${photo ? `
  <tr>
    <td align="center" style="padding:24px 24px 12px;">
      ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" style="text-decoration:none;">` : ""}<img src="${photo}" alt="${name}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${websiteUrl ? `</a>` : ""}
    </td>
  </tr>` : ""}
  <tr>
    <td align="center" style="padding:0 24px 8px;text-align:center;">
      <p style="margin:0 0 4px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${name}</p>
      <p style="margin:0 0 12px 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${title}</p>
      <p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${cleanPhone}" style="color:#555555;text-decoration:none;">${phone}</a></p>
      <p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;"><a href="mailto:${email}" style="color:#8a7e6b;text-decoration:none;">${email}</a></p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:16px 24px 24px;border-top:1px solid #e8e2d6;text-align:center;">
      <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" style="display:inline-block;width:110px;height:auto;" />
    </td>
  </tr>
</table>`.trim();
}

/**
 * Append the signature to a body string. Handles both plain-text and HTML.
 *  - Plain text → wraps body in basic block, then appends signature table
 *  - HTML       → injects signature just before </body> if present, else appends
 */
export function appendSignatureToHtml(html: string, agent: SignatureAgent): string {
  const sig = buildAgentSignatureHtml(agent);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${sig}</body>`);
  }
  return `${html}${sig}`;
}
