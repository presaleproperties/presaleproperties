/**
 * Recommendation Email HTML builder — "Catalogue V2"
 * ─────────────────────────────────────────────────────────────────────────────
 * Behaviour-triggered recommendation email. Inspired by Priceline's deal email
 * structure (top nav, hero banner, 2-col card grid, "you may also like",
 * VIP block, quick action pills) but reskinned to our cream/gold brand.
 *
 * Supports 2–8 projects, optionally grouped by category (Condos / Townhomes /
 * Detached). Used for automated lead-nurture flows where projects are picked
 * based on user behaviour (city/neighborhood interest, new launches).
 *
 * Brand: cream/gold, Plus Jakarta Sans — matches buildCatalogueEmailHtml.
 */

import { type AgentInfo, DEFAULT_AGENT } from "@/components/admin/AiEmailTemplate";

const LOGO_EMAIL_URL =
  "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";
const ACCENT = "#C9A55A";
const ACCENT_SOFT = "#f5ecd6";
const DARK = "#111111";
const CREAM = "#f5f2ec";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const GOOGLE_FONT =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const SITE_BASE = "https://presaleproperties.com";

// Click-tracking endpoint — reuses the existing track-email-open edge function
// which logs click_count + clicked_url to email_logs and 302-redirects to the
// destination URL. We tag every link with `cs` (click source) so we can
// attribute engagement to specific projects, neighborhoods, and CTAs.
const TRACK_BASE =
  "https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/track-email-open";

const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

function getAgentWebsiteUrl(fullName: string): string | undefined {
  return AGENT_WEBSITE_URLS[fullName.split(" ")[0]];
}

/**
 * Wrap a destination URL with the click-tracking redirect endpoint.
 * MailerLite injects `{$tracking_id}` into the merge tag at send time
 * (see email_logs.tracking_id) so each recipient's clicks are attributed.
 *
 * @param destination Final URL the user lands on
 * @param meta        Semantic context (project, category, city, slot, cta)
 *                    — surfaced as query params for analytics joins.
 */
function trackUrl(
  destination: string,
  meta: {
    cta?: string;
    project_id?: string;
    project_slug?: string;
    category?: string;
    city?: string;
    neighborhood?: string;
    slot?: number | string;
    section?: string;
  } = {},
): string {
  const params = new URLSearchParams();
  params.set("t", "click");
  params.set("tid", "{$tracking_id}"); // MailerLite merge tag — per-recipient
  params.set("url", destination);
  if (meta.cta) params.set("cta", meta.cta);
  if (meta.project_id) params.set("pid", meta.project_id);
  if (meta.project_slug) params.set("pslug", meta.project_slug);
  if (meta.category) params.set("cat", meta.category);
  if (meta.city) params.set("city", meta.city);
  if (meta.neighborhood) params.set("nbhd", meta.neighborhood);
  if (meta.slot !== undefined) params.set("slot", String(meta.slot));
  if (meta.section) params.set("section", meta.section);
  return `${TRACK_BASE}?${params.toString()}`;
}

export type RecommendationCategory = "condo" | "townhome" | "detached";

export const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  condo: "Condos",
  townhome: "Townhomes",
  detached: "Detached Homes",
};

export interface RecommendationProject {
  id: string;
  category: RecommendationCategory;
  projectName: string;
  city: string;
  neighborhood?: string;
  developerName?: string;
  startingPrice?: string;
  completion?: string;
  featuredImage?: string;
  projectUrl: string;
}

export interface RecommendationEmailOptions {
  subjectLine: string;
  previewText: string;
  /** Headline for the hero banner */
  headline: string;
  /** Subline under the headline */
  subline?: string;
  /** Personal intro paragraph(s) — supports **bold** + line breaks */
  bodyCopy: string;
  /** Personalization context (e.g. "based on your interest in Brentwood") */
  personalizationContext?: string;
  /** Primary city (drives nav + footer) */
  city?: string;
  /** Pick 2–8 projects */
  projects: RecommendationProject[];
  /** Group cards by category headers */
  groupByCategory?: boolean;
  agent?: AgentInfo;
}

// ───────────────────────────────────────────────────────────────────────────
// Atoms
// ───────────────────────────────────────────────────────────────────────────

