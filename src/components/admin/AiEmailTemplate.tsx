/**
 * AiEmailTemplate
 * ─────────────────────────────────────────────────────────────
 * Email templates:
 *  1. buildAiEmailHtml            — Classic editorial layout
 *  2. buildPitchDeckEmailHtml     — Pitch deck / Mailchimp
 *  3. buildPitchDeckEmailHtmlLofty — Lofty / CRM table-based
 * ─────────────────────────────────────────────────────────────
 *  Last updated: 2026-03-22
 *  2. buildLoopEmailHtml — Loop/magazine layout with CSS hero slideshow
 *
 * Brand: dark forest green header (#0d1f18), gold accent (#C9A55A),
 * Cormorant Garamond + DM Sans typography.
 */

const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

/** Refined sage-green for "What's Included" items across all layouts */
const INCLUDED_GREEN = "#6B9E7E";

const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

function getAgentWebsiteUrl(fullName: string): string | undefined {
  const firstName = fullName.split(" ")[0];
  return AGENT_WEBSITE_URLS[firstName];
}


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
  photo_url: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1772579582217-unijnf.jpg",
  phone: "778-231-3592",
  email: "info@presaleproperties.com",
};

export interface ImageCardEntry {
  id: string;
  url: string;
  caption?: string;
}

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
  /** URL to the project page on presaleproperties.com */
  projectUrl?: string;
  /** Additional info rows rendered as a secondary stats bar. Each entry: "Label|Value" */
  infoRows?: string[];
  /** Image cards rendered below the What's Included section */
  imageCards?: ImageCardEntry[];
}

/** Parse a credit string like "$10,000" into a number */
function parseCredit(credit?: string): number {
  if (!credit) return 0;
  const match = credit.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/** Calculate PSF, optionally adjusting for exclusive credit */
function calcPsf(priceStr?: string, sqftStr?: string, creditStr?: string): string {
  if (!priceStr || !sqftStr) return "";
  let price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  const credit = parseCredit(creditStr);
  if (credit > 0 && price > credit) price -= credit;
  // Extract only the first number from sqft string (interior sqft)
  // e.g. "589 + 76 ext sq ft" → 589, "678 sq ft" → 678
  const sqftMatch = sqftStr.match(/(\d+(?:\.\d+)?)/);
  const sqft = sqftMatch ? parseFloat(sqftMatch[1]) : 0;
  if (price > 0 && sqft > 0) return `$${Math.round(price / sqft).toLocaleString()}`;
  return "";
}

/** Render exclusive credit badge HTML for email */
function creditBadgeHtml(creditStr?: string, bodyFont?: string): string {
  if (!creditStr) return "";
  const display = creditStr.startsWith("$") ? creditStr : `$${creditStr}`;
  const font = bodyFont || "'DM Sans',Arial,sans-serif";
  return `<p style="margin:6px 0 0 0;font-family:${font};font-size:12px;font-weight:700;color:#22c55e;line-height:1.3;">✦ Exclusive Credit: ${display}</p>`;
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

/** Render a "Project Details" CTA button — only shown when projectUrl is present */
function projectDetailsCta(opts: { projectUrl?: string; projectName?: string; developerName?: string; font: string; accent?: string; dark?: string }): string {
  if (!opts.projectUrl) return "";
  const ACCENT = opts.accent || "#C9A55A";
  const DARK = opts.dark || "#0d1f18";
  return `
  <tr>
    <td style="padding:0 36px 8px;background:#ffffff;" class="mobile-pad">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid ${ACCENT};border-radius:6px;overflow:hidden;">
        <tr>
          <td align="center" style="padding:16px 24px;background:#ffffff;">
            <a href="${opts.projectUrl}" target="_blank"
               style="font-family:${opts.font};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;line-height:1;">
              VIEW PROJECT DETAILS &nbsp;→
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Generate document CTA buttons (brochure / floor plans / pricing) — only renders when URLs are present */
function docCtaButtons(opts: {
  brochureUrl?: string; floorplanUrl?: string; pricingUrl?: string; deckUrl?: string;
  font: string; accent: string; dark: string;
  style?: "gold-fill" | "pill" | "outline";
  showBrochureCta?: boolean; showFloorPlansCta?: boolean; showPricingCta?: boolean;
}): string {
  const { brochureUrl, floorplanUrl, pricingUrl, deckUrl, font: F, accent: ACCENT, dark: DARK } = opts;
  // Respect visibility toggles (default true)
  const brochureVisible = opts.showBrochureCta !== false;
  const floorplanVisible = opts.showFloorPlansCta !== false;
  const pricingVisible = opts.showPricingCta !== false;
  // Only use explicit floorplanUrl — do NOT fall back to deckUrl here
  // (deckUrl is handled separately by "VIEW MORE PLANS" to avoid double buttons)
  const hasFloorplan = floorplanVisible && !!floorplanUrl;
  const floorplanHref = floorplanUrl || "";
  const hasBrochure = brochureVisible && !!brochureUrl;
  const hasPricing = pricingVisible && !!pricingUrl;
  if (!hasFloorplan && !hasBrochure && !hasPricing) return "";

  const style = opts.style || "pill";

  if (style === "gold-fill") {
    const buttons: string[] = [];
    if (hasBrochure) {
      buttons.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:${hasFloorplan ? '10px' : '14px'};">
        <tr><td align="center" style="background:${ACCENT};padding:18px 24px;text-align:center;">
          <a href="${brochureUrl}" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;display:block;line-height:1;">VIEW BROCHURE &nbsp;→</a>
        </td></tr></table>`);
    }
    if (hasFloorplan) {
      buttons.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:${hasPricing ? '10px' : '14px'};">
        <tr><td align="center" style="background:${hasBrochure ? DARK : ACCENT};padding:18px 24px;text-align:center;">
          <a href="${floorplanHref}" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${hasBrochure ? '#ffffff' : DARK};text-decoration:none;display:block;line-height:1;">VIEW FLOOR PLANS &nbsp;→</a>
        </td></tr></table>`);
    }
    if (hasPricing) {
      buttons.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr><td align="center" style="background:${DARK};padding:18px 24px;text-align:center;">
          <a href="${pricingUrl}" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">VIEW PRICING &nbsp;→</a>
        </td></tr></table>`);
    }
    return buttons.join("\n      ");
  }

  if (style === "pill") {
    const buttons: string[] = [];
    if (hasBrochure) {
      buttons.push(`<tr>
    <td class="content-pad" style="padding:${hasFloorplan ? '28px 40px 8px' : '28px 40px 14px'};background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${ACCENT};border-radius:50px;padding:18px 32px;text-align:center;">
          <a href="${brochureUrl}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;white-space:nowrap;">VIEW BROCHURE</a>
        </td>
      </tr></table>
    </td>
  </tr>`);
    }
    if (hasFloorplan) {
      buttons.push(`<tr>
    <td class="content-pad" style="padding:${hasBrochure ? '8px 40px 14px' : '28px 40px 14px'};background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${hasBrochure ? DARK : ACCENT};border-radius:50px;padding:18px 32px;text-align:center;">
          <a href="${floorplanHref}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${hasBrochure ? ACCENT : '#ffffff'};text-decoration:none;display:block;white-space:nowrap;">VIEW FLOOR PLANS</a>
        </td>
      </tr></table>
    </td>
  </tr>`);
    }
    if (hasPricing) {
      buttons.push(`<tr>
    <td class="content-pad" style="padding:8px 40px 14px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;text-align:center;">
          <a href="${pricingUrl}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${ACCENT};text-decoration:none;display:block;white-space:nowrap;">VIEW PRICING</a>
        </td>
      </tr></table>
    </td>
  </tr>`);
    }
    return buttons.join("\n  ");
  }

  // outline style (editorial)
  const buttons: string[] = [];
  if (hasBrochure) {
    buttons.push(`<tr>
    <td class="content-pad" style="padding:28px 40px ${hasFloorplan ? '8px' : '8px'};background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid ${ACCENT};border-radius:6px;overflow:hidden;"><tr>
        <td align="center" style="padding:16px 24px;background:#ffffff;">
          <a href="${brochureUrl}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;line-height:1;">VIEW BROCHURE &nbsp;→</a>
        </td>
      </tr></table>
    </td>
  </tr>`);
  }
  if (hasFloorplan) {
    buttons.push(`<tr>
    <td class="content-pad" style="padding:${hasBrochure ? '8px' : '28px'} 40px 8px;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid ${ACCENT};border-radius:6px;overflow:hidden;"><tr>
        <td align="center" style="padding:16px 24px;background:#ffffff;">
          <a href="${floorplanHref}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;line-height:1;">VIEW FLOOR PLANS &nbsp;→</a>
        </td>
      </tr></table>
    </td>
  </tr>`);
  }
  return buttons.join("\n  ");
}

/** Generate "BOOK A SHOWING" CTA button — only renders when URL is provided and toggle is on */
function bookShowingCta(opts: {
  bookShowingUrl?: string; showBookShowingCta?: boolean;
  font: string; accent: string; dark: string;
  style?: "gold-fill" | "pill" | "outline";
}): string {
  if (opts.showBookShowingCta === false || !opts.bookShowingUrl) return "";
  const { bookShowingUrl, font: F, accent: ACCENT, dark: DARK } = opts;
  const style = opts.style || "gold-fill";

  if (style === "pill") {
    return `<!-- ── CTA: BOOK A SHOWING ── -->
  <tr>
    <td class="content-pad" style="padding:28px 40px 14px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${ACCENT};border-radius:50px;padding:18px 32px;text-align:center;">
          <a href="${bookShowingUrl}" target="_blank" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;white-space:nowrap;">BOOK A SHOWING</a>
        </td>
      </tr></table>
    </td>
  </tr>`;
  }

  if (style === "outline") {
    return `<!-- ── CTA: BOOK A SHOWING ── -->
  <tr>
    <td class="content-pad" style="padding:28px 40px 8px;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid ${ACCENT};border-radius:6px;overflow:hidden;"><tr>
        <td align="center" style="padding:16px 24px;background:#ffffff;">
          <a href="${bookShowingUrl}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;line-height:1;">BOOK A SHOWING &nbsp;→</a>
        </td>
      </tr></table>
    </td>
  </tr>`;
  }

  // gold-fill (default)
  return `<!-- ── CTA: BOOK A SHOWING ── -->
  <tr>
    <td class="mobile-pad" style="background:#f7f5f1;padding:0 36px 14px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td align="center" style="background:${ACCENT};padding:18px 24px;text-align:center;width:100%;">
          <a href="${bookShowingUrl}" target="_blank" style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;display:block;line-height:1;white-space:nowrap;">BOOK A SHOWING &nbsp;→</a>
        </td>
      </tr></table>
    </td>
  </tr>`;
}


export interface EmailFontPairing {
  id: string;
  label: string;
  tag: string;
  display: string;
  body: string;
  googleUrl: string;
}

