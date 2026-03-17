/**
 * AiEmailTemplate
 * ─────────────────────────────────────────────────────────────
 * Two email templates:
 *  1. buildAiEmailHtml  — Classic editorial layout
 *  2. buildLoopEmailHtml — Loop/magazine layout with CSS hero slideshow
 *
 * Brand: Warm cream background, gold accent (#C9A55A),
 * dark charcoal foreground (#1a2332), Plus Jakarta Sans typography.
 * Matches presaleproperties.com website branding exactly.
 */

const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

// ─── Brand palette (matching website CSS tokens) ─────────────────────────────
const BRAND = {
  gold: "#C9A55A",
  goldLight: "#d4b76e",
  goldDark: "#a8873a",
  dark: "#1a2332",       // hsl(220 20% 10%) — site foreground
  darkMuted: "#5c6577",  // hsl(220 8% 46%) — muted foreground
  cream: "#FDFCFB",      // hsl(30 20% 99%) — site background
  creamDark: "#f5f3f0",  // slightly darker cream for sections
  cardBg: "#ffffff",
  border: "#e8e3db",
  borderLight: "#f0ede8",
};

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
      const withBold = p.replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:600;color:${BRAND.dark};">$1</strong>`);
      return `<p style="margin:0 0 14px 0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;color:${BRAND.darkMuted};line-height:1.75;">${withBold}</p>`;
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
    id: "jakarta-jakarta",
    label: "Plus Jakarta Sans",
    tag: "Website Match",
    display: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    body: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
  },
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
  const ACCENT = BRAND.gold;
  const DARK = BRAND.dark;
  const incentives = parseIncentives(copy.incentiveText || "");
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont = font?.display || "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
  const bodyFont = font?.body || "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
  const googleFontUrl = font?.googleUrl || "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";

  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");
  const byLine = copy.developerName ? `by ${copy.developerName}` : "";

  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>\${copy.subjectLine || "New Presale Opportunity"}</title>
  \${copy.previewText ? \`<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">\${copy.previewText}</div>\` : ""}
  <link href="\${googleFontUrl}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:${BRAND.cream};}
    *{box-sizing:border-box;}
    /* ── Apple Mail / Gmail link colour reset ── */
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    /* ── Mobile ── */
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;max-width:100%!important;}
      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}
      .mobile-pad-sm{padding-left:14px!important;padding-right:14px!important;}
      .mobile-stack td{display:block!important;width:100%!important;text-align:left!important;padding-left:20px!important;padding-right:20px!important;}
      .mobile-stack td:first-child{border-right:none!important;border-bottom:1px solid ${BRAND.border}!important;}
      .mobile-hero-img{min-height:200px!important;}
      .hero-headline{font-size:24px!important;}
      .body-headline{font-size:22px!important;}
      .stat-value{font-size:22px!important;}
      .agent-logo{display:none!important;}
      .agent-photo{width:44px!important;height:44px!important;}
      .agent-photo-cell{padding:14px 0 14px 16px!important;width:60px!important;}
      .agent-info-cell{padding:14px 16px!important;}
      .agent-logo-cell{display:none!important;}
      .fp-cell{display:block!important;width:100%!important;}
      table.mobile-full{width:100%!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};" id="body">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};">
<tr><td align="center" style="padding:24px 12px;">

<!-- Email container -->
<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:4px;overflow:hidden;">

  <!-- ─── LOGO HEADER ─── -->
  <tr>
    <td style="background:#ffffff;padding:28px 36px 20px;text-align:center;border-bottom:2px solid ${ACCENT};">
      <img src="\${LOGO_EMAIL_URL}" alt="Presale Properties" width="200" border="0"
           style="display:inline-block;width:200px;max-width:200px;height:auto;" />
    </td>
  </tr>

  <!-- ─── PROJECT HEADER ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 4px 0;font-family:\${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
      <p class="hero-headline" style="margin:0 0 10px 0;font-family:\${displayFont};font-size:32px;font-weight:700;color:#ffffff;line-height:1.1;">\${copy.projectName || "New Presale Release"}</p>
      \${byLine ? \`<p style="margin:0 0 10px 0;font-family:\${bodyFont};font-size:11px;color:rgba(255,255,255,0.55);">\${byLine}</p>\` : ""}
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:32px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:8px;height:2px;background:${ACCENT};opacity:0.4;"></td>
      </tr></table>
    </td>
  </tr>

  <!-- ─── LOCATION BANNER (conditional) ─── -->
  \${locationLine ? \`
  <tr>
    <td class="mobile-pad" style="background:${ACCENT};padding:9px 36px;">
      <p style="margin:0;font-family:\${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">\${locationLine.toUpperCase()}</p>
    </td>
  </tr>\` : ""}

  <!-- ─── HERO STATS BAR (conditional) ─── -->
  \${(copy.startingPrice || copy.completion || copy.deposit) ? \`
  <tr>
    <td style="background:${BRAND.creamDark};border-bottom:1px solid ${BRAND.border};padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          \${copy.startingPrice ? \`
          <td style="padding:16px 20px 14px;border-right:1px solid ${BRAND.border};text-align:center;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:${ACCENT};">\${copy.startingPrice}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.darkMuted};">Starting Price</p>
          </td>\` : ""}
          \${copy.deposit ? \`
          <td style="padding:16px 20px 14px;border-right:1px solid ${BRAND.border};text-align:center;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:${DARK};">\${copy.deposit}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.darkMuted};">Deposit Structure</p>
          </td>\` : ""}
          \${copy.completion ? \`
          <td style="padding:16px 20px 14px;text-align:center;">
            <p class="stat-value" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:${DARK};">\${copy.completion}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.darkMuted};">Est. Completion</p>
          </td>\` : ""}
        </tr>
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── INFO ROWS (conditional) ─── -->
  \${(copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) ? \`
  <tr>
    <td class="mobile-pad" style="padding:0 36px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:4px;overflow:hidden;">
        \${copy.infoRows.filter(r => r.includes("|")).map((row, i, arr) => {
          const [label, value] = row.split("|").map(s => s.trim());
          const isLast = i === arr.length - 1;
          return \`<tr>
          <td style="padding:10px 16px;background:${BRAND.creamDark};border-right:1px solid ${BRAND.border};width:40%;\${!isLast ? "border-bottom:1px solid ${BRAND.border};" : ""}">
            <p style="margin:0;font-family:\${bodyFont};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.darkMuted};">\${label}</p>
          </td>
          <td style="padding:10px 16px;background:#ffffff;\${!isLast ? "border-bottom:1px solid ${BRAND.border};" : ""}">
            <p style="margin:0;font-family:\${bodyFont};font-size:13px;font-weight:600;color:${DARK};">\${value}</p>
          </td>
        </tr>\`;
        }).join("")}
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── BODY COPY ─── -->
  <tr>
    <td class="mobile-pad" style="padding:36px 36px 28px;">
      \${(!suppressHeadlineInBody && copy.headline) ? \`
      <p class="body-headline" style="margin:0 0 18px 0;font-family:\${displayFont};font-size:30px;font-weight:700;color:${DARK};line-height:1.2;letter-spacing:-0.3px;">\${copy.headline}</p>
      <div style="width:40px;height:3px;background:${ACCENT};margin-bottom:20px;"></div>\` : ""}
      <div style="font-family:\${bodyFont};font-size:15px;color:${BRAND.darkMuted};line-height:1.8;">
        \${bodyToHtml(copy.bodyCopy || "")}
      </div>
    </td>
  </tr>

  <!-- ─── INCENTIVES (conditional) ─── -->
  \${incentives.length > 0 ? \`
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:28px 36px 24px;">
      <p style="margin:0 0 16px 0;font-family:\${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">WHAT'S INCLUDED</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        \${incentives.map(item => \`
        <tr>
          <td style="padding:0 0 10px 0;vertical-align:top;width:16px;">
            <div style="width:5px;height:5px;background:${ACCENT};margin-top:7px;"></div>
          </td>
          <td style="padding:0 0 10px 12px;vertical-align:top;">
            <p style="margin:0;font-family:\${bodyFont};font-size:14px;color:rgba(255,255,255,0.75);line-height:1.7;">\${item}</p>
          </td>
        </tr>\`).join("")}
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── IMAGE CARDS (conditional) ─── -->
  \${(copy.imageCards && copy.imageCards.filter(c => c.url).length > 0) ? (() => {
    const cards = copy.imageCards!.filter(c => c.url);
    const colWidth = cards.length === 1 ? "100%" : cards.length === 2 ? "50%" : "33.333%";
    return \`
  <tr>
    <td style="padding:0;margin:0;background:#ffffff;line-height:0;font-size:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;table-layout:fixed;">
        <tr>
          \${cards.map((card, i) => \`
          <td style="width:\${colWidth};vertical-align:top;padding:0;margin:0;\${i > 0 ? "border-left:2px solid #ffffff;" : ""}line-height:0;font-size:0;">
            <img src="\${card.url}" alt="\${card.caption || "Project image"}" width="100%"
                 style="display:block;width:100%;height:auto;object-fit:cover;" />
            \${card.caption ? \`<p style="margin:4px 0 0 0;padding:0 4px;font-family:\${bodyFont};font-size:10px;color:${BRAND.darkMuted};text-align:center;letter-spacing:0.5px;line-height:1.4;">\${card.caption}</p>\` : ""}
          </td>\`).join("")}
        </tr>
      </table>
    </td>
  </tr>\`;
  })() : ""}

  <!-- ─── CTA ─── -->
  <tr>
    <td style="background:${BRAND.creamDark};padding:32px 36px 36px;">
      <!-- Primary CTA: VIEW PLANS — full gold fill -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr>
          <td align="center" style="background:${ACCENT};padding:18px 24px;text-align:center;border-radius:4px;">
            <a href="\${plansPricingUrl}"
               style="font-family:\${bodyFont};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              VIEW PLANS &amp; PRICING &nbsp;→
            </a>
          </td>
        </tr>
      </table>
      <!-- Secondary CTA: CALL NOW — dark fill -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:16px 24px;text-align:center;border-radius:4px;">
            <a href="tel:\${(agent.phone || DEFAULT_AGENT.phone).replace(/\\D/g,'')}"
               style="font-family:\${bodyFont};font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              &#128222;&nbsp; CALL NOW
            </a>
          </td>
        </tr>
      </table>
      <!-- Agent note -->
      <p style="margin:16px 0 0 0;font-family:\${bodyFont};font-size:11px;color:${BRAND.darkMuted};text-align:center;line-height:1.5;">
        Questions? Reply to this email or call \${agent.phone || DEFAULT_AGENT.phone} directly.
      </p>
    </td>
  </tr>

  <!-- ─── DIVIDER ─── -->
  <tr>
    <td style="padding:0 36px;">
      <div style="height:1px;background:${BRAND.border};"></div>
    </td>
  </tr>

  <!-- ─── AGENT CARD ─── -->
  <!-- This comment is used as injection point for floor plans -->
  <tr>
    <td bgcolor="#ffffff" style="padding:0;background-color:#ffffff;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          \${agent.photo_url ? \`
          <td width="80" valign="middle" class="agent-photo-cell" style="padding:18px 0 18px 20px;vertical-align:middle;line-height:0;font-size:0;">
            <img src="\${agent.photo_url}" alt="\${agent.full_name}" width="60" height="60" border="0" class="agent-photo"
                 style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
          </td>\` : ""}
          <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px \${agent.photo_url ? "10px" : "20px"};vertical-align:middle;">
            <div style="font-family:\${displayFont};font-size:17px;font-weight:700;color:${DARK};line-height:1.15;mso-line-height-rule:exactly;margin-bottom:2px;">\${agent.full_name}</div>
            <div style="font-family:\${bodyFont};font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};mso-line-height-rule:exactly;line-height:1.5;margin-bottom:6px;">\${agent.title}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              \${agent.phone ? \`<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:${BRAND.darkMuted};line-height:1;">&#128222;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:\${agent.phone.replace(/\\D/g,"")}" style="font-family:\${bodyFont};font-size:12px;font-weight:400;color:${BRAND.darkMuted};text-decoration:none;">\${agent.phone}</a></td>
              </tr>\` : ""}
              \${agent.email ? \`<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:${BRAND.darkMuted};line-height:1;">&#9993;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:\${agent.email}" style="font-family:\${bodyFont};font-size:11px;font-weight:400;color:${BRAND.darkMuted};text-decoration:none;">\${agent.email}</a></td>
              </tr>\` : ""}
            </table>
          </td>
          <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">
            <img src="\${LOGO_EMAIL_URL}" alt="Presale Properties" width="150" border="0" class="agent-logo"
                 style="display:block;width:150px;max-width:150px;height:auto;-ms-interpolation-mode:bicubic;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td bgcolor="${DARK}" class="mobile-pad" style="padding:22px 36px;background-color:${DARK};">
      <div style="font-family:\${bodyFont};font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;mso-line-height-rule:exactly;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; \${copy.city ? \`\${copy.city.toUpperCase()}, BC\` : "VANCOUVER, BC"}</div>
      <div style="font-family:\${bodyFont};font-size:12px;font-weight:300;color:rgba(255,255,255,0.6);mso-line-height-rule:exactly;line-height:1.6;"><a href="https://presaleproperties.com" style="color:rgba(255,255,255,0.6);text-decoration:none;">presaleproperties.com</a>\${agent.phone ? \` &nbsp;&middot;&nbsp; \${agent.phone}\` : ""}</div>
    </td>
  </tr>

  <!-- ─── LEGAL + UNSUBSCRIBE ─── -->
  <tr>
    <td bgcolor="${BRAND.creamDark}" class="mobile-pad" style="padding:24px 36px 28px;background-color:${BRAND.creamDark};border-top:1px solid ${BRAND.border};">
      <div style="font-family:\${bodyFont};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRAND.darkMuted};margin-bottom:12px;mso-line-height-rule:exactly;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:12px;mso-line-height-rule:exactly;">
        This email was sent by \${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
      </div>
      <div style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:18px;mso-line-height-rule:exactly;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="*|UNSUB|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#cccccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">View in Browser</a>
      </div>
    </td>
  </tr>

</table>
<!-- /Email container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>\`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP TEMPLATE — editorial magazine layout with CSS hero slideshow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate CSS keyframe animation for n hero slides.
 * Each slide is visible for \`duration\` seconds; cross-fade ~1s.
 * Works in Apple Mail, Gmail iOS/Android, and modern webmail.
 */
function buildSlideshowCss(n: number, duration = 8): string {
  if (n <= 1) return "";
  const total = n * duration;
  const frames: string[] = [];

  for (let i = 0; i < n; i++) {
    const startSec  = i * duration;
    const endSec    = (i + 1) * duration;
    const p = (s: number) => \`\${Math.round((s / total) * 1000) / 10}%\`;

    if (i === 0) {
      frames.push(
        \`@keyframes pp-s0{0%{opacity:1}\${p(endSec - 1)}{opacity:1}\${p(endSec)}{opacity:0}\${p(total - 1)}{opacity:0}100%{opacity:1}}\`
      );
    } else {
      frames.push(
        \`@keyframes pp-s\${i}{0%{opacity:0}\${p(startSec)}{opacity:0}\${p(startSec + 1)}{opacity:1}\${p(endSec - 1)}{opacity:1}\${p(endSec)}{opacity:0}100%{opacity:0}}\`
      );
    }
  }
  return frames.join("\\n");
}

export function buildLoopEmailHtml(
  copy: AiEmailCopy,
  agent: AgentInfo = DEFAULT_AGENT,
  heroSlides: string[],
  ctaUrl?: string,
  font?: EmailFontPairing,
): string {
  const ACCENT        = BRAND.gold;
  const DARK          = BRAND.dark;
  const DARK2         = "#232d3e";
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont   = font?.display   || "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
  const bodyFont      = font?.body      || "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
  const googleFontUrl = font?.googleUrl || "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";

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
      return \`
  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="\${slides[0]}" alt="\${copy.projectName || "Project"}" width="600"
           style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;" />
    </td>
  </tr>\`;
    }
    // Multi-slide: stacked with CSS animation
    const imgTags = slides.map((url, i) => \`
        <img src="\${url}" alt="\${copy.projectName || "Project"} – image \${i + 1}" width="600"
             style="display:block;width:100%;height:320px;object-fit:cover;\${i > 0 ? "position:absolute;top:0;left:0;" : ""}opacity:\${i === 0 ? 1 : 0};animation:pp-s\${i} \${totalDur}s linear infinite;" />\`).join("");
    return \`
  <!-- ─── HERO SLIDESHOW ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;position:relative;height:320px;overflow:hidden;">
      <div style="position:relative;width:100%;height:320px;overflow:hidden;display:block;line-height:0;font-size:0;">\${imgTags}
      </div>
    </td>
  </tr>\`;
  })();

  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>\${copy.subjectLine || "New Presale Opportunity"}</title>
  \${copy.previewText ? \`<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">\${copy.previewText}</div>\` : ""}
  <link href="\${googleFontUrl}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:${BRAND.cream};}
    *{box-sizing:border-box;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    \${slideCss}
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
<body style="margin:0;padding:0;background:${BRAND.cream};" id="body">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};">
<tr><td align="center" style="padding:24px 12px;">

<!-- Loop email container -->
<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:4px;overflow:hidden;">

  <!-- ─── LOGO HEADER ─── -->
  <tr>
    <td style="background:#ffffff;padding:24px 36px 18px;text-align:center;border-bottom:1px solid ${BRAND.border};">
      <img src="\${LOGO_EMAIL_URL}" alt="Presale Properties" width="180" border="0"
           style="display:inline-block;width:180px;max-width:180px;height:auto;" />
    </td>
  </tr>

  <!-- ─── MASTHEAD ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:18px 36px 16px;border-bottom:1px solid rgba(201,165,90,0.2);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:3.5px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES\${locationLine ? \` &nbsp;·&nbsp; \${locationLine.toUpperCase()}\` : ""}</p>
          </td>
          <td align="right">
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:1.5px;color:rgba(201,165,90,0.35);text-transform:uppercase;">Exclusive Release</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── PROJECT NAMEPLATE ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:24px 36px 30px;">
      \${copy.developerName ? \`<p style="margin:0 0 7px 0;font-family:\${bodyFont};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">\${copy.developerName}</p>\` : ""}
      <p class="loop-project" style="margin:0 0 14px 0;font-family:\${displayFont};font-size:44px;font-weight:800;color:#ffffff;line-height:1.0;letter-spacing:-0.5px;">\${copy.projectName || "New Presale Release"}</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:44px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:12px;height:2px;background:${ACCENT};opacity:0.3;"></td>
      </tr></table>
    </td>
  </tr>

  \${heroHtml}

  <!-- ─── DARK STATS STRIP (conditional) ─── -->
  \${(copy.startingPrice || copy.completion || copy.deposit) ? \`
  <tr>
    <td style="background:\${DARK2};padding:0;border-top:1px solid rgba(201,165,90,0.18);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          \${copy.startingPrice ? \`
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:${ACCENT};">\${copy.startingPrice}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Starting From</p>
          </td>\` : ""}
          \${copy.deposit ? \`
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:#ffffff;">\${copy.deposit}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Deposit</p>
          </td>\` : ""}
          \${copy.completion ? \`
          <td style="padding:14px 20px 12px;text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 3px 0;font-family:\${displayFont};font-size:22px;font-weight:700;color:#ffffff;">\${copy.completion}</p>
            <p style="margin:0;font-family:\${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Completion</p>
          </td>\` : ""}
        </tr>
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── BODY COPY ─── -->
  <tr>
    <td class="mobile-pad" style="padding:40px 36px 32px;background:#ffffff;">
      \${copy.headline ? \`
      <p class="loop-headline" style="margin:0 0 16px 0;font-family:\${displayFont};font-size:32px;font-weight:700;color:${DARK};line-height:1.2;letter-spacing:-0.3px;">\${copy.headline}</p>
      <div style="width:36px;height:2px;background:${ACCENT};margin-bottom:22px;"></div>\` : ""}
      <div style="font-family:\${bodyFont};font-size:15px;color:${BRAND.darkMuted};line-height:1.85;">
        \${bodyToHtml(copy.bodyCopy || "")}
      </div>
    </td>
  </tr>

  <!-- ─── INFO TABLE (conditional) ─── -->
  \${(copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) ? \`
  <tr>
    <td class="mobile-pad" style="padding:0 36px 28px;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:4px;overflow:hidden;">
        \${copy.infoRows.filter(r => r.includes("|")).map((row, i, arr) => {
          const [label, value] = row.split("|").map(s => s.trim());
          const isLast = i === arr.length - 1;
          return \`<tr>
          <td style="padding:10px 16px;background:${BRAND.creamDark};border-right:1px solid ${BRAND.border};width:40%;\${!isLast ? "border-bottom:1px solid ${BRAND.border};" : ""}">
            <p style="margin:0;font-family:\${bodyFont};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.darkMuted};">\${label}</p>
          </td>
          <td style="padding:10px 16px;background:#ffffff;\${!isLast ? "border-bottom:1px solid ${BRAND.border};" : ""}">
            <p style="margin:0;font-family:\${bodyFont};font-size:13px;font-weight:600;color:${DARK};">\${value}</p>
          </td>
        </tr>\`;
        }).join("")}
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── INCENTIVES (conditional) ─── -->
  \${incentives.length > 0 ? \`
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:30px 36px 26px;border-top:3px solid ${ACCENT};">
      <p style="margin:0 0 18px 0;font-family:\${displayFont};font-size:24px;font-weight:700;color:#ffffff;">What's Included</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        \${incentives.map(item => \`
        <tr>
          <td style="padding:0 0 11px 0;vertical-align:top;width:14px;">
            <div style="width:4px;height:4px;background:${ACCENT};margin-top:8px;"></div>
          </td>
          <td style="padding:0 0 11px 12px;vertical-align:top;">
            <p style="margin:0;font-family:\${bodyFont};font-size:14px;color:rgba(255,255,255,0.75);line-height:1.75;">\${item}</p>
          </td>
        </tr>\`).join("")}
      </table>
    </td>
  </tr>\` : ""}

  <!-- ─── CTA ─── -->
  <tr>
    <td style="background:${BRAND.creamDark};padding:36px 36px;text-align:center;border-top:1px solid ${BRAND.border};">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
        <tr>
          <td align="center" style="background:${ACCENT};padding:20px 32px;border-radius:4px;">
            <a href="\${plansPricingUrl}"
               style="font-family:\${bodyFont};font-size:11px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              VIEW PLANS &amp; PRICING &nbsp;→
            </a>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background:${DARK};padding:16px 24px;border-radius:4px;">
            <a href="tel:\${(agent.phone || DEFAULT_AGENT.phone).replace(/\\D/g,"")}"
               style="font-family:\${bodyFont};font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">
              &#128222;&nbsp; CALL NOW
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;font-family:\${bodyFont};font-size:11px;color:${BRAND.darkMuted};text-align:center;line-height:1.5;">
        Questions? Reply to this email or call \${agent.phone || DEFAULT_AGENT.phone} directly.
      </p>
    </td>
  </tr>

  <!-- ─── AGENT CARD ─── -->
  <!-- This comment is used as injection point for floor plans -->
  <tr>
    <td bgcolor="#ffffff" style="padding:0;background-color:#ffffff;border-top:2px solid ${ACCENT};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          \${agent.photo_url ? \`
          <td width="80" valign="middle" class="agent-photo-cell" style="padding:18px 0 18px 20px;vertical-align:middle;line-height:0;font-size:0;">
            <img src="\${agent.photo_url}" alt="\${agent.full_name}" width="60" height="60" border="0" class="agent-photo"
                 style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ${ACCENT};-ms-interpolation-mode:bicubic;" />
          </td>\` : ""}
          <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px \${agent.photo_url ? "10px" : "20px"};vertical-align:middle;">
            <div style="font-family:\${displayFont};font-size:17px;font-weight:700;color:${DARK};line-height:1.15;margin-bottom:2px;">\${agent.full_name}</div>
            <div style="font-family:\${bodyFont};font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};line-height:1.5;margin-bottom:6px;">\${agent.title}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              \${agent.phone ? \`<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:${BRAND.darkMuted};line-height:1;">&#128222;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:\${agent.phone.replace(/\\D/g,"")}" style="font-family:\${bodyFont};font-size:12px;color:${BRAND.darkMuted};text-decoration:none;">\${agent.phone}</a></td>
              </tr>\` : ""}
              \${agent.email ? \`<tr>
                <td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:${BRAND.darkMuted};line-height:1;">&#9993;</td>
                <td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:\${agent.email}" style="font-family:\${bodyFont};font-size:11px;color:${BRAND.darkMuted};text-decoration:none;">\${agent.email}</a></td>
              </tr>\` : ""}
            </table>
          </td>
          <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">
            <img src="\${LOGO_EMAIL_URL}" alt="Presale Properties" width="150" border="0" class="agent-logo"
                 style="display:block;width:150px;max-width:150px;height:auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td bgcolor="${DARK}" class="mobile-pad" style="padding:22px 36px;background-color:${DARK};">
      <div style="font-family:\${bodyFont};font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};margin-bottom:6px;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; \${copy.city ? \`\${copy.city.toUpperCase()}, BC\` : "VANCOUVER, BC"}</div>
      <div style="font-family:\${bodyFont};font-size:12px;font-weight:300;color:rgba(255,255,255,0.6);line-height:1.6;"><a href="https://presaleproperties.com" style="color:rgba(255,255,255,0.6);text-decoration:none;">presaleproperties.com</a>\${agent.phone ? \` &nbsp;&middot;&nbsp; \${agent.phone}\` : ""}</div>
    </td>
  </tr>

  <!-- ─── LEGAL + UNSUBSCRIBE ─── -->
  <tr>
    <td bgcolor="${BRAND.creamDark}" class="mobile-pad" style="padding:24px 36px 28px;background-color:${BRAND.creamDark};border-top:1px solid ${BRAND.border};">
      <div style="font-family:\${bodyFont};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRAND.darkMuted};margin-bottom:12px;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
      <div style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:12px;">
        This email was sent by \${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500;color:#666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
      </div>
      <div style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:18px;">
        You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
      </div>
      <div>
        <a href="*|UNSUB|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Unsubscribe</a>
        <span style="color:#ccc;margin:0 10px;">&middot;</span>
        <a href="*|UPDATE_PROFILE|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Update Preferences</a>
        <span style="color:#ccc;margin:0 10px;">&middot;</span>
        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:\${bodyFont};font-size:11px;font-weight:300;color:#888;text-decoration:underline;">View in Browser</a>
      </div>
    </td>
  </tr>

</table>
<!-- /Loop email container -->

</td></tr>
</table>

</body>
</html>\`;
}
