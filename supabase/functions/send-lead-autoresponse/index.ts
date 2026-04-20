import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/gmail-smtp.ts";

/**
 * send-lead-autoresponse
 * ─────────────────────────────────────────────────────────────
 * Called when a lead submits a floor plan / pricing request.
 * Auto-generates and sends a branded email with project details.
 * 
 * - If project has brochure/floorplan files → sends Template A (with docs)
 * - If no files available → sends Template B (agent follow-up)
 * 
 * Body: { leadId: string, projectId?: string }
 */

const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

interface ProjectData {
  name: string;
  city?: string;
  neighborhood?: string;
  developer_name?: string;
  featured_image?: string;
  gallery_images?: string[];
  og_image?: string;
  price_range?: string;
  starting_price?: number;
  deposit_structure?: string;
  deposit_percent?: number;
  completion_year?: number;
  completion_month?: number;
  slug?: string;
  brochure_files?: string[];
  floorplan_files?: string[];
  pricing_sheets?: string[];
}

interface AgentData {
  full_name: string;
  title: string;
  photo_url?: string | null;
  phone: string;
  email: string;
}

const DEFAULT_AGENT: AgentData = {
  full_name: "Uzair Muhammad",
  title: "Presale Specialist",
  photo_url: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1772579582217-unijnf.jpg",
  phone: "778-231-3592",
  email: "info@presaleproperties.com",
};

// Internal-copy agent (Zara). Internal notifications to info@ are signed by Zara
// so the team can quickly forward to the right outside agent for follow-up.
const ZARA_AGENT: AgentData = {
  full_name: "Zara Malik",
  title: "Operations & Partnerships Manager",
  photo_url: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/zara-malik-headshot.png",
  phone: "(672) 258-1100",
  email: "info@presaleproperties.com",
};

const INTERNAL_RECIPIENT = "info@presaleproperties.com";

interface LeadInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  lead_source?: string | null;
  persona?: string | null;
  agent_status?: string | null;
}

function internalLeadBanner(lead: LeadInfo, projectName?: string): string {
  const rows: { label: string; value: string }[] = [];
  if (lead.name) rows.push({ label: "Name", value: lead.name });
  if (lead.email) rows.push({ label: "Email", value: lead.email });
  if (lead.phone) rows.push({ label: "Phone", value: lead.phone });
  if (lead.lead_source) rows.push({ label: "Source", value: lead.lead_source.replace(/_/g, " ") });
  if (lead.persona) rows.push({ label: "Persona", value: lead.persona });
  if (lead.agent_status) rows.push({ label: "Agent Status", value: lead.agent_status.replace(/_/g, " ") });
  if (projectName) rows.push({ label: "Project", value: projectName });

  return `<tr><td style="padding:0;background:#fff8e6;border-bottom:2px solid ${ACCENT};">
<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td class="content-pad" style="padding:20px 40px;">
<p style="margin:0 0 10px 0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">🔔 INTERNAL — NEW LEAD · FORWARD TO AGENT</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:${F};font-size:13px;color:${DARK};">
${rows.map(r => `<tr><td style="padding:3px 0;width:110px;color:#777;font-weight:600;">${r.label}:</td><td style="padding:3px 0;font-weight:600;">${r.value}</td></tr>`).join("")}
</table>
</td></tr></table>
</td></tr>`;
}

/**
 * Build an internal copy of an outbound email by prepending a lead-context banner
 * and re-rendering the agent card as Zara. Returns the same HTML shell with
 * a banner at the top and Zara's signature replacing the customer-facing agent.
 */
