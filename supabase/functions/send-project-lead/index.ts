import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectLeadRequest {
  leadId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId }: ProjectLeadRequest = await req.json();
    console.log("Processing project lead:", leadId);

    if (!leadId) {
      throw new Error("Lead ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch lead details with project info
    const { data: lead, error: leadError } = await supabase
      .from("project_leads")
      .select(`
        id,
        name,
        email,
        phone,
        message,
        created_at,
        project_id,
        presale_projects (
          name,
          slug,
          city,
          neighborhood,
          developer_name,
          status,
          price_range,
          project_type
        )
      `)
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      throw new Error("Lead not found");
    }

    console.log("Lead details fetched successfully:", { leadId: lead.id, projectId: lead.project_id });

    // Send to Zapier webhook if configured
    const zapierWebhookUrl = Deno.env.get("ZAPIER_PROJECT_LEADS_WEBHOOK");
    
    if (zapierWebhookUrl) {
      console.log("Sending lead to Zapier webhook");
      
      const project = lead.presale_projects as any;
      
      const webhookPayload = {
        // Lead info
        lead_id: lead.id,
        lead_name: lead.name,
        lead_email: lead.email,
        lead_phone: lead.phone || "",
        has_realtor: lead.message || "",
        submitted_at: lead.created_at,
        
        // Project info
        project_id: lead.project_id,
        project_name: project?.name || "",
        project_city: project?.city || "",
        project_neighborhood: project?.neighborhood || "",
        project_developer: project?.developer_name || "",
        project_status: project?.status || "",
        project_type: project?.project_type || "",
        project_price_range: project?.price_range || "",
        project_url: project?.slug ? `https://presaleproperties.com/presale-projects/${project.slug}` : "",
        
        // Source
        source: "PresaleProperties.com",
        form_type: "Project Lead Form",
        lead_type: "project",
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
        // Don't throw - we still want to return success if lead was saved
      }
    } else {
      console.log("No Zapier webhook configured (ZAPIER_PROJECT_LEADS_WEBHOOK), skipping CRM sync");
    }

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing project lead:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});