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
        persona,
        home_size,
        agent_status,
        lead_source,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer,
        landing_page,
        created_at,
        project_id,
        visitor_id,
        session_id,
        intent_score,
        city_interest,
        project_interest,
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

    // Get webhook URL from app_settings (fallback to env var for backwards compatibility)
    let zapierWebhookUrl = Deno.env.get("ZAPIER_PROJECT_LEADS_WEBHOOK");
    
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_project_leads_webhook")
      .single();
    
    if (webhookSetting?.value && typeof webhookSetting.value === "string" && webhookSetting.value.trim()) {
      zapierWebhookUrl = webhookSetting.value;
      console.log("Using webhook URL from app_settings");
    }
    
    if (zapierWebhookUrl) {
      console.log("Sending lead to Zapier webhook");
      
      const project = lead.presale_projects as any;
      
      // Map lead_source to human-readable descriptions for Lofty
      const getFormType = (leadSource: string | null): string => {
        // Handle city_list_* sources dynamically
        if (leadSource?.startsWith("city_list_")) {
          const city = leadSource.replace("city_list_", "").replace(/_/g, " ");
          return `City List Request - ${city.charAt(0).toUpperCase() + city.slice(1)}`;
        }
        
        const sourceMap: Record<string, string> = {
          "scheduler": "Schedule a Preview",
          "floor_plan_request": "Floor Plan Request",
          "floor_plan_request_step1": "Floor Plan Request (Partial)",
          "callback_request": "Request a Callback",
          "general_inquiry": "General Inquiry",
          "newsletter": "Newsletter Signup",
          "vip_membership": "VIP Membership Application",
          "new_homes_page": "New Homes Interest",
          "mortgage_calculator": "Mortgage Calculator",
          "roi_calculator": "ROI Calculator",
          "roi_analysis": "ROI Analysis Request",
          "consultation": "Consultation Request",
          "exit_intent_guide": "Guide Download",
          "resale_inquiry": "Resale Property Inquiry",
          "sticky_bar": "Sticky Bar Inquiry",
          "header_inquiry": "Header Inquiry",
        };
        return sourceMap[leadSource || ""] || leadSource?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Website Inquiry";
      };

      // Generate tags for Lofty CRM based on lead data
      const generateTags = (): string[] => {
        const tags: string[] = [];
        
        // Source tag
        tags.push("PresaleProperties.com");
        
        // Form type tag
        const formType = getFormType(lead.lead_source);
        if (formType) tags.push(formType);
        
        // Project tag
        if (project?.name) tags.push(project.name);
        
        // City tag
        if (project?.city) tags.push(project.city);
        
        // Neighborhood tag
        if (project?.neighborhood) tags.push(project.neighborhood);
        
        // Persona tag
        if (lead.persona) {
          const personaMap: Record<string, string> = {
            "first_time": "First-Time Buyer",
            "first-time": "First-Time Buyer",
            "first-home": "First-Time Buyer",
            "investor": "Investor",
            "invest": "Investor",
            "portfolio": "Portfolio Builder",
            "upgrade": "Upgrading Home",
            "buyer": "Buyer",
          };
          tags.push(personaMap[lead.persona] || lead.persona);
        }
        
        // Agent status tag
        if (lead.agent_status === "i_am_realtor") {
          tags.push("Is Realtor");
        } else if (lead.agent_status === "yes") {
          tags.push("Has Realtor");
        } else if (lead.agent_status === "no") {
          tags.push("No Realtor");
        }
        
        // Home size tag
        if (lead.home_size) {
          const sizeMap: Record<string, string> = {
            "studio": "Studio",
            "1_bed": "1 Bedroom",
            "2_bed": "2 Bedroom", 
            "3_bed": "3+ Bedroom",
          };
          tags.push(sizeMap[lead.home_size] || lead.home_size);
        }
        
        // UTM source tag
        if (lead.utm_source) {
          tags.push(`UTM: ${lead.utm_source}`);
        }
        
        // City list specific tag
        if (lead.lead_source?.startsWith("city_list_")) {
          const city = lead.lead_source.replace("city_list_", "").replace(/_/g, " ");
          tags.push(`City List: ${city.charAt(0).toUpperCase() + city.slice(1)}`);
        }
        
        return tags;
      };

      // Determine if this is a tour/preview request
      const isTourRequest = lead.lead_source === "scheduler";
      const isFloorPlanRequest = lead.lead_source === "floor_plan_request" || !lead.lead_source;
      const isCallbackRequest = lead.lead_source === "callback_request";

      // Extract page location from landing_page URL
      const getFormLocation = (landingPage: string | null): string => {
        if (!landingPage) return "Direct/Unknown";
        try {
          // Handle both full URLs and paths
          let path = landingPage.toLowerCase();
          if (path.startsWith("http")) {
            const url = new URL(landingPage);
            path = url.pathname.toLowerCase();
          }
          
          if (path.includes("/presale-projects/") && path.split("/").length > 2) {
            return "Project Detail Page";
          } else if (path === "/" || path === "") {
            return "Homepage";
          } else if (path === "/presale-projects" || path === "/presale-projects/") {
            return "Projects Listing Page";
          } else if (path.includes("/blog")) {
            return "Blog";
          } else if (path.includes("/vip")) {
            return "VIP Membership Page";
          } else if (path.includes("/mortgage-calculator")) {
            return "Mortgage Calculator Page";
          } else if (path.includes("/roi-calculator") || path.includes("/roi")) {
            return "ROI Calculator Page";
          } else if (path.includes("/resale")) {
            return "New Homes Page";
          } else if (path.includes("-presale-") || path.includes("presale-")) {
            // Landing pages like /langley-presale-townhomes, /surrey-presale-condos
            const cityMatch = path.match(/\/([a-z-]+)-presale/);
            const city = cityMatch ? cityMatch[1].replace(/-/g, ' ') : '';
            return city ? `${city.charAt(0).toUpperCase() + city.slice(1)} Landing Page` : "City Landing Page";
          } else if (path.includes("/ad/") || path.includes("/exclusive-offer")) {
            return "Ad Landing Page";
          } else if (path.includes("/guide") || path.includes("/buyers-guide")) {
            return "Guide Page";
          } else if (path.includes("/contact")) {
            return "Contact Page";
          } else if (path.includes("/about")) {
            return "About Page";
          } else {
            // Return the path cleaned up for context
            const cleanPath = path.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' ');
            return cleanPath ? `${cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)} Page` : "Other Page";
          }
        } catch {
          return "Direct/Unknown";
        }
      };

      // Parse first and last name from message field if available, otherwise split the name
      const parseNames = (name: string, message: string | null): { firstName: string; lastName: string } => {
        // Try to extract from message field first (format: "First Name: X | Last Name: Y | ...")
        if (message) {
          const firstNameMatch = message.match(/First Name:\s*([^|]+)/i);
          const lastNameMatch = message.match(/Last Name:\s*([^|]+)/i);
          if (firstNameMatch && lastNameMatch) {
            return {
              firstName: firstNameMatch[1].trim(),
              lastName: lastNameMatch[1].trim(),
            };
          }
        }
        // Fallback: split the full name
        const parts = (name || "").trim().split(/\s+/);
        if (parts.length >= 2) {
          return {
            firstName: parts[0],
            lastName: parts.slice(1).join(" "),
          };
        }
        return { firstName: parts[0] || "", lastName: "" };
      };

      const { firstName, lastName } = parseNames(lead.name, lead.message);

      const tags = generateTags();
      const formType = getFormType(lead.lead_source);
      const formLocation = getFormLocation(lead.landing_page);
      
      // Build full page URL
      const getFullPageUrl = (): string => {
        if (lead.landing_page) {
          // If it's already a full URL, return it
          if (lead.landing_page.startsWith("http")) {
            return lead.landing_page;
          }
          // Otherwise, prepend the domain
          return `https://presaleproperties.com${lead.landing_page.startsWith("/") ? "" : "/"}${lead.landing_page}`;
        }
        return "";
      };

      const webhookPayload = {
        // Lead info - separate first and last name
        lead_id: lead.id,
        lead_first_name: firstName,
        lead_last_name: lastName,
        lead_name: lead.name,
        lead_email: lead.email,
        lead_phone: lead.phone || "",
        lead_notes: lead.message || "",
        lead_persona: lead.persona || "",
        lead_home_size: lead.home_size || "",
        lead_agent_status: lead.agent_status || "",
        is_realtor: lead.agent_status === "i_am_realtor" ? "Yes" : "No",
        has_realtor: lead.agent_status === "yes" ? "Yes" : "No",
        submitted_at: lead.created_at,
        
        // TAGS for Lofty CRM - comma-separated string AND array
        tags: tags.join(", "),
        tags_array: tags,
        
        // Visitor tracking for behavior enrichment
        visitor_id: lead.visitor_id || "",
        session_id: lead.session_id || "",
        intent_score: lead.intent_score || 0,
        city_interest: lead.city_interest || [],
        project_interest: lead.project_interest || [],
        
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
        
        // Lead type flags - use in Lofty for easy filtering
        is_floor_plan_request: isFloorPlanRequest ? "Yes" : "No",
        is_tour_request: isTourRequest ? "Yes" : "No",
        is_callback_request: isCallbackRequest ? "Yes" : "No",
        
        // Source tracking - CLEAR form identification
        source: "PresaleProperties.com",
        lead_source: lead.lead_source || "website_inquiry",
        form_type: formType,
        form_location: formLocation,
        lead_type: "project",
        
        // Full URLs for Lofty
        page_url: getFullPageUrl(),
        landing_page: lead.landing_page || "",
        landing_page_full: getFullPageUrl(),
        
        // UTM & Attribution tracking
        utm_source: lead.utm_source || "",
        utm_medium: lead.utm_medium || "",
        utm_campaign: lead.utm_campaign || "",
        utm_content: lead.utm_content || "",
        utm_term: lead.utm_term || "",
        referrer: lead.referrer || "",
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

    console.log("Lead processed successfully via Zapier webhook");

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