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

/** Convert \n-separated body copy paragraphs into HTML */
function bodyToHtml(text: string, accentColor: string): string {
  if (!text) return "";
  const paras = text.split("\n").filter(Boolean);
  return paras
    .map(p => `<p style="margin:0 0 14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#444444;line-height:1.75;">${p}</p>`)
    .join("");
}

export function buildAiEmailHtml(copy: AiEmailCopy): string {
  const ACCENT = "#C9A55A";
  const DARK = "#0d1f18";
  const incentives = parseIncentives(copy.incentiveText || "");

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
        ${bodyToHtml(copy.bodyCopy || "", ACCENT)}
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
            <a href="https://presaleproperties.com/book" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">BOOK A PRIVATE CONSULTATION →</a>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border:1.5px solid ${ACCENT};padding:12px 36px;">
            <a href="https://presaleproperties.com" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};text-decoration:none;display:block;">VIEW ALL PROJECTS & FLOOR PLANS</a>
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

  <!-- ─── SIGNATURE ─── -->
  <tr>
    <td style="padding:24px 36px 28px;">
      <p style="margin:0 0 2px 0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#111111;">Uzair Muhammad</p>
      <p style="margin:0 0 1px 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888888;">Presale Specialist · Presale Properties</p>
      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:${ACCENT};">presaleproperties.com</p>
      <p style="margin:10px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#aaaaaa;line-height:1.5;">
        I represent buyers — not developers. My services are at no extra cost to you.<br/>
        English · Punjabi · Hindi · Urdu
      </p>
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td style="background:#f7f5f1;border-top:1px solid #e8e3db;padding:16px 36px;">
      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#aaaaaa;line-height:1.6;">
        You're receiving this because you registered for VIP access or requested information about presale projects in Metro Vancouver and the Fraser Valley. 
        <a href="#" style="color:#aaaaaa;">Unsubscribe</a>
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