function navLink(label: string, href: string): string {
  const tracked = trackUrl(href, { cta: "nav", section: "header", city: label });
  return `<a href="${tracked}" target="_blank" style="font-family:${F};font-size:12px;font-weight:600;color:${DARK};text-decoration:none;letter-spacing:0.3px;padding:0 10px;">${label}</a>`;
}

function quickActionPill(label: string, href: string, icon: string): string {
  const tracked = trackUrl(href, { cta: "quick_action", section: "explore_more" });
  return `
    <td width="50%" style="padding:5px;" valign="top">
      <a href="${tracked}" target="_blank" style="display:block;text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e8e2d6;border-radius:999px;">
          <tr>
            <td style="padding:14px 18px;font-family:${F};">
              <span style="font-size:16px;margin-right:8px;vertical-align:middle;">${icon}</span>
              <span style="font-size:13px;font-weight:600;color:${DARK};vertical-align:middle;">${label}</span>
            </td>
          </tr>
        </table>
      </a>
    </td>`;
}

function projectCardHtml(p: RecommendationProject, slot: number): string {
  const location = [p.neighborhood, p.city].filter(Boolean).join(", ");
  // Derive a slug from the projectUrl for cleaner analytics joins
  const slug = (() => {
    try {
      const u = new URL(p.projectUrl);
      return u.pathname.split("/").filter(Boolean).pop() || undefined;
    } catch {
      return undefined;
    }
  })();
  const baseMeta = {
    project_id: p.id,
    project_slug: slug,
    category: p.category,
    city: p.city,
    neighborhood: p.neighborhood,
    slot,
    section: "project_grid",
  };
  const imgUrl = trackUrl(p.projectUrl, { ...baseMeta, cta: "card_image" });
  const titleUrl = trackUrl(p.projectUrl, { ...baseMeta, cta: "card_title" });
  const ctaUrl = trackUrl(p.projectUrl, { ...baseMeta, cta: "card_button" });

  return `
    <td width="50%" valign="top" style="padding:6px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e8e2d6;border-radius:12px;overflow:hidden;">
        <!-- Hero image with overlay -->
        <tr>
          <td style="padding:0;line-height:0;font-size:0;position:relative;">
            <a href="${imgUrl}" target="_blank" style="display:block;line-height:0;text-decoration:none;">
              ${
                p.featuredImage
                  ? `<img src="${p.featuredImage}" alt="${p.projectName}" width="270" style="display:block;width:100%;height:200px;object-fit:cover;border:0;" />`
                  : `<div style="width:100%;height:200px;background:${CREAM};"></div>`
              }
            </a>
          </td>
        </tr>
        <!-- Title block -->
        <tr>
          <td style="padding:14px 16px 6px;">
            <a href="${titleUrl}" target="_blank" style="text-decoration:none;">
              <p style="margin:0;font-family:${F};font-size:15px;font-weight:800;color:${DARK};line-height:1.25;">${p.projectName}</p>
            </a>
            ${
              location
                ? `<p style="margin:3px 0 0;font-family:${F};font-size:11px;color:#8a7e6b;">${location}</p>`
                : ""
            }
          </td>
        </tr>
        <!-- Price + completion -->
        ${
          p.startingPrice || p.completion
            ? `<tr>
          <td style="padding:6px 16px 4px;">
            ${
              p.startingPrice
                ? `<p style="margin:0;font-family:${F};font-size:11px;color:#8a7e6b;">From <span style="font-size:15px;font-weight:800;color:${ACCENT};">${p.startingPrice}</span></p>`
                : ""
            }
            ${
              p.completion
                ? `<p style="margin:2px 0 0;font-family:${F};font-size:10px;color:#8a7e6b;">Completion · <span style="color:${DARK};font-weight:600;">${p.completion}</span></p>`
                : ""
            }
          </td>
        </tr>`
            : ""
        }
        <!-- CTA -->
        <tr>
          <td style="padding:12px 16px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" bgcolor="${DARK}" style="border-radius:999px;padding:10px 16px;">
                  <a href="${ctaUrl}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">View Project</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>`;
}

/** Render rows of 2 cards each (handles odd counts). `startSlot` keeps slot
 *  numbers globally unique across grouped category sections for analytics. */
function renderProjectGrid(
  projects: RecommendationProject[],
  startSlot = 0,
): string {
  if (projects.length === 0) return "";
  const rows: string[] = [];
  for (let i = 0; i < projects.length; i += 2) {
    const left = projects[i];
    const right = projects[i + 1];
    rows.push(`
      <tr>
        ${projectCardHtml(left, startSlot + i + 1)}
        ${right ? projectCardHtml(right, startSlot + i + 2) : `<td width="50%" style="padding:6px;">&nbsp;</td>`}
      </tr>`);
  }
  return rows.join("");
}

