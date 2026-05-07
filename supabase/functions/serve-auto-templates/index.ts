/**
 * serve-auto-templates
 * ────────────────────────────────────────────────────────────
 * API endpoint for DealsFlow CRM to:
 *   GET  → List available auto-response email templates
 *   POST → Render a template with project + lead data → returns HTML
 *
 * Auth: x-bridge-secret header must match BRIDGE_SECRET env var
 * ────────────────────────────────────────────────────────────
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/* ── Brand constants (must mirror auto-response-emails.ts) ── */
const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";
const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const GOOGLE_FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

interface ProjectData {
  projectName: string;
  city?: string;
  neighborhood?: string;
  developerName?: string;
  heroImage?: string;
  startingPrice?: string;
  deposit?: string;
  completion?: string;
  projectUrl?: string;
  brochureUrl?: string;
  floorplanUrl?: string;
  pricingUrl?: string;
}

interface AgentInfo {
  full_name: string;
  title: string;
  photo_url?: string | null;
  phone: string;
  email: string;
}

const DEFAULT_AGENT: AgentInfo = {
  full_name: "Uzair Muhammad",
  title: "Presale Specialist",
  photo_url: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1772579582217-unijnf.jpg",
  phone: "778-231-3592",
  email: "info@presaleproperties.com",
};

/* ── Template catalogue ── */
const TEMPLATE_CATALOGUE = [
  {
    id: "auto_project_details_docs",
    name: "Template A: Project Details + Documents",
    description: "Full project details with brochure/floorplan download CTAs. Best when documents are available.",
    required_fields: ["projectName"],
    optional_fields: ["city", "developerName", "heroImage", "startingPrice", "deposit", "completion", "projectUrl", "brochureUrl", "floorplanUrl", "pricingUrl"],
    supports_agent_override: true,
  },
  {
    id: "auto_agent_followup",
    name: "Template B: Agent Follow-Up",
    description: "Personal agent introduction with project summary. Best when no documents are available yet.",
    required_fields: ["projectName"],
    optional_fields: ["city", "developerName", "startingPrice", "deposit", "completion", "projectUrl"],
    supports_agent_override: true,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth check
  const secret = Deno.env.get("BRIDGE_SECRET");
  const provided = req.headers.get("x-bridge-secret");
  if (!secret || provided !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    if (req.method === "GET") {
      return json({ templates: TEMPLATE_CATALOGUE }, 200);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "Invalid JSON" }, 400);

      const templateId = body.template_id as string;
      const recipientName = String(body.recipient_name || body.first_name || "there");
      const project: ProjectData = body.project || {};
      const agentOverride: AgentInfo | null = body.agent || null;

      if (!templateId) return json({ error: "Missing template_id" }, 400);
      if (!project.projectName) return json({ error: "Missing project.projectName" }, 400);

      // Resolve agent — if agent_slug provided, look up from DB
      let agent: AgentInfo = DEFAULT_AGENT;
      if (agentOverride) {
        agent = { ...DEFAULT_AGENT, ...agentOverride };
      } else if (body.agent_slug) {
        const resolved = await resolveAgent(body.agent_slug);
        if (resolved) agent = resolved;
      }

      let html: string;
      let subject: string;

      if (templateId === "auto_project_details_docs") {
        html = buildTemplateA(project, recipientName, agent);
        subject = `${project.projectName} — Your Exclusive Project Details`;
      } else if (templateId === "auto_agent_followup") {
        html = buildTemplateB(project, recipientName, agent);
        subject = `${project.projectName} — Let's Connect`;
      } else {
        return json({ error: `Unknown template_id: ${templateId}` }, 400);
      }

      return json({ html, subject, template_id: templateId }, 200);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[serve-auto-templates]", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

/* ── Agent resolution from team_members table ── */
async function resolveAgent(slug: string): Promise<AgentInfo | null> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    const sb = createClient(url, key);
    const { data } = await sb
      .from("team_members")
      .select("full_name, title, avatar_url, phone, email")
      .eq("agent_slug", slug)
      .maybeSingle();
    if (!data) return null;
    return {
      full_name: data.full_name || slug,
      title: data.title || "Presale Specialist",
      photo_url: data.avatar_url || null,
      phone: data.phone || "",
      email: data.email || "",
    };
  } catch { return null; }
}

