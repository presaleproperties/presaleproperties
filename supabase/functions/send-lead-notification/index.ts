import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SENDER = "PresaleProperties <onboarding@resend.dev>";

// Maximum age of lead to process (5 minutes)
const MAX_LEAD_AGE_MS = 5 * 60 * 1000;

interface LeadNotificationRequest {
  leadId: string;
}

async function getSenderEmail(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_sender")
    .maybeSingle();
  
  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }
  return DEFAULT_SENDER;
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { leadId }: LeadNotificationRequest = await req.json();
    console.log("Processing listing lead:", leadId);

    // Validate leadId format
    if (!leadId || typeof leadId !== "string") {
      return new Response(
        JSON.stringify({ error: "leadId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidUUID(leadId)) {
      console.warn("Invalid leadId format attempted:", leadId.substring(0, 10));
      return new Response(
        JSON.stringify({ error: "Invalid leadId format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch lead with listing details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(`
        *,
        listing:listings(
          id,
          title,
          project_name,
          city,
          neighborhood,
          developer_name,
          assignment_price,
          beds,
          baths,
          interior_sqft,
          property_type,
          unit_type,
          status
        )
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

    // Validate lead age to prevent abuse
    const leadAge = Date.now() - new Date(lead.created_at).getTime();
    if (leadAge > MAX_LEAD_AGE_MS) {
      console.warn(`Lead ${leadId} is too old (${Math.round(leadAge / 1000)}s), rejecting notification`);
      return new Response(
        JSON.stringify({ error: "Lead is too old to process" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Lead details fetched successfully:", { leadId: lead.id, listingId: lead.listing_id, ageMs: leadAge });

    // Send to Zapier webhook if configured
    const zapierWebhookUrl = Deno.env.get("ZAPIER_LISTING_LEADS_WEBHOOK");
    
    if (zapierWebhookUrl) {
      console.log("Sending listing lead to Zapier webhook");
      
      const listing = lead.listing as any;
      
      const webhookPayload = {
        // Lead info
        lead_id: lead.id,
        lead_name: lead.name,
        lead_email: lead.email,
        lead_phone: lead.phone || "",
        lead_message: lead.message || "",
        submitted_at: lead.created_at,
        
        // Listing info
        listing_id: lead.listing_id,
        listing_title: listing?.title || "",
        project_name: listing?.project_name || "",
        listing_city: listing?.city || "",
        listing_neighborhood: listing?.neighborhood || "",
        developer_name: listing?.developer_name || "",
        assignment_price: listing?.assignment_price || "",
        beds: listing?.beds || "",
        baths: listing?.baths || "",
        interior_sqft: listing?.interior_sqft || "",
        property_type: listing?.property_type || "",
        unit_type: listing?.unit_type || "",
        
        // Agent info
        agent_id: lead.agent_id,
        
        // Source
        source: "PresaleProperties.com",
        form_type: "Listing Lead Form",
        lead_type: "listing",
      };

      console.log("Webhook payload:", JSON.stringify(webhookPayload));

      try {
        const webhookResponse = await fetch(zapierWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        console.log("Zapier webhook response status:", webhookResponse.status);
        
        if (!webhookResponse.ok) {
          console.error("Zapier webhook failed:", await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Error sending to Zapier:", webhookError);
      }
    } else {
      console.log("No Zapier webhook configured (ZAPIER_LISTING_LEADS_WEBHOOK), skipping CRM sync");
    }

    // Send email notification if Resend is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Lead processed, email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        JSON.stringify({ success: true, message: "Lead processed, agent email not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Dynamic import of Resend
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const listing = lead.listing as any;
    const listingTitle = listing?.title || "Your Listing";
    const projectName = listing?.project_name || "";
    const city = listing?.city || "";

    // Get sender email from settings
    const senderEmail = await getSenderEmail(supabase);

    // Sanitize user content for email
    const sanitize = (str: string) => str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const safeName = sanitize(lead.name || "");
    const safeEmail = sanitize(lead.email || "");
    const safePhone = lead.phone ? sanitize(lead.phone) : "";
    const safeMessage = lead.message ? sanitize(lead.message) : "";

    // Send email to agent
    const emailResponse = await resend.emails.send({
      from: senderEmail,
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
            <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${sanitize(listingTitle)}</p>
            <p style="margin: 4px 0 0; color: #6a6a6a; font-size: 14px;">${sanitize(projectName)}${city ? ` • ${sanitize(city)}` : ""}</p>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Lead Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="mailto:${safeEmail}" style="color: #2563eb;">${safeEmail}</a>
              </td>
            </tr>
            ${safePhone ? `
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="tel:${safePhone}" style="color: #2563eb;">${safePhone}</a>
              </td>
            </tr>
            ` : ""}
          </table>
          
          ${safeMessage ? `
          <h3 style="color: #1a1a1a; font-size: 16px; margin: 24px 0 8px;">Message</h3>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          ` : ""}
          
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            Respond promptly to increase your chances of closing this deal!
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            This email was sent from PresaleProperties. You can manage your leads in your dashboard.
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
