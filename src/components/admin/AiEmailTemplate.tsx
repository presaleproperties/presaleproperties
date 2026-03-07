/**
 * AiEmailTemplate
 * ─────────────────────────────────────────────────────────────
 * A self-contained HTML email renderer that takes AI-generated
 * copy and produces a production-ready email in Presale Properties'
 * brand style. Sections auto-show/hide based on available copy.
 *
 * Brand: dark forest green header (#0d1f18), gold accent (#C9A55A),
 * Cormorant Garamond + DM Sans typography.
 */

const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

export interface AgentInfo {
  full_name: string;
  title: string;
  photo_url: string | null;
  phone: string;
  email: string;
}

export const DEFAULT_AGENT: AgentInfo = {
  full_name: "Uzair Muhammad",
  title: "Presale Specialist",
  photo_url: null,
  phone: "778-231-3592",
  email: "info@presaleproperties.com",
};

export interface AiEmailCopy {
  subjectLine?: string;
  previewText?: string;
  headline?: string;
  bodyCopy?: string;
  incentiveText?: string;
  projectName?: string;
  city?: string;
  neighborhood?: string;
  developerName?: string;
  startingPrice?: string;
  deposit?: string;
  completion?: string;
}

/** Build bullet items from incentiveText (lines starting with ✦ or -) */
function parseIncentives(text: string): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map(l => l.replace(/^[✦•\-–]\s*/, "").trim())
    .filter(Boolean);
}

/** Convert \n-separated body copy paragraphs into HTML, rendering **bold** markers */
function bodyToHtml(text: string): string {
  if (!text) return "";
  const paras = text.split("\n").filter(Boolean);
  return paras
    .map(p => {
      const withBold = p.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#222222;">$1</strong>');
      return `<p style="margin:0 0 14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#444444;line-height:1.75;">${withBold}</p>`;
    })
    .join("");
}

export function buildAiEmailHtml(copy: AiEmailCopy, agent: AgentInfo = DEFAULT_AGENT, ctaUrl?: string): string {
  const ACCENT = "#C9A55A";
  const DARK = "#0d1f18";
  const incentives = parseIncentives(copy.incentiveText || "");
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";

  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");
  const byLine = copy.developerName ? `by ${copy.developerName}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${copy.subjectLine || "New Presale Opportunity"}</title>
  ${copy.previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">${copy.previewText}</div>` : ""}
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:#f0ede8;}
    *{box-sizing:border-box;}
  </style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;">
<tr><td align="center" style="padding:24px 12px;">