function buildInternalCopy(originalHtml: string, lead: LeadInfo, projectName: string | undefined, customerAgent: AgentData): string {
  // Inject the banner immediately after the opening container table row.
  const banner = internalLeadBanner(lead, projectName);
  let html = originalHtml.replace(
    /(<table[^>]*class="email-container"[^>]*>)/,
    `$1${banner}`
  );

  // Swap the customer-facing agent block for Zara's by replacing the agent card.
  // We rebuild it cleanly using the same agentCard() helper.
  // Strategy: find the gold accent strip + agent card section and replace with Zara's card.
  // Identify via the unique agent name string.
  if (customerAgent.full_name && html.includes(customerAgent.full_name)) {
    html = html.split(customerAgent.full_name).join(ZARA_AGENT.full_name);
  }
  if (customerAgent.title && html.includes(customerAgent.title)) {
    html = html.split(customerAgent.title).join(ZARA_AGENT.title);
  }
  if (customerAgent.phone && html.includes(customerAgent.phone)) {
    html = html.split(customerAgent.phone).join(ZARA_AGENT.phone);
  }
  if (customerAgent.photo_url && html.includes(customerAgent.photo_url)) {
    html = html.split(customerAgent.photo_url).join(ZARA_AGENT.photo_url || "");
  }
  // Replace the "Talk soon, Uzair" sign-off if present
  html = html.replace(/<strong style="font-weight:700;color:#111111;">Uzair<\/strong>/g, `<strong style="font-weight:700;color:${DARK};">Zara</strong>`);

  return html;
}

async function sendInternalCopy(params: {
  supabase: any;
  supabaseUrl: string;
  originalHtml: string;
  originalSubject: string;
  lead: LeadInfo & { id: string };
  projectName?: string;
  customerAgent: AgentData;
  templateType: string;
}): Promise<void> {
  try {
    const internalHtml = buildInternalCopy(params.originalHtml, params.lead, params.projectName, params.customerAgent);
    const internalSubject = `[Lead] ${params.lead.name || "New lead"} — ${params.projectName || params.originalSubject}`;

    const trackingId = crypto.randomUUID();
    const trackingPixelUrl = `${params.supabaseUrl}/functions/v1/track-email-open?tid=${trackingId}`;
    const htmlWithPixel = internalHtml.replace(
      "</body>",
      `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" /></body>`,
    );

    const result = await sendEmail({
      to: INTERNAL_RECIPIENT,
      subject: internalSubject,
      html: htmlWithPixel,
      fromName: "Zara Malik | Presale Properties",
      replyTo: params.lead.email || undefined,
      skipAdminBcc: true,
    });

    await params.supabase.from("email_logs").insert({
      email_to: INTERNAL_RECIPIENT,
      recipient_name: "Zara Malik (Internal)",
      subject: internalSubject,
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
      template_type: `internal_${params.templateType}`,
      lead_id: params.lead.id,
      tracking_id: trackingId,
    });

    if (!result.success) {
      console.error("[send-lead-autoresponse] Internal copy failed:", result.error);
    } else {
      console.log(`[send-lead-autoresponse] Internal Zara copy sent to ${INTERNAL_RECIPIENT}`);
    }
  } catch (e) {
    console.error("[send-lead-autoresponse] Internal copy error:", e);
  }
}

