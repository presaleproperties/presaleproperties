import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/gmail-smtp.ts";

/**
 * Send a campaign template email to an onboarded lead.
 * Body: { leadId: string, templateId: string }
 */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadId, templateId, htmlOverride } = await req.json();
    if (!leadId || !templateId) {
      return new Response(JSON.stringify({ error: "leadId and templateId are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("onboarded_leads")
      .select("*")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template
    const { data: template, error: tplErr } = await supabase
      .from("campaign_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (tplErr || !template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch agent profile for sender name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const agentFirstName = profile?.full_name?.split(" ")[0] || "";
    const senderName = agentFirstName
      ? `Presale Properties | ${agentFirstName}`
      : "Presale Properties";

    const fd = template.form_data || {};
    const firstName = lead.first_name || "there";
    const copy = fd.copy || {};
    const subjectLine = copy.subjectLine || fd.projectName || template.project_name || "New Development";

    // If the client passed pre-rendered HTML from the Marketing Hub builder, use it directly
    let html: string;
    if (htmlOverride) {
      html = htmlOverride;
    } else if (fd.finalHtml) {
      html = fd.finalHtml
        .replace(/\{first_name\}/gi, firstName)
        .replace(/\{name\}/gi, firstName)
        .replace(/\[First Name\]/g, firstName)
        .replace(/\[first name\]/g, firstName)
        .replace(/\[Name\]/g, firstName)
        .replace(/\[name\]/g, firstName)
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\*\|FNAME\|\*/g, firstName);
    } else {
      // Fallback: reconstruct from form_data fields (legacy templates)
      const projectName = fd.projectName || template.project_name || "New Development";
      const heroImage = fd.heroImage || "";
      const headline = copy.headline || projectName;
      const bodyCopy = copy.bodyCopy || "";
      const startingPrice = copy.startingPrice || "";
      const deposit = copy.deposit || "";
      const completion = copy.completion || "";
      const city = fd.city || "";
      const ctaUrl = fd.ctaUrl || "";

      let floorPlanRows = "";
      try {
        const plans = Array.isArray(fd.floorPlans) ? fd.floorPlans : [];
        floorPlanRows = plans.slice(0, 4).map((fp: any) => {
          const label = fp.label || `${fp.beds || "?"} Bed + ${fp.baths || "?"} Bath`;
          const size = fp.sqft ? `${fp.sqft} sq ft` : "";
          const price = fp.price ? `From $${Number(fp.price).toLocaleString()}` : "";
          return `<tr><td style="padding:8px 16px;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0ede8;">${label}</td><td style="padding:8px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0ede8;">${size}</td><td style="padding:8px 16px;font-size:14px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0ede8;text-align:right;">${price}</td></tr>`;
        }).join("");
      } catch { /* ignore */ }

      let statsHtml = "";
      const stats = [
        startingPrice && { label: "Starting From", value: startingPrice },
        deposit && { label: "Deposit", value: deposit },
        completion && { label: "Completion", value: completion },
      ].filter(Boolean);
      if (stats.length) {
        statsHtml = `<tr><td style="padding:16px 32px;"><table width="100%" cellpadding="0" cellspacing="0">${stats.map((s: any) =>
          `<tr><td style="padding:6px 0;font-size:13px;color:#888;">${s.label}</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${s.value}</td></tr>`
        ).join("")}</table></td></tr>`;
      }

      const personalBody = (bodyCopy || "")
        .replace(/\{first_name\}/gi, firstName)
        .replace(/\{name\}/gi, firstName);

      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0dbd3;border-radius:8px;overflow:hidden;">
${heroImage ? `<tr><td>${ctaUrl ? `<a href="${ctaUrl}" target="_blank">` : ""}<img src="${heroImage}" alt="${projectName}" width="600" style="display:block;width:100%;height:auto;">${ctaUrl ? "</a>" : ""}</td></tr>` : ""}
<tr><td style="padding:32px 32px 0;">
<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1a1a;">${headline}</h1>
${city ? `<p style="margin:0 0 12px;font-size:14px;color:#888;">${city}</p>` : ""}
</td></tr>
${statsHtml}
<tr><td style="padding:16px 32px;">
<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.75;">Hi ${firstName},</p>
${personalBody ? `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.75;">${personalBody}</p>` : ""}
</td></tr>
${ctaUrl ? `<tr><td align="center" style="padding:8px 32px 24px;"><a href="${ctaUrl}" target="_blank" style="display:inline-block;background:#1a1a1a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:50px;">View Full Details</a></td></tr>` : ""}
${floorPlanRows ? `<tr><td style="padding:0 32px 16px;"><p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a1a;">Floor Plans</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ede8;border-radius:6px;overflow:hidden;">${floorPlanRows}</table></td></tr>` : ""}
<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Presale Properties &middot; <a href="https://presaleproperties.com" style="color:#888;text-decoration:underline;">presaleproperties.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
    }

    const result = await sendEmail({
      to: lead.email,
      subject: subjectLine.replace(/\{first_name\}/gi, firstName),
      html,
      fromName: senderName,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log
    await supabase.from("email_logs").insert({
      email_to: lead.email,
      subject: subjectLine,
      status: "sent",
      template_type: "campaign_template",
      recipient_name: `${lead.first_name} ${lead.last_name}`.trim(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-template-email error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
