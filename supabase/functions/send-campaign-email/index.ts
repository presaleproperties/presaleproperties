import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CampaignRequest {
  campaign_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── ADMIN AUTH CHECK ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      console.warn(`[send-campaign-email] Non-admin user ${userId} attempted to send campaign`);
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── END AUTH CHECK ────────────────────────────────────────

    const { campaign_id }: CampaignRequest = await req.json();

    console.log(`[send-campaign-email] Admin ${userId} sending campaign ${campaign_id}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*, presale_projects(name, city, neighborhood)")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "sent") {
      throw new Error("Campaign already sent");
    }

    // Get leads to email - either for specific project or all leads
    let query = supabase.from("project_leads").select("id, name, email");
    
    if (campaign.project_id) {
      query = query.eq("project_id", campaign.project_id);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      throw new Error("Failed to fetch leads");
    }

    if (!leads || leads.length === 0) {
      throw new Error("No leads found for this campaign");
    }

    console.log(`Sending to ${leads.length} leads`);

    let successCount = 0;
    let failCount = 0;

    // Send emails to each lead
    for (const lead of leads) {
      try {
        let htmlContent = campaign.html_content
          .replace(/\{\{lead_name\}\}/g, lead.name)
          .replace(/\{\{project_name\}\}/g, campaign.presale_projects?.name || "")
          .replace(/\{\{project_city\}\}/g, campaign.presale_projects ? 
            `${campaign.presale_projects.neighborhood}, ${campaign.presale_projects.city}` : "");

        const subject = campaign.subject
          .replace(/\{\{project_name\}\}/g, campaign.presale_projects?.name || "");

        await resend.emails.send({
          from: "PresaleProperties <noreply@presaleproperties.com>",
          to: [lead.email],
          subject: subject,
          html: htmlContent,
        });

        // Log success
        await supabase.from("email_logs").insert({
          lead_id: lead.id,
          campaign_id: campaign_id,
          email_to: lead.email,
          subject: subject,
          status: "sent",
        });

        successCount++;
      } catch (emailError: any) {
        console.error(`Failed to send to ${lead.email}:`, emailError);
        
        // Log failure
        await supabase.from("email_logs").insert({
          lead_id: lead.id,
          campaign_id: campaign_id,
          email_to: lead.email,
          subject: campaign.subject,
          status: "failed",
          error_message: emailError.message,
        });

        failCount++;
      }
    }

    // Update campaign status
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      })
      .eq("id", campaign_id);

    console.log(`Campaign complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending campaign:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