function renderCategorySection(
  category: RecommendationCategory,
  projects: RecommendationProject[],
  startSlot = 0,
): string {
  if (projects.length === 0) return "";
  const label = CATEGORY_LABELS[category];
  return `
    <tr>
      <td class="content-pad" style="padding:18px 32px 4px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <p style="margin:0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${label}</p>
              <p style="margin:2px 0 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${projects.length} hand-picked ${label.toLowerCase()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="content-pad" style="padding:8px 26px 12px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${renderProjectGrid(projects, startSlot)}
        </table>
      </td>
    </tr>`;
}

// ───────────────────────────────────────────────────────────────────────────
// Main builder
// ───────────────────────────────────────────────────────────────────────────

export function buildRecommendationEmailHtml(
  options: RecommendationEmailOptions,
): string {
  const agent = options.agent || DEFAULT_AGENT;
  const cityDisplay =
    options.city || options.projects[0]?.city || "Vancouver";
  const phone = agent.phone || DEFAULT_AGENT.phone;
  const projectCount = options.projects.length;

  // Body copy with bold + paragraphs
  const bodyLines = (options.bodyCopy || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const processed = l.replace(
        /\*\*(.*?)\*\*/g,
        '<strong style="font-weight:700;color:#111111;">$1</strong>',
      );
      return `<p style="margin:0 0 12px 0;font-family:${F};font-size:14px;color:#444444;line-height:1.7;">${processed}</p>`;
    })
    .join("");

  // Cards: grouped or flat
  let cardsBlock: string;
  if (options.groupByCategory) {
    const grouped: Record<RecommendationCategory, RecommendationProject[]> = {
      condo: [],
      townhome: [],
      detached: [],
    };
    for (const p of options.projects) {
      grouped[p.category].push(p);
    }
    cardsBlock =
      renderCategorySection("condo", grouped.condo, 0) +
      renderCategorySection(
        "townhome",
        grouped.townhome,
        grouped.condo.length,
      ) +
      renderCategorySection(
        "detached",
        grouped.detached,
        grouped.condo.length + grouped.townhome.length,
      );
  } else {
    cardsBlock = `
    <tr>
      <td class="content-pad" style="padding:8px 26px 12px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${renderProjectGrid(options.projects, 0)}
        </table>
      </td>
    </tr>`;
  }

  // Personalization strip
  const personalizationStrip = options.personalizationContext
    ? `
    <tr>
      <td align="center" class="content-pad" style="padding:14px 32px 0;">
        <table cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td align="center" style="background:${ACCENT_SOFT};border-radius:999px;padding:8px 18px;">
              <span style="font-family:${F};font-size:11px;font-weight:600;color:#8a6d2a;">★ ${options.personalizationContext}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

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
  .content-pad{padding-left:14px!important;padding-right:14px!important;}
  .nav-link{padding:0 6px!important;font-size:11px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};-webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;font-size:1px;color:${CREAM};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${options.previewText || ""}
</div>

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${CREAM};">
<tr><td align="center" style="padding:20px 0;">

<table class="outer-table" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;">

  <!-- TOP GOLD BAR -->
  <tr><td style="height:4px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- LOGO + QUICK NAV -->
  <tr>
    <td align="center" style="padding:24px 24px 14px;background:#faf8f4;">
      <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="140" style="display:inline-block;width:140px;height:auto;" />
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0 12px 16px;background:#faf8f4;border-bottom:1px solid #e8e2d6;">
      ${navLink("Vancouver", `${SITE_BASE}/presale-projects/vancouver`)}
      <span style="color:${ACCENT};">·</span>
      ${navLink("Burnaby", `${SITE_BASE}/presale-projects/burnaby`)}
      <span style="color:${ACCENT};">·</span>
      ${navLink("Surrey", `${SITE_BASE}/presale-projects/surrey`)}
      <span style="color:${ACCENT};">·</span>
      ${navLink("Coquitlam", `${SITE_BASE}/presale-projects/coquitlam`)}
      <span style="color:${ACCENT};">·</span>
      ${navLink("Map", `${SITE_BASE}/map-search`)}
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td class="content-pad" style="padding:18px 32px 0;">
      <p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;">Hi {$name},</p>
    </td>
  </tr>

  ${personalizationStrip}

  <!-- HERO BANNER (cream/gold) -->
  <tr>
    <td class="content-pad" style="padding:14px 32px 6px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg, ${ACCENT_SOFT} 0%, #faf3e0 100%);border-radius:14px;border:1px solid ${ACCENT}33;">
        <tr>
          <td align="center" style="padding:36px 24px;">
            <p style="margin:0 0 8px;font-family:${F};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">★ Curated For You</p>
            <h1 style="margin:0;font-family:${F};font-size:30px;font-weight:800;color:${DARK};line-height:1.15;">${options.headline}</h1>
            ${
              options.subline
                ? `<p style="margin:10px 0 0;font-family:${F};font-size:14px;color:#555555;line-height:1.55;">${options.subline}</p>`
                : ""
            }
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:18px;">
              <tr>
                <td align="center" bgcolor="${DARK}" style="border-radius:999px;padding:12px 26px;">
                  <a href="${trackUrl(`${SITE_BASE}/presale-projects/${cityDisplay.toLowerCase()}`, { cta: "hero_browse_city", section: "hero", city: cityDisplay })}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">Browse All in ${cityDisplay}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BODY COPY -->
  ${
    bodyLines
      ? `<tr>
    <td class="content-pad" style="padding:18px 32px 4px;">
      ${bodyLines}
    </td>
  </tr>`
      : ""
  }

  <!-- COUNT BADGE -->
  <tr>
    <td align="center" class="content-pad" style="padding:14px 32px 0;">
      <span style="display:inline-block;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${projectCount} ${projectCount === 1 ? "Project" : "Projects"} Selected For You</span>
    </td>
  </tr>

  <!-- PROJECT CARDS GRID -->
  ${cardsBlock}

  <!-- DIVIDER -->
  <tr><td class="content-pad" style="padding:8px 32px 0;"><div style="height:1px;background:#e8e2d6;line-height:0;font-size:0;">&nbsp;</div></td></tr>

  <!-- AGENT VIP BLOCK -->
  <tr>
    <td class="content-pad" style="padding:24px 32px 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${DARK};border-radius:14px;">
        <tr>
          <td align="center" style="padding:32px 24px;">
            <p style="margin:0 0 6px;font-family:${F};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">★ VIP Access</p>
            <p style="margin:0 0 12px;font-family:${F};font-size:22px;font-weight:800;color:#ffffff;line-height:1.25;">You're on ${agent.full_name.split(" ")[0]}'s VIP list</p>
            <p style="margin:0 0 20px;font-family:${F};font-size:13px;color:#cccccc;line-height:1.6;max-width:420px;">Floor plan previews, pricing access, and off-market opportunities — before they hit our website.</p>
            <table cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td align="center" bgcolor="${ACCENT}" style="border-radius:999px;padding:12px 26px;">
                  <a href="${trackUrl(`tel:${phone.replace(/\D/g, "")}`, { cta: "vip_book_call", section: "vip_block" })}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${DARK};text-decoration:none;display:block;">Book a 15-min Call</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- QUICK ACTIONS GRID -->
  <tr>
    <td class="content-pad" style="padding:18px 26px 8px;">
      <p style="margin:0 0 10px 6px;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">Explore More</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${quickActionPill("Map Search", `${SITE_BASE}/map-search`, "🗺")}
          ${quickActionPill("Market Reports", `${SITE_BASE}/market-reports`, "📊")}
        </tr>
        <tr>
          ${quickActionPill("Mortgage Calc", `${SITE_BASE}/mortgage-calculator`, "💰")}
          ${quickActionPill("Meet the Team", `${SITE_BASE}/team`, "🤝")}
        </tr>
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- AGENT CARD -->
  <tr>
    <td style="padding:0;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${
          agent.photo_url
            ? `
        <tr>
          <td align="center" style="padding:28px 24px 12px;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>
        </tr>`
            : ""
        }
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

  <!-- FOOTER -->
  <tr>
    <td class="content-pad" style="padding:20px 40px;background:${DARK};">
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${cityDisplay.toUpperCase()}, BC</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="${SITE_BASE}" style="color:#888888;text-decoration:none;">presaleproperties.com</a> &nbsp;·&nbsp; ${phone}</p>
    </td>
  </tr>

  <!-- LEGAL -->
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
