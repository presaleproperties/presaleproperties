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
<html lang="en">
<head>
...
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP TEMPLATE — editorial magazine layout with CSS hero slideshow
// ─────────────────────────────────────────────────────────────────────────────

/** Generate CSS keyframe animation for a hero slideshow of n slides */
function buildSlideshowCss(n: number, duration = 8): string {
  if (n <= 1) return "";
  const total = n * duration;
  const frames: string[] = [];

  for (let i = 0; i < n; i++) {
    const startSec   = i * duration;
    const endSec     = (i + 1) * duration;
    // as percentages of total cycle
    const fadeInEnd  = Math.round(((startSec + 1) / total) * 100 * 10) / 10;
    const holdEnd    = Math.round(((endSec   - 1) / total) * 100 * 10) / 10;
    const fadeOutEnd = Math.round(( endSec          / total) * 100 * 10) / 10;
    // loop-back for first slide
    const loopStart  = Math.round(((total - 1)     / total) * 100 * 10) / 10;

    if (i === 0) {
      frames.push(`@keyframes pp-s${i}{
  0%{opacity:1}
  ${holdEnd}%{opacity:1}
  ${fadeOutEnd}%{opacity:0}
  ${loopStart}%{opacity:0}
  100%{opacity:1}
}`);
    } else {
      const prevFadeOut = Math.round(((startSec) / total) * 100 * 10) / 10;
      frames.push(`@keyframes pp-s${i}{
  0%{opacity:0}
  ${prevFadeOut}%{opacity:0}
  ${fadeInEnd}%{opacity:1}
  ${holdEnd}%{opacity:1}
  ${fadeOutEnd}%{opacity:0}
  100%{opacity:0}
}`);
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
  const ACCENT      = "#C9A55A";
  const DARK        = "#0d1f18";
  const DARK2       = "#152b20";
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont = font?.display || "'Cormorant Garamond', Georgia, serif";
  const bodyFont    = font?.body    || "'DM Sans', Helvetica, Arial, sans-serif";
  const googleFontUrl = font?.googleUrl || "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";

  const slides      = heroSlides.filter(Boolean);
  const nSlides     = slides.length;
  const duration    = 8;
  const totalDur    = nSlides * duration;
  const slideCss    = buildSlideshowCss(nSlides, duration);

  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");
  const incentives   = parseIncentives(copy.incentiveText || "");

  // Build hero slideshow HTML
  const heroHtml = slides.length === 0 ? "" : (() => {
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
    // Multi-slide: absolutely stacked with CSS animation
    const imgTags = slides.map((url, i) => `
      <img src="${url}" alt="${copy.projectName || "Project"} slide ${i + 1}" width="600"
           style="display:block;width:100%;height:320px;object-fit:cover;${i === 0 ? "" : "position:absolute;top:0;left:0;"}opacity:${i === 0 ? 1 : 0};animation:pp-s${i} ${totalDur}s infinite;" />`).join("");
    return `
  <!-- ─── HERO SLIDESHOW ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;position:relative;height:320px;overflow:hidden;">
      <div style="position:relative;width:100%;height:320px;overflow:hidden;line-height:0;font-size:0;">${imgTags}
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
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0!important;padding:0!important;background:#f0ede8;}
    *{box-sizing:border-box;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit!important;text-decoration:none!important;}
    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}
    ${slideCss}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;max-width:100%!important;}
      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}
      .loop-hero{height:220px!important;}
      .loop-hero img{height:220px!important;}
      .loop-headline{font-size:26px!important;line-height:1.15!important;}
      .loop-project{font-size:28px!important;}
      .loop-stat-val{font-size:20px!important;}
      .mobile-stack td{display:block!important;width:100%!important;text-align:left!important;padding-left:20px!important;padding-right:20px!important;}
      .mobile-stack td:first-child{border-right:none!important;border-bottom:1px solid #e8e3db!important;}
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
    <td class="mobile-pad" style="background:${DARK};padding:20px 36px 18px;border-bottom:1px solid rgba(201,165,90,0.25);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0;font-family:${bodyFont};font-size:9px;letter-spacing:3.5px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES${locationLine ? ` · ${locationLine.toUpperCase()}` : ""}</p>
          </td>
          <td align="right">
            <p style="margin:0;font-family:${bodyFont};font-size:9px;letter-spacing:1.5px;color:rgba(201,165,90,0.4);text-transform:uppercase;">Exclusive Release</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── PROJECT NAMEPLATE ─── -->
  <tr>
    <td class="mobile-pad" style="background:${DARK};padding:22px 36px 26px;">
      ${copy.developerName ? `<p style="margin:0 0 6px 0;font-family:${bodyFont};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7a9a86;">${copy.developerName}</p>` : ""}
      <p class="loop-project" style="margin:0 0 12px 0;font-family:${displayFont};font-size:42px;font-weight:600;color:#ffffff;line-height:1.0;letter-spacing:-0.5px;">${copy.projectName || "New Presale Release"}</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:40px;height:2px;background:${ACCENT};"></td>
        <td style="width:8px;"></td>
        <td style="width:10px;height:2px;background:${ACCENT};opacity:0.35;"></td>
      </tr></table>
    </td>
  </tr>

  ${heroHtml}

  <!-- ─── STATS STRIP (conditional) ─── -->
  ${(copy.startingPrice || copy.completion || copy.deposit) ? `
  <tr>
    <td style="background:${DARK2};padding:0;border-top:1px solid rgba(201,165,90,0.2);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack">
        <tr>
          ${copy.startingPrice ? `
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.07);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 2px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.startingPrice}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.6);">Starting From</p>
          </td>` : ""}
          ${copy.deposit ? `
          <td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.07);text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 2px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.deposit}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.6);">Deposit</p>
          </td>` : ""}
          ${copy.completion ? `
          <td style="padding:14px 20px 12px;text-align:center;">
            <p class="loop-stat-val" style="margin:0 0 2px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">${copy.completion}</p>
            <p style="margin:0;font-family:${bodyFont};font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.6);">Completion</p>
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
      <p style="margin:0 0 18px 0;font-family:${displayFont};font-size:22px;font-weight:600;color:#ffffff;">What's Included</p>
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
    <td style="background:#f7f5f1;padding:36px 36px 36px;text-align:center;border-top:1px solid #e8e3db;">
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
}
