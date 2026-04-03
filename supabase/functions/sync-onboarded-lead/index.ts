import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    if (!leadId || typeof leadId !== "string") {
      return new Response(JSON.stringify({ error: "leadId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the onboarded lead + deck info
    const { data: lead, error: fetchErr } = await sb
      .from("onboarded_leads")
      .select(`
        id, user_id, first_name, last_name, email, phone,
        source, notes, deck_id, deck_url, created_at,
        pitch_decks ( project_name, slug, city )
      `)
      .eq("id", leadId)
      .single();

    if (fetchErr || !lead) {
      console.error("Fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent info
    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", lead.user_id)
      .single();

    // Get webhook URL — dedicated onboard webhook first, fallback to general
    let webhookUrl = Deno.env.get("ZAPIER_ONBOARD_LEADS_WEBHOOK");
    if (!webhookUrl) {
      const { data: setting } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", "zapier_onboard_leads_webhook")
        .single();
      if (setting?.value && typeof setting.value === "string" && setting.value.trim()) {
        webhookUrl = setting.value;
      }
    }

    if (!webhookUrl) {
      console.log("No Zapier webhook configured, skipping sync");
      return new Response(JSON.stringify({ success: true, synced: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate lead data before firing webhook
    if (!lead.email || lead.email.trim().length < 3) {
      console.log("Skipping Zapier — no valid email");
      return new Response(JSON.stringify({ success: true, synced: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deck = lead.pitch_decks as any;
    const sourceMap: Record<string, string> = {
      website: "Website",
      referral: "Referral",
      social_media: "Social Media",
      walk_in: "Walk-in",
      phone_call: "Phone Call",
      open_house: "Open House",
      other: "Other",
    };

    const tags = [
      "PresaleProperties.com",
      "Manual Onboard",
      sourceMap[lead.source] || lead.source,
    ];
    if (deck?.project_name) tags.push(deck.project_name);
    if (deck?.city) tags.push(deck.city);

    const payload = {
      lead_id: lead.id,
      lead_first_name: lead.first_name,
      lead_last_name: lead.last_name,
      lead_name: `${lead.first_name} ${lead.last_name}`.trim(),
      lead_email: lead.email,
      lead_phone: lead.phone || "",
      lead_notes: lead.notes || "",
      submitted_at: lead.created_at,
      tags: tags.join(", "),
      tags_array: tags,
      source: "PresaleProperties.com",
      lead_source: sourceMap[lead.source] || lead.source,
      form_type: "Manual Onboard",
      form_location: "Lead Onboard Hub",
      lead_type: "onboarded",
      deck_name: deck?.project_name || "",
      deck_url: lead.deck_url || "",
      deck_city: deck?.city || "",
      agent_name: profile?.full_name || "",
      agent_email: profile?.email || "",
      agent_phone: profile?.phone || "",
    };

    console.log("Sending onboarded lead to Zapier:", lead.id);

    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Zapier response:", resp.status);

      // Mark as synced
      await sb
        .from("onboarded_leads")
        .update({ zapier_synced: true })
        .eq("id", lead.id);
    } catch (webhookErr) {
      console.error("Webhook error:", webhookErr);
    }

    return new Response(JSON.stringify({ success: true, synced: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sync-onboarded-lead error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
