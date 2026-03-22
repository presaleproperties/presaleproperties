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
  /** Additional info rows rendered as a secondary stats bar. Each entry: "Label|Value" */
  infoRows?: string[];
  /** Image cards rendered below the What's Included section */
  imageCards?: ImageCardEntry[];
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

  <!-- ─── INCENTIVES (conditional) ─── -->
  ${incentives.length > 0 ? `
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 16px 0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentives.map(item => `
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${ACCENT};margin-top:7px;"></div>
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
      <!-- Primary CTA: VIEW PLANS — full gold fill -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr>
          <td align="center" style="background:${ACCENT};padding:18px 24px;text-align:center;">
            <a href="${plansPricingUrl}"
               style="font-family:${bodyFont};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#0d1f18;text-decoration:none;display:block;line-height:1;">
              VIEW PLANS &amp; PRICING &nbsp;→
            </a>
          </td>
        </tr>
      </table>
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
            <img src="${agent.photo_url}" alt="${agent.full_name}" width="60" height="60" border="0" class="agent-photo"
                 style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
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
        <a href="*|UNSUB|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">View in Browser</a>
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
// LOOP TEMPLATE — editorial magazine layout with CSS hero slideshow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate CSS keyframe animation for n hero slides.
 * Each slide is visible for `duration` seconds; cross-fade ~1s.
 * Works in Apple Mail, Gmail iOS/Android, and modern webmail.
 */
function buildSlideshowCss(n: number, duration = 8): string {
  if (n <= 1) return "";
  const total = n * duration;
  const frames: string[] = [];

  for (let i = 0; i < n; i++) {
    const startSec  = i * duration;
    const endSec    = (i + 1) * duration;
    const p = (s: number) => `${Math.round((s / total) * 1000) / 10}%`;

    if (i === 0) {
      // First slide: starts visible, fades out, then comes back at end of cycle
      frames.push(
        `@keyframes pp-s0{0%{opacity:1}${p(endSec - 1)}{opacity:1}${p(endSec)}{opacity:0}${p(total - 1)}{opacity:0}100%{opacity:1}}`
      );
    } else {
      // Subsequent slides: wait, fade in, hold, fade out
      frames.push(
        `@keyframes pp-s${i}{0%{opacity:0}${p(startSec)}{opacity:0}${p(startSec + 1)}{opacity:1}${p(endSec - 1)}{opacity:1}${p(endSec)}{opacity:0}100%{opacity:0}}`
      );
    }
  }
  return frames.join("\n");
}

export function buildLoopEmailHtml(
  copy: AiEmailCopy,
  agent: AgentInfo = DEFAULT_AGENT,
  heroSlides: string[],
  ctaUrl?: string,
  font?: EmailFontPairing,
): string {
  const ACCENT        = "#C9A55A";
  const DARK          = "#0d1f18";
  const DARK2         = "#152b20";
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont   = font?.display   || "'Cormorant Garamond', Georgia, serif";
  const bodyFont      = font?.body      || "'DM Sans', Helvetica, Arial, sans-serif";
  const googleFontUrl = font?.googleUrl || "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";

  const slides     = heroSlides.filter(Boolean);
  const nSlides    = slides.length;
  const duration   = 8;
  const totalDur   = nSlides * duration;
  const slideCss   = buildSlideshowCss(nSlides, duration);
  const incentives = parseIncentives(copy.incentiveText || "");
  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");

  // Hero section HTML
  const heroHtml = (() => {
    if (slides.length === 0) return "";
    if (slides.length === 1) {
      return `
  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${slides[0]}" alt="${copy.projectName || "Project"}" width="600"
           style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;" />
    </td>
  </tr>`;
    }
    // Multi-slide: stacked with CSS animation
    const imgTags = slides.map((url, i) => `
        <img src="${url}" alt="${copy.projectName || "Project"} – image ${i + 1}" width="600"
             style="display:block;width:100%;height:320px;object-fit:cover;${i > 0 ? "position:absolute;top:0;left:0;" : ""}opacity:${i === 0 ? 1 : 0};animation:pp-s${i} ${totalDur}s linear infinite;" />`).join("");
    return `
  <!-- ─── HERO SLIDESHOW ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;position:relative;height:320px;overflow:hidden;">
      <div style="position:relative;width:100%;height:320px;overflow:hidden;display:block;line-height:0;font-size:0;">${imgTags}
      </div>
    </td>
  </tr>`;
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${copy.subjectLine || "New Presale Opportunity"}</title>
  ${copy.previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">${copy.previewText}</div>` : ""}
  <link href="${googleFontUrl}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:#f0ede8;}
    *{box-sizing:border-box;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    ${slideCss}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;max-width:100%!important;}
      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}
      .loop-hero-cell{height:220px!important;}
      .loop-hero-cell div{height:220px!important;}
      .loop-hero-cell img{height:220px!important;}
      .loop-project{font-size:30px!important;line-height:1.1!important;}
      .loop-headline{font-size:24px!important;line-height:1.2!important;}
      .loop-stat-val{font-size:20px!important;}
      .mobile-stack td{display:block!important;width:100%!important;text-align:left!important;padding-left:20px!important;padding-right:20px!important;}
      .mobile-stack td:first-child{border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.07)!important;}
      .agent-photo{width:44px!important;height:44px!important;}
      .agent-photo-cell{padding:14px 0 14px 16px!important;width:60px!important;}
      .agent-info-cell{padding:14px 16px!important;}
      .agent-logo-cell{display:none!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;" id="body">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;">
<tr><td align="center" style="padding:24px 12px;">

<!-- Loop email container -->
<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0dbd3;">

  <!-- ─── MASTHEAD ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:18px 36px 16px;border-bottom:1px solid rgba(201,165,90,0.2);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:3.5px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES${locationLine ? ` &nbsp;·&nbsp; ${locationLine.toUpperCase()}` : ""}</p>
          </td>
          <td align="right">
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:1.5px;color:rgba(201,165,90,0.35);text-transform:uppercase;">Exclusive Release</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── PROJECT NAMEPLATE ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:24px 36px 30px;">
      ${copy.developerName ? `<p style="margin:0 0 7px 0;font-family:${bodyFont};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7a9a86;">${copy.developerName}</p>` : ""}
      <p class="loop-project" style="margin:0 0 14px 0;font-family:${displayFont};font-size:44px;font-weight:600;color:#ffffff;line-height:1.0;letter-spacing:-0.5px;">${copy.projectName || "New Presale Release"}</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:44px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:12px;height:2px;background:${ACCENT};opacity:0.3;"></td>
      </tr></table>
    </td>
  </tr>

  ${heroHtml}

  <!-- ─── DARK STATS STRIP (conditional) ─── -->
  ${(copy.startingPrice || copy.completion || copy.deposit) ? `
  <tr>
    <td style="background:${DARK2};padding:0;border-top:1px solid rgba(201,165,90,0.18);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          ${copy.startingPrice ? `
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.startingPrice}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Starting From</p>
          </td>` : ""}
          ${copy.deposit ? `
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.deposit}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Deposit</p>
          </td>` : ""}
          ${copy.completion ? `
          <td style="padding:14px 20px 12px;text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.completion}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Completion</p>
          </td>` : ""}
        </tr>
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── BODY COPY ─── -->
  <tr>
    <td class="mobile-pad" style="padding:40px 36px 32px;background:#ffffff;">
      ${copy.headline ? `
      <p class="loop-headline" style="margin:0 0 16px 0;font-family:${displayFont};font-size:32px;font-weight:600;color:${DARK};line-height:1.2;letter-spacing:-0.3px;">${copy.headline}</p>
      <div style="width:36px;height:2px;background:${ACCENT};margin-bottom:22px;"></div>` : ""}
      <div style="font-family:${bodyFont};font-size:15px;color:#444444;line-height:1.85;">
        ${bodyToHtml(copy.bodyCopy || "")}
      </div>
    </td>
  </tr>

  <!-- ─── INFO TABLE (conditional) ─── -->
  ${(copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) ? `
  <tr>
    <td class="mobile-pad" style="padding:0 36px 28px;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e3db;border-radius:2px;overflow:hidden;">
        ${copy.infoRows.filter(r => r.includes("|")).map((row, i, arr) => {
          const [label, value] = row.split("|").map(s => s.trim());
          const isLast = i === arr.length - 1;
          return `<tr>
          <td style="padding:10px 16px;background:#f7f5f1;border-right:1px solid #e8e3db;width:40%;${!isLast ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${bodyFont};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;">${label}</p>
          </td>
          <td style="padding:10px 16px;background:#ffffff;${!isLast ? "border-bottom:1px solid #e8e3db;" : ""}">
            <p style="margin:0;font-family:${bodyFont};font-size:13px;font-weight:500;color:#222;">${value}</p>
          </td>
        </tr>`;
        }).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── INCENTIVES (conditional) ─── -->
  ${incentives.length > 0 ? `
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:30px 36px 26px;border-top:3px solid ${ACCENT};">
      <p style="margin:0 0 18px 0;font-family:${displayFont};font-size:24px;font-weight:600;color:#ffffff;">What's Included</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${incentives.map(item => `
        <tr>
          <td style="padding:0 0 11px 0;vertical-align:top;width:14px;">
            <div style="width:4px;height:4px;background:${ACCENT};margin-top:8px;"></div>
          </td>
          <td style="padding:0 0 11px 12px;vertical-align:top;">
            <p style="margin:0;font-family:${bodyFont};font-size:14px;color:#c8d8cc;line-height:1.75;">${item}</p>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ─── CTA ─── -->
  <tr>
    <td style="background:#f7f5f1;padding:36px 36px;text-align:center;border-top:1px solid #e8e3db;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr>
          <td align="center" style="background:${ACCENT};padding:20px 32px;">
            <a href="${plansPricingUrl}"
               style="font-family:${bodyFont};font-size:11px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:${DARK};text-decoration:none;display:block;line-height:1;">
              VIEW PLANS &amp; PRICING &nbsp;→
            </a>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:16px 24px;">
            <a href="tel:${(agent.phone || DEFAULT_AGENT.phone).replace(/\D/g,"")}"
               style="font-family:${bodyFont};font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              &#128222;&nbsp; CALL NOW
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;font-family:${bodyFont};font-size:11px;color:#999;text-align:center;line-height:1.5;">
        Questions? Reply to this email or call ${agent.phone || DEFAULT_AGENT.phone} directly.
      </p>
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
            <img src="${agent.photo_url}" alt="${agent.full_name}" width="60" height="60" border="0" class="agent-photo"
                 style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
          </td>` : ""}
          <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px ${agent.photo_url ? "10px" : "20px"};vertical-align:middle;">
            <div style="font-family:${displayFont};font-size:17px;font-weight:600;color:#111;line-height:1.15;margin-bottom:2px;">${agent.full_name}</div>
            <div style="font-family:${bodyFont};font-size:9px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};line-height:1.5;margin-bottom:6px;">${agent.title}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${agent.phone ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888;line-height:1;">&#128222;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="font-family:${bodyFont};font-size:12px;color:#444;text-decoration:none;">${agent.phone}</a></td>
              </tr>` : ""}
              ${agent.email ? `<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#888;line-height:1;">&#9993;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:${agent.email}" style="font-family:${bodyFont};font-size:11px;color:#444;text-decoration:none;">${agent.email}</a></td>
              </tr>` : ""}
            </table>
          </td>
          <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">
            <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="150" border="0" class="agent-logo"
                 style="display:block;width:150px;max-width:150px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td bgcolor="${DARK}" class="mobile-pad" style="padding:22px 36px;background-color:${DARK};">
      <div style="font-family:${bodyFont};font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${copy.city ? `${copy.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
      <div style="font-family:${bodyFont};font-size:12px;font-weight:300;color:#8aaa96;line-height:1.6;"><a href="https://presaleproperties.com" style="color:#8aaa96;text-decoration:none;">presaleproperties.com</a>${agent.phone ? ` &nbsp;&middot;&nbsp; ${agent.phone}` : ""}</div>
    </td>
  </tr>

  <!-- ─── LEGAL + UNSUBSCRIBE ─── -->
  <tr>
    <td bgcolor="#f8f7f4" class="mobile-pad" style="padding:24px 36px 28px;background-color:#f8f7f4;border-top:1px solid #e8e8e4;">
      <div style="font-family:${bodyFont};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:12px;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:12px;">
        This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
      </div>
      <div style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:18px;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="*|UNSUB|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#ccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#ccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">View in Browser</a>
      </div>
    </td>
  </tr>

</table>
<!-- /Loop email container -->

</td></tr>
</table>

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
  const deckLink = data.deckUrl || "";

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
            ${fp.sqft  ? `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:12px;color:#8aaa96;">${fp.sqft}</p>` : ""}
            ${fp.price ? `<p style="margin:0;font-family:${DISPLAY_FONT};font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
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
  const bodyHtml = (data.bodyCopy || "").split("\n").filter(Boolean).map(p => {
    // Replace **bold** markers with semi-bold, then strip any remaining lone * characters
    const bold = p
      .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:500;color:#333333;">$1</strong>`)
      .replace(/\*/g, "");
    return `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:14px;color:#444444;line-height:1.65;">${bold}</p>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
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
    @media only screen and (max-width:680px){
      .email-container{width:100%!important;max-width:100%!important;}
      .mobile-pad{padding-left:16px!important;padding-right:16px!important;}
      .mobile-stack td{display:block!important;width:100%!important;text-align:center!important;padding:12px 20px!important;border-right:none!important;border-bottom:1px solid #e8e3db!important;}
      .mobile-stack td:last-child{border-bottom:none!important;}
      .fp-wrap{padding-left:12px!important;padding-right:12px!important;}
      .hero-headline{font-size:24px!important;}
      .stat-val{font-size:20px!important;}
      /* Hide desktop agent card on mobile — use table-row for iOS Mail compatibility */
      .agent-desktop{display:none!important;max-height:0!important;overflow:hidden!important;}
      /* Show mobile agent card — must be table-row not block for <tr> in iOS Mail */
      .agent-mobile{display:table-row!important;max-height:none!important;overflow:visible!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;" id="body">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="center" style="padding:0;margin:0;">

<!-- Email container -->
<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;">

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
        ? `<a href="${deckLink}" target="_blank" style="display:block;line-height:0;font-size:0;"><img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" /></a>`
        : `<img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />`
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
    <td class="mobile-pad" style="padding:32px 36px 24px;background-color:#f7f5f1;">
      ${data.headline ? `
      <p style="margin:0 0 16px 0;font-family:${DISPLAY_FONT};font-size:26px;font-weight:800;color:#0d1f18;line-height:1.2;letter-spacing:-0.5px;">${(data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "")}</p>
      <div style="width:40px;height:3px;background:${ACCENT};margin-bottom:18px;"></div>` : ""}
      <div style="font-family:${BODY_FONT};font-size:14px;color:#444444;line-height:1.8;">
        ${bodyHtml}
      </div>
    </td>
  </tr>

  <!-- WHAT'S INCLUDED (parking, locker, incentives) -->
  ${includedItems.length > 0 ? `
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:24px 36px;">
      <p style="margin:0 0 14px 0;font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${includedItems.map(item => `
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${ACCENT};margin-top:7px;"></div>
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
  <!-- I'M INTERESTED CTA -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:0 28px 28px;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:${ACCENT};padding:13px 32px;">
          <a href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in ${data.projectName}. Can you send me more details?`)}"
             style="font-family:${BODY_FONT};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;font-weight:700;">I'M INTERESTED →</a>
        </td>
      </tr></table>
    </td>
  </tr>` : ""}

  <!-- CALL NOW CTA -->
  <tr>
    <td class="mobile-pad" style="background:#f7f5f1;padding:28px 36px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:18px 24px;text-align:center;">
            <a href="tel:${phone.replace(/\D/g,'')}"
               style="font-family:${BODY_FONT};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              &#128222;&nbsp; CALL NOW — ${phone}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0;font-family:${BODY_FONT};font-size:11px;color:#999999;text-align:center;line-height:1.5;">
        Questions? Reply to this email or call ${phone} directly.
      </p>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#ece8e0;"></div></td></tr>

  <!-- AGENT CARD — DESKTOP (hidden on mobile) -->
  <tr class="agent-desktop" style="display:table-row;">
    <td bgcolor="#fafaf8" style="padding:0;background-color:#fafaf8;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${agent.photo_url ? `
          <td width="110" valign="middle" style="padding:20px 0 20px 24px;vertical-align:middle;line-height:0;font-size:0;width:110px;">
            <img src="${agent.photo_url}" alt="${agent.full_name}" width="90" height="90" border="0"
                 style="display:block;width:90px;height:90px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
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
            <img src="${agent.photo_url}" alt="${agent.full_name}" width="100" height="100" border="0"
                 style="display:inline-block;width:100px;height:100px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
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
        <a href="*|UNSUB|*" style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:${BODY_FONT};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">View in Browser</a>
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
  const whatsapp   = data.ctaWhatsApp || "16722581100";
  const locationLine = data.city ? data.city.toUpperCase() : "";
  const byLine       = data.developerName ? `by ${data.developerName}` : "";
  const deckLink     = data.deckUrl || "";
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
          <td valign="top" width="16" style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <p style="margin:0;${F}font-size:16px;line-height:1;color:${ACCENT};">&#8226;</p>
          </td>
          <td valign="top" style="padding:0 0 10px 10px;vertical-align:top;">
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

  // ─── Stats bar ────────────────────────────────────────────────────────────
  const stats = [
    data.startingPrice ? { val: data.startingPrice, label: "Starting Price" }    : null,
    data.deposit       ? { val: data.deposit,       label: "Deposit Structure" } : null,
    data.completion    ? { val: data.completion,    label: "Est. Completion" }   : null,
  ].filter(Boolean) as { val: string; label: string }[];

  const colPct = stats.length === 3 ? "33%" : stats.length === 2 ? "50%" : "100%";

  const statsHtml = stats.length > 0 ? `
  <tr>
    <td style="background:#f7f5f1;border-bottom:1px solid #e8e3db;padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${stats.map((s, i) => `
          <td class="mobile-full" width="${colPct}" valign="top"
              style="width:${colPct};padding:16px 8px 14px;${i < stats.length - 1 ? "border-right:1px solid #e8e3db;" : ""}text-align:center;vertical-align:top;">
            <p style="margin:0 0 4px 0;${F}font-size:17px;font-weight:700;color:#111111;line-height:1.2;">${s.val}</p>
            <p style="margin:0;${F}font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:#aaaaaa;">${s.label}</p>
          </td>`).join("")}
        </tr>
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
            <td width="45%" style="width:45%;padding:10px 14px;background:#f7f5f1;border-right:1px solid #e8e3db;${bb}vertical-align:top;">
              <p style="margin:0;${F}font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">${label}</p>
            </td>
            <td style="padding:10px 14px;background:#ffffff;${bb}vertical-align:top;">
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
              ${fp.sqft  ? `<p style="margin:0 0 8px 0;${F}font-size:13px;color:#8aaa96;">${fp.sqft}</p>` : ""}
              ${fp.price ? `<p style="margin:0 0 10px 0;${F}font-size:22px;font-weight:700;color:#ffffff;">${fp.price.startsWith("$") ? fp.price : "$" + fp.price}</p>` : ""}
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
  <!--
    STYLE BLOCK: media queries only — all other styles are fully inlined.
    Gmail strips <style> entirely; the fluid table layout handles Gmail.
    Apple Mail, iOS Mail, and Outlook preserve media queries for true responsiveness.
  -->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100% !important; }
    /* Mobile overrides */
    @media only screen and (max-width: 600px) {
      .mobile-full  { width: 100% !important; display: block !important; }
      .mobile-hide  { display: none !important; }
      .mobile-center { text-align: center !important; }
      td.mobile-full { padding: 10px 16px !important; border-right: none !important; border-bottom: 1px solid #e8e3db !important; }
      td.mobile-full:last-child { border-bottom: none !important; }
      .mobile-pad   { padding-left: 16px !important; padding-right: 16px !important; }
      .hero-text    { font-size: 22px !important; }
      .stat-value   { font-size: 15px !important; }
      .fp-price     { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

${data.previewText ? `<!-- Preview text (hidden) -->
<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${data.previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>` : ""}

<!-- ═══ OUTER WRAPPER ═══ -->
<table cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin: 0; padding: 0; width: 100%; background-color: #ffffff;">
  <tr>
    <td align="center" valign="top" style="padding: 0; margin: 0;">
      <!--[if mso]><table align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td><![endif]-->

      <!-- ═══ EMAIL CONTAINER: 100% wide, capped at 600px ═══ -->
      <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%"
             style="max-width: 600px; width: 100%; background-color: #ffffff;">

        <!-- ── HEADER ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 28px 36px 24px;">
            <p style="margin: 0 0 6px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${ACCENT};">PRESALE PROPERTIES</p>
            <p class="hero-text" style="margin: 0 0 8px 0; ${F} font-size: 28px; font-weight: 800; color: #ffffff; line-height: 1.1; letter-spacing: -0.5px;">${data.projectName || "New Presale Release"}</p>
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
              style="background-color: ${ACCENT}; padding: 9px 36px;">
            <p style="margin: 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #ffffff;">${locationLine}</p>
          </td>
        </tr>` : ""}

        <!-- ── HERO IMAGE ── -->
        ${data.heroImage ? `
        <tr>
          <td valign="top" style="padding: 0; font-size: 0; line-height: 0;">
            ${deckLink
              ? `<a href="${deckLink}" target="_blank" style="display: block; font-size: 0; line-height: 0;"><img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" /></a>`
              : `<img src="${data.heroImage}" alt="${data.projectName}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />`}
          </td>
        </tr>` : ""}

        <!-- ── STATS BAR ── -->
        ${statsHtml}

        <!-- ── INFO ROWS ── -->
        ${infoRowsHtml}

        <!-- ── BODY COPY ── -->
        <tr>
          <td class="mobile-pad" valign="top" style="padding: 28px 36px 24px; background-color: #f7f5f1;">
            ${data.headline ? `
            <p class="hero-text" style="margin: 0 0 14px 0; ${F} font-size: 24px; font-weight: 800; color: ${DARK}; line-height: 1.2; letter-spacing: -0.5px;">${(data.headline || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*/g, "")}</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
              <tr><td width="40" height="3" style="width: 40px; height: 3px; background-color: ${ACCENT}; font-size: 0; line-height: 0;">&nbsp;</td></tr>
            </table>` : ""}
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── WHAT'S INCLUDED ── -->
        ${includedItems.length > 0 ? `
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 22px 36px;">
            <p style="margin: 0 0 14px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${ACCENT};">WHAT'S INCLUDED</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${includedItems.map((item: string) => `
              <tr>
                <td width="16" valign="top" style="padding: 0 0 10px 0; width: 16px; vertical-align: top;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr><td width="5" height="5" style="width: 5px; height: 5px; background-color: ${ACCENT}; font-size: 0; line-height: 0; margin-top: 7px;">&nbsp;</td></tr>
                  </table>
                </td>
                <td valign="top" style="padding: 0 0 10px 12px; vertical-align: top;">
                  <p style="margin: 0; ${F} font-size: 14px; font-weight: 500; color: #c8d8cc; line-height: 1.75;">${item}</p>
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
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 24px 36px 12px;">
            <p style="margin: 0 0 4px 0; ${F} font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: ${ACCENT};">FLOOR PLANS</p>
            <p style="margin: 0 0 6px 0; ${F} font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.15;">${fpHeading}</p>
            <p style="margin: 0; ${F} font-size: 12px; color: #8aaa96; line-height: 1.6;">${fpSubheading}</p>
          </td>
        </tr>

        <!-- ── FLOOR PLAN CARDS ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 12px 36px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${fpRowsHtml}
            </table>
          </td>
        </tr>

        <!-- ── I'M INTERESTED CTA ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 0 36px 28px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" valign="top"
                    style="background-color: ${ACCENT}; padding: 14px 24px; text-align: center;">
                  <a href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in ${data.projectName}. Can you send me more details?`)}"
                     style="${F} font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: ${DARK}; text-decoration: none; display: block;">
                    I'M INTERESTED &#8594;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ""}

        <!-- ── CALL NOW CTA ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: #f7f5f1; padding: 24px 36px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" valign="top"
                    style="background-color: ${DARK}; padding: 18px 24px; text-align: center;">
                  <a href="tel:${phone.replace(/\D/g, "")}"
                     style="${F} font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #ffffff; text-decoration: none; display: block; line-height: 1.4;">
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
        <tr>
          <td style="padding: 0 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td height="1" style="height: 1px; background-color: #ece8e0; font-size: 0; line-height: 0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        <!-- ── AGENT CARD ── -->
        <tr>
          <td valign="top" style="background-color: #fafaf8; border-top: 2px solid ${ACCENT}; padding: 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${agent.photo_url ? `
              <tr>
                <td align="center" valign="top" style="padding: 24px 24px 12px; text-align: center;">
                  <img src="${agent.photo_url}" alt="${agent.full_name}" width="90" height="90" border="0"
                       style="display: inline-block; width: 90px; height: 90px; border-radius: 50%; object-fit: cover; object-position: center top; border: 3px solid ${ACCENT}; -ms-interpolation-mode: bicubic;" />
                </td>
              </tr>` : ""}
              <tr>
                <td align="center" valign="top" style="padding: 0 24px 14px; text-align: center;">
                  <p style="margin: 0 0 4px 0; ${F} font-size: 18px; font-weight: 700; color: #111111; line-height: 1.2;">${agent.full_name}</p>
                  <p style="margin: 0 0 10px 0; ${F} font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${ACCENT}; line-height: 1.5;">${agent.title}</p>
                  ${agent.phone ? `<p style="margin: 0 0 4px 0; ${F} font-size: 13px; color: #555555;">&#128222; <a href="tel:${agent.phone.replace(/\D/g, "")}" style="color: #555555; text-decoration: none;">${agent.phone}</a></p>` : ""}
                  ${agent.email ? `<p style="margin: 0; ${F} font-size: 12px; color: #777777;">&#9993; <a href="mailto:${agent.email}" style="color: #777777; text-decoration: none;">${agent.email}</a></p>` : ""}
                </td>
              </tr>
              <tr>
                <td align="center" valign="top"
                    style="padding: 12px 24px 20px; border-top: 1px solid #e8e3db; text-align: center;">
                  <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" border="0"
                       style="display: inline-block; width: 110px; height: auto; border: 0;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td class="mobile-pad" valign="top"
              style="background-color: ${DARK}; padding: 20px 36px;">
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
          <td class="mobile-pad" valign="top"
              style="background-color: #f8f7f4; padding: 22px 36px 26px; border-top: 1px solid #e8e8e4;">
            <p style="margin: 0 0 10px 0; ${F} font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #555555; line-height: 1.4;">L E G A L &nbsp; D I S C L A I M E R</p>
            <p style="margin: 0 0 10px 0; ${F} font-size: 11px; font-weight: 300; color: #888888; line-height: 1.8;">
              This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer&rsquo;s agents &mdash; we represent <strong style="${F} font-weight: 500; color: #666666;">you</strong>, not the developer. This is <strong style="${F} font-weight: 500; color: #666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E.
            </p>
            <p style="margin: 0 0 16px 0; ${F} font-size: 11px; font-weight: 300; color: #888888; line-height: 1.8;">
              You are receiving this because you opted in to presale updates from Presale Properties. Per Canada&rsquo;s Anti-Spam Legislation (CASL), you may withdraw consent at any time.
            </p>
            <p style="margin: 0;">
              <a href="*|UNSUB|*" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">Unsubscribe</a>
              <span style="color: #cccccc; margin: 0 8px;">&middot;</span>
              <a href="*|UPDATE_PROFILE|*" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">Update Preferences</a>
              <span style="color: #cccccc; margin: 0 8px;">&middot;</span>
              <a href="*|EMAIL_WEB_VERSION_URL|*" style="${F} font-size: 11px; color: #888888; text-decoration: underline;">View in Browser</a>
            </p>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>

</body>
</html>`;
}