function emailShell(content: string, previewText?: string, subjectLine?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<title>${subjectLine || "Presale Properties"}</title>
<link href="${GOOGLE_FONT}" rel="stylesheet"/>
<style>
:root{color-scheme:light only;}
body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;max-width:100%;}
body{margin:0!important;padding:0!important;background:#faf8f4;width:100%!important;}
@media only screen and (max-width:620px){
.email-container{width:100%!important;max-width:100%!important;border:none!important;border-radius:0!important;}
.outer-td{padding:0!important;}
.content-pad{padding-left:24px!important;padding-right:24px!important;}
.stat-cell{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #e8e2d6!important;padding:14px 24px!important;text-align:left!important;}
.cta-table{width:100%!important;}
.cta-td{width:100%!important;border-radius:50px!important;padding:18px 24px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#faf8f4;" id="body">
${previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${previewText}&zwnj;</span>` : ""}
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;margin:0;padding:0;">
<tr><td class="outer-td" align="center" style="padding:24px 0;">
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
${content}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heroBlock(heroImage?: string, projectName?: string): string {
  if (!heroImage) {
    return `<tr><td class="content-pad" style="background:#111111;padding:32px 40px;"><p style="margin:0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p></td></tr>`;
  }
  return `<tr><td style="padding:0;margin:0;line-height:0;font-size:0;"><img src="${heroImage}" alt="${projectName || "New Presale"}" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;" /></td></tr>`;
}

function headlineBlock(project: ProjectData): string {
  return `<tr><td class="content-pad" style="padding:40px 40px 28px;background:#ffffff;">
<p style="margin:0 0 6px 0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">${project.city ? project.city.toUpperCase() : "PRESALE PROPERTIES"}${project.developer_name ? ` &nbsp;·&nbsp; ${project.developer_name.toUpperCase()}` : ""}</p>
<p style="margin:0;font-family:${F};font-size:36px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1px;">${project.name}</p>
</td></tr>`;
}

function statsBar(project: ProjectData): string {
  const stats: { value: string; label: string }[] = [];
  const priceDisplay = project.price_range || (project.starting_price ? `From $${project.starting_price.toLocaleString()}` : null);
  if (priceDisplay) stats.push({ value: priceDisplay, label: "Starting From" });
  // Use deposit_structure if meaningful, otherwise fall back to deposit_percent
  const depositDisplay = (project.deposit_structure && project.deposit_structure.toLowerCase() !== "unknown")
    ? project.deposit_structure
    : (project.deposit_percent ? `${project.deposit_percent}%` : null);
  if (depositDisplay) stats.push({ value: depositDisplay, label: "Deposit" });
  const completionStr = project.completion_year ? (project.completion_month ? `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][project.completion_month - 1]} ${project.completion_year}` : `${project.completion_year}`) : null;
  if (completionStr) stats.push({ value: completionStr, label: "Completion" });
  if (stats.length === 0) return "";

  return `<tr><td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;"><tr>
${stats.map((s, i) => `<td class="stat-cell" style="padding:18px 20px;${i < stats.length - 1 ? `border-right:1px solid #e8e2d6;` : ""}text-align:left;vertical-align:middle;">
<p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${s.value}</p>
<p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">${s.label}</p>
</td>`).join("")}
</tr></table>
</td></tr>`;
}

function agentCard(agent: AgentData, city?: string): string {
  return `
<tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>
<tr><td style="padding:0;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%">
${agent.photo_url ? `<tr><td align="center" style="padding:28px 24px 12px;"><img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${ACCENT};" /></td></tr>` : ""}
<tr><td align="center" style="padding:0 24px 8px;text-align:center;">
<p style="margin:0 0 4px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${agent.full_name}</p>
<p style="margin:0 0 12px 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${agent.title}</p>
${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555555;text-decoration:none;">${agent.phone}</a></p>` : ""}
${agent.email ? `<p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;"><a href="mailto:${agent.email}" style="color:#8a7e6b;text-decoration:none;">${agent.email}</a></p>` : ""}
</td></tr>
<tr><td align="center" style="padding:16px 24px 24px;border-top:1px solid #e8e2d6;text-align:center;">
<img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" style="display:inline-block;width:110px;height:auto;" />
</td></tr>
</table>
</td></tr>
<tr><td class="content-pad" style="padding:20px 40px;background:#111111;">
<p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${city ? `${city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
<p style="margin:0;font-family:${F};font-size:12px;color:#888888;"><a href="https://presaleproperties.com" style="color:#888888;text-decoration:none;">presaleproperties.com</a> &nbsp;·&nbsp; ${agent.phone}</p>
</td></tr>
<tr><td class="content-pad" style="padding:20px 40px 24px;background:#faf8f4;border-top:1px solid #e8e2d6;">
<p style="margin:0 0 8px 0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#777777;">LEGAL DISCLAIMER</p>
<p style="margin:0;font-family:${F};font-size:11px;color:#aaaaaa;line-height:1.7;">This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer&rsquo;s agents. This is <strong style="font-weight:600;color:#888888;">not an offering for sale</strong>. Prices and availability subject to change. E.&amp;O.E.</p>
</td></tr>`;
}

function docButtons(project: ProjectData): string {
  const docs: { label: string; url: string; icon: string }[] = [];
  if (project.brochure_files?.length) docs.push({ label: "VIEW BROCHURE", url: project.brochure_files[0], icon: "📄" });
  if (project.floorplan_files?.length) docs.push({ label: "VIEW FLOOR PLANS", url: project.floorplan_files[0], icon: "📐" });
  if (project.pricing_sheets?.length) docs.push({ label: "VIEW PRICING", url: project.pricing_sheets[0], icon: "💰" });
  if (docs.length === 0) return "";

  return `<tr><td class="content-pad" style="padding:0 40px 28px;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border-radius:8px;border:1px solid #e8e2d6;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 14px 0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">YOUR REQUESTED DOCUMENTS</p>
${docs.map(d => `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;"><tr>
<td style="background:${DARK};border-radius:8px;padding:14px 20px;text-align:center;">
<a href="${d.url}" target="_blank" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">${d.icon} &nbsp; ${d.label}</a>
</td></tr></table>`).join("")}
</td></tr>
</table>
</td></tr>`;
}

function buildLeadMagnetEmail(firstName: string, pdfUrl: string, agent: AgentData): string {
  const subjectLine = "Your Free Guide: 7 Costly Mistakes Presale Buyers Make";
  const safePdfUrl = pdfUrl || "https://presaleproperties.com/resources/7-mistakes-guide";
  const ctaLabel = pdfUrl ? "DOWNLOAD YOUR GUIDE (PDF)" : "READ YOUR GUIDE";

  const body = `
<tr><td class="content-pad" style="padding:48px 40px 24px;background:#ffffff;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="padding:0 0 8px 0;">
      <p style="margin:0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">YOUR FREE GUIDE</p>
    </td></tr>
    <tr><td style="padding:0 0 24px 0;">
      <p style="margin:0;font-family:${F};font-size:30px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">7 Costly Mistakes Presale Buyers Make</p>
    </td></tr>
    <tr><td style="padding:0 0 18px 0;">
      <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:0 0 18px 0;">
      <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Thanks for grabbing the guide. I put this together because I see the same mistakes <strong style="font-weight:700;color:${DARK};">cost buyers tens of thousands of dollars</strong> on presale purchases in Metro Vancouver every year &mdash; mistakes that are completely avoidable when you know what to look for.</p>
    </td></tr>
    <tr><td style="padding:0 0 28px 0;">
      <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Inside you'll learn how to <strong style="font-weight:700;color:${DARK};">read assignment clauses</strong>, what really happens between deposit and completion, and the questions every buyer should ask <strong style="font-weight:700;color:${DARK};">before</strong> signing.</p>
    </td></tr>
  </table>
</td></tr>
<tr><td class="content-pad" style="padding:0 40px 32px;background:#ffffff;">
  <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td class="cta-td" align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;text-align:center;">
      <a href="${safePdfUrl}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">${ctaLabel}</a>
    </td>
  </tr></table>
</td></tr>
<tr><td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="padding:0 0 14px 0;border-top:1px solid #e8e2d6;padding-top:28px;">
      <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Once you've had a read, I'd love to hear what stood out. If you have a project in mind &mdash; or you're not sure where to start &mdash; just reply to this email or text me directly. I'll point you in the right direction with no pressure.</p>
    </td></tr>
    <tr><td style="padding:0;">
      <p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Talk soon,<br/><strong style="font-weight:700;color:${DARK};">Uzair</strong></p>
    </td></tr>
  </table>
</td></tr>
${agentCard(agent, undefined)}`;

  return emailShell(body, "Your Free Guide: 7 Costly Mistakes Presale Buyers Make", subjectLine);
}

function buildTemplateA(project: ProjectData, firstName: string, agent: AgentData): string {
  const subjectLine = `${project.name} — Your Requested Floor Plans & Details`;

  return emailShell(`
${heroBlock(project.featured_image, project.name)}
${headlineBlock(project)}
${statsBar(project)}
<tr><td class="content-pad" style="padding:36px 40px 20px;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:0 0 18px 0;"><p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Hi ${firstName},</p></td></tr>
<tr><td style="padding:0 0 18px 0;"><p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Thank you for your interest in <strong style="font-weight:700;color:${DARK};">${project.name}</strong>${project.city ? ` in <strong style="font-weight:700;color:${DARK};">${project.city}</strong>` : ""}${project.developer_name ? ` by ${project.developer_name}` : ""}. Here are the documents you requested &mdash; tap to view or download.</p></td></tr>
</table>
</td></tr>
${docButtons(project)}
<tr><td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
<table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td class="cta-td" align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;text-align:center;">
<a href="tel:${agent.phone.replace(/\D/g, "")}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">CALL NOW &nbsp; ${agent.phone}</a>
</td></tr></table>
</td></tr>
${agentCard(agent, project.city)}`,
  `${project.name} — Your Requested Floor Plans & Details`,
  subjectLine);
}

function buildTemplateB(project: ProjectData, firstName: string, agent: AgentData, projectUrl?: string): string {
  const subjectLine = `${project.name} — We'll Be in Touch Shortly`;

  return emailShell(`
${heroBlock(project.featured_image, project.name)}
${headlineBlock(project)}
${statsBar(project)}
<tr><td class="content-pad" style="padding:36px 40px 16px;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:0 0 18px 0;"><p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Hi ${firstName},</p></td></tr>
<tr><td style="padding:0 0 18px 0;"><p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">Thank you for your interest in <strong style="font-weight:700;color:${DARK};">${project.name}</strong>${project.city ? ` in <strong style="font-weight:700;color:${DARK};">${project.city}</strong>` : ""}.</p></td></tr>
<tr><td style="padding:0 0 18px 0;"><p style="margin:0;font-family:${F};font-size:16px;color:#444444;line-height:1.75;">The detailed floor plans and pricing information for this project is <strong style="font-weight:700;color:${DARK};">not publicly available</strong> at this time. This is because the developer has restricted distribution to authorized agents only.</p></td></tr>
</table>
</td></tr>
<tr><td class="content-pad" style="padding:0 40px 28px;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border-radius:8px;border-left:3px solid ${ACCENT};">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px 0;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">WHAT HAPPENS NEXT</p>
<p style="margin:0;font-family:${F};font-size:15px;color:#444444;line-height:1.7;">An agent from our team will personally reach out to you with exclusive access to the floor plans, pricing, and any available incentives for <strong style="font-weight:700;color:${DARK};">${project.name}</strong>.</p>
</td></tr>
</table>
</td></tr>
<tr><td class="content-pad" style="padding:0 40px 44px;background:#ffffff;">
<table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td class="cta-td" align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;text-align:center;">
<a href="tel:${agent.phone.replace(/\D/g, "")}" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">CALL NOW &nbsp; ${agent.phone}</a>
</td></tr></table>
</td></tr>
${agentCard(agent, project.city)}`,
  `${project.name} — We'll Be in Touch Shortly`,
  subjectLine);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leadId, projectId } = await req.json();
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if auto-response is enabled
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_response_enabled")
      .maybeSingle();

    const autoEnabled = setting?.value === true || setting?.value === "true";
    if (!autoEnabled) {
      console.log("[send-lead-autoresponse] Auto-response disabled via app_settings");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("project_leads")
      .select("id, name, email, phone, project_id, lead_source, persona, agent_status")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      console.error("Lead not found:", leadErr);
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine project ID
    const pid = projectId || lead.project_id;

    // ── LEAD-MAGNET BRANCH ─────────────────────────────────────────────────
    // No project linked? If this lead came from a lead-magnet form (exit intent,
    // 7 mistakes guide, newsletter, etc.), send the guide-delivery email.
    const LEAD_MAGNET_SOURCES = new Set([
      "exit_intent_guide",
      "exit_intent",
      "7_mistakes_guide",
      "mistakes_guide",
      "lead_magnet",
      "newsletter",
    ]);
    const isLeadMagnet = !pid && lead.lead_source && LEAD_MAGNET_SOURCES.has(lead.lead_source.toLowerCase());

    if (isLeadMagnet) {
      // Look up the PDF URL from app_settings
      const { data: pdfSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "exit_intent_pdf_url")
        .maybeSingle();
      const rawPdf = pdfSetting?.value;
      const pdfUrl = typeof rawPdf === "string" ? rawPdf.replace(/^"|"$/g, "") : "";

      const firstNameLM = lead.name?.split(" ")[0] || "there";
      const subjectLine = "Your Free Guide: 7 Costly Mistakes Presale Buyers Make";
      const html = buildLeadMagnetEmail(firstNameLM, pdfUrl, DEFAULT_AGENT);

      const trackingId = crypto.randomUUID();
      const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?tid=${trackingId}`;
      const htmlWithPixel = html.replace(
        "</body>",
        `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" /></body>`,
      );

      const result = await sendEmail({
        to: lead.email,
        subject: subjectLine,
        html: htmlWithPixel,
        fromName: "Uzair Muhammad | Presale Properties",
      });

      await supabase.from("email_logs").insert({
        email_to: lead.email,
        recipient_name: lead.name,
        subject: subjectLine,
        status: result.success ? "sent" : "failed",
        error_message: result.success ? null : result.error,
        template_type: "auto_lead_magnet_guide",
        lead_id: lead.id,
        tracking_id: trackingId,
      });

      if (!result.success) {
        console.error("[send-lead-autoresponse] Lead magnet email failed:", result.error);
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[send-lead-autoresponse] Sent lead-magnet guide to ${lead.email}`);
      return new Response(
        JSON.stringify({ success: true, template: "lead_magnet_guide", recipient: lead.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!pid) {
      console.log("[send-lead-autoresponse] No project_id, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_project" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project details
    const { data: project, error: projErr } = await supabase
      .from("presale_projects")
      .select("name, city, neighborhood, developer_name, featured_image, gallery_images, og_image, price_range, starting_price, deposit_structure, deposit_percent, completion_year, completion_month, slug, brochure_files, floorplan_files, pricing_sheets")
      .eq("id", pid)
      .single();

    if (projErr || !project) {
      console.error("Project not found:", projErr);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure a hero image is present in the email — fall back through the chain
    // so the recipient always recognizes the project they signed up for.
    const projectAny = project as any;
    if (!projectAny.featured_image) {
      const fallback =
        (Array.isArray(projectAny.gallery_images) && projectAny.gallery_images[0]) ||
        projectAny.og_image ||
        null;
      if (fallback) projectAny.featured_image = fallback;
    }

    // Hard rule: realtors or leads working with an agent ALWAYS get Template B
    const isRealtorOrHasAgent = 
      lead.persona === "realtor" || 
      lead.agent_status === "i_am_realtor" || 
      lead.agent_status === "working_with_agent";

    const hasBrochure = project.brochure_files && project.brochure_files.length > 0;
    const hasFloorplan = project.floorplan_files && project.floorplan_files.length > 0;
    const hasPricing = project.pricing_sheets && project.pricing_sheets.length > 0;
    const hasDocuments = hasBrochure || hasFloorplan || hasPricing;

    const firstName = lead.name?.split(" ")[0] || "there";
    const projectUrl = project.slug ? `https://presaleproperties.com/projects/${project.slug}` : undefined;
    const agent = DEFAULT_AGENT;

    // Template B for realtors/agent leads (always), or when no docs available
    const useTemplateB = isRealtorOrHasAgent || !hasDocuments;
    const templateType = useTemplateB ? "agent_followup" : "project_details_docs";
    const html = useTemplateB
      ? buildTemplateB(project as ProjectData, firstName, agent, projectUrl)
      : buildTemplateA(project as ProjectData, firstName, agent);

    const subjectLine = useTemplateB
      ? `${project.name} — We'll Be in Touch Shortly`
      : `${project.name} — Your Requested Floor Plans & Details`;

    // Generate a unique tracking ID for open tracking
    const trackingId = crypto.randomUUID();
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?tid=${trackingId}`;
    
    // Inject tracking pixel before closing </body> tag
    const htmlWithPixel = html.replace(
      "</body>",
      `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" /></body>`
    );

    // Send the email
    const result = await sendEmail({
      to: lead.email,
      subject: subjectLine,
      html: htmlWithPixel,
      fromName: "Presale Properties",
    });

    if (!result.success) {
      console.error("[send-lead-autoresponse] Email send failed:", result.error);
      
      // Log failure
      await supabase.from("email_logs").insert({
        email_to: lead.email,
        recipient_name: lead.name,
        subject: subjectLine,
        status: "failed",
        error_message: result.error,
        template_type: `auto_${templateType}`,
        lead_id: lead.id,
        tracking_id: trackingId,
      });

      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log success
    await supabase.from("email_logs").insert({
      email_to: lead.email,
      recipient_name: lead.name,
      subject: subjectLine,
      status: "sent",
      template_type: `auto_${templateType}`,
      lead_id: lead.id,
      tracking_id: trackingId,
    });

    console.log(`[send-lead-autoresponse] Sent ${templateType} email to ${lead.email} for ${project.name}`);

    return new Response(
      JSON.stringify({ success: true, template: templateType, recipient: lead.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[send-lead-autoresponse] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
