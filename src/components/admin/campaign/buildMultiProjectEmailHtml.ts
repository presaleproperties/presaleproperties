/**
 * Multi-project comparison email HTML builder
 * Used for campaign weeks 2, 6, 8, 10, 12 — renders 3 project cards side by side
 * Reuses exact brand aesthetic: cream/gold, Plus Jakarta Sans, agent card, legal footer
 */

import { type AgentInfo, DEFAULT_AGENT } from "@/components/admin/AiEmailTemplate";

const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";
const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

function getAgentWebsiteUrl(fullName: string): string | undefined {
  return AGENT_WEBSITE_URLS[fullName.split(" ")[0]];
}

export interface MultiProjectData {
  projectName: string;
  city: string;
  neighborhood?: string;
  developerName?: string;
  startingPrice?: string;
  deposit?: string;
  completion?: string;
  featuredImage?: string;
  projectUrl?: string;
  highlights?: string[];
}

export interface MultiProjectEmailOptions {
  weekNumber: number;
  weekLabel: string;
  subjectLine: string;
  previewText: string;
  headline: string;
  bodyCopy: string;
  projects: MultiProjectData[];
  agent?: AgentInfo;
  /** Optional CTA label override per project */
  ctaLabel?: string;
  /** City for footer */
  city?: string;
  /** Injected HTML snippets (market stats, rental data, guide CTAs, etc.) */
  enrichmentHtml?: string;
}

function projectCardHtml(p: MultiProjectData, index: number, ctaLabel: string): string {
  const badgeColors = ["#C9A55A", "#6B9E7E", "#8B7355"];
  const badgeLabels = ["Primary", "Option 2", "Option 3"];
  const badge = badgeColors[index] || ACCENT;

  const highlights = (p.highlights || []).slice(0, 3);

  return `
  <tr>
    <td style="padding:0 0 24px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
        ${p.featuredImage ? `
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            ${p.projectUrl ? `<a href="${p.projectUrl}" target="_blank" style="display:block;line-height:0;">` : ""}
            <img src="${p.featuredImage}" alt="${p.projectName}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />
            ${p.projectUrl ? `</a>` : ""}
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:20px 24px 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};line-height:1.3;">${p.projectName}</p>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block;font-family:${F};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;background:${badge};padding:4px 10px;border-radius:3px;">${badgeLabels[index]}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 24px 16px;">
            <p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;">${p.city}${p.neighborhood ? ` · ${p.neighborhood}` : ""}${p.developerName ? ` — by ${p.developerName}` : ""}</p>
          </td>
        </tr>
        <!-- Stats row -->
        <tr>
          <td style="padding:0 24px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
              <tr>
                ${p.startingPrice ? `<td style="padding:12px 8px;text-align:center;border-right:1px solid #e8e2d6;">
                  <p style="margin:0 0 2px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">From</p>
                  <p style="margin:0;font-family:${F};font-size:16px;font-weight:800;color:${DARK};">${p.startingPrice}</p>
                </td>` : ""}
                ${p.deposit ? `<td style="padding:12px 8px;text-align:center;border-right:1px solid #e8e2d6;">
                  <p style="margin:0 0 2px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Deposit</p>
                  <p style="margin:0;font-family:${F};font-size:14px;font-weight:700;color:${DARK};">${p.deposit}</p>
                </td>` : ""}
                ${p.completion ? `<td style="padding:12px 8px;text-align:center;">
                  <p style="margin:0 0 2px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Completion</p>
                  <p style="margin:0;font-family:${F};font-size:14px;font-weight:700;color:${DARK};">${p.completion}</p>
                </td>` : ""}
              </tr>
            </table>
          </td>
        </tr>
        ${highlights.length > 0 ? `
        <tr>
          <td style="padding:0 24px 16px;">
            ${highlights.map(h => `<p style="margin:0 0 4px;font-family:${F};font-size:13px;color:#555;line-height:1.5;">✦ ${h}</p>`).join("")}
          </td>
        </tr>` : ""}
        ${p.projectUrl ? `
        <tr>
          <td style="padding:0 24px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" bgcolor="${DARK}" style="padding:14px 20px;border-radius:6px;">
                  <a href="${p.projectUrl}" target="_blank" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ""}
      </table>
    </td>
  </tr>`;
}

export function buildMultiProjectEmailHtml(options: MultiProjectEmailOptions): string {
  const agent = options.agent || DEFAULT_AGENT;
  const ctaLabel = options.ctaLabel || "VIEW PROJECT DETAILS";
  const cityDisplay = options.city || options.projects[0]?.city || "Vancouver";
  const phone = agent.phone || DEFAULT_AGENT.phone;

  // Body copy — process bold and line breaks
  const bodyLines = (options.bodyCopy || "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const processed = l.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#111111;">$1</strong>');
      return `<p style="margin:0 0 14px 0;font-family:${F};font-size:15px;color:#444444;line-height:1.7;">${processed}</p>`;
    }).join("");

  const projectCards = options.projects.map((p, i) => projectCardHtml(p, i, ctaLabel)).join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no"/>
