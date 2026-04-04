import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, subject, html } = await req.json();

    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
    if (!MAILERLITE_API_KEY) {
      throw new Error("MAILERLITE_API_KEY is not configured");
    }

    // Push as a campaign to MailerLite
    // Step 1: Create the campaign
    const campaignRes = await fetch("https://connect.mailerlite.com/api/campaigns", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAILERLITE_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        type: "regular",
        emails: [{
          subject: subject.trim(),
          from: "info@presaleproperties.com",
          from_name: "Uzair Muhammad | Presale Properties",
          content: html.trim(),
        }],
      }),
    });

    const campaignData = await campaignRes.json();

    if (!campaignRes.ok) {
      console.error("MailerLite campaign creation failed:", JSON.stringify(campaignData));
      const errorMsg = campaignData?.message || campaignData?.error?.message || `MailerLite API error: ${campaignRes.status}`;
      return new Response(
        JSON.stringify({ error: errorMsg, details: campaignData }),
        { status: campaignRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("MailerLite campaign created:", campaignData?.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaignData?.data?.id,
        message: `Campaign "${name.trim()}" created in MailerLite as a draft`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("push-to-mailerlite error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
