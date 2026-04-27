// Server-side (Deno) renderer for the Presale Properties agent signature
// and a minimal project-spotlight email body. Mirrors the visual rules in
// src/lib/emailSignature.ts so emails sent via DealsFlow look identical to
// emails sent from Presale's own builder.
//
// Pure string functions — no DOM, no React, no external deps.

export interface BridgeAgent {
  full_name: string;
  title?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  calendly_url?: string | null;
  website_url?: string | null;
}

export interface BridgeProject {
  name: string;
  slug: string;
  city?: string | null;
  neighborhood?: string | null;
  developer_name?: string | null;
  starting_price?: number | string | null;
  price_range?: string | null;
  deposit_structure?: string | null;
  completion_year?: number | null;
  featured_image?: string | null;
  short_description?: string | null;
  highlights?: string[] | null;
  brochure_url?: string | null;
  pricing_sheet_url?: string | null;
  floorplan_url?: string | null;
  pitch_deck_url?: string | null;
  project_url?: string | null;
}

const LOGO_EMAIL_URL =
  "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";
const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const FALLBACK_PHONE = "(672) 258-1100";
const FALLBACK_EMAIL = "info@presaleproperties.com";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtMoney(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  if (!isFinite(n) || n <= 0) return null;
  return "$" + Math.round(n).toLocaleString("en-CA");
}

/** Email-safe agent signature block. */
export function renderAgentSignatureHtml(agent: BridgeAgent): string {
  const name = esc(agent.full_name || "Presale Properties Team");
  const title = esc(agent.title || "Presale Specialist");
  const phone = agent.phone || FALLBACK_PHONE;
  const email = agent.email || FALLBACK_EMAIL;
  const photo = agent.photo_url || "";
  const cleanPhone = phone.replace(/\D/g, "");
  const websiteUrl = agent.website_url || "";

  const photoCell = photo
    ? `<img src="${esc(photo)}" alt="${name}" width="64" height="64" style="display:block;border-radius:9999px;border:2px solid ${ACCENT};object-fit:cover" />`
    : `<div style="width:64px;height:64px;border-radius:9999px;background:${ACCENT};color:#fff;font:600 22px ${F};text-align:center;line-height:64px">${esc(name.charAt(0))}</div>`;

  const photoWrapped = websiteUrl
    ? `<a href="${esc(websiteUrl)}" target="_blank" style="text-decoration:none">${photoCell}</a>`
    : photoCell;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #eee;padding-top:20px;font-family:${F}">
  <tr>
    <td valign="top" style="padding-right:16px">${photoWrapped}</td>
    <td valign="top" style="font:14px/1.5 ${F};color:${DARK}">
      <div style="font-weight:700;font-size:15px;color:${DARK}">${name}</div>
      <div style="color:#666;font-size:13px;margin-top:2px">${title}</div>
      <div style="margin-top:8px;font-size:13px;color:${DARK}">
        <a href="tel:${cleanPhone}" style="color:${DARK};text-decoration:none">${esc(phone)}</a>
        &nbsp;·&nbsp;
        <a href="mailto:${esc(email)}" style="color:${DARK};text-decoration:none">${esc(email)}</a>
      </div>
      ${agent.calendly_url ? `<div style="margin-top:6px"><a href="${esc(agent.calendly_url)}" style="color:${ACCENT};text-decoration:none;font-size:13px;font-weight:600">Book a call →</a></div>` : ""}
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:18px">
      <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" height="22" style="display:block;height:22px" />
    </td>
  </tr>
</table>`.trim();
}

/** Compact project spotlight card for the email body. */
export function renderProjectCardHtml(project: BridgeProject): string {
  const name = esc(project.name);
  const location = [project.neighborhood, project.city].filter(Boolean).map(esc).join(", ");
  const dev = project.developer_name ? `<div style="color:#666;font-size:13px;margin-top:2px">by ${esc(project.developer_name)}</div>` : "";
  const price = fmtMoney(project.starting_price) || project.price_range || "";
  const priceLine = price ? `<div style="margin-top:10px;font-size:15px;color:${DARK}"><strong>From ${esc(price)}</strong>${project.completion_year ? ` · Completes ${project.completion_year}` : ""}</div>` : "";
  const desc = project.short_description ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#333">${esc(project.short_description)}</p>` : "";
  const hero = project.featured_image
    ? `<img src="${esc(project.featured_image)}" alt="${name}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:8px" />`
    : "";

  const links: string[] = [];
  if (project.pricing_sheet_url) links.push(`<a href="${esc(project.pricing_sheet_url)}" style="color:${ACCENT};text-decoration:none;font-weight:600">Pricing Sheet</a>`);
  if (project.floorplan_url) links.push(`<a href="${esc(project.floorplan_url)}" style="color:${ACCENT};text-decoration:none;font-weight:600">Floor Plans</a>`);
  if (project.brochure_url) links.push(`<a href="${esc(project.brochure_url)}" style="color:${ACCENT};text-decoration:none;font-weight:600">Brochure</a>`);
  if (project.pitch_deck_url) links.push(`<a href="${esc(project.pitch_deck_url)}" style="color:${ACCENT};text-decoration:none;font-weight:600">Full Presentation</a>`);
  const linksRow = links.length
    ? `<div style="margin-top:16px;font-size:14px">${links.join(' &nbsp;·&nbsp; ')}</div>`
    : "";

  const cta = project.project_url
    ? `<div style="margin-top:24px"><a href="${esc(project.project_url)}" style="display:inline-block;background:${DARK};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;font-family:${F}">View ${name} →</a></div>`
    : "";

  return `
<div style="font-family:${F};max-width:600px">
  ${hero}
  <div style="padding:20px 0">
    <div style="font-size:22px;font-weight:700;color:${DARK};letter-spacing:-0.01em">${name}</div>
    ${location ? `<div style="color:#666;font-size:14px;margin-top:4px">${location}</div>` : ""}
    ${dev}
    ${priceLine}
    ${desc}
    ${linksRow}
    ${cta}
  </div>
</div>`.trim();
}

/** Wraps body + signature into a complete email document. */
export function renderEmailDocument(args: {
  preheader?: string;
  bodyHtml: string;
  agent: BridgeAgent;
  trackingPixelUrl?: string;
}): string {
  const { preheader = "", bodyHtml, agent, trackingPixelUrl } = args;
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Presale Properties</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:${F};color:${DARK}">
${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f3ee">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        ${bodyHtml}
        ${renderAgentSignatureHtml(agent)}
      </td></tr>
    </table>
  </td></tr>
</table>
${trackingPixelUrl ? `<img src="${esc(trackingPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />` : ""}
</body></html>`;
}