<!-- Email container -->
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0dbd3;">

  <!-- ─── HEADER ─── -->
  <tr>
    <td style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
      <p style="margin:0 0 10px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:400;color:#ffffff;line-height:1.1;">${copy.projectName || "New Presale Release"}</p>
      ${byLine ? `<p style="margin:0 0 10px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#7a9a86;">${byLine}</p>` : ""}
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:32px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:8px;height:2px;background:${ACCENT};opacity:0.4;"></td>
      </tr></table>
    </td>
  </tr>

  <!-- ─── LOCATION BANNER (conditional) ─── -->
  ${locationLine ? `
  <tr>
    <td style="background:${ACCENT};padding:9px 36px;">
      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">${locationLine.toUpperCase()}</p>
    </td>
  </tr>` : ""}

  <!-- ─── HERO STATS BAR (conditional) ─── -->
  ${(copy.startingPrice || copy.completion || copy.deposit) ? `
  <tr>
    <td style="background:#f7f5f1;border-bottom:1px solid #e8e3db;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${copy.startingPrice ? `
          <td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">
            <p style="margin:0 0 3px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:400;color:#111111;">${copy.startingPrice}</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Starting Price</p>
          </td>` : ""}
          ${copy.deposit ? `
          <td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">
            <p style="margin:0 0 3px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:400;color:#111111;">${copy.deposit}</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Deposit Structure</p>
          </td>` : ""}
          ${copy.completion ? `
          <td style="padding:16px 20px 14px;text-align:center;">
            <p style="margin:0 0 3px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:400;color:#111111;">${copy.completion}</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Est. Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── BODY COPY ─── -->
  <tr>
    <td style="padding:36px 36px 28px;">
      ${copy.headline ? `<p style="margin:0 0 20px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#111111;line-height:1.2;">${copy.headline}</p>` : ""}
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#444444;line-height:1.75;">
        ${bodyToHtml(copy.bodyCopy || "")}
      </div>
    </td>
  </tr>

  <!-- ─── INCENTIVES (conditional) ─── -->
  ${incentives.length > 0 ? `
  <tr>
    <td style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 16px 0;font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentives.map(item => `
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${ACCENT};margin-top:6px;"></div>
          </td>
          <td style="padding:0 0 10px 12px;vertical-align:top;">
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#c8d8cc;line-height:1.6;">${item}</p>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── CTA ─── -->
  <tr>
    <td style="padding:28px 36px 32px;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
        <tr>
          <td style="background:${DARK};padding:14px 36px;">
            <a href="tel:${(agent.phone || DEFAULT_AGENT.phone).replace(/\D/g,'')}" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">CALL NOW →</a>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border:1.5px solid ${ACCENT};padding:12px 36px;">
            <a href="${plansPricingUrl}" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;">VIEW PLANS & PRICING</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── DIVIDER ─── -->
  <tr>
    <td style="padding:0 36px;">
      <div style="height:1px;background:#ece8e0;"></div>
    </td>
  </tr>

  <!-- ─── AGENT CARD (matches main builder) ─── -->
  <!-- This comment is used as injection point for floor plans -->
  <tr>
    <td bgcolor="#fafaf8" style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <!-- Photo -->
          ${agent.photo_url ? `
          <td width="90" valign="middle" style="padding:18px 0 18px 24px;vertical-align:middle;line-height:0;font-size:0;">
            <img src="${agent.photo_url}" alt="${agent.full_name}" width="64" height="64" border="0"
                 style="display:block;width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
          </td>` : ""}
          <!-- Info -->
          <td valign="middle" style="padding:18px 12px 18px ${agent.photo_url ? "12px" : "24px"};vertical-align:middle;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;font-weight:400;color:#111111;line-height:1.15;mso-line-height-rule:exactly;margin-bottom:2px;">${agent.full_name}</div>
            <div style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};mso-line-height-rule:exactly;line-height:1.5;margin-bottom:7px;">${agent.title}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${agent.phone ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888888;line-height:1;">&#128222;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:400;color:#444444;text-decoration:none;">${agent.phone}</a></td>
              </tr>` : ""}
              ${agent.email ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888888;line-height:1;">&#9993;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:${agent.email}" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:400;color:#444444;text-decoration:none;">${agent.email}</a></td>
              </tr>` : ""}
            </table>
          </td>
          <!-- Logo -->
          <td align="right" valign="middle" style="padding:18px 24px 18px 12px;vertical-align:middle;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="120" border="0"
                 style="display:block;width:120px;max-width:120px;height:auto;-ms-interpolation-mode:bicubic;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td bgcolor="${DARK}" style="padding:22px 40px;background-color:${DARK};">
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;mso-line-height-rule:exactly;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${copy.city ? `${copy.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8aaa96;mso-line-height-rule:exactly;line-height:1.6;"><a href="https://presaleproperties.com" style="color:#8aaa96;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}</div>
    </td>
  </tr>

  <!-- ─── LEGAL + UNSUBSCRIBE ─── -->
  <tr>
    <td bgcolor="#f8f7f4" style="padding:24px 40px 28px;background-color:#f8f7f4;border-top:1px solid #e8e8e4;">
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#555555;margin-bottom:12px;mso-line-height-rule:exactly;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:12px;mso-line-height-rule:exactly;">
        This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
      </div>
      <div style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:18px;mso-line-height-rule:exactly;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="*|UNSUB|*" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">View in Browser</a>
      </div>
    </td>
  </tr>

</table>
<!-- /Email container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}
