import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  leadId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Dynamic import of Resend
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { leadId }: LeadNotificationRequest = await req.json();

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "leadId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch lead with listing and agent details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(`
        *,
        listing:listings(title, project_name, city),
        agent_profile:agent_profiles!leads_agent_id_fkey(user_id)
      `)
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get agent's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", lead.agent_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching agent profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Agent email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const listingTitle = lead.listing?.title || "Your Listing";
    const projectName = lead.listing?.project_name || "";
    const city = lead.listing?.city || "";

    // Send email to agent
    const emailResponse = await resend.emails.send({
      from: "AssignmentHub <notifications@resend.dev>",
      to: [profile.email],
      subject: `New Lead for ${listingTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">New Lead Received!</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hi ${profile.full_name || "there"},
          </p>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            You have received a new inquiry for your listing:
          </p>
          
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${listingTitle}</p>
            <p style="margin: 4px 0 0; color: #6a6a6a; font-size: 14px;">${projectName}${city ? ` • ${city}` : ""}</p>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Lead Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${lead.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="mailto:${lead.email}" style="color: #2563eb;">${lead.email}</a>
              </td>
            </tr>
            ${lead.phone ? `
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="tel:${lead.phone}" style="color: #2563eb;">${lead.phone}</a>
              </td>
            </tr>
            ` : ""}
          </table>
          
          ${lead.message ? `
          <h3 style="color: #1a1a1a; font-size: 16px; margin: 24px 0 8px;">Message</h3>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${lead.message}</p>
          </div>
          ` : ""}
          
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            Respond promptly to increase your chances of closing this deal!
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            This email was sent from AssignmentHub. You can manage your leads in your dashboard.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-lead-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