/* ── Email shell ── */
function emailShell(content: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <link href="${GOOGLE_FONT}" rel="stylesheet"/>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important;}
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
<body style="margin:0;padding:0;background:#faf8f4;">
${previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${previewText}&zwnj;</span>` : ""}
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;"><tr><td class="outer-td" align="center" style="padding:24px 0;">
<table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" class="email-container" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
${content}
</table>
</td></tr></table>
</body></html>`;
}

function heroBlock(heroImage?: string, projectName?: string): string {
  if (!heroImage) {
    return `<tr><td class="content-pad" style="background:#111111;padding:32px 40px;">
      <p style="margin:0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES</p>
    </td></tr>`;
  }
  return `<tr><td style="padding:0;line-height:0;font-size:0;">
    <img src="${heroImage}" alt="${projectName || "New Presale"}" width="600" style="display:block;width:100%;height:auto;" />
  </td></tr>`;
}

function headlineBlock(data: ProjectData): string {
  return `<tr><td class="content-pad" style="padding:40px 40px 28px;background:#ffffff;">
    <p style="margin:0 0 6px 0;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">
      ${data.city ? data.city.toUpperCase() : "PRESALE PROPERTIES"}${data.developerName ? ` &nbsp;·&nbsp; ${data.developerName.toUpperCase()}` : ""}
    </p>
    ${data.projectName ? `<p style="margin:0;font-family:${F};font-size:36px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1px;">${data.projectName}</p>` : ""}
  </td></tr>`;
}

function statsBar(data: ProjectData): string {
  if (!data.startingPrice && !data.deposit && !data.completion) return "";
  const cells = [
    data.startingPrice ? { value: data.startingPrice, label: "Starting From", border: true } : null,
    data.deposit ? { value: data.deposit, label: "Deposit", border: !!data.completion } : null,
    data.completion ? { value: data.completion, label: "Completion", border: false } : null,
  ].filter(Boolean) as { value: string; label: string; border: boolean }[];

  return `<tr><td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;">
      <tr>${cells.map(c => `
        <td class="stat-cell" style="padding:18px 20px;${c.border ? `border-right:1px solid #e8e2d6;` : ""}text-align:left;">
          <p style="margin:0 0 3px 0;font-family:${F};font-size:20px;font-weight:800;color:${DARK};">${c.value}</p>
          <p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">${c.label}</p>
        </td>`).join("")}
      </tr>
    </table>
  </td></tr>`;
}