<title>${options.subjectLine}</title>
<!--[if !mso]><!-->
<link href="${GOOGLE_FONT}" rel="stylesheet"/>
<!--<![endif]-->
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0;mso-table-rspace:0;}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
body{margin:0;padding:0;width:100%!important;min-width:100%!important;}
@media only screen and (max-width:620px){
  .outer-table{width:100%!important;}
  .content-pad{padding-left:16px!important;padding-right:16px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ec;-webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;font-size:1px;color:#f5f2ec;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${options.previewText || ""}
</div>

<!-- Outer wrapper -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f2ec;">
<tr><td align="center" style="padding:20px 0;">

<!-- Email container -->
<table class="outer-table" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:0;overflow:hidden;">

  <!-- ── TOP GOLD BAR ── -->
  <tr><td style="height:4px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- ── LOGO ── -->
  <tr>
    <td align="center" style="padding:28px 24px 20px;background:#faf8f4;">
      <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="140" style="display:inline-block;width:140px;height:auto;" />
    </td>
  </tr>

  <!-- ── GREETING ── -->
  <tr>
    <td class="content-pad" style="padding:8px 40px 0;">
      <p style="margin:0;font-family:${F};font-size:14px;color:#8a7e6b;">Hi {$name},</p>
    </td>
  </tr>

  <!-- ── HEADLINE ── -->
  <tr>
    <td class="content-pad" style="padding:20px 40px 12px;">
      <h1 style="margin:0;font-family:${F};font-size:28px;font-weight:800;color:${DARK};line-height:1.2;">${options.headline}</h1>
    </td>
  </tr>

  <!-- ── BODY COPY ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 24px;">
      ${bodyLines}
    </td>
  </tr>

  <!-- ── DIVIDER ── -->
  <tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- ── WEEK BADGE ── -->
  <tr>
    <td align="center" style="padding:24px 24px 8px;">
      <span style="display:inline-block;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">WEEK ${options.weekNumber} · ${options.weekLabel.toUpperCase()}</span>
    </td>
  </tr>

  <!-- ── PROJECT CARDS ── -->
  <tr>
    <td class="content-pad" style="padding:16px 40px 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${projectCards}
      </table>
    </td>
  </tr>

  ${options.enrichmentHtml ? `<!-- ── ENRICHMENT DATA ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 8px;">
      ${options.enrichmentHtml}
    </td>
  </tr>` : ""}

  <tr>
    <td class="content-pad" style="padding:8px 40px 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" bgcolor="${DARK}" style="padding:16px 24px;border-radius:6px;">
            <a href="tel:${phone.replace(/\D/g, "")}" target="_blank" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">CALL NOW — ${phone}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── DIVIDER ── -->
  <tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- ── AGENT CARD ── -->
  <tr>
    <td style="padding:0;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${agent.photo_url ? `
        <tr>
          <td align="center" style="padding:28px 24px 12px;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>
        </tr>` : ""}
        <tr>
          <td align="center" style="padding:0 24px 8px;text-align:center;">
            <p style="margin:0 0 4px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${agent.full_name}</p>
            <p style="margin:0 0 12px 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${agent.title}</p>
            ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g, "")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
            ${agent.email ? `<p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;"><a href="mailto:${agent.email}" style="color:#8a7e6b;text-decoration:none;">${agent.email}</a></p>` : ""}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px 24px;border-top:1px solid #e8e2d6;text-align:center;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" style="display:inline-block;width:110px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td class="content-pad" style="padding:20px 40px;background:#111111;">
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${cityDisplay.toUpperCase()}, BC</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a> &nbsp;·&nbsp; ${phone}</p>
    </td>
  </tr>

  <!-- ── LEGAL ── -->
  <tr>
    <td class="content-pad" style="padding:20px 40px 24px;background:#faf8f4;border-top:1px solid #e8e2d6;">
      <p style="margin:0 0 8px 0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#777777;">LEGAL DISCLAIMER</p>
      <p style="margin:0 0 8px 0;font-family:${F};font-size:11px;color:#aaaaaa;line-height:1.7;">
        This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer&rsquo;s agents. This is <strong style="font-weight:600;color:#888888;">not an offering for sale</strong>. Prices and availability subject to change. E.&amp;O.E.
      </p>
      <p style="margin:0 0 12px 0;font-family:${F};font-size:11px;color:#aaaaaa;line-height:1.7;">
        You received this because you opted in to presale updates. Per CASL, you may withdraw consent at any time.
      </p>
      <p style="margin:0;">
        <a href="{$unsubscribe}" style="font-family:${F};font-size:11px;color:#aaaaaa;text-decoration:underline;">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}
