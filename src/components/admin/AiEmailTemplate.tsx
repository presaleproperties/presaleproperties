/**
 * AiEmailTemplate
 * ─────────────────────────────────────────────────────────────
 * Two email templates:
 *  1. buildAiEmailHtml  — Classic editorial layout
 *  2. buildLoopEmailHtml — Loop/magazine layout with CSS hero slideshow
 *
 * Brand: warm cream bg (#FDFCFB), gold accent (#C9A55A),
 * dark charcoal header (#1a2332), Plus Jakarta Sans.
 * Matches presaleproperties.com website branding.
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
function bodyToHtml(text: string, bodyFont: string): string {
  if (!text) return "";
  const paras = text.split("\n").filter(Boolean);
  return paras
    .map(p => {
      const withBold = p.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#1a2332;">$1</strong>');
      return "<p style=\"margin:0 0 14px 0;font-family:" + bodyFont + ";font-size:14px;color:#5c6577;line-height:1.75;\">" + withBold + "</p>";
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

// Default font references
const DEF_DISPLAY = "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
const DEF_BODY = "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
const DEF_GFONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIC TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

export function buildAiEmailHtml(copy: AiEmailCopy, agent: AgentInfo = DEFAULT_AGENT, ctaUrl?: string, font?: EmailFontPairing, suppressHeadlineInBody?: boolean): string {
  const ACCENT = "#C9A55A";
  const DARK = "#1a2332";
  const incentives = parseIncentives(copy.incentiveText || "");
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont = font?.display || DEF_DISPLAY;
  const bodyFont = font?.body || DEF_BODY;
  const googleFontUrl = font?.googleUrl || DEF_GFONT;

  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");
  const byLine = copy.developerName ? "by " + copy.developerName : "";

  // Build stats bar cells
  let statCells = "";
  if (copy.startingPrice) {
    statCells += '<td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">' +
      '<p class="stat-value" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:' + ACCENT + ';">' + copy.startingPrice + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#5c6577;">Starting Price</p></td>';
  }
  if (copy.deposit) {
    statCells += '<td style="padding:16px 20px 14px;border-right:1px solid #e8e3db;text-align:center;">' +
      '<p class="stat-value" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:' + DARK + ';">' + copy.deposit + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#5c6577;">Deposit Structure</p></td>';
  }
  if (copy.completion) {
    statCells += '<td style="padding:16px 20px 14px;text-align:center;">' +
      '<p class="stat-value" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:' + DARK + ';">' + copy.completion + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#5c6577;">Est. Completion</p></td>';
  }

  // Build info rows
  let infoRowsHtml = "";
  if (copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) {
    const rows = copy.infoRows.filter(r => r.includes("|"));
    let rowsInner = "";
    rows.forEach((row, i) => {
      const parts = row.split("|").map(s => s.trim());
      const label = parts[0];
      const value = parts[1];
      const isLast = i === rows.length - 1;
      rowsInner += '<tr><td style="padding:10px 16px;background:#f5f3f0;border-right:1px solid #e8e3db;width:40%;' + (!isLast ? "border-bottom:1px solid #e8e3db;" : "") + '">' +
        '<p style="margin:0;font-family:' + bodyFont + ';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5c6577;">' + label + '</p></td>' +
        '<td style="padding:10px 16px;background:#ffffff;' + (!isLast ? "border-bottom:1px solid #e8e3db;" : "") + '">' +
        '<p style="margin:0;font-family:' + bodyFont + ';font-size:13px;font-weight:600;color:' + DARK + ';">' + value + '</p></td></tr>';
    });
    infoRowsHtml = '<tr><td class="mobile-pad" style="padding:0 36px 20px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e3db;border-radius:4px;overflow:hidden;">' + rowsInner + '</table></td></tr>';
  }

  // Build incentives
  let incentivesHtml = "";
  if (incentives.length > 0) {
    let items = "";
    incentives.forEach(item => {
      items += '<tr><td style="padding:0 0 10px 0;vertical-align:top;width:16px;"><div style="width:5px;height:5px;background:' + ACCENT + ';margin-top:7px;"></div></td>' +
        '<td style="padding:0 0 10px 12px;vertical-align:top;"><p style="margin:0;font-family:' + bodyFont + ';font-size:14px;color:rgba(255,255,255,0.75);line-height:1.7;">' + item + '</p></td></tr>';
    });
    incentivesHtml = '<tr><td class="mobile-pad" style="background:' + DARK + ';padding:28px 36px 24px;">' +
      '<p style="margin:0 0 16px 0;font-family:' + bodyFont + ';font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + ACCENT + ';">WHAT\'S INCLUDED</p>' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' + items + '</table></td></tr>';
  }

  // Build image cards
  let imageCardsHtml = "";
  if (copy.imageCards && copy.imageCards.filter(c => c.url).length > 0) {
    const cards = copy.imageCards.filter(c => c.url);
    const colWidth = cards.length === 1 ? "100%" : cards.length === 2 ? "50%" : "33.333%";
    let cardCells = "";
    cards.forEach((card, i) => {
      cardCells += '<td style="width:' + colWidth + ';vertical-align:top;padding:0;margin:0;' + (i > 0 ? "border-left:2px solid #ffffff;" : "") + 'line-height:0;font-size:0;">' +
        '<img src="' + card.url + '" alt="' + (card.caption || "Project image") + '" width="100%" style="display:block;width:100%;height:auto;object-fit:cover;" />' +
        (card.caption ? '<p style="margin:4px 0 0 0;padding:0 4px;font-family:' + bodyFont + ';font-size:10px;color:#5c6577;text-align:center;letter-spacing:0.5px;line-height:1.4;">' + card.caption + '</p>' : '') +
        '</td>';
    });
    imageCardsHtml = '<tr><td style="padding:0;margin:0;background:#ffffff;line-height:0;font-size:0;"><table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;table-layout:fixed;"><tr>' + cardCells + '</tr></table></td></tr>';
  }

  // Body headline
  let bodyHeadline = "";
  if (!suppressHeadlineInBody && copy.headline) {
    bodyHeadline = '<p class="body-headline" style="margin:0 0 18px 0;font-family:' + displayFont + ';font-size:30px;font-weight:700;color:' + DARK + ';line-height:1.2;letter-spacing:-0.3px;">' + copy.headline + '</p>' +
      '<div style="width:40px;height:3px;background:' + ACCENT + ';margin-bottom:20px;"></div>';
  }

  const agentPhone = agent.phone || DEFAULT_AGENT.phone;
  const phoneDigits = agentPhone.replace(/\D/g, '');

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1"/>\n' +
    '  <meta name="x-apple-disable-message-reformatting"/>\n' +
    '  <title>' + (copy.subjectLine || "New Presale Opportunity") + '</title>\n' +
    (copy.previewText ? '  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">' + copy.previewText + '</div>\n' : '') +
    '  <link href="' + googleFontUrl + '" rel="stylesheet"/>\n' +
    '  <style>\n' +
    '    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}\n' +
    '    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}\n' +
    '    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}\n' +
    '    body{margin:0!important;padding:0!important;background:#FDFCFB;}\n' +
    '    *{box-sizing:border-box;}\n' +
    '    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}\n' +
    '    u+#body a{color:inherit!important;text-decoration:none!important;}\n' +
    '    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}\n' +
    '    @media only screen and (max-width:620px){\n' +
    '      .email-container{width:100%!important;max-width:100%!important;}\n' +
    '      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}\n' +
    '      .mobile-pad-sm{padding-left:14px!important;padding-right:14px!important;}\n' +
    '      .mobile-stack td{display:block!important;width:100%!important;text-align:left!important;padding-left:20px!important;padding-right:20px!important;}\n' +
    '      .mobile-stack td:first-child{border-right:none!important;border-bottom:1px solid #e8e3db!important;}\n' +
    '      .mobile-hero-img{min-height:200px!important;}\n' +
    '      .hero-headline{font-size:24px!important;}\n' +
    '      .body-headline{font-size:22px!important;}\n' +
    '      .stat-value{font-size:22px!important;}\n' +
    '      .agent-logo{display:none!important;}\n' +
    '      .agent-photo{width:44px!important;height:44px!important;}\n' +
    '      .agent-photo-cell{padding:14px 0 14px 16px!important;width:60px!important;}\n' +
    '      .agent-info-cell{padding:14px 16px!important;}\n' +
    '      .agent-logo-cell{display:none!important;}\n' +
    '      .fp-cell{display:block!important;width:100%!important;}\n' +
    '      table.mobile-full{width:100%!important;}\n' +
    '    }\n' +
    '  </style>\n</head>\n' +
    '<body style="margin:0;padding:0;background:#FDFCFB;" id="body">\n\n' +

    '<!-- Outer wrapper -->\n' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDFCFB;">\n' +
    '<tr><td align="center" style="padding:24px 12px;">\n\n' +

    '<!-- Email container -->\n' +
    '<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e3db;border-radius:4px;overflow:hidden;">\n\n' +

    // LOGO HEADER
    '  <!-- LOGO HEADER -->\n' +
    '  <tr>\n    <td style="background:#ffffff;padding:12px 36px 10px;text-align:center;border-bottom:2px solid ' + ACCENT + ';">\n' +
    '      <img src="' + LOGO_EMAIL_URL + '" alt="Presale Properties" width="160" border="0" style="display:inline-block;width:160px;max-width:160px;height:auto;" />\n' +
    '    </td>\n  </tr>\n\n' +

    // PROJECT HEADER
    '  <!-- PROJECT HEADER -->\n' +
    '  <tr>\n    <td class="mobile-pad" style="background:' + DARK + ';padding:28px 36px 24px;">\n' +
    '      <p style="margin:0 0 4px 0;font-family:' + bodyFont + ';font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + ACCENT + ';">PRESALE PROPERTIES</p>\n' +
    '      <p class="hero-headline" style="margin:0 0 10px 0;font-family:' + displayFont + ';font-size:32px;font-weight:700;color:#ffffff;line-height:1.1;">' + (copy.projectName || "New Presale Release") + '</p>\n' +
    (byLine ? '      <p style="margin:0 0 10px 0;font-family:' + bodyFont + ';font-size:11px;color:rgba(255,255,255,0.55);">' + byLine + '</p>\n' : '') +
    '      <table cellpadding="0" cellspacing="0" border="0"><tr>\n' +
    '        <td style="width:32px;height:2px;background:' + ACCENT + ';"></td>\n' +
    '        <td style="width:8px;"></td>\n' +
    '        <td style="width:8px;height:2px;background:' + ACCENT + ';opacity:0.4;"></td>\n' +
    '      </tr></table>\n' +
    '    </td>\n  </tr>\n\n' +

    // LOCATION BANNER
    (locationLine ? '  <!-- LOCATION BANNER -->\n  <tr>\n    <td class="mobile-pad" style="background:' + ACCENT + ';padding:9px 36px;">\n' +
    '      <p style="margin:0;font-family:' + bodyFont + ';font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">' + locationLine.toUpperCase() + '</p>\n' +
    '    </td>\n  </tr>\n\n' : '') +

    // HERO STATS BAR
    (statCells ? '  <!-- HERO STATS BAR -->\n  <tr>\n    <td style="background:#f5f3f0;border-bottom:1px solid #e8e3db;padding:0;">\n' +
    '      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack"><tr>' + statCells + '</tr></table>\n' +
    '    </td>\n  </tr>\n\n' : '') +

    // INFO ROWS
    infoRowsHtml +

    // BODY COPY
    '  <!-- BODY COPY -->\n' +
    '  <tr>\n    <td class="mobile-pad" style="padding:36px 36px 28px;">\n' +
    bodyHeadline +
    '      <div style="font-family:' + bodyFont + ';font-size:15px;color:#5c6577;line-height:1.8;">\n' +
    bodyToHtml(copy.bodyCopy || "", bodyFont) +
    '      </div>\n' +
    '    </td>\n  </tr>\n\n' +

    // INCENTIVES
    incentivesHtml +

    // IMAGE CARDS
    imageCardsHtml +

    // CTA
    '  <!-- CTA -->\n' +
    '  <tr>\n    <td style="background:#f5f3f0;padding:32px 36px 36px;">\n' +
    '      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">\n' +
    '        <tr><td align="center" style="background:' + ACCENT + ';padding:18px 24px;text-align:center;border-radius:4px;">\n' +
    '            <a href="' + plansPricingUrl + '" style="font-family:' + bodyFont + ';font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">VIEW PLANS &amp; PRICING &nbsp;&rarr;</a>\n' +
    '        </td></tr>\n      </table>\n' +
    '      <table cellpadding="0" cellspacing="0" border="0" width="100%">\n' +
    '        <tr><td align="center" style="background:' + DARK + ';padding:16px 24px;text-align:center;border-radius:4px;">\n' +
    '            <a href="tel:' + phoneDigits + '" style="font-family:' + bodyFont + ';font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">&#128222;&nbsp; CALL NOW</a>\n' +
    '        </td></tr>\n      </table>\n' +
    '      <p style="margin:16px 0 0 0;font-family:' + bodyFont + ';font-size:11px;color:#5c6577;text-align:center;line-height:1.5;">Questions? Reply to this email or call ' + agentPhone + ' directly.</p>\n' +
    '    </td>\n  </tr>\n\n' +

    // DIVIDER
    '  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e8e3db;"></div></td></tr>\n\n' +

    // AGENT CARD
    '  <!-- This comment is used as injection point for floor plans -->\n' +
    '  <tr>\n    <td bgcolor="#ffffff" style="padding:0;background-color:#ffffff;border-top:2px solid ' + ACCENT + ';">\n' +
    '      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">\n        <tr>\n' +
    (agent.photo_url ? '          <td width="80" valign="middle" class="agent-photo-cell" style="padding:18px 0 18px 20px;vertical-align:middle;line-height:0;font-size:0;">\n' +
    '            <img src="' + agent.photo_url + '" alt="' + agent.full_name + '" width="60" height="60" border="0" class="agent-photo" style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ' + ACCENT + ';-ms-interpolation-mode:bicubic;" />\n' +
    '          </td>\n' : '') +
    '          <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px ' + (agent.photo_url ? "10px" : "20px") + ';vertical-align:middle;">\n' +
    '            <div style="font-family:' + displayFont + ';font-size:17px;font-weight:700;color:' + DARK + ';line-height:1.15;mso-line-height-rule:exactly;margin-bottom:2px;">' + agent.full_name + '</div>\n' +
    '            <div style="font-family:' + bodyFont + ';font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:' + ACCENT + ';mso-line-height-rule:exactly;line-height:1.5;margin-bottom:6px;">' + agent.title + '</div>\n' +
    '            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">\n' +
    (agent.phone ? '              <tr><td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#5c6577;line-height:1;">&#128222;</td>' +
    '<td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:' + agent.phone.replace(/\D/g, "") + '" style="font-family:' + bodyFont + ';font-size:12px;font-weight:400;color:#5c6577;text-decoration:none;">' + agent.phone + '</a></td></tr>\n' : '') +
    (agent.email ? '              <tr><td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#5c6577;line-height:1;">&#9993;</td>' +
    '<td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:' + agent.email + '" style="font-family:' + bodyFont + ';font-size:11px;font-weight:400;color:#5c6577;text-decoration:none;">' + agent.email + '</a></td></tr>\n' : '') +
    '            </table>\n          </td>\n' +
    '          <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">\n' +
    '            <img src="' + LOGO_EMAIL_URL + '" alt="Presale Properties" width="150" border="0" class="agent-logo" style="display:block;width:150px;max-width:150px;height:auto;-ms-interpolation-mode:bicubic;" />\n' +
    '          </td>\n        </tr>\n      </table>\n    </td>\n  </tr>\n\n' +

    // FOOTER
    '  <tr>\n    <td bgcolor="' + DARK + '" class="mobile-pad" style="padding:22px 36px;background-color:' + DARK + ';">\n' +
    '      <div style="font-family:' + bodyFont + ';font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:' + ACCENT + ';margin-bottom:6px;mso-line-height-rule:exactly;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ' + (copy.city ? copy.city.toUpperCase() + ', BC' : 'VANCOUVER, BC') + '</div>\n' +
    '      <div style="font-family:' + bodyFont + ';font-size:12px;font-weight:300;color:rgba(255,255,255,0.6);mso-line-height-rule:exactly;line-height:1.6;"><a href="https://presaleproperties.com" style="color:rgba(255,255,255,0.6);text-decoration:none;">presaleproperties.com</a>' + (agent.phone ? ' &nbsp;&middot;&nbsp; ' + agent.phone : '') + '</div>\n' +
    '    </td>\n  </tr>\n\n' +

    // LEGAL + UNSUBSCRIBE
    '  <tr>\n    <td bgcolor="#f5f3f0" class="mobile-pad" style="padding:24px 36px 28px;background-color:#f5f3f0;border-top:1px solid #e8e3db;">\n' +
    '      <div style="font-family:' + bodyFont + ';font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#5c6577;margin-bottom:12px;mso-line-height-rule:exactly;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>\n' +
    '      <div style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:12px;mso-line-height-rule:exactly;">' +
    'This email was sent by ' + agent.full_name + ', a licensed REALTOR&reg; with Presale Properties. We act as buyer\'s agents &mdash; we represent <strong style="font-weight:500;color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).' +
    '</div>\n' +
    '      <div style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888888;line-height:1.8;margin-bottom:18px;mso-line-height-rule:exactly;">' +
    'You are receiving this because you opted in to presale updates from Presale Properties. Per Canada\'s Anti-Spam Legislation (CASL), you may withdraw consent at any time.' +
    '</div>\n' +
    '      <div>\n' +
    '        <a href="*|UNSUB|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Unsubscribe</a>\n' +
    '        <span style="color:#cccccc;margin:0 10px;">&middot;</span>\n' +
    '        <a href="*|UPDATE_PROFILE|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">Update Preferences</a>\n' +
    '        <span style="color:#cccccc;margin:0 10px;">&middot;</span>\n' +
    '        <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888888;text-decoration:underline;">View in Browser</a>\n' +
    '      </div>\n    </td>\n  </tr>\n\n' +

    '</table>\n<!-- /Email container -->\n\n</td></tr>\n</table>\n<!-- /Outer wrapper -->\n\n</body>\n</html>';
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP TEMPLATE — editorial magazine layout with CSS hero slideshow
// ─────────────────────────────────────────────────────────────────────────────

function buildSlideshowCss(n: number, duration = 8): string {
  if (n <= 1) return "";
  const total = n * duration;
  const frames: string[] = [];

  for (let i = 0; i < n; i++) {
    const startSec = i * duration;
    const endSec = (i + 1) * duration;
    const p = (s: number) => Math.round((s / total) * 1000) / 10 + "%";

    if (i === 0) {
      frames.push(
        "@keyframes pp-s0{0%{opacity:1}" + p(endSec - 1) + "{opacity:1}" + p(endSec) + "{opacity:0}" + p(total - 1) + "{opacity:0}100%{opacity:1}}"
      );
    } else {
      frames.push(
        "@keyframes pp-s" + i + "{0%{opacity:0}" + p(startSec) + "{opacity:0}" + p(startSec + 1) + "{opacity:1}" + p(endSec - 1) + "{opacity:1}" + p(endSec) + "{opacity:0}100%{opacity:0}}"
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
  const ACCENT = "#C9A55A";
  const DARK = "#1a2332";
  const DARK2 = "#232d3e";
  const plansPricingUrl = ctaUrl || "https://presaleproperties.com";
  const displayFont = font?.display || DEF_DISPLAY;
  const bodyFont = font?.body || DEF_BODY;
  const googleFontUrl = font?.googleUrl || DEF_GFONT;

  const slides = heroSlides.filter(Boolean);
  const nSlides = slides.length;
  const duration = 8;
  const totalDur = nSlides * duration;
  const slideCss = buildSlideshowCss(nSlides, duration);
  const incentives = parseIncentives(copy.incentiveText || "");
  const locationLine = [copy.neighborhood, copy.city].filter(Boolean).join(", ");

  // Hero section HTML
  let heroHtml = "";
  if (slides.length === 1) {
    heroHtml = '  <tr><td style="padding:0;line-height:0;font-size:0;">' +
      '<img src="' + slides[0] + '" alt="' + (copy.projectName || "Project") + '" width="600" style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;" />' +
      '</td></tr>\n';
  } else if (slides.length > 1) {
    let imgTags = "";
    slides.forEach((url, i) => {
      imgTags += '<img src="' + url + '" alt="' + (copy.projectName || "Project") + ' – image ' + (i + 1) + '" width="600" style="display:block;width:100%;height:320px;object-fit:cover;' + (i > 0 ? "position:absolute;top:0;left:0;" : "") + 'opacity:' + (i === 0 ? 1 : 0) + ';animation:pp-s' + i + ' ' + totalDur + 's linear infinite;" />';
    });
    heroHtml = '  <tr><td style="padding:0;line-height:0;font-size:0;position:relative;height:320px;overflow:hidden;">' +
      '<div style="position:relative;width:100%;height:320px;overflow:hidden;display:block;line-height:0;font-size:0;">' + imgTags + '</div></td></tr>\n';
  }

  // Stats strip
  let statCells = "";
  if (copy.startingPrice) {
    statCells += '<td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">' +
      '<p class="loop-stat-val" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:' + ACCENT + ';">' + copy.startingPrice + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Starting From</p></td>';
  }
  if (copy.deposit) {
    statCells += '<td style="padding:14px 20px 12px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">' +
      '<p class="loop-stat-val" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:#ffffff;">' + copy.deposit + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Deposit</p></td>';
  }
  if (copy.completion) {
    statCells += '<td style="padding:14px 20px 12px;text-align:center;">' +
      '<p class="loop-stat-val" style="margin:0 0 3px 0;font-family:' + displayFont + ';font-size:22px;font-weight:700;color:#ffffff;">' + copy.completion + '</p>' +
      '<p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,165,90,0.55);">Completion</p></td>';
  }

  // Info table
  let infoRowsHtml = "";
  if (copy.infoRows && copy.infoRows.filter(r => r.includes("|")).length > 0) {
    const rows = copy.infoRows.filter(r => r.includes("|"));
    let rowsInner = "";
    rows.forEach((row, i) => {
      const parts = row.split("|").map(s => s.trim());
      const isLast = i === rows.length - 1;
      rowsInner += '<tr><td style="padding:10px 16px;background:#f5f3f0;border-right:1px solid #e8e3db;width:40%;' + (!isLast ? "border-bottom:1px solid #e8e3db;" : "") + '">' +
        '<p style="margin:0;font-family:' + bodyFont + ';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5c6577;">' + parts[0] + '</p></td>' +
        '<td style="padding:10px 16px;background:#ffffff;' + (!isLast ? "border-bottom:1px solid #e8e3db;" : "") + '">' +
        '<p style="margin:0;font-family:' + bodyFont + ';font-size:13px;font-weight:600;color:' + DARK + ';">' + parts[1] + '</p></td></tr>';
    });
    infoRowsHtml = '  <tr><td class="mobile-pad" style="padding:0 36px 28px;background:#ffffff;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e3db;border-radius:4px;overflow:hidden;">' + rowsInner + '</table></td></tr>\n';
  }

  // Incentives
  let incentivesHtml = "";
  if (incentives.length > 0) {
    let items = "";
    incentives.forEach(item => {
      items += '<tr><td style="padding:0 0 11px 0;vertical-align:top;width:14px;"><div style="width:4px;height:4px;background:' + ACCENT + ';margin-top:8px;"></div></td>' +
        '<td style="padding:0 0 11px 12px;vertical-align:top;"><p style="margin:0;font-family:' + bodyFont + ';font-size:14px;color:rgba(255,255,255,0.75);line-height:1.75;">' + item + '</p></td></tr>';
    });
    incentivesHtml = '  <tr><td class="mobile-pad" style="background:' + DARK + ';padding:30px 36px 26px;border-top:3px solid ' + ACCENT + ';">' +
      '<p style="margin:0 0 18px 0;font-family:' + displayFont + ';font-size:24px;font-weight:700;color:#ffffff;">What\'s Included</p>' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' + items + '</table></td></tr>\n';
  }

  const agentPhone = agent.phone || DEFAULT_AGENT.phone;
  const phoneDigits = agentPhone.replace(/\D/g, "");

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1"/>\n' +
    '  <meta name="x-apple-disable-message-reformatting"/>\n' +
    '  <title>' + (copy.subjectLine || "New Presale Opportunity") + '</title>\n' +
    (copy.previewText ? '  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">' + copy.previewText + '</div>\n' : '') +
    '  <link href="' + googleFontUrl + '" rel="stylesheet"/>\n' +
    '  <style>\n' +
    '    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}\n' +
    '    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}\n' +
    '    img{-ms-interpolation-mode:bicubic;border:0;line-height:100%;outline:none;text-decoration:none;}\n' +
    '    body{margin:0!important;padding:0!important;background:#FDFCFB;}\n' +
    '    *{box-sizing:border-box;}\n' +
    '    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}\n' +
    '    u+#body a{color:inherit!important;text-decoration:none!important;}\n' +
    '    #MessageViewBody a{color:inherit!important;text-decoration:none!important;}\n' +
    (slideCss ? '    ' + slideCss + '\n' : '') +
    '    @media only screen and (max-width:620px){\n' +
    '      .email-container{width:100%!important;max-width:100%!important;}\n' +
    '      .mobile-pad{padding-left:20px!important;padding-right:20px!important;}\n' +
    '      .loop-hero-cell{height:220px!important;}\n' +
    '      .loop-hero-cell div{height:220px!important;}\n' +
    '      .loop-hero-cell img{height:220px!important;}\n' +
    '      .loop-project{font-size:30px!important;line-height:1.1!important;}\n' +
    '      .loop-headline{font-size:24px!important;line-height:1.2!important;}\n' +
    '      .loop-stat-val{font-size:20px!important;}\n' +
    '      .mobile-stack td{display:block!important;width:100%!important;text-align:left!important;padding-left:20px!important;padding-right:20px!important;}\n' +
    '      .mobile-stack td:first-child{border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.07)!important;}\n' +
    '      .agent-photo{width:44px!important;height:44px!important;}\n' +
    '      .agent-photo-cell{padding:14px 0 14px 16px!important;width:60px!important;}\n' +
    '      .agent-info-cell{padding:14px 16px!important;}\n' +
    '      .agent-logo-cell{display:none!important;}\n' +
    '    }\n  </style>\n</head>\n' +
    '<body style="margin:0;padding:0;background:#FDFCFB;" id="body">\n\n' +

    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDFCFB;">\n' +
    '<tr><td align="center" style="padding:24px 12px;">\n\n' +

    '<table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e3db;border-radius:4px;overflow:hidden;">\n\n' +

    // LOGO HEADER
    '  <tr><td style="background:#ffffff;padding:24px 36px 18px;text-align:center;border-bottom:1px solid #e8e3db;">' +
    '<img src="' + LOGO_EMAIL_URL + '" alt="Presale Properties" width="180" border="0" style="display:inline-block;width:180px;max-width:180px;height:auto;" />' +
    '</td></tr>\n\n' +

    // MASTHEAD
    '  <tr><td class="mobile-pad" style="background:' + DARK + ';padding:18px 36px 16px;border-bottom:1px solid rgba(201,165,90,0.2);">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td><p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:3.5px;text-transform:uppercase;color:' + ACCENT + ';">PRESALE PROPERTIES' + (locationLine ? ' &nbsp;&middot;&nbsp; ' + locationLine.toUpperCase() : '') + '</p></td>' +
    '<td align="right"><p style="margin:0;font-family:' + bodyFont + ';font-size:8px;letter-spacing:1.5px;color:rgba(201,165,90,0.35);text-transform:uppercase;">Exclusive Release</p></td>' +
    '</tr></table></td></tr>\n\n' +

    // PROJECT NAMEPLATE
    '  <tr><td class="mobile-pad" style="background:' + DARK + ';padding:24px 36px 30px;">\n' +
    (copy.developerName ? '    <p style="margin:0 0 7px 0;font-family:' + bodyFont + ';font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">' + copy.developerName + '</p>\n' : '') +
    '    <p class="loop-project" style="margin:0 0 14px 0;font-family:' + displayFont + ';font-size:44px;font-weight:800;color:#ffffff;line-height:1.0;letter-spacing:-0.5px;">' + (copy.projectName || "New Presale Release") + '</p>\n' +
    '    <table cellpadding="0" cellspacing="0" border="0"><tr><td style="width:44px;height:2px;background:' + ACCENT + ';"></td><td style="width:8px;"></td><td style="width:12px;height:2px;background:' + ACCENT + ';opacity:0.3;"></td></tr></table>\n' +
    '  </td></tr>\n\n' +

    heroHtml +

    // DARK STATS STRIP
    (statCells ? '  <tr><td style="background:' + DARK2 + ';padding:0;border-top:1px solid rgba(201,165,90,0.18);">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-stack"><tr>' + statCells + '</tr></table></td></tr>\n\n' : '') +

    // BODY COPY
    '  <tr><td class="mobile-pad" style="padding:40px 36px 32px;background:#ffffff;">\n' +
    (copy.headline ? '    <p class="loop-headline" style="margin:0 0 16px 0;font-family:' + displayFont + ';font-size:32px;font-weight:700;color:' + DARK + ';line-height:1.2;letter-spacing:-0.3px;">' + copy.headline + '</p>\n' +
    '    <div style="width:36px;height:2px;background:' + ACCENT + ';margin-bottom:22px;"></div>\n' : '') +
    '    <div style="font-family:' + bodyFont + ';font-size:15px;color:#5c6577;line-height:1.85;">' + bodyToHtml(copy.bodyCopy || "", bodyFont) + '</div>\n' +
    '  </td></tr>\n\n' +

    infoRowsHtml +
    incentivesHtml +

    // CTA
    '  <tr><td style="background:#f5f3f0;padding:36px 36px;text-align:center;border-top:1px solid #e8e3db;">\n' +
    '    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;"><tr>' +
    '<td align="center" style="background:' + ACCENT + ';padding:20px 32px;border-radius:4px;">' +
    '<a href="' + plansPricingUrl + '" style="font-family:' + bodyFont + ';font-size:11px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">VIEW PLANS &amp; PRICING &nbsp;&rarr;</a>' +
    '</td></tr></table>\n' +
    '    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
    '<td align="center" style="background:' + DARK + ';padding:16px 24px;border-radius:4px;">' +
    '<a href="tel:' + phoneDigits + '" style="font-family:' + bodyFont + ';font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;line-height:1;">&#128222;&nbsp; CALL NOW</a>' +
    '</td></tr></table>\n' +
    '    <p style="margin:16px 0 0 0;font-family:' + bodyFont + ';font-size:11px;color:#5c6577;text-align:center;line-height:1.5;">Questions? Reply to this email or call ' + agentPhone + ' directly.</p>\n' +
    '  </td></tr>\n\n' +

    // AGENT CARD
    '  <!-- This comment is used as injection point for floor plans -->\n' +
    '  <tr><td bgcolor="#ffffff" style="padding:0;background-color:#ffffff;border-top:2px solid ' + ACCENT + ';">\n' +
    '    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>\n' +
    (agent.photo_url ? '      <td width="80" valign="middle" class="agent-photo-cell" style="padding:18px 0 18px 20px;vertical-align:middle;line-height:0;font-size:0;">' +
    '<img src="' + agent.photo_url + '" alt="' + agent.full_name + '" width="60" height="60" border="0" class="agent-photo" style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid ' + ACCENT + ';-ms-interpolation-mode:bicubic;" /></td>\n' : '') +
    '      <td valign="middle" class="agent-info-cell" style="padding:18px 12px 18px ' + (agent.photo_url ? "10px" : "20px") + ';vertical-align:middle;">\n' +
    '        <div style="font-family:' + displayFont + ';font-size:17px;font-weight:700;color:' + DARK + ';line-height:1.15;margin-bottom:2px;">' + agent.full_name + '</div>\n' +
    '        <div style="font-family:' + bodyFont + ';font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:' + ACCENT + ';line-height:1.5;margin-bottom:6px;">' + agent.title + '</div>\n' +
    '        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">\n' +
    (agent.phone ? '          <tr><td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#5c6577;line-height:1;">&#128222;</td>' +
    '<td style="padding-bottom:3px;vertical-align:middle;"><a href="tel:' + agent.phone.replace(/\D/g, "") + '" style="font-family:' + bodyFont + ';font-size:12px;color:#5c6577;text-decoration:none;">' + agent.phone + '</a></td></tr>\n' : '') +
    (agent.email ? '          <tr><td style="padding-bottom:3px;padding-right:6px;vertical-align:middle;font-size:10px;color:#5c6577;line-height:1;">&#9993;</td>' +
    '<td style="padding-bottom:3px;vertical-align:middle;"><a href="mailto:' + agent.email + '" style="font-family:' + bodyFont + ';font-size:11px;color:#5c6577;text-decoration:none;">' + agent.email + '</a></td></tr>\n' : '') +
    '        </table>\n      </td>\n' +
    '      <td align="right" valign="middle" class="agent-logo-cell" style="padding:18px 24px 18px 12px;vertical-align:middle;">' +
    '<img src="' + LOGO_EMAIL_URL + '" alt="Presale Properties" width="150" border="0" class="agent-logo" style="display:block;width:150px;max-width:150px;height:auto;" /></td>\n' +
    '    </tr></table>\n  </td></tr>\n\n' +

    // FOOTER
    '  <tr><td bgcolor="' + DARK + '" class="mobile-pad" style="padding:22px 36px;background-color:' + DARK + ';">\n' +
    '    <div style="font-family:' + bodyFont + ';font-size:9px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:' + ACCENT + ';margin-bottom:6px;line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ' + (copy.city ? copy.city.toUpperCase() + ', BC' : 'VANCOUVER, BC') + '</div>\n' +
    '    <div style="font-family:' + bodyFont + ';font-size:12px;font-weight:300;color:rgba(255,255,255,0.6);line-height:1.6;"><a href="https://presaleproperties.com" style="color:rgba(255,255,255,0.6);text-decoration:none;">presaleproperties.com</a>' + (agent.phone ? ' &nbsp;&middot;&nbsp; ' + agent.phone : '') + '</div>\n' +
    '  </td></tr>\n\n' +

    // LEGAL + UNSUBSCRIBE
    '  <tr><td bgcolor="#f5f3f0" class="mobile-pad" style="padding:24px 36px 28px;background-color:#f5f3f0;border-top:1px solid #e8e3db;">\n' +
    '    <div style="font-family:' + bodyFont + ';font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#5c6577;margin-bottom:12px;line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>\n' +
    '    <div style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:12px;">' +
    'This email was sent by ' + agent.full_name + ', a licensed REALTOR&reg; with Presale Properties. We act as buyer\'s agents &mdash; we represent <strong style="font-weight:500;color:#666;">you</strong>, not the developer. This is <strong style="font-weight:500;color:#666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).' +
    '</div>\n' +
    '    <div style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888;line-height:1.8;margin-bottom:18px;">' +
    'You are receiving this because you opted in to presale updates from Presale Properties. Per Canada\'s Anti-Spam Legislation (CASL), you may withdraw consent at any time.' +
    '</div>\n' +
    '    <div>\n' +
    '      <a href="*|UNSUB|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Unsubscribe</a>\n' +
    '      <span style="color:#ccc;margin:0 10px;">&middot;</span>\n' +
    '      <a href="*|UPDATE_PROFILE|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888;text-decoration:underline;">Update Preferences</a>\n' +
    '      <span style="color:#ccc;margin:0 10px;">&middot;</span>\n' +
    '      <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:' + bodyFont + ';font-size:11px;font-weight:300;color:#888;text-decoration:underline;">View in Browser</a>\n' +
    '    </div>\n  </td></tr>\n\n' +

    '</table>\n<!-- /Loop email container -->\n\n</td></tr>\n</table>\n\n</body>\n</html>';
}
