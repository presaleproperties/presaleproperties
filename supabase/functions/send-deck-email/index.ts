import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/gmail-smtp.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadId } = await req.json();
    if (!leadId || typeof leadId !== "string") {
      return new Response(JSON.stringify({ error: "leadId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead + deck
    const { data: lead, error: leadErr } = await supabase
      .from("onboarded_leads")
      .select("*, pitch_decks(*)")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deck = lead.pitch_decks;
    if (!deck) {
      return new Response(JSON.stringify({ error: "No pitch deck assigned to this lead" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deckUrl = `https://presaleproperties.com/deck/${deck.slug}`;
    const heroImg = deck.hero_image_url || "";
    const projectName = deck.project_name || "New Development";
    const city = deck.city || "";
    const tagline = deck.tagline || "";
    const firstName = lead.first_name || "there";

    // Parse floor plans for display
    let floorPlanRows = "";
    try {
      const plans = Array.isArray(deck.floor_plans) ? deck.floor_plans : [];
      const topPlans = plans.slice(0, 3);
      if (topPlans.length > 0) {
        floorPlanRows = topPlans.map((fp: any) => {
          const label = `${fp.beds || "?"} Bed + ${fp.baths || "?"} Bath`;
          const size = fp.sqft ? `${fp.sqft} sq ft` : "";
          const price = fp.price ? `From $${Number(fp.price).toLocaleString()}` : "";
          return `<tr><td style="padding:8px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0ede8;">${label}</td><td style="padding:8px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;color:#666;border-bottom:1px solid #f0ede8;">${size}</td><td style="padding:8px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0ede8;text-align:right;">${price}</td></tr>`;
        }).join("");
      }
    } catch { /* ignore parse errors */ }

    // Parse deposit structure
    let depositHtml = "";
    try {
      const steps = Array.isArray(deck.deposit_steps) ? deck.deposit_steps : [];
      if (steps.length > 0) {
        depositHtml = steps.map((s: any) =>
          `<tr><td style="padding:6px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;color:#666;">${s.label || ""}</td><td style="padding:6px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${s.amount || s.value || ""}</td></tr>`
        ).join("");
      }
    } catch { /* ignore */ }

    // Build email HTML
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f7f5f2;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0dbd3;border-radius:8px;overflow:hidden;">

${heroImg ? `<tr><td><a href="${deckUrl}" target="_blank"><img src="${heroImg}" alt="${projectName}" width="600" style="display:block;width:100%;height:auto;"></a></td></tr>` : ""}

<tr><td style="padding:32px 32px 0;">
<h1 style="margin:0 0 8px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#1a1a1a;">${projectName}</h1>
${city ? `<p style="margin:0 0 8px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;color:#888;">${city}</p>` : ""}
${tagline ? `<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:15px;color:#444;line-height:1.6;">${tagline}</p>` : ""}
</td></tr>

<tr><td style="padding:16px 32px;">
<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:15px;color:#444;line-height:1.75;">Hi ${firstName},</p>
<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:15px;color:#444;line-height:1.75;">Thank you for your interest — I've put together a detailed overview of <strong>${projectName}</strong> for you. Click below to explore floor plans, pricing, deposit structure, and more.</p>
</td></tr>

<tr><td align="center" style="padding:8px 32px 24px;">
<a href="${deckUrl}" target="_blank" style="display:inline-block;background:#1a1a1a;color:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:50px;">View Full Details</a>
</td></tr>

${floorPlanRows ? `<tr><td style="padding:0 32px 16px;"><p style="margin:0 0 12px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;">Floor Plans</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ede8;border-radius:6px;overflow:hidden;">${floorPlanRows}</table></td></tr>` : ""}

${depositHtml ? `<tr><td style="padding:0 32px 24px;"><p style="margin:0 0 12px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;">Deposit Structure</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ede8;border-radius:6px;overflow:hidden;">${depositHtml}</table></td></tr>` : ""}

<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;color:#aaa;line-height:1.5;">Presale Properties &middot; <a href="https://presaleproperties.com" style="color:#888;text-decoration:underline;">presaleproperties.com</a></p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

    // Send email
    const result = await sendEmail({
      to: lead.email,
      subject: `${projectName} — Your Exclusive Overview`,
      html,
      fromName: "Presale Properties",
    });

    if (!result.success) {
      console.error("Email send failed:", result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log to email_logs
    await supabase.from("email_logs").insert({
      email_to: lead.email,
      subject: `${projectName} — Your Exclusive Overview`,
      status: "sent",
      template_type: "deck_intro",
      lead_id: null,
    });

    console.log(`Deck email sent to ${lead.email} for ${projectName}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-deck-email error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