export const EMAIL_FONT_PAIRINGS: EmailFontPairing[] = [
  {
    id: "cormorant-dm",
    label: "Cormorant + DM Sans",
    tag: "Classic Luxury",
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'DM Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap",
  },
  {
    id: "playfair-lato",
    label: "Playfair Display + Lato",
    tag: "Editorial Bold",
    display: "'Playfair Display', Georgia, serif",
    body: "'Lato', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap",
  },
  {
    id: "bodoni-jost",
    label: "Bodoni Moda + Jost",
    tag: "High Fashion",
    display: "'Bodoni Moda', Georgia, serif",
    body: "'Jost', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap",
  },
  {
    id: "cinzel-raleway",
    label: "Cinzel + Raleway",
    tag: "Architectural",
    display: "'Cinzel', Georgia, serif",
    body: "'Raleway', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Raleway:wght@300;400;500;700&display=swap",
  },
  {
    id: "montserrat-montserrat",
    label: "Montserrat",
    tag: "Bold & Modern",
    display: "'Montserrat', Helvetica, Arial, sans-serif",
    body: "'Montserrat', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap",
  },
  {
    id: "jakarta-jakarta",
    label: "Plus Jakarta Sans",
    tag: "Clean & Strong",
    display: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    body: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
  },
  {
    id: "eb-garamond-montserrat",
    label: "EB Garamond + Montserrat",
    tag: "Prestige",
    display: "'EB Garamond', Georgia, serif",
    body: "'Montserrat', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;600;700&display=swap",
  },
  {
    id: "raleway-open",
    label: "Raleway + Open Sans",
    tag: "Refined Sans",
    display: "'Raleway', Helvetica, Arial, sans-serif",
    body: "'Open Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,600;0,700;1,400&family=Open+Sans:wght@300;400;600&display=swap",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIC TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

export function buildAiEmailHtml(copy: AiEmailCopy, agent: AgentInfo = DEFAULT_AGENT, ctaUrl?: string, font?: EmailFontPairing, suppressHeadlineInBody?: boolean): string {
  const ACCENT = "#C9A55A";
  const DARK = "#0d1f18";
  const incentives = parseIncentives(copy.incentiveText || "");
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont = font?.display || "'Cormorant Garamond', Georgia, serif";
  const bodyFont = font?.body || "'DM Sans', Helvetica, Arial, sans-serif";
  const googleFontUrl = font?.googleUrl || "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";

  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");
  const byLine = copy.developerName ? `by ${copy.developerName}` : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${copy.subjectLine || "New Presale Opportunity"}</title>
  ${copy.previewText ? `<span style="display:none;font-size:1px;color:#ffffff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${copy.previewText}</span>` : ""}
  <link href="${googleFontUrl}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;display:block;}
    body{margin:0!important;padding:0!important;background:#f0ede8;min-width:100%!important;width:100%!important;}
    /* ── Apple Mail / Gmail link colour reset ── */
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    /* Force email-container to be fluid — critical for iOS Mail */
    .email-container{width:100%!important;max-width:600px!important;}
    /* ── Mobile ── */
    @media screen and (max-width:600px){
      .email-container{width:100%!important;max-width:100%!important;}
      .outer-td{padding:0!important;}
      .mobile-pad{padding-left:16px!important;padding-right:16px!important;}
      .mobile-pad-sm{padding-left:12px!important;padding-right:12px!important;}
      .mobile-stack td,.stat-cell{display:block!important;width:100%!important;text-align:center!important;padding:14px 16px!important;border-right:none!important;border-left:none!important;}
      .mobile-stack td:not(:last-child),.stat-cell:not(:last-child){border-bottom:1px solid #e8e3db!important;}
      .mobile-hero-img{min-height:200px!important;}
      .hero-headline{font-size:24px!important;line-height:1.2!important;}
      .body-headline{font-size:22px!important;}
      .stat-value{font-size:22px!important;}
      .agent-logo{display:none!important;}
      .agent-photo{width:80px!important;height:80px!important;}
      .agent-photo-cell{padding:16px 0 16px 16px!important;width:96px!important;}
      .agent-info-cell{padding:16px!important;}
      .agent-logo-cell{display:none!important;}
      .fp-cell{display:block!important;width:100%!important;padding:0 0 24px 0!important;}
      table.mobile-full{width:100%!important;}
      .section-pad{padding-left:16px!important;padding-right:16px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;word-spacing:normal;" id="body">

<!-- Outer wrapper — truly 100%, zero padding so iOS doesn't clip -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ede8;width:100%;min-width:100%;">
<tr><td align="center" style="padding:0;">

<!-- Email container — fluid, max 600px, centered via margin auto -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;margin:0 auto;">

  <!-- ─── HEADER ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 4px 0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
      <p class="hero-headline" style="margin:0 0 10px 0;font-family:${displayFont};font-size:32px;font-weight:600;color:#ffffff;line-height:1.1;">${copy.projectName || "New Presale Release"}</p>
      ${byLine ? `<p style="margin:0 0 10px 0;font-family:${bodyFont};font-size:11px;color:#7a9a86;">${byLine}</p>` : ""}
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
    <td class="mobile-pad" style="background:${ACCENT};padding:9px 36px;">
      <p style="margin:0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">${locationLine.toUpperCase()}</p>
    </td>
  </tr>` : ""}

  <!-- ─── HERO STATS BAR (conditional) ─── -->
  ${(copy.startingPrice || copy.completion || copy.deposit) ? `
  <tr>
    <td style="background:#f7f5f1;border-bottom:1px solid #e8e3db;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          ${copy.startingPrice ? `
          <td class="stat-cell" style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;width:33%;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#111111;">${copy.startingPrice}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Starting Price</p>
          </td>` : ""}
          ${copy.deposit ? `
          <td class="stat-cell" style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;width:33%;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#111111;">${copy.deposit}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Deposit Structure</p>
          </td>` : ""}
          ${copy.completion ? `
          <td class="stat-cell" style="padding:16px 20px 14px;text-align:center;width:34%;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#111111;">${copy.completion}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Est. Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── INFO ROWS (conditional) ─── -->
  ${(copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) ? `
  <tr>
    <td class="mobile-pad" style="padding:0 36px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e3db;border-radius:2px;overflow:hidden;">
        ${copy.infoRows.filter(r => r.includes("|")).map((row, i, arr) => {
          const [label, value] = row.split("|").map(s => s.trim());
          const isLast = i === arr.length - 1;
          return `<tr>
          <td style="padding:10px 16px;background:#f7f5f1;border-right:1px solid #e8e3db;width:40%;${!isLast ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${bodyFont};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">${label}</p>
          </td>
          <td style="padding:10px 16px;background:#ffffff;${!isLast ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${bodyFont};font-size:13px;font-weight:500;color:#222222;">${value}</p>
          </td>
        </tr>`;
        }).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── BODY COPY ─── -->
  <tr>
    <td class="mobile-pad" style="padding:36px 36px 28px;">
      ${(!suppressHeadlineInBody && copy.headline) ? `
      <p class="body-headline" style="margin:0 0 18px 0;font-family:${displayFont};font-size:30px;font-weight:700;color:#0d1f18;line-height:1.2;letter-spacing:-0.3px;">${copy.headline}</p>
      <div style="width:40px;height:3px;background:${ACCENT};margin-bottom:20px;"></div>` : ""}
      <div style="font-family:${bodyFont};font-size:15px;color:#444444;line-height:1.8;">
        ${bodyToHtml(copy.bodyCopy || "")}
      </div>
    </td>
  </tr>

  ${projectDetailsCta({ projectUrl: copy.projectUrl, projectName: copy.projectName, developerName: copy.developerName, font: bodyFont, accent: ACCENT, dark: DARK })}

  <!-- ─── INCENTIVES (conditional) ─── -->
  ${incentives.length > 0 ? `
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 16px 0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${INCLUDED_GREEN};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentives.map(item => `
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${INCLUDED_GREEN};margin-top:7px;"></div>
          </td>
          <td style="padding:0 0 10px 12px;vertical-align:top;">
            <p style="margin:0;font-family:${bodyFont};font-size:14px;color:#c8d8cc;line-height:1.7;">${item}</p>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── IMAGE CARDS (conditional) ─── -->
  ${(copy.imageCards && copy.imageCards.filter(c => c.url).length > 0) ? (() => {
    const cards = copy.imageCards!.filter(c => c.url);
    const colWidth = cards.length === 1 ? "100%" : cards.length === 2 ? "50%" : "33.333%";
    return `
  <tr>
    <td style="padding:0;margin:0;background:#ffffff;line-height:0;font-size:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;table-layout:fixed;">
        <tr>
          ${cards.map((card, i) => `
          <td style="width:${colWidth};vertical-align:top;padding:0;margin:0;${i > 0 ? "border-left:2px solid #ffffff;" : ""}line-height:0;font-size:0;">
            <img src="${card.url}" alt="${card.caption || "Project image"}" width="100%"
                 style="display:block;width:100%;height:auto;object-fit:cover;" />
            ${card.caption ? `<p style="margin:4px 0 0 0;padding:0 4px;font-family:${bodyFont};font-size:10px;color:#999999;text-align:center;letter-spacing:0.5px;line-height:1.4;">${card.caption}</p>` : ""}
          </td>`).join("")}
        </tr>
      </table>
    </td>
  </tr>`;
  })() : ""}

  <!-- ─── CTA ─── -->
  <tr>
    <td style="background:#f7f5f1;padding:32px 36px 36px;">
      ${ctaUrl ? `<!-- Primary CTA: VIEW PLANS — full gold fill -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr>
          <td align="center" style="background:${ACCENT};padding:18px 24px;text-align:center;">
            <a href="${plansPricingUrl}"
               style="font-family:${bodyFont};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#0d1f18;text-decoration:none;display:block;line-height:1;">
              VIEW PLANS &amp; PRICING &nbsp;→
            </a>
          </td>
        </tr>
      </table>` : ""}
      <!-- Secondary CTA: CALL NOW — dark green fill -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:16px 24px;text-align:center;">
            <a href="tel:${(agent.phone || DEFAULT_AGENT.phone).replace(/\D/g,'')}"
               style="font-family:${bodyFont};font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              &#128222;&nbsp; CALL NOW
            </a>
          </td>
        </tr>
      </table>
      <!-- Agent note -->
      <p style="margin:16px 0 0 0;font-family:${bodyFont};font-size:11px;color:#999999;text-align:center;line-height:1.5;">
        Questions? Reply to this email or call ${agent.phone || DEFAULT_AGENT.phone} directly.
      </p>
    </td>
  </tr>

  <!-- ─── DIVIDER ─── -->
  <tr>
    <td style="padding:0 36px;">
      <div style="height:1px;background:#ece8e0;"></div>
    </td>
  </tr>

  <!-- ─── AGENT CARD ─── -->
  <!-- This comment is used as injection point for floor plans -->
  <tr>
    <td bgcolor="#fafaf8" style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${agent.photo_url ? `
          <td width="80" valign="middle" class="agent-photo-cell" style="padding:18px 0 18px 20px;vertical-align:middle;line-height:0;font-size:0;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="60" height="60" border="0" class="agent-photo"
                 style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>` : ""}
          <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px ${agent.photo_url ? "10px" : "20px"};vertical-align:middle;">
            <div style="font-family:${displayFont};font-size:17px;font-weight:600;color:#111111;line-height:1.15;mso-line-height-rule:exactly;margin-bottom:2px;">${agent.full_name}</div>
            <div style="font-family:${bodyFont};font-size:9px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};mso-line-height-rule:exactly;line-height:1.5;margin-bottom:6px;">${agent.title}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${agent.phone ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888888;line-height:1;">&#128222;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="font-family:${bodyFont};font-size:12px;font-weight:400;color:#444444;text-decoration:none;">${agent.phone}</a></td>
              </tr>` : ""}
              ${agent.email ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888888;line-height:1;">&#9993;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:${agent.email}" style="font-family:${bodyFont};font-size:11px;font-weight:400;color:#444444;text-decoration:none;">${agent.email}</a></td>
              </tr>` : ""}
            </table>
          </td>
          <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="150" border="0" class="agent-logo"
                 style="display:block;width:150px;max-width:150px;height:auto;-ms-interpolation-mode:bicubic;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td bgcolor="${DARK}" class="mobile-pad" style="padding:22px 36px;background-color:${DARK};">
      <div style="font-family:${bodyFont};font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;mso-line-height-rule:exactly;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${copy.city ? `${copy.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
      <div style="font-family:${bodyFont};font-size:12px;font-weight:300;color:#8aaa96;mso-line-height-rule:exactly;line-height:1.6;"><a href="https://presaleproperties.com" style="color:#8aaa96;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}</div>
    </td>
  </tr>

  <!-- ─── LEGAL + UNSUBSCRIBE ─── -->
  <tr>
    <td bgcolor="#f8f7f4" class="mobile-pad" style="padding:24px 36px 28px;background-color:#f8f7f4;border-top:1px solid #e8e8e4;">
      <div style="font-family:${bodyFont};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#555555;margin-bottom:12px;mso-line-height-rule:exactly;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:12px;mso-line-height-rule:exactly;">
        This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
      </div>
      <div style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:18px;mso-line-height-rule:exactly;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="{$unsubscribe}" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
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


// ─────────────────────────────────────────────────────────────────────────────
// PITCH DECK EMAIL TEMPLATE
// Optimized for pitch deck sends:
//  - Plus Jakarta Sans (matches website)
//  - No "View Plans & Pricing" CTA (just Call Now + I'm Interested)
//  - Floor plans in a mobile-responsive 2-col grid
//  - Price shown under each floor plan
//  - Parking + locker included row
// ─────────────────────────────────────────────────────────────────────────────

export interface PitchDeckEmailFloorPlan {
  id: string;
  url: string;
  label: string;       // e.g. "1 Bedroom"
  sqft: string;        // e.g. "620 sq ft"
  price?: string;      // e.g. "$549,000"
  exclusive_credit?: string; // e.g. "$10,000"
}

export interface PitchDeckEmailData {
  projectName: string;
  city?: string;
  developerName?: string;
  heroImage?: string;
  tagline?: string;
  headline?: string;
  bodyCopy?: string;
  startingPrice?: string;
  deposit?: string;
  completion?: string;
  assignmentFee?: string;
  parkingIncluded?: string;
  lockerIncluded?: string;
  incentiveText?: string;
  infoRows?: string[];
  floorPlans?: PitchDeckEmailFloorPlan[];
  fpHeading?: string;
  fpSubheading?: string;
  subjectLine?: string;
  previewText?: string;
  ctaPhone?: string;
  ctaWhatsApp?: string;
  /** Public URL of the pitch deck — floor plans + hero image link here */
  deckUrl?: string;
  /** URL to the project page on presaleproperties.com */
  projectUrl?: string;
  /** URL to the brochure PDF — shows "VIEW BROCHURE" CTA when present */
  brochureUrl?: string;
  /** URL to the floor plans / pricing PDF — shows "VIEW FLOOR PLANS" CTA when present */
  floorplanUrl?: string;
  /** URL to the pricing sheet — shows "VIEW PRICING" CTA when present */
  pricingUrl?: string;
  /** CTA visibility toggles — all default to true when undefined */
  showFloorPlansCta?: boolean;
  showBrochureCta?: boolean;
  showPricingCta?: boolean;
  showViewMorePlansCta?: boolean;
  showCallNowCta?: boolean;
  showBookShowingCta?: boolean;
  bookShowingUrl?: string;
}

export function buildPitchDeckEmailHtml(
  data: PitchDeckEmailData,
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  const ACCENT      = "#C9A55A";
  const DARK        = "#0d1f18";
  const BODY_BG     = "#f0ede8";
  // Website font: Plus Jakarta Sans
  const DISPLAY_FONT = "'Plus Jakarta Sans', 'DM Sans', Helvetica, Arial, sans-serif";
  const BODY_FONT    = "'Plus Jakarta Sans', 'DM Sans', Helvetica, Arial, sans-serif";
  const GOOGLE_FONT  = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";

  const phone       = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  const whatsapp    = data.ctaWhatsApp || "16722581100";
  const locationLine = data.city ? data.city.toUpperCase() : "";
  const byLine       = data.developerName ? `by ${data.developerName}` : "";

  // ── Floor plans grid ─────────────────────────────────────────────────────
  // Each floor plan renders full-width (1 per row) on BOTH desktop and mobile
  // so images are large and legible. Each card links to the deck for zoom/detail.
  const fps = (data.floorPlans || []).filter(fp => fp.url);
  const deckLink = (data.projectName || data.developerName) ? (data.deckUrl || "") : "";

  const fpRowsHtml = fps.map(fp => `
    <tr>
      <td style="padding:0 0 20px 0;">
        <div style="border:1px solid rgba(201,165,90,0.25);overflow:hidden;background:#0f2920;border-radius:4px;">
          ${deckLink
            ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;"><img src="${fp.url}" alt="${fp.label || "Floor Plan"}" style="display:block;width:100%;max-width:100%;height:auto;" /></a>`
            : `<img src="${fp.url}" alt="${fp.label || "Floor Plan"}" style="display:block;width:100%;max-width:100%;height:auto;" />`
          }
          <div style="padding:14px 18px 18px;text-align:left;">
            ${fp.label ? `<p style="margin:0 0 4px 0;font-family:${BODY_FONT};font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${ACCENT};">${fp.label}</p>` : ""}
            ${fp.sqft  ? `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:12px;color:#8aaa96;">${fp.sqft}${(() => { const psf = calcPsf(fp.price, fp.sqft, fp.exclusive_credit); return psf ? ` · ${psf}/sqft` : ""; })()}</p>` : ""}
            ${fp.price ? `<p style="margin:0;font-family:${DISPLAY_FONT};font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
            ${creditBadgeHtml(fp.exclusive_credit, BODY_FONT)}
            ${deckLink ? `<p style="margin:8px 0 0 0;font-family:${BODY_FONT};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};"><a href="${deckLink}" target="_blank" style="color:${ACCENT};text-decoration:none;">View Full Details →</a></p>` : ""}
          </div>
        </div>
      </td>
    </tr>`).join("");

  const fpHeading    = data.fpHeading    || "Available Floor Plans";
  const fpSubheading = data.fpSubheading || "Limited units remaining — exclusive pricing for selected buyers";

  // ── Incentives ────────────────────────────────────────────────────────────
  const incentiveLines = (data.incentiveText || "")
    .split("\n").map(l => l.replace(/^[✦•\-–]\s*/, "").trim()).filter(Boolean);

  // ── What's Included ──────────────────────────────────────────────────────
  // incentiveLines already contains all items (parking, locker, AC, etc.)
  // Only fall back to parkingIncluded/lockerIncluded if incentiveLines is empty
  const includedItems: string[] = incentiveLines.length > 0
    ? incentiveLines
    : [
        data.parkingIncluded,
        data.lockerIncluded,
      ].filter(Boolean) as string[];

  // ── Body copy → HTML ──────────────────────────────────────────────────────
  // Renders as a flat list of table rows — bullets get indented dot+text columns.
  // All rows go into a single wrapper table (no div wrappers that break in email clients).
  const bodyRows = (data.bodyCopy || "").split("\n").filter(Boolean).map(p => {
    const isList = /^[✦•\-–]/.test(p.trim());
    const content = p
      .replace(/^[✦•\-–]\s*/, "")
      .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:600;color:#222222;">$1</strong>`)
      .replace(/\*/g, "");
    if (isList) {
      return `
      <tr>
        <td class="bullet-dot" valign="top" width="28" style="width:28px;padding:0 0 10px 20px;vertical-align:top;font-family:${BODY_FONT};font-size:16px;line-height:1.65;color:#C9A55A;">•</td>
        <td class="bullet-text" valign="top" style="padding:0 0 10px 8px;vertical-align:top;">
          <p style="margin:0;font-family:${BODY_FONT};font-size:14px;color:#444444;line-height:1.75;">${content}</p>
        </td>
      </tr>`;
    }
    return `
      <tr>
        <td colspan="2" style="padding:0 0 13px 0;">
          <p style="margin:0;font-family:${BODY_FONT};font-size:14px;color:#444444;line-height:1.75;">${content}</p>
        </td>
      </tr>`;
  }).join("");

  const bodyHtml = bodyRows
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%">${bodyRows}</table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${data.subjectLine || `${data.projectName} — Exclusive Presale Details`}</title>
  ${data.previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">${data.previewText}</div>` : ""}
  <link href="${GOOGLE_FONT}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:#ffffff;}
    *{box-sizing:border-box;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    @media only screen and (max-width:620px){
      /* TRUE edge-to-edge on iPhone — remove all outer spacing and border */
      .email-outer{padding:0!important;}
      .email-container{width:100%!important;max-width:100%!important;border:none!important;border-left:none!important;border-right:none!important;}
      /* Section padding: tighter on mobile */
      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}
      /* Stats bar: stack vertically */
      .mobile-stack td{display:block!important;width:100%!important;text-align:center!important;padding:14px 20px!important;border-right:none!important;border-bottom:1px solid #e8e3db!important;}
      .mobile-stack td:last-child{border-bottom:none!important;}
      /* Floor plan section */
      .fp-wrap{padding-left:16px!important;padding-right:16px!important;}
      /* Typography scale-up */
      .hero-headline{font-size:26px!important;line-height:1.15!important;}
      .stat-val{font-size:22px!important;}
      /* Body copy */
      .body-copy p{font-size:15px!important;line-height:1.8!important;}
      /* Bullet indentation on mobile */
      .bullet-dot{padding-left:16px!important;font-size:16px!important;}
      .bullet-text p{font-size:15px!important;line-height:1.8!important;}
      /* Full-width CTA button on mobile */
      .cta-btn{width:100%!important;display:block!important;}
      .cta-btn td{width:100%!important;text-align:center!important;padding:18px 20px!important;}
      /* Hide desktop agent card on mobile */
      .agent-desktop{display:none!important;max-height:0!important;overflow:hidden!important;}
      /* Show mobile agent card */
      .agent-mobile{display:table-row!important;max-height:none!important;overflow:visible!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;" id="body">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;margin:0;padding:0;">
<tr><td class="email-outer" align="center" style="padding:0;margin:0;">

<!-- Email container: capped at 600px on desktop, true full-width on mobile -->
<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:600px;background:#ffffff;border:1px solid #e0dbd3;">

  <!-- HEADER -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 6px 0;font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
      <p class="hero-headline" style="margin:0 0 8px 0;font-family:${DISPLAY_FONT};font-size:32px;font-weight:800;color:#ffffff;line-height:1.1;letter-spacing:-0.5px;">${data.projectName || "New Presale Release"}</p>
      ${byLine ? `<p style="margin:0 0 10px 0;font-family:${BODY_FONT};font-size:11px;color:#7a9a86;">${byLine}</p>` : ""}
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:32px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:8px;height:2px;background:${ACCENT};opacity:0.4;"></td>
      </tr></table>
    </td>
  </tr>

  <!-- LOCATION BANNER -->
  ${locationLine ? `
  <tr>
    <td class="mobile-pad" style="background:${ACCENT};padding:9px 36px;">
      <p style="margin:0;font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">${locationLine}</p>
    </td>
  </tr>` : ""}

  <!-- HERO IMAGE -->
  ${data.heroImage ? `
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
       ${deckLink
        ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;"><img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display:block;width:100%;height:auto;" /></a>`
        : `<img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display:block;width:100%;height:auto;" />`
      }
    </td>
  </tr>` : ""}

  <!-- STATS BAR -->
  ${(data.startingPrice || data.deposit || data.completion) ? `
  <tr>
    <td style="background:#f7f5f1;border-bottom:1px solid #e8e3db;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          ${data.startingPrice ? `
          <td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">
            <p class="stat-val" style="margin:0 0 3px 0;font-family:${DISPLAY_FONT};font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.3px;">${data.startingPrice}</p>
            <p style="margin:0;font-family:${BODY_FONT};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Starting Price</p>
          </td>` : ""}
          ${data.deposit ? `
          <td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">
            <p class="stat-val" style="margin:0 0 3px 0;font-family:${DISPLAY_FONT};font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.3px;">${data.deposit}</p>
            <p style="margin:0;font-family:${BODY_FONT};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Deposit Structure</p>
          </td>` : ""}
          ${data.completion ? `
          <td style="padding:16px 20px 14px;text-align:center;">
            <p class="stat-val" style="margin:0 0 3px 0;font-family:${DISPLAY_FONT};font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.3px;">${data.completion}</p>
            <p style="margin:0;font-family:${BODY_FONT};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">Est. Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- INFO ROWS (assignment fee etc) -->
  ${(data.infoRows && data.infoRows.filter(r => r.includes("|")).length > 0) ? `
  <tr>
    <td class="mobile-pad" style="padding:20px 36px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e3db;overflow:hidden;">
        ${data.infoRows.filter(r => r.includes("|")).map((row, i, arr) => {
          const [label, value] = row.split("|").map((s: string) => s.trim());
          return `<tr>
          <td style="padding:10px 16px;background:#f7f5f1;border-right:1px solid #e8e3db;width:45%;${i < arr.length-1 ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${BODY_FONT};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">${label}</p>
          </td>
          <td style="padding:10px 16px;background:#ffffff;${i < arr.length-1 ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${BODY_FONT};font-size:13px;font-weight:600;color:#222222;">${value}</p>
          </td>
        </tr>`;
        }).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- BODY COPY -->
  <tr>
    <td class="mobile-pad" style="padding:32px 36px 24px;background-color:#ffffff;">
      ${data.headline ? `
      <p style="margin:0 0 16px 0;font-family:${DISPLAY_FONT};font-size:26px;font-weight:800;color:#0d1f18;line-height:1.2;letter-spacing:-0.5px;">${(data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "")}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;"><tr><td width="40" height="3" style="width:40px;height:3px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr></table>` : ""}
      ${bodyHtml}
    </td>
  </tr>

  ${projectDetailsCta({ projectUrl: data.projectUrl, projectName: data.projectName, developerName: data.developerName, font: BODY_FONT, accent: ACCENT, dark: DARK })}

  <!-- WHAT'S INCLUDED (parking, locker, incentives) -->
  ${includedItems.length > 0 ? `
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:24px 36px;">
      <p style="margin:0 0 14px 0;font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${INCLUDED_GREEN};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${includedItems.map(item => `
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${INCLUDED_GREEN};margin-top:7px;"></div>
          </td>
          <td style="padding:0 0 10px 12px;vertical-align:top;">
            <p style="margin:0;font-family:${BODY_FONT};font-size:13px;font-weight:500;color:#c8d8cc;line-height:1.7;">${item}</p>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- FLOOR PLANS -->
  ${fps.length > 0 ? `
  <tr><td style="background:${DARK};padding:0;"><div style="height:3px;background:${ACCENT};"></div></td></tr>
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:24px 28px 8px;">
      <p style="margin:0 0 4px 0;font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
      <p style="margin:0 0 6px 0;font-family:${DISPLAY_FONT};font-size:24px;font-weight:700;color:#ffffff;line-height:1.15;letter-spacing:-0.3px;">${fpHeading}</p>
      <p style="margin:0;font-family:${BODY_FONT};font-size:12px;color:#8aaa96;line-height:1.6;">${fpSubheading}</p>
    </td>
  </tr>
  <tr>
    <td class="fp-wrap" style="background:${DARK};padding:12px 20px 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${fpRowsHtml}
      </table>
    </td>
  </tr>
  ` : ""}

  ${bookShowingCta({ bookShowingUrl: data.bookShowingUrl, showBookShowingCta: data.showBookShowingCta, font: BODY_FONT, accent: ACCENT, dark: DARK, style: "gold-fill" })}

  <!-- CALL NOW CTA — full-width button for mobile -->
  <tr>
    <td class="mobile-pad" style="background:#f7f5f1;padding:28px 36px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:18px 24px;text-align:center;width:100%;">
            <a href="tel:${phone.replace(/\D/g,'')}"
               style="font-family:${BODY_FONT};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;white-space:nowrap;">
              &#128222;&nbsp; CALL NOW — ${phone}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0;font-family:${BODY_FONT};font-size:11px;color:#999999;text-align:center;line-height:1.5;">
        Questions? Reply to this email or call <a href="tel:${phone.replace(/\D/g,'')}" style="color:#999999;">${phone}</a> directly.
      </p>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="height:1px;font-size:0;line-height:0;background:#ece8e0;padding:0;margin:0;">&nbsp;</td></tr>

  <!-- AGENT CARD — DESKTOP (hidden on mobile) -->
  <tr class="agent-desktop" style="display:table-row;">
    <td bgcolor="#fafaf8" style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${agent.photo_url ? `
          <td width="110" valign="middle" style="padding:20px 0 20px 24px;vertical-align:middle;line-height:0;font-size:0;width:110px;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="90" height="90" border="0"
                 style="display:block;width:90px;height:90px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>` : ""}
          <td valign="middle" style="padding:20px 0 20px 16px;vertical-align:middle;">
            <div style="font-family:${DISPLAY_FONT};font-size:17px;font-weight:700;color:#111111;line-height:1.2;margin-bottom:3px;">${agent.full_name}</div>
            <div style="font-family:${BODY_FONT};font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};line-height:1.5;margin-bottom:8px;">${agent.title}</div>
            ${agent.phone ? `<div style="font-family:${BODY_FONT};font-size:12px;color:#555555;margin-bottom:3px;">&#128222; <a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></div>` : ""}
            ${agent.email ? `<div style="font-family:${BODY_FONT};font-size:11px;color:#777777;">&#9993; <a href="mailto:${agent.email}" style="color:#777777;text-decoration:none;">${agent.email}</a></div>` : ""}
          </td>
          <td align="right" valign="middle" style="padding:20px 28px 20px 16px;vertical-align:middle;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="130" border="0"
                 style="display:block;width:130px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- AGENT CARD — MOBILE ONLY (shown via CSS media query on ≤620px) -->
  <tr class="agent-mobile" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    <td style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <!-- Photo row -->
        ${agent.photo_url ? `
        <tr>
          <td align="center" style="padding:28px 24px 14px;text-align:center;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="100" height="100" border="0"
                 style="display:inline-block;width:100px;height:100px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>
        </tr>` : ""}
        <!-- Name + title row -->
        <tr>
          <td align="center" style="padding:0 24px 16px;text-align:center;">
            <div style="font-family:${DISPLAY_FONT};font-size:20px;font-weight:700;color:#111111;line-height:1.2;margin-bottom:5px;">${agent.full_name}</div>
            <div style="font-family:${BODY_FONT};font-size:9px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};line-height:1.5;">${agent.title}</div>
          </td>
        </tr>
        <!-- CTA buttons row -->
        <tr>
          <td align="center" style="padding:0 24px 20px;text-align:center;">
            ${agent.phone ? `
            <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 auto 10px;">
              <tr>
                <td align="center" style="background:${DARK};padding:13px 28px;">
                  <a href="tel:${agent.phone.replace(/\D/g,"")}"
                     style="font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;">
                    &#128222;&nbsp; ${agent.phone}
                  </a>
                </td>
              </tr>
            </table>` : ""}
            ${agent.email ? `
            <br/>
            <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 auto;">
              <tr>
                <td align="center" style="background:#f0ede8;border:1px solid #d8d3ca;padding:11px 28px;">
                  <a href="mailto:${agent.email}"
                     style="font-family:${BODY_FONT};font-size:12px;font-weight:600;letter-spacing:1px;color:#444444;text-decoration:none;white-space:nowrap;">
                    &#9993;&nbsp; ${agent.email}
                  </a>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>
        <!-- Logo row -->
        <tr>
          <td align="center" style="padding:14px 24px 22px;border-top:1px solid #e8e3db;text-align:center;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" border="0"
                 style="display:inline-block;width:110px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td bgcolor="${DARK}" class="mobile-pad" style="padding:22px 36px;background-color:${DARK};">
      <div style="font-family:${BODY_FONT};font-size:9px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
      <div style="font-family:${BODY_FONT};font-size:12px;font-weight:300;color:#8aaa96;line-height:1.6;"><a href="https://presaleproperties.com" style="color:#8aaa96;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}</div>
    </td>
  </tr>

  <!-- LEGAL -->
  <tr>
    <td bgcolor="#f8f7f4" class="mobile-pad" style="padding:24px 36px 28px;background-color:#f8f7f4;border-top:1px solid #e8e8e4;">
      <div style="font-family:${BODY_FONT};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#555555;margin-bottom:12px;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:12px;">
        This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E.
      </div>
      <div style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:18px;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="{$unsubscribe}" style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
      </div>
    </td>
  </tr>

</table>
<!-- /Email container -->

</td></tr>
</table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERN / PREMIUM GOLD EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
// Design principles:
//  - Full-bleed hero image (zero margin, 100% width, no container border)
//  - Warm cream (#faf8f4) background with gold (#C9A55A) accent highlights
//  - Huge bold sans-serif headline (42px desktop, 32px mobile)
//  - Gold CTA buttons, premium warm palette throughout
//  - No dark header bar — hero IS the header
//  - Single editorial column, breathing room between sections
// ─────────────────────────────────────────────────────────────────────────────

export function buildLululemonEmailHtml(
  data: PitchDeckEmailData,
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  const ACCENT     = "#C9A55A";
  const DARK       = "#111111";
  const F          = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
  const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

  const phone    = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  const whatsapp = data.ctaWhatsApp || "16722581100";
  const deckLink = (data.projectName || data.developerName) ? (data.deckUrl || "") : "";

  // ── Floor plans ──────────────────────────────────────────────────────────
  const fps = (data.floorPlans || []).filter(fp => fp.url);
  const fpRowsHtml = fps.map(fp => {
    const imgTag = `<img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`;
    return `
    <tr>
      <td style="padding:0 0 24px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border:1px solid #e8e2d6;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${deckLink ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">${imgTag}</a>` : imgTag}
            </td>
          </tr>
          ${(fp.label || fp.sqft || fp.price) ? `
          <tr>
            <td style="padding:16px 20px 20px;border-top:1px solid #e8e2d6;">
              ${fp.label ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${ACCENT};">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0 0 8px 0;font-family:${F};font-size:14px;color:#8a7e6b;">${fp.sqft}${(() => { const psf = calcPsf(fp.price, fp.sqft, fp.exclusive_credit); return psf ? ` · ${psf}/sqft` : ""; })()}</p>` : ""}
              ${fp.price ? `<p style="margin:0;font-family:${F};font-size:26px;font-weight:800;color:${DARK};">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
              ${creditBadgeHtml(fp.exclusive_credit, F)}
            </td>
          </tr>` : ""}
        </table>
      </td>
    </tr>`;
  }).join("");

  // ── Incentives ────────────────────────────────────────────────────────────
  const incentiveLines = (data.incentiveText || "")
    .split("\n").map(l => l.replace(/^[✦•\-–]\s*/, "").trim()).filter(Boolean);

  // ── Body copy ─────────────────────────────────────────────────────────────
  const bodyRows = (data.bodyCopy || "")
    .split("\n").map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (/^uzair\b/i.test(l) && l.split(" ").length <= 3 && !/[,.:!?]/.test(l)) return false;
      return true;
    })
    .map(p => {
      const isList = /^[✦•\-–]/.test(p);
      const html = p
        .replace(/^[✦•\-–]\s*/, "")
        .replace(/\*\*(.+?)\*\*/g, `<strong style="font-family:${F};font-weight:700;color:${DARK};">$1</strong>`)
        .replace(/\*/g, "");
      if (isList) {
        return `
        <tr>
          <td valign="top" width="20" style="padding:0 0 12px 0;vertical-align:top;width:20px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr><td width="6" height="6" style="width:6px;height:6px;background:${ACCENT};border-radius:3px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td>
          <td valign="top" style="padding:0 0 12px 10px;vertical-align:top;">
            <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.7;">${html}</p>
          </td>
        </tr>`;
      }
      return `<tr><td colspan="2" style="padding:0 0 18px 0;">
        <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">${html}</p>
      </td></tr>`;
    }).join("");

  const bodyHtml = bodyRows
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%">${bodyRows}</table>`
    : "";

  const cleanHeadline = (data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"/><!--<![endif]-->
  <title>${data.subjectLine || data.projectName || "New Presale"}</title>
  <link href="${GOOGLE_FONT}" rel="stylesheet"/>
  <style>
    /* Force Apple Mail to respect width */
    :root{color-scheme:light only;}
    body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-width:100%;}
    body{margin:0!important;padding:0!important;background:#faf8f4;width:100%!important;min-width:100%!important;-webkit-text-size-adjust:100%!important;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    /* Apple Mail width fix — forces 100% width rendering */
    u+#body .email-container{width:100%!important;min-width:100%!important;}
    u+#body{min-width:100vw!important;}
    div[style*="margin: 16px 0"]{margin:0!important;}
    @media only screen and (max-width:620px){
      /* True edge-to-edge on iPhone */
      .email-container{width:100%!important;max-width:100%!important;min-width:100%!important;border:none!important;border-radius:0!important;}
      .outer-td{padding:0!important;}
      .content-pad{padding-left:24px!important;padding-right:24px!important;}
      /* Scale headline */
      .hero-headline{font-size:32px!important;line-height:1.15!important;}
      /* Full-width CTA pill */
      .cta-table{width:100%!important;}
      .cta-td{width:100%!important;border-radius:50px!important;padding:18px 24px!important;}
      /* Stats stacking */
      .stat-cell{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #e8e2d6!important;padding:14px 24px!important;text-align:left!important;}
      /* Agent card */
      .agent-logo-cell{display:none!important;}
      /* Force all tables to 100% on mobile */
      table[class="email-container"]{width:100%!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#faf8f4;" id="body">
${data.previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${data.previewText}&zwnj;</span>` : ""}

<!-- OUTER WRAPPER -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;margin:0;padding:0;">
<tr><td class="outer-td" align="center" style="padding:24px 0;">

<!-- EMAIL CONTAINER: max 600px, true full-width on mobile -->
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container"
       style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">

  <!-- ── HERO IMAGE: full-bleed, zero padding ── -->
  ${data.heroImage ? `
  <tr>
    <td style="padding:0;margin:0;line-height:0;font-size:0;">
      ${deckLink
        ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;"><img src="${data.heroImage}" alt="${data.projectName || "New Presale"}" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;" /></a>`
        : `<img src="${data.heroImage}" alt="${data.projectName || "New Presale"}" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`
      }
    </td>
  </tr>` : `
  <!-- No hero: branded header strip -->
  <tr>
    <td class="content-pad" style="background:#111111;padding:32px 40px;">
      <p style="margin:0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
    </td>
  </tr>`}

  <!-- ── HEADLINE BLOCK ── -->
  <tr>
    <td class="content-pad" style="padding:40px 40px 28px;background:#ffffff;">
      <p style="margin:0 0 6px 0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">
        ${data.city ? data.city.toUpperCase() : "PRESALE PROPERTIES"}${data.developerName ? ` &nbsp;·&nbsp; ${data.developerName.toUpperCase()}` : ""}
      </p>
      ${data.projectName ? `<p style="margin:0 0 20px 0;font-family:${F};font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a7e6b;">${data.projectName}</p>` : ""}
      ${cleanHeadline ? `<p class="hero-headline" style="margin:0;font-family:${F};font-size:42px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1.5px;">${cleanHeadline}</p>` : ""}
    </td>
  </tr>

  <!-- ── STATS BAR (optional) ── -->
  ${(data.startingPrice || data.deposit || data.completion) ? `
  <tr>
    <td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;">
        <tr>
          ${data.startingPrice ? `
          <td class="stat-cell" style="padding:18px 20px;border-right:1px solid #e8e2d6;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.startingPrice}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Starting From</p>
          </td>` : ""}
          ${data.deposit ? `
          <td class="stat-cell" style="padding:18px 20px;${data.completion ? `border-right:1px solid #e8e2d6;` : ""}text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.deposit}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Deposit</p>
          </td>` : ""}
          ${data.completion ? `
          <td class="stat-cell" style="padding:18px 20px;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.completion}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── BODY COPY ── -->
  ${bodyHtml ? `
  <tr>
    <td class="content-pad" style="padding:36px 40px 28px;background:#ffffff;">
      ${bodyHtml}
    </td>
  </tr>` : ""}

  ${projectDetailsCta({ projectUrl: data.projectUrl, projectName: data.projectName, developerName: data.developerName, font: F, accent: ACCENT, dark: DARK })}

  <!-- ── WHAT'S INCLUDED ── -->
  ${incentiveLines.length > 0 ? `
  <tr>
    <td class="content-pad" style="padding:0 40px 36px;background:#ffffff;">
      <!-- Section header -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${INCLUDED_GREEN};">WHAT'S INCLUDED</p>
        </td></tr>
      </table>
      <!-- Items grid -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentiveLines.map((item, i) => `
        <tr>
          <td style="padding:0 0 ${i < incentiveLines.length - 1 ? '10' : '0'}px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border-radius:8px;border-left:3px solid ${INCLUDED_GREEN};">
              <tr>
                <td style="padding:14px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td valign="middle" width="28" style="width:28px;vertical-align:middle;">
                        <p style="margin:0;font-size:16px;line-height:1;color:${INCLUDED_GREEN};">✦</p>
                      </td>
                      <td valign="middle" style="vertical-align:middle;">
                        <p style="margin:0;font-family:${F};font-size:14px;font-weight:600;color:${DARK};line-height:1.5;">${item}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}


  ${fps.length > 0 ? `
  <tr>
    <td style="padding:0;border-top:1px solid #e8e2d6;background:#faf8f4;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="content-pad" style="padding:32px 40px 20px;">
            <p style="margin:0 0 6px 0;font-family:${F};font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
            <p style="margin:0;font-family:${F};font-size:26px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.fpHeading || "Available Units"}</p>
          </td>
        </tr>
        <tr>
          <td class="content-pad" style="padding:0 40px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${fpRowsHtml}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

  ${docCtaButtons({ brochureUrl: data.brochureUrl, floorplanUrl: data.floorplanUrl, deckUrl: data.deckUrl, font: F, accent: ACCENT, dark: DARK, style: "pill", showBrochureCta: data.showBrochureCta, showFloorPlansCta: data.showFloorPlansCta })}

  ${(data.showViewMorePlansCta !== false && fps.length > 0 && deckLink && !data.floorplanUrl) ? `
  <!-- ── VIEW DETAILS CTA ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 8px;background:#faf8f4;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="background:#0d1f18;border-radius:50px;padding:14px 36px;text-align:center;">
            <a href="${deckLink}"
               style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;white-space:nowrap;">
              VIEW DETAILS &nbsp;→
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

  ${bookShowingCta({ bookShowingUrl: data.bookShowingUrl, showBookShowingCta: data.showBookShowingCta, font: F, accent: ACCENT, dark: DARK, style: "pill" })}

  ${data.showCallNowCta !== false ? `
  <!-- ── SECONDARY CTA: CALL NOW ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="cta-td" align="center" style="background:#ffffff;border:2px solid ${ACCENT};border-radius:50px;padding:16px 32px;text-align:center;">
            <a href="tel:${phone.replace(/\D/g, "")}"
               style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${DARK};text-decoration:none;display:block;white-space:nowrap;">
              CALL NOW &nbsp; ${phone}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

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
            ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
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
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;·&nbsp; ${agent.phone}` : ""}</p>
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
<!-- /Email container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERN V2 — exact duplicate of Modern (buildLululemonEmailHtml)
// ─────────────────────────────────────────────────────────────────────────────
export function buildModernV2EmailHtml(
  data: PitchDeckEmailData & { loopSlides?: string[] },
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  const ACCENT     = "#C9A55A";
  const DARK       = "#111111";
  const F          = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
  const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

  const phone    = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  const whatsapp = data.ctaWhatsApp || "16722581100";
  const deckLink = (data.projectName || data.developerName) ? (data.deckUrl || "") : "";

  // ── Collect hero slides for carousel ─────────────────────────────────────
  const heroSlides: string[] = [];
  if (data.loopSlides && data.loopSlides.length > 0) {
    heroSlides.push(...data.loopSlides.filter(Boolean));
  }
  if (heroSlides.length === 0 && data.heroImage) {
    heroSlides.push(data.heroImage);
  }

  // ── Carousel CSS (each slide gets its own keyframe for proper cycling) ──
  const slideCount = heroSlides.length;
  const slideDuration = 2; // 2 seconds per slide (visible time)
  const fadeDuration = 0.6; // cross-fade transition
  const totalDuration = slideCount * slideDuration;

  let carouselCss = "";
  if (slideCount > 1) {
    // Each slide gets its own @keyframes: visible for its slot, hidden otherwise
    const allKeyframes = heroSlides.map((_, i) => {
      const showStart = (i / slideCount) * 100;
      const showEnd = ((i + 1) / slideCount) * 100;
      const fadeIn = Math.max(0, showStart - 2);
      const fadeOut = Math.min(100, showEnd + 2);
      return `@keyframes mv2-fade-${i}{` +
        `0%{opacity:${i === 0 ? 1 : 0}} ` +
        `${fadeIn.toFixed(1)}%{opacity:0} ` +
        `${showStart.toFixed(1)}%{opacity:1} ` +
        `${showEnd.toFixed(1)}%{opacity:1} ` +
        `${fadeOut.toFixed(1)}%{opacity:0} ` +
        `100%{opacity:${i === 0 ? 1 : 0}}}`;
    }).join("\n");
    carouselCss = allKeyframes;
  }

  // ── Hero HTML ────────────────────────────────────────────────────────────
  const heroHtml = heroSlides.length > 0 ? (() => {
    if (slideCount === 1) {
      const img = `<img src="${heroSlides[0]}" alt="${data.projectName || "New Presale"}" width="1200" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`;
      return deckLink
        ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">${img}</a>`
        : img;
    }
    const layers = heroSlides.map((src, i) => {
      return `<div style="position:${i === 0 ? "relative" : "absolute"};top:0;left:0;width:100%;${i > 0 ? "opacity:0;" : ""}animation:mv2-fade-${i} ${totalDuration}s infinite ease-in-out;">
        ${deckLink ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">` : ""}
        <img src="${src}" alt="${data.projectName || "New Presale"}" width="1200" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />
        ${deckLink ? "</a>" : ""}
      </div>`;
    }).join("");
    return `<div style="position:relative;overflow:hidden;">${layers}</div>`;
  })() : "";

  // ── Floor plans ──────────────────────────────────────────────────────────
  const fps = (data.floorPlans || []).filter(fp => fp.url);
  const fpRowsHtml = fps.map(fp => {
    const imgTag = `<img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`;
    return `
    <tr>
      <td style="padding:0 0 24px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border:1px solid #e8e2d6;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${deckLink ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">${imgTag}</a>` : imgTag}
            </td>
          </tr>
          ${(fp.label || fp.sqft || fp.price) ? `
          <tr>
            <td style="padding:16px 20px 20px;border-top:1px solid #e8e2d6;">
              ${fp.label ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${ACCENT};">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0 0 8px 0;font-family:${F};font-size:14px;color:#8a7e6b;">${fp.sqft}${(() => { const psf = calcPsf(fp.price, fp.sqft, fp.exclusive_credit); return psf ? ` · ${psf}/sqft` : ""; })()}</p>` : ""}
              ${fp.price ? `<p style="margin:0;font-family:${F};font-size:26px;font-weight:800;color:${DARK};">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
              ${creditBadgeHtml(fp.exclusive_credit, F)}
            </td>
          </tr>` : ""}
        </table>
      </td>
    </tr>`;
  }).join("");

  // ── Incentives ────────────────────────────────────────────────────────────
  const incentiveLines = (data.incentiveText || "")
    .split("\n").map(l => l.replace(/^[✦•\-–]\s*/, "").trim()).filter(Boolean);

  // ── Body copy ─────────────────────────────────────────────────────────────
  const bodyRows = (data.bodyCopy || "")
    .split("\n").map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (/^uzair\b/i.test(l) && l.split(" ").length <= 3 && !/[,.:!?]/.test(l)) return false;
      return true;
    })
    .map(p => {
      const isList = /^[✦•\-–]/.test(p);
      const html = p
        .replace(/^[✦•\-–]\s*/, "")
        .replace(/\*\*(.+?)\*\*/g, `<strong style="font-family:${F};font-weight:700;color:${DARK};">$1</strong>`)
        .replace(/\*/g, "");
      if (isList) {
        return `
        <tr>
          <td valign="top" width="20" style="padding:0 0 12px 0;vertical-align:top;width:20px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr><td width="6" height="6" style="width:6px;height:6px;background:${ACCENT};border-radius:3px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td>
          <td valign="top" style="padding:0 0 12px 10px;vertical-align:top;">
            <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.7;">${html}</p>
          </td>
        </tr>`;
      }
      return `<tr><td colspan="2" style="padding:0 0 18px 0;">
        <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">${html}</p>
      </td></tr>`;
    }).join("");

  const bodyHtml = bodyRows
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%">${bodyRows}</table>`
    : "";

  const cleanHeadline = (data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"/><!--<![endif]-->
  <title>${data.subjectLine || data.projectName || "New Presale"}</title>
  <link href="${GOOGLE_FONT}" rel="stylesheet"/>
  <style>
    :root{color-scheme:light only;}
    body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-width:100%;}
    body{margin:0!important;padding:0!important;background:#faf8f4;width:100%!important;min-width:100%!important;-webkit-text-size-adjust:100%!important;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    u+#body .email-container{width:100%!important;min-width:100%!important;}
    u+#body{min-width:100vw!important;}
    div[style*="margin: 16px 0"]{margin:0!important;}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;max-width:100%!important;min-width:100%!important;border:none!important;border-radius:0!important;}
      .outer-td{padding:0!important;}
      .content-pad{padding-left:24px!important;padding-right:24px!important;}
      .hero-headline{font-size:32px!important;line-height:1.15!important;}
      .cta-table{width:100%!important;}
      .cta-td{width:100%!important;border-radius:50px!important;padding:18px 24px!important;}
      .stat-cell{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #e8e2d6!important;padding:14px 24px!important;text-align:left!important;}
      .agent-logo-cell{display:none!important;}
      table[class="email-container"]{width:100%!important;}
    }
    ${carouselCss}
  </style>
</head>
<body style="margin:0;padding:0;background:#faf8f4;" id="body">
${data.previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${data.previewText}&zwnj;</span>` : ""}

<!-- OUTER WRAPPER -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;margin:0;padding:0;">
<tr><td class="outer-td" align="center" style="padding:24px 0;">

<!-- EMAIL CONTAINER -->
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container"
       style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">

  <!-- ── HERO CAROUSEL ── -->
  ${heroHtml ? `
  <tr>
    <td style="padding:0;margin:0;line-height:0;font-size:0;">
      ${heroHtml}
    </td>
  </tr>` : `
  <tr>
    <td class="content-pad" style="background:#111111;padding:32px 40px;">
      <p style="margin:0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
    </td>
  </tr>`}

  <!-- ── HEADLINE BLOCK ── -->
  <tr>
    <td class="content-pad" style="padding:40px 40px 28px;background:#ffffff;">
      <p style="margin:0 0 6px 0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">
        ${data.city ? data.city.toUpperCase() : "PRESALE PROPERTIES"}${data.developerName ? ` &nbsp;·&nbsp; ${data.developerName.toUpperCase()}` : ""}
      </p>
      ${data.projectName ? `<p style="margin:0 0 20px 0;font-family:${F};font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a7e6b;">${data.projectName}</p>` : ""}
      ${cleanHeadline ? `<p class="hero-headline" style="margin:0;font-family:${F};font-size:42px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1.5px;">${cleanHeadline}</p>` : ""}
    </td>
  </tr>

  <!-- ── STATS BAR ── -->
  ${(data.startingPrice || data.deposit || data.completion) ? `
  <tr>
    <td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;">
        <tr>
          ${data.startingPrice ? `
          <td class="stat-cell" style="padding:18px 20px;border-right:1px solid #e8e2d6;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.startingPrice}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Starting From</p>
          </td>` : ""}
          ${data.deposit ? `
          <td class="stat-cell" style="padding:18px 20px;${data.completion ? `border-right:1px solid #e8e2d6;` : ""}text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.deposit}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Deposit</p>
          </td>` : ""}
          ${data.completion ? `
          <td class="stat-cell" style="padding:18px 20px;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.completion}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── BODY COPY ── -->
  ${bodyHtml ? `
  <tr>
    <td class="content-pad" style="padding:36px 40px 28px;background:#ffffff;">
      ${bodyHtml}
    </td>
  </tr>` : ""}

  ${projectDetailsCta({ projectUrl: data.projectUrl, projectName: data.projectName, developerName: data.developerName, font: F, accent: ACCENT, dark: DARK })}

  ${docCtaButtons({ brochureUrl: data.brochureUrl, floorplanUrl: data.floorplanUrl, deckUrl: data.deckUrl, font: F, accent: ACCENT, dark: DARK, style: "pill", showBrochureCta: data.showBrochureCta, showFloorPlansCta: data.showFloorPlansCta })}

  ${bookShowingCta({ bookShowingUrl: data.bookShowingUrl, showBookShowingCta: data.showBookShowingCta, font: F, accent: ACCENT, dark: DARK, style: "pill" })}

  ${data.showCallNowCta !== false ? `
  <!-- ── SECONDARY CTA: CALL NOW ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="cta-td" align="center" style="background:#ffffff;border:2px solid ${ACCENT};border-radius:50px;padding:16px 32px;text-align:center;">
            <a href="tel:${phone.replace(/\D/g, "")}"
               style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${DARK};text-decoration:none;display:block;white-space:nowrap;">
              CALL NOW &nbsp; ${phone}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

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
            ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
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
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;·&nbsp; ${agent.phone}` : ""}</p>
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

// ─────────────────────────────────────────────────────────────────────────────
// buildEditorialEmailHtml
// Clean editorial layout: rotating hero slideshow, stats bar, body copy, CTAs.
// No floor plans. No "What's Included". Hero links to project URL.
// ─────────────────────────────────────────────────────────────────────────────
export function buildEditorialEmailHtml(
  data: PitchDeckEmailData & { loopSlides?: string[] },
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  const OLIVE    = "#7a8a5a";
  const BROWN    = "#96712e";
  const CREAM    = "#faf8f4";
  const DARK     = "#1a1a1a";
  const BORDER   = "#e8e2d6";
  const F        = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
  const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

  const phone    = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  const whatsapp = data.ctaWhatsApp || "16722581100";
  const projectUrl = data.projectUrl || data.deckUrl || "";

  // ── Collect hero images for rotation ──────────────────────────────────────
  const heroSlides: string[] = [];
  if (data.loopSlides && data.loopSlides.length > 0) {
    heroSlides.push(...data.loopSlides.filter(Boolean));
  }
  if (heroSlides.length === 0 && data.heroImage) {
    heroSlides.push(data.heroImage);
  }

  // ── Body copy ─────────────────────────────────────────────────────────────
  const bodyRows = (data.bodyCopy || "")
    .split("\n").map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (/^uzair\b/i.test(l) && l.split(" ").length <= 3 && !/[,.:!?]/.test(l)) return false;
      return true;
    })
    .map(p => {
      const html = p
        .replace(/^[✦•\-–]\s*/, "")
        .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700;color:${DARK};">$1</strong>`)
        .replace(/\*/g, "");
      return `<p style="margin:0 0 18px 0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">${html}</p>`;
    }).join("");

  const cleanHeadline = (data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "");

  // ── Hero slideshow CSS ────────────────────────────────────────────────────
  const slideCount = heroSlides.length;
  const slideDuration = 5; // seconds per slide
  const totalDuration = slideCount * slideDuration;

  let slideshowCss = "";
  if (slideCount > 1) {
    const keyframes = heroSlides.map((_, i) => {
      const start = (i / slideCount) * 100;
      const hold = ((i + 0.85) / slideCount) * 100;
      const end = ((i + 1) / slideCount) * 100;
      return `${start.toFixed(1)}%{opacity:1} ${hold.toFixed(1)}%{opacity:1} ${end.toFixed(1)}%{opacity:0}`;
    }).join(" ");
    slideshowCss = `@keyframes editorial-fade{${keyframes} 100%{opacity:1}}`;
  }

  // ── Hero HTML ─────────────────────────────────────────────────────────────
  const heroHtml = heroSlides.length > 0 ? (() => {
    if (slideCount === 1) {
      const img = `<img src="${heroSlides[0]}" alt="${data.projectName || "Project"}" width="600" style="display:block;width:100%;height:auto;border:0;" />`;
      return projectUrl
        ? `<a href="${projectUrl}" target="_blank" style="display:block;line-height:0;font-size:0;">${img}</a>`
        : img;
    }
    // Multiple images: CSS crossfade
    const layers = heroSlides.map((src, i) => {
      const delay = i * slideDuration;
      return `<div style="position:${i === 0 ? "relative" : "absolute"};top:0;left:0;width:100%;${i > 0 ? "opacity:0;" : ""}animation:editorial-fade ${totalDuration}s infinite;animation-delay:${delay}s;">
        ${projectUrl ? `<a href="${projectUrl}" target="_blank" style="display:block;line-height:0;font-size:0;">` : ""}
        <img src="${src}" alt="${data.projectName || "Project"}" width="600" style="display:block;width:100%;height:auto;border:0;" />
        ${projectUrl ? "</a>" : ""}
      </div>`;
    }).join("");
    return `<div style="position:relative;overflow:hidden;">${layers}</div>`;
  })() : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"/><!--<![endif]-->
  <title>${data.subjectLine || data.projectName || "New Presale"}</title>
  <link href="${GOOGLE_FONT}" rel="stylesheet"/>
  <style>
    :root{color-scheme:light only;}
    body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-width:100%;}
    body{margin:0!important;padding:0!important;background:${CREAM};width:100%!important;min-width:100%!important;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    u+#body .email-container{width:100%!important;min-width:100%!important;}
    u+#body{min-width:100vw!important;}
    div[style*="margin: 16px 0"]{margin:0!important;}
    ${slideshowCss}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;max-width:100%!important;min-width:100%!important;border:none!important;border-radius:0!important;}
      .outer-td{padding:0!important;}
      .content-pad{padding-left:24px!important;padding-right:24px!important;}
      .hero-headline{font-size:28px!important;line-height:1.15!important;}
      .cta-table{width:100%!important;}
      .cta-td{width:100%!important;border-radius:50px!important;padding:18px 24px!important;}
      .stat-cell{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid ${BORDER}!important;padding:14px 24px!important;text-align:left!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CREAM};" id="body">
${data.previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${data.previewText}&zwnj;</span>` : ""}

<!-- OUTER WRAPPER -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};margin:0;padding:0;">
<tr><td class="outer-td" align="center" style="padding:24px 0;">

<!-- EMAIL CONTAINER -->
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container"
       style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">

  <!-- ── BRANDED HEADER ── -->
  <tr>
    <td style="background:${OLIVE};padding:28px 40px 24px;" class="content-pad">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td>
            ${data.projectName ? `<p style="margin:0;font-family:${F};font-size:28px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.5px;">${data.projectName.toUpperCase()}</p>` : ""}
            ${data.developerName ? `<p style="margin:6px 0 0 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);">BY ${data.developerName.toUpperCase()}</p>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── HERO IMAGE (rotates if multiple) ── -->
  ${heroHtml ? `
  <tr>
    <td style="padding:0;margin:0;line-height:0;font-size:0;">
      ${heroHtml}
    </td>
  </tr>` : ""}

  <!-- ── STATS BAR ── -->
  ${(data.startingPrice || data.deposit || data.completion) ? `
  <tr>
    <td style="padding:0;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
        <tr>
          ${data.startingPrice ? `
          <td class="stat-cell" style="padding:18px 20px;border-right:1px solid ${BORDER};text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};letter-spacing:-0.3px;">${data.startingPrice}</p>
            <p style="margin:0;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${OLIVE};">Starting From</p>
          </td>` : ""}
          ${data.deposit ? `
          <td class="stat-cell" style="padding:18px 20px;${data.completion ? `border-right:1px solid ${BORDER};` : ""}text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};letter-spacing:-0.3px;">${data.deposit}</p>
            <p style="margin:0;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${OLIVE};">Deposit</p>
          </td>` : ""}
          ${data.completion ? `
          <td class="stat-cell" style="padding:18px 20px;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};letter-spacing:-0.3px;">${data.completion}</p>
            <p style="margin:0;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${OLIVE};">Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── HEADLINE ── -->
  <tr>
    <td class="content-pad" style="padding:36px 40px 8px;background:${CREAM};">
      ${cleanHeadline ? `<p class="hero-headline" style="margin:0;font-family:${F};font-size:32px;font-weight:800;color:${BROWN};line-height:1.15;letter-spacing:-1px;">${cleanHeadline}</p>` : ""}
    </td>
  </tr>

  <!-- ── BODY COPY ── -->
  ${bodyRows ? `
  <tr>
    <td class="content-pad" style="padding:24px 40px 8px;background:${CREAM};">
      ${bodyRows}
    </td>
  </tr>` : ""}

  <!-- ── DOCUMENT CTAs ── -->
  ${docCtaButtons({ brochureUrl: data.brochureUrl, floorplanUrl: data.floorplanUrl, deckUrl: data.deckUrl, font: F, accent: OLIVE, dark: DARK, style: "outline", showBrochureCta: data.showBrochureCta, showFloorPlansCta: data.showFloorPlansCta })}

  ${(!data.brochureUrl && !data.floorplanUrl && !data.deckUrl && projectUrl) ? `
  <!-- ── PROJECT DETAILS CTA (fallback) ── -->
  <tr>
    <td class="content-pad" style="padding:28px 40px 8px;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid ${OLIVE};border-radius:6px;overflow:hidden;">
        <tr>
          <td align="center" style="padding:16px 24px;background:#ffffff;">
            <a href="${projectUrl}" target="_blank"
               style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${OLIVE};text-decoration:none;display:block;line-height:1;">
              VIEW PROJECT DETAILS &nbsp;→
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

  ${bookShowingCta({ bookShowingUrl: data.bookShowingUrl, showBookShowingCta: data.showBookShowingCta, font: F, accent: OLIVE, dark: DARK, style: "outline" })}

  ${data.showCallNowCta !== false ? `
  <!-- ── CTA: CALL NOW ── -->
  <tr>
    <td class="content-pad" style="padding:28px 40px 36px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="cta-td" align="center" style="background:${BROWN};border-radius:50px;padding:18px 32px;text-align:center;">
            <a href="tel:${phone.replace(/\D/g, "")}"
               style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${DARK};text-decoration:none;display:block;white-space:nowrap;">
              CALL NOW &nbsp; ${phone}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── DIVIDER ── -->
  <tr><td style="height:2px;background:${OLIVE};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>

  <!-- ── AGENT CARD ── -->
  <tr>
    <td style="padding:0;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${agent.photo_url ? `
        <tr>
          <td align="center" style="padding:28px 24px 12px;">
            ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${OLIVE};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
          </td>
        </tr>` : ""}
        <tr>
          <td align="center" style="padding:0 24px 8px;text-align:center;">
            <p style="margin:0 0 4px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${agent.full_name}</p>
            <p style="margin:0 0 12px 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${OLIVE};">${agent.title}</p>
            ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
            ${agent.email ? `<p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;"><a href="mailto:${agent.email}" style="color:#8a7e6b;text-decoration:none;">${agent.email}</a></p>` : ""}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px 24px;border-top:1px solid ${BORDER};text-align:center;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" style="display:inline-block;width:110px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td class="content-pad" style="padding:20px 40px;background:${DARK};">
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${OLIVE};">PRESALE PROPERTIES &nbsp;·&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;·&nbsp; ${agent.phone}` : ""}</p>
    </td>
  </tr>

  <!-- ── LEGAL ── -->
  <tr>
    <td class="content-pad" style="padding:20px 40px 24px;background:${CREAM};border-top:1px solid ${BORDER};">
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
<!-- /Email container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildPitchDeckEmailHtmlLofty
// Fluid hybrid layout:
//  - Container uses width="100%" + max-width:600px inline → caps at 600px on
//    desktop, collapses to full screen on mobile — no media queries needed.
//  - Stats bar: 3 side-by-side cols using percentage widths (stays side-by-side
//    on desktop AND mobile — no stacking needed, each cell is compact).
//  - All other sections single-column full-width.
//  - Includes <style> block with media queries as a bonus for clients that keep
//    them (Gmail iOS, Apple Mail). If Lofty strips it, the fluid layout still
//    works correctly.
// ─────────────────────────────────────────────────────────────────────────────
export function buildPitchDeckEmailHtmlLofty(
  data: PitchDeckEmailData,
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  // ─── Constants ────────────────────────────────────────────────────────────
  const ACCENT      = "#C9A55A";
  const DARK        = "#0d1f18";
  const BODY_BG     = "#f0ede8";
  const FONT_STACK  = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
  const F           = `font-family:${FONT_STACK};`;
  const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

  const phone      = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  
  const locationLine = data.city ? data.city.toUpperCase() : "";
  const byLine       = data.developerName ? `by ${data.developerName}` : "";
  const deckLink     = (data.projectName || data.developerName) ? (data.deckUrl || "") : "";
  const fps          = (data.floorPlans || []).filter(fp => fp.url);

  // ─── Body copy renderer ───────────────────────────────────────────────────
  // Strips bare name sign-offs, renders list items and bold markers.
  const bodyRows = (data.bodyCopy || "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (/^uzair\b/i.test(l) && l.split(" ").length <= 3 && !/[,.:!?]/.test(l)) return false;
      return true;
    })
    .map(p => {
      const isList = /^[✦•\-–]/.test(p);
      const html = p
        .replace(/^[✦•\-–]\s*/, "")
        .replace(/\*\*(.+?)\*\*/g, `<strong style="${F}font-weight:600;color:#222222;">$1</strong>`)
        .replace(/\*/g, "");
      if (isList) {
        return `
        <tr>
          <td class="bullet-dot" valign="top" width="32" style="padding:0 0 10px 20px;vertical-align:top;width:32px;${F}font-size:15px;line-height:1.65;color:${ACCENT};">&#8226;</td>
          <td class="bullet-text" valign="top" style="padding:0 0 10px 10px;vertical-align:top;">
            <p style="margin:0;${F}font-size:14px;color:#444444;line-height:1.75;">${html}</p>
          </td>
        </tr>`;
      }
      return `
        <tr><td colspan="2" style="padding:0 0 14px 0;">
          <p style="margin:0;${F}font-size:14px;color:#444444;line-height:1.75;">${html}</p>
        </td></tr>`;
    }).join("");

  const bodyHtml = bodyRows
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%">${bodyRows}</table>`
    : "";

  // ─── Stats bar (mobile-first: stacked vertically, no media queries needed) ─
  const stats = [
    data.startingPrice ? { val: data.startingPrice, label: "Starting Price" }    : null,
    data.deposit       ? { val: data.deposit,       label: "Deposit Structure" } : null,
    data.completion    ? { val: data.completion,    label: "Est. Completion" }   : null,
  ].filter(Boolean) as { val: string; label: string }[];

  const statsHtml = stats.length > 0 ? `
  <tr>
    <td style="background:#f7f5f1;border-bottom:1px solid #e8e3db;padding:16px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${stats.map((s, i) => `
        <tr>
          <td valign="top"
              style="padding:${i > 0 ? "12px" : "0"} 0 0 0;text-align:left;vertical-align:top;">
            <p style="margin:0;${F}font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#aaaaaa;">${s.label}</p>
            <p style="margin:3px 0 0 0;${F}font-size:20px;font-weight:700;color:#111111;line-height:1.2;letter-spacing:-0.3px;">${s.val}</p>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : "";

  // ─── Info rows ────────────────────────────────────────────────────────────
  const infoRowsFiltered = (data.infoRows || []).filter((r: string) => r.includes("|"));
  const infoRowsHtml = infoRowsFiltered.length > 0 ? `
  <tr>
    <td style="padding:20px 24px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e8e3db;">
        ${infoRowsFiltered.map((row: string, i: number) => {
          const [label, value] = row.split("|").map((s: string) => s.trim());
          const bb = i < infoRowsFiltered.length - 1 ? "border-bottom:1px solid #e8e3db;" : "";
          return `<tr>
             <td width="45%" style="width:45%;padding:10px 16px;background:#f7f5f1;border-right:1px solid #e8e3db;${bb}vertical-align:top;">
               <p style="margin:0;${F}font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">${label}</p>
             </td>
             <td style="padding:10px 16px;background:#ffffff;${bb}vertical-align:top;">
               <p style="margin:0;${F}font-size:13px;font-weight:600;color:#222222;">${value}</p>
            </td>
          </tr>`;
        }).join("")}
      </table>
    </td>
  </tr>` : "";

  // ─── Floor plan cards ────────────────────────────────────────────────────
  const fpHeading    = data.fpHeading    || "Available Floor Plans";
  const fpSubheading = data.fpSubheading || "Limited units remaining — exclusive pricing for selected buyers";

  const fpRowsHtml = fps.map(fp => {
    const imgTag = `<img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="552"
      style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`;
    return `
    <tr>
      <td style="padding:0 0 20px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:#0f2920;border:1px solid #2a4a38;">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${deckLink ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">${imgTag}</a>` : imgTag}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px 18px;">
              ${fp.label ? `<p style="margin:0 0 4px 0;${F}font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${ACCENT};">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0 0 8px 0;${F}font-size:12px;color:#8aaa96;">${fp.sqft}${(() => { const psf = calcPsf(fp.price, fp.sqft, fp.exclusive_credit); return psf ? ` · ${psf}/sqft` : ""; })()}</p>` : ""}
              ${fp.price ? `<p style="margin:0 0 10px 0;${F}font-size:22px;font-weight:700;color:#ffffff;">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
              ${creditBadgeHtml(fp.exclusive_credit, F.replace(/font-family:/,"").replace(/;$/,""))}
              ${deckLink ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0;">
                <a href="${deckLink}" target="_blank"
                   style="${F}font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};text-decoration:none;">
                  View Full Details &#8594;
                </a>
              </td></tr></table>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");

  // ─── What's included ─────────────────────────────────────────────────────
  const incentiveLines = (data.incentiveText || "")
    .split("\n").map((l: string) => l.replace(/^[✦•\-–]\s*/, "").trim()).filter(Boolean);
  const includedItems: string[] = incentiveLines.length > 0
    ? incentiveLines
    : [data.parkingIncluded, data.lockerIncluded].filter(Boolean) as string[];

  // ─── HTML ─────────────────────────────────────────────────────────────────
  // ─── HTML (Lofty-safe: NO <style> block, mobile-first inline styles) ────
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${data.subjectLine || `${data.projectName} — Exclusive Presale Details`}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <link href="${GOOGLE_FONT}" rel="stylesheet" type="text/css" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" id="body">
${data.previewText ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${data.previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>` : ""}
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;width:100%;background-color:#ffffff;">
<tr><td align="center" valign="top" style="padding:0;margin:0;">
<!--[if mso]><table align="center" border="0" cellspacing="0" cellpadding="0" width="414"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%"
       style="max-width:414px;width:100%;background-color:#ffffff;border:none;border-collapse:collapse;">

        <!-- ── HEADER ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 28px 20px 24px;">
            <p style="margin: 0 0 6px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${ACCENT};">PRESALE PROPERTIES</p>
            <p style="margin: 0 0 8px 0; ${F} font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.15; letter-spacing: -0.5px;">${data.projectName || "New Presale Release"}</p>
            ${byLine ? `<p style="margin: 0 0 10px 0; ${F} font-size: 11px; color: #7a9a86;">${byLine}</p>` : ""}
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="32" height="2" style="width: 32px; height: 2px; background-color: ${ACCENT}; font-size: 0; line-height: 0;">&nbsp;</td>
                <td width="8" style="width: 8px; font-size: 0;">&nbsp;</td>
                <td width="8" height="2" style="width: 8px; height: 2px; background-color: ${ACCENT}; opacity: 0.4; font-size: 0; line-height: 0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── LOCATION BANNER ── -->
        ${locationLine ? `
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${ACCENT}; padding: 9px 20px;">
            <p style="margin: 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #ffffff;">${locationLine}</p>
          </td>
        </tr>` : ""}

        <!-- ── HERO IMAGE ── -->
        ${data.heroImage ? `
        <tr>
          <td valign="top" style="padding: 0; font-size: 0; line-height: 0;">
            ${deckLink
              ? `<a href="${deckLink}" target="_blank" style="display: block; font-size: 0; line-height: 0;"><img src="${data.heroImage}" alt="${data.projectName}" width="414" style="display: block; width: 100%; max-width: 414px; height: auto; border: 0;" /></a>`
              : `<img src="${data.heroImage}" alt="${data.projectName}" width="414" style="display: block; width: 100%; max-width: 414px; height: auto; border: 0;" />`}
          </td>
        </tr>` : ""}

        <!-- ── STATS BAR ── -->
        ${statsHtml}

        <!-- ── INFO ROWS ── -->
        ${infoRowsHtml}

        <!-- ── BODY COPY ── -->
        <tr>
           <td valign="top" style="padding: 32px 20px 24px; background-color: #ffffff;">
            ${data.headline ? `
            <p class="hero-text" style="margin: 0 0 16px 0; ${F} font-size: 26px; font-weight: 800; color: ${DARK}; line-height: 1.2; letter-spacing: -0.5px;">${(data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "")}</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
              <tr><td width="40" height="3" style="width: 40px; height: 3px; background-color: ${ACCENT}; font-size: 0; line-height: 0;">&nbsp;</td></tr>
            </table>` : ""}
            ${bodyHtml}
          </td>
        </tr>

        ${projectDetailsCta({ projectUrl: data.projectUrl, projectName: data.projectName, developerName: data.developerName, font: F.replace(/font-family:/,"").replace(/;$/,""), accent: ACCENT, dark: DARK })}

        <!-- ── WHAT'S INCLUDED ── -->
        ${includedItems.length > 0 ? `
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 22px 20px;">
            <p style="margin: 0 0 14px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${INCLUDED_GREEN};">WHAT'S INCLUDED</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${includedItems.map((item: string) => `
              <tr>
                <td width="16" valign="top" style="padding: 0 0 10px 0; width: 16px; vertical-align: top;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr><td width="5" height="5" style="width: 5px; height: 5px; background-color: ${INCLUDED_GREEN}; font-size: 0; line-height: 0; margin-top: 7px;">&nbsp;</td></tr>
                  </table>
                </td>
                <td valign="top" style="padding: 0 0 10px 12px; vertical-align: top;">
                  <p style="margin: 0; ${F} font-size: 13px; font-weight: 500; color: #c8d8cc; line-height: 1.7;">${item}</p>
                </td>
              </tr>`).join("")}
            </table>
          </td>
        </tr>` : ""}

        <!-- ── FLOOR PLANS HEADER ── -->
        ${fps.length > 0 ? `
        <tr>
          <td height="3" style="height: 3px; background-color: ${ACCENT}; font-size: 0; line-height: 0; padding: 0;">&nbsp;</td>
        </tr>
        <tr>
           <td valign="top"
               style="background-color: ${DARK}; padding: 24px 20px 8px;">
             <p style="margin: 0 0 4px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${ACCENT};">FLOOR PLANS</p>
             <p style="margin: 0 0 6px 0; ${F} font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.15; letter-spacing: -0.3px;">${fpHeading}</p>
             <p style="margin: 0; ${F} font-size: 12px; color: #8aaa96; line-height: 1.6;">${fpSubheading}</p>
           </td>
        </tr>

        <!-- ── FLOOR PLAN CARDS ── -->
        <tr>
           <td valign="top"
               style="background-color: ${DARK}; padding: 12px 16px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${fpRowsHtml}
            </table>
          </td>
        </tr>

        ` : ""}

        <!-- ── CALL NOW CTA ── -->
        <tr>
          <td valign="top"
              style="background-color: #f7f5f1; padding: 28px 20px 28px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" valign="top"
                    style="background-color: ${DARK}; padding: 18px 24px; text-align: center;">
                  <a href="tel:${phone.replace(/\D/g, "")}"
                     style="${F} font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #ffffff; text-decoration: none; display: block; line-height: 1; white-space: nowrap;">
                    &#128222;&nbsp; CALL NOW &mdash; ${phone}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin: 12px 0 0 0; ${F} font-size: 11px; color: #999999; text-align: center; line-height: 1.5;">
              Questions? Reply to this email or call ${phone} directly.
            </p>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr><td style="height:1px;font-size:0;line-height:0;background:#ece8e0;padding:0;margin:0;">&nbsp;</td></tr>

        <!-- ── AGENT CARD (mobile-first stacked layout) ── -->
        <tr>
          <td style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${agent.photo_url ? `
              <tr>
                <td align="center" style="padding:28px 24px 14px;text-align:center;">
                  ${getAgentWebsiteUrl(agent.full_name) ? `<a href="${getAgentWebsiteUrl(agent.full_name)}" target="_blank" style="text-decoration:none;">` : ""}<img src="${agent.photo_url}" alt="${agent.full_name}" width="100" height="100" border="0"
                       style="display:inline-block;width:100px;height:100px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />${getAgentWebsiteUrl(agent.full_name) ? `</a>` : ""}
                </td>
              </tr>` : ""}
              <tr>
                <td align="center" style="padding:0 24px 16px;text-align:center;">
                  <div style="${F}font-size:20px;font-weight:700;color:#111111;line-height:1.2;margin-bottom:5px;">${agent.full_name}</div>
                  <div style="${F}font-size:9px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};line-height:1.5;">${agent.title}</div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 24px 20px;text-align:center;">
                  ${agent.phone ? `
                  <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 auto 10px;">
                    <tr>
                      <td align="center" style="background:${DARK};padding:13px 28px;">
                        <a href="tel:${agent.phone.replace(/\D/g,"")}"
                           style="${F}font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;">
                          &#128222;&nbsp; ${agent.phone}
                        </a>
                      </td>
                    </tr>
                  </table>` : ""}
                  ${agent.email ? `
                  <br/>
                  <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 auto;">
                    <tr>
                      <td align="center" style="background:#f0ede8;border:1px solid #d8d3ca;padding:11px 28px;">
                        <a href="mailto:${agent.email}"
                           style="${F}font-size:12px;font-weight:600;letter-spacing:1px;color:#444444;text-decoration:none;white-space:nowrap;">
                          &#9993;&nbsp; ${agent.email}
                        </a>
                      </td>
                    </tr>
                  </table>` : ""}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:14px 24px 22px;border-top:1px solid #e8e3db;text-align:center;">
                  <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" border="0"
                       style="display:inline-block;width:110px;height:auto;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td valign="top"
              style="background-color: ${DARK}; padding: 20px 20px;">
            <p style="margin: 0 0 6px 0; ${F} font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: ${ACCENT}; line-height: 1.5;">
              PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}
            </p>
            <p style="margin: 0; ${F} font-size: 12px; font-weight: 300; color: #8aaa96; line-height: 1.6;">
              <a href="https://presaleproperties.com" style="color: #8aaa96; text-decoration: none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}
            </p>
          </td>
        </tr>

        <!-- ── LEGAL ── -->
        <tr>
          <td valign="top"
              style="background-color: #f8f7f4; padding: 24px 20px 28px; border-top: 1px solid #e8e8e4;">
            <p style="margin: 0 0 10px 0; ${F} font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #555555; line-height: 1.4;">L E G A L &nbsp; D I S C L A I M E R</p>
            <p style="margin: 0 0 10px 0; ${F} font-size: 11px; font-weight: 300; color: #888888; line-height: 1.8;">
              This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer&rsquo;s agents &mdash; we represent <strong style="${F} font-weight: 500; color: #666666;">you</strong>, not the developer. This is <strong style="${F} font-weight: 500; color: #666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E.
            </p>
            <p style="margin: 0 0 16px 0; ${F} font-size: 11px; font-weight: 300; color: #888888; line-height: 1.8;">
              You are receiving this because you opted in to presale updates from Presale Properties. Per Canada&rsquo;s Anti-Spam Legislation (CASL), you may withdraw consent at any time.
            </p>
            <p style="margin: 0;">
              <a href="#unsubscribe_url#" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">Unsubscribe</a>
              <span style="color: #cccccc; margin: 0 8px;">&middot;</span>
              <a href="#update_preferences_url#" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">Update Preferences</a>
              <span style="color: #cccccc; margin: 0 8px;">&middot;</span>
              <a href="#view_in_browser_url#" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">View in Browser</a>
            </p>
          </td>
        </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAILERLITE-OPTIMIZED EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
// Design principles:
//  - Zero <style> blocks — MailerLite's custom HTML block strips them
//  - 100% inline styles, table-based layout
//  - MailerLite merge tags: {$unsubscribe}, {$email}, {$name}
//  - Text in simple containers so MailerLite's editor can select/edit them
//  - Fixed 600px container (MailerLite handles responsive wrapping)
//  - No media queries
// ─────────────────────────────────────────────────────────────────────────────

export function buildMailerLiteEmailHtml(
  data: PitchDeckEmailData,
  agent: AgentInfo = DEFAULT_AGENT,
): string {
  // ── Exact replica of buildLululemonEmailHtml (modern/premium gold template)
  //    with MailerLite merge tags for unsubscribe/preferences/browser view.
  const ACCENT     = "#C9A55A";
  const DARK       = "#111111";
  const F          = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
  const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

  const phone    = data.ctaPhone    || agent.phone    || DEFAULT_AGENT.phone;
  const whatsapp = data.ctaWhatsApp || "16722581100";
  const deckLink = (data.projectName || data.developerName) ? (data.deckUrl || "") : "";

  // ── Floor plans ──
  const fps = (data.floorPlans || []).filter(fp => fp.url);
  const fpRowsHtml = fps.map(fp => {
    const imgTag = `<img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`;
    return `
    <tr>
      <td style="padding:0 0 24px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border:1px solid #e8e2d6;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${deckLink ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;">${imgTag}</a>` : imgTag}
            </td>
          </tr>
          ${(fp.label || fp.sqft || fp.price) ? `
          <tr>
            <td style="padding:16px 20px 20px;border-top:1px solid #e8e2d6;">
              ${fp.label ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${ACCENT};">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0 0 8px 0;font-family:${F};font-size:14px;color:#8a7e6b;">${fp.sqft}${(() => { const psf = calcPsf(fp.price, fp.sqft, fp.exclusive_credit); return psf ? ` · ${psf}/sqft` : ""; })()}</p>` : ""}
              ${fp.price ? `<p class="fp-price" style="margin:0;font-family:${F};font-size:26px;font-weight:800;color:${DARK};">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
              ${creditBadgeHtml(fp.exclusive_credit, F)}
            </td>
          </tr>` : ""}
        </table>
      </td>
    </tr>`;
  }).join("");

  // ── Incentives ──
  const incentiveLines = (data.incentiveText || "")
    .split("\n").map(l => l.replace(/^[✦•\-–]\s*/, "").trim()).filter(Boolean);

  // ── Body copy ──
  const bodyRows = (data.bodyCopy || "")
    .split("\n").map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (/^uzair\b/i.test(l) && l.split(" ").length <= 3 && !/[,.:!?]/.test(l)) return false;
      return true;
    })
    .map(p => {
      const isList = /^[✦•\-–]/.test(p);
      const html = p
        .replace(/^[✦•\-–]\s*/, "")
        .replace(/\*\*(.+?)\*\*/g, `<strong style="font-family:${F};font-weight:700;color:${DARK};">$1</strong>`)
        .replace(/\*/g, "");
      if (isList) {
        return `
        <tr>
          <td valign="top" width="20" style="padding:0 0 12px 0;vertical-align:top;width:20px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr><td width="6" height="6" style="width:6px;height:6px;background:${ACCENT};border-radius:3px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td>
          <td valign="top" style="padding:0 0 12px 10px;vertical-align:top;">
            <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.7;">${html}</p>
          </td>
        </tr>`;
      }
      return `<tr><td colspan="2" style="padding:0 0 18px 0;">
        <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">${html}</p>
      </td></tr>`;
    }).join("");

  const bodyHtml = bodyRows
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%">${bodyRows}</table>`
    : "";

  const cleanHeadline = (data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<title>${data.subjectLine || data.projectName || "New Presale"}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="${GOOGLE_FONT}" rel="stylesheet"/>
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  body{margin:0!important;padding:0!important;background:#faf8f4;}
  a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
  u+#body a{color:inherit!important;text-decoration:none!important;}
  #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
  @media only screen and (max-width:620px){
    .email-container{width:100%!important;max-width:100%!important;border:none!important;}
    .outer-td{padding:0!important;}
    .content-pad{padding-left:24px!important;padding-right:24px!important;}
    .hero-headline{font-size:32px!important;line-height:1.15!important;}
    .cta-table{width:100%!important;}
    .cta-td{width:100%!important;border-radius:50px!important;padding:18px 24px!important;}
    .stat-cell{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #e8e2d6!important;padding:14px 24px!important;text-align:left!important;}
    .stat-cell:last-child{border-bottom:none!important;}
    .fp-price{font-size:22px!important;}
    .agent-logo-cell{display:none!important;}
    .footer-pad{padding:16px 24px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#faf8f4;" id="body">
${data.previewText ? `<span style="display:none;font-size:1px;color:#faf8f4;max-height:0;overflow:hidden;mso-hide:all;">${data.previewText}${"&zwnj;&nbsp;".repeat(30)}</span>` : ""}

<!-- OUTER WRAPPER -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;margin:0;padding:0;" role="presentation">
<tr><td class="outer-td" align="center" style="padding:24px 0;">

<!-- EMAIL CONTAINER -->
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container"
       style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;" role="presentation">

  <!-- ── HERO IMAGE ── -->
  ${data.heroImage ? `
  <tr>
    <td style="padding:0;margin:0;line-height:0;font-size:0;">
      ${deckLink
        ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;"><img src="${data.heroImage}" alt="${data.projectName || "New Presale"}" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;" /></a>`
        : `<img src="${data.heroImage}" alt="${data.projectName || "New Presale"}" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />`
      }
    </td>
  </tr>` : `
  <!-- No hero: branded header strip -->
  <tr>
    <td class="content-pad" style="background:${DARK};padding:32px 40px;">
      <p style="margin:0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
    </td>
  </tr>`}

  <!-- ── HEADLINE BLOCK ── -->
  <tr>
    <td class="content-pad" style="padding:40px 40px 28px;background:#ffffff;">
      <p style="margin:0 0 6px 0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">
        ${data.city ? data.city.toUpperCase() : "PRESALE PROPERTIES"}${data.developerName ? ` &nbsp;·&nbsp; ${data.developerName.toUpperCase()}` : ""}
      </p>
      ${data.projectName ? `<p style="margin:0 0 20px 0;font-family:${F};font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a7e6b;">${data.projectName}</p>` : ""}
      ${cleanHeadline ? `<p class="hero-headline" style="margin:0;font-family:${F};font-size:42px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1.5px;">${cleanHeadline}</p>` : ""}
    </td>
  </tr>

  <!-- ── STATS BAR ── -->
  ${(data.startingPrice || data.deposit || data.completion) ? `
  <tr>
    <td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;" role="presentation">
        <tr>
          ${data.startingPrice ? `
          <td class="stat-cell" style="padding:18px 20px;border-right:1px solid #e8e2d6;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.startingPrice}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Starting From</p>
          </td>` : ""}
          ${data.deposit ? `
          <td class="stat-cell" style="padding:18px 20px;${data.completion ? `border-right:1px solid #e8e2d6;` : ""}text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.deposit}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Deposit</p>
          </td>` : ""}
          ${data.completion ? `
          <td class="stat-cell" style="padding:18px 20px;text-align:left;vertical-align:middle;">
            <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.completion}</p>
            <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── BODY COPY ── -->
  ${bodyHtml ? `
  <tr>
    <td class="content-pad" style="padding:36px 40px 28px;background:#ffffff;">
      ${bodyHtml}
    </td>
  </tr>` : ""}

  ${projectDetailsCta({ projectUrl: data.projectUrl, projectName: data.projectName, developerName: data.developerName, font: F, accent: ACCENT, dark: DARK })}

  <!-- ── WHAT'S INCLUDED ── -->
  ${incentiveLines.length > 0 ? `
  <tr>
    <td class="content-pad" style="padding:0 40px 36px;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${INCLUDED_GREEN};">WHAT'S INCLUDED</p>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentiveLines.map((item, i) => `
        <tr>
          <td style="padding:0 0 ${i < incentiveLines.length - 1 ? '10' : '0'}px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border-radius:8px;border-left:3px solid ${INCLUDED_GREEN};">
              <tr>
                <td style="padding:14px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td valign="middle" width="28" style="width:28px;vertical-align:middle;">
                        <p style="margin:0;font-size:16px;line-height:1;color:${INCLUDED_GREEN};">&#10022;</p>
                      </td>
                      <td valign="middle" style="vertical-align:middle;">
                        <p style="margin:0;font-family:${F};font-size:14px;font-weight:600;color:${DARK};line-height:1.5;">${item}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ── FLOOR PLANS ── -->
  ${fps.length > 0 ? `
  <tr>
    <td style="padding:0;border-top:1px solid #e8e2d6;background:#faf8f4;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="content-pad" style="padding:32px 40px 20px;">
            <p style="margin:0 0 6px 0;font-family:${F};font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
            <p style="margin:0;font-family:${F};font-size:26px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${data.fpHeading || "Available Units"}</p>
          </td>
        </tr>
        <tr>
          <td class="content-pad" style="padding:0 40px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${fpRowsHtml}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ── PRIMARY CTA: I'M INTERESTED ── -->
  <tr>
    <td class="content-pad" style="padding:28px 40px 14px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
        <tr>
          <td class="cta-td" align="center" style="background:${ACCENT};border-radius:50px;padding:18px 32px;text-align:center;">
            <a href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in ${data.projectName || "this presale"}. Can you send me more details?`)}"
               style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;white-space:nowrap;">
              I'M INTERESTED
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${bookShowingCta({ bookShowingUrl: data.bookShowingUrl, showBookShowingCta: data.showBookShowingCta, font: F, accent: ACCENT, dark: DARK, style: "pill" })}

  <!-- ── SECONDARY CTA: CALL NOW ── -->
  <tr>
    <td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
        <tr>
          <td class="cta-td" align="center" style="background:#ffffff;border:2px solid ${ACCENT};border-radius:50px;padding:16px 32px;text-align:center;">
            <a href="tel:${phone.replace(/\D/g, "")}"
               style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${DARK};text-decoration:none;display:block;white-space:nowrap;">
              CALL NOW &nbsp; ${phone}
            </a>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
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
            ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
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
    <td class="content-pad footer-pad" style="padding:20px 40px;background:${DARK};">
      <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${data.city ? `${data.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
      <p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}</p>
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
        <span style="color:#dddddd;margin:0 8px;">&middot;</span>
        <a href="https://presaleproperties.com" style="font-family:${F};font-size:11px;color:#aaaaaa;text-decoration:underline;">Visit Website</a>
      </p>
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