function agentCard(agent: AgentInfo, city?: string): string {
  return `
  <tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>
  <tr><td style="padding:0;background:#ffffff;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      ${agent.photo_url ? `<tr><td align="center" style="padding:28px 24px 12px;">
        <img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${ACCENT};" />
      </td></tr>` : ""}
      <tr><td align="center" style="padding:0 24px 8px;text-align:center;">
        <p style="margin:0 0 4px 0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${agent.full_name}</p>
        <p style="margin:0 0 12px 0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${agent.title}</p>
        ${agent.phone ? `<p style="margin:0 0 4px 0;font-family:${F};font-size:14px;color:#555;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="color:#555;text-decoration:none;">${agent.phone}</a></p>` : ""}
        ${agent.email ? `<p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;"><a href="mailto:${agent.email}" style="color:#8a7e6b;text-decoration:none;">${agent.email}</a></p>` : ""}
      </td></tr>
      <tr><td align="center" style="padding:16px 24px 24px;border-top:1px solid #e8e2d6;">
        <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="110" style="width:110px;height:auto;" />
      </td></tr>
    </table>
  </td></tr>
  <tr><td class="content-pad" style="padding:20px 40px;background:#111111;">
    <p style="margin:0 0 4px 0;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES &nbsp;·&nbsp; ${city ? `${city.toUpperCase()}, BC` : "VANCOUVER, BC"}</p>
    <p style="margin:0;font-family:${F};font-size:12px;color:#888;"><a href="https://presaleproperties.com" style="color:#888;text-decoration:none;">presaleproperties.com</a> &nbsp;·&nbsp; ${agent.phone}</p>
  </td></tr>
  <tr><td class="content-pad" style="padding:20px 40px 24px;background:#faf8f4;border-top:1px solid #e8e2d6;">
    <p style="margin:0 0 8px 0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#777;">LEGAL DISCLAIMER</p>
    <p style="margin:0;font-family:${F};font-size:11px;color:#aaa;line-height:1.7;">
      This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer&rsquo;s agents. This is <strong style="font-weight:600;color:#888;">not an offering for sale</strong>. Prices and availability subject to change. E.&amp;O.E.
    </p>
  </td></tr>`;
}

/* ── Template A: Project Details + Documents ── */
function buildTemplateA(data: ProjectData, recipientName: string, agent: AgentInfo): string {
  const name = recipientName || "there";
  const hasBrochure = !!data.brochureUrl;
  const hasFloorplan = !!(data.floorplanUrl || data.pricingUrl);

  let docButtons = "";
  if (hasBrochure) {
    docButtons += `<tr><td class="content-pad" style="padding:0 40px 12px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${ACCENT};border-radius:50px;padding:18px 32px;">
          <a href="${data.brochureUrl}" target="_blank" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">VIEW BROCHURE</a>
        </td>
      </tr></table>
    </td></tr>`;
  }
  if (hasFloorplan) {
    docButtons += `<tr><td class="content-pad" style="padding:0 40px 12px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:#0d1f18;border-radius:50px;padding:18px 32px;">
          <a href="${data.floorplanUrl || data.pricingUrl}" target="_blank" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:${ACCENT};text-decoration:none;display:block;">VIEW FLOOR PLANS</a>
        </td>
      </tr></table>
    </td></tr>`;
  }

  const content = `
    ${heroBlock(data.heroImage, data.projectName)}
    ${headlineBlock(data)}
    <tr><td class="content-pad" style="padding:0 40px 28px;background:#ffffff;">
      <p style="margin:0;font-family:${F};font-size:15px;color:#444;line-height:1.75;">
        Hi ${name}, thank you for your interest in <strong>${data.projectName}</strong>.
        Here are the exclusive details and documents for this presale project.
      </p>
    </td></tr>
    ${statsBar(data)}
    ${docButtons}
    ${data.projectUrl ? `<tr><td class="content-pad" style="padding:12px 40px 28px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="border:2px solid #e8e2d6;border-radius:50px;padding:16px 32px;">
          <a href="${data.projectUrl}" target="_blank" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1px;color:${DARK};text-decoration:none;display:block;">VIEW FULL PROJECT PAGE</a>
        </td>
      </tr></table>
    </td></tr>` : ""}
    ${agentCard(agent, data.city)}`;

  return emailShell(content, `${data.projectName} — Your exclusive project details are ready`);
}

/* ── Template B: Agent Follow-Up ── */
function buildTemplateB(data: ProjectData, recipientName: string, agent: AgentInfo): string {
  const name = recipientName || "there";
  const content = `
    ${heroBlock(undefined, data.projectName)}
    ${headlineBlock(data)}
    <tr><td class="content-pad" style="padding:0 40px 28px;background:#ffffff;">
      <p style="margin:0;font-family:${F};font-size:15px;color:#444;line-height:1.75;">
        Hi ${name}, I'm ${agent.full_name} — your dedicated presale specialist for
        <strong>${data.projectName}</strong>${data.city ? ` in ${data.city}` : ""}.
      </p>
      <p style="margin:16px 0 0;font-family:${F};font-size:15px;color:#444;line-height:1.75;">
        I'd love to share the latest pricing, floor plans, and availability with you.
        Feel free to reply directly or call me anytime.
      </p>
    </td></tr>
    ${statsBar(data)}
    ${data.projectUrl ? `<tr><td class="content-pad" style="padding:20px 40px 28px;background:#ffffff;">
      <table class="cta-table" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="cta-td" align="center" style="background:${ACCENT};border-radius:50px;padding:18px 32px;">
          <a href="${data.projectUrl}" target="_blank" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-decoration:none;display:block;">VIEW PROJECT</a>
        </td>
      </tr></table>
    </td></tr>` : ""}
    ${agentCard(agent, data.city)}`;

  return emailShell(content, `${agent.full_name} — Your presale specialist for ${data.projectName}`);
}

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
