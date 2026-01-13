import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  booking_id?: string;
  appointment_type: "preview" | "showing";
  appointment_date: string;
  appointment_time: string;
  formattedDate: string;
  formattedTime: string;
  project_name: string;
  project_id?: string;
  project_url: string;
  project_city?: string;
  project_neighborhood?: string;
  name: string;
  email: string;
  phone: string;
  buyer_type: string;
  timeline: string;
  persona?: string;
  home_size?: string;
  agent_status?: string;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  // Visitor tracking fields
  visitor_id?: string;
  session_id?: string;
  intent_score?: number;
  city_interest?: string[];
  project_interest?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();
    console.log("Processing booking notification:", data);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const appointmentTypeLabel = data.appointment_type === "preview" 
      ? "Preview Presentation" 
      : "On-site Showing";

    const buyerTypeLabels: Record<string, string> = {
      first_time: "First-time Buyer",
      investor: "Investor",
      upgrader: "Upgrading",
      other: "Other",
    };

    // Get webhook URL from app_settings (fallback to env var for backwards compatibility)
    let zapierWebhookUrl = Deno.env.get("ZAPIER_PROJECT_LEADS_WEBHOOK");
    
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_bookings_webhook")
      .single();
    
    if (webhookSetting?.value && typeof webhookSetting.value === "string" && webhookSetting.value.trim()) {
      zapierWebhookUrl = webhookSetting.value;
      console.log("Using webhook URL from app_settings");
    }
    
    if (zapierWebhookUrl) {
      console.log("Sending booking to Zapier webhook for Lofty CRM");
      
      // Parse first and last name from notes field if available, otherwise split the name
      const parseNames = (name: string, notes: string | undefined): { firstName: string; lastName: string } => {
        // Try to extract from notes field first (format: "First Name: X | Last Name: Y | ...")
        if (notes) {
          const firstNameMatch = notes.match(/First Name:\s*([^|]+)/i);
          const lastNameMatch = notes.match(/Last Name:\s*([^|]+)/i);
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

      // Parse home size and agent status from notes if not directly provided
      const parseFromNotes = (notes: string | undefined): { homeSize: string; agentStatus: string } => {
        let homeSize = "";
        let agentStatus = "";
        
        if (notes) {
          const homeSizeMatch = notes.match(/Home size:\s*([^,|]+)/i);
          const agentMatch = notes.match(/Agent:\s*([^,.|]+)/i);
          if (homeSizeMatch) homeSize = homeSizeMatch[1].trim();
          if (agentMatch) agentStatus = agentMatch[1].trim();
        }
        
        return { homeSize, agentStatus };
      };

      const { firstName, lastName } = parseNames(data.name, data.notes);
      const parsedFromNotes = parseFromNotes(data.notes);
      
      // Use direct fields if available, otherwise use parsed values
      const homeSize = data.home_size || parsedFromNotes.homeSize;
      const agentStatus = data.agent_status || parsedFromNotes.agentStatus;
      
      const webhookPayload = {
        // Lead info - separate first and last name
        lead_id: data.booking_id || `booking-${Date.now()}`,
        lead_first_name: firstName,
        lead_last_name: lastName,
        lead_name: data.name,
        lead_email: data.email,
        lead_phone: data.phone || "",
        lead_notes: data.notes || "",
        lead_persona: data.persona || data.buyer_type || "",
        lead_home_size: homeSize,
        lead_agent_status: agentStatus,
        is_realtor: agentStatus === "is_agent" ? "Yes" : "No",
        has_realtor: agentStatus === "has_agent" ? "Yes" : "No",
        submitted_at: new Date().toISOString(),
        
        // Visitor tracking for behavior enrichment
        visitor_id: data.visitor_id || "",
        session_id: data.session_id || "",
        intent_score: data.intent_score || 0,
        city_interest: data.city_interest || [],
        project_interest: data.project_interest || [],
        
        // Booking specific info
        appointment_type: appointmentTypeLabel,
        appointment_date: data.formattedDate,
        appointment_time: data.formattedTime,
        buyer_type: buyerTypeLabels[data.buyer_type] || data.buyer_type,
        timeline: data.timeline,
        
        // Project info
        project_id: data.project_id || "",
        project_name: data.project_name,
        project_city: data.project_city || "",
        project_neighborhood: data.project_neighborhood || "",
        project_url: data.project_url,
        
        // Lead type flags
        is_floor_plan_request: "No",
        is_tour_request: "Yes",
        is_callback_request: "No",
        
        // Attribution
        utm_source: data.utm_source || "",
        utm_medium: data.utm_medium || "",
        utm_campaign: data.utm_campaign || "",
        referrer: data.referrer || "",
        
        // Source
        source: "PresaleProperties.com",
        form_type: "Schedule a Preview",
        form_location: "Booking Modal",
        lead_type: "booking",
      };

      console.log("Zapier webhook payload:", JSON.stringify(webhookPayload));

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
      console.log("No Zapier webhook configured (ZAPIER_PROJECT_LEADS_WEBHOOK), skipping CRM sync");
    }

    // Direct Lofty API sync (bypasses Zapier for real-time delivery)
    if (data.booking_id) {
      try {
        console.log("Syncing booking directly to Lofty CRM API");
        const loftyResponse = await fetch(`${supabaseUrl}/functions/v1/sync-lead-to-lofty`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ bookingId: data.booking_id }),
        });
        
        const loftyResult = await loftyResponse.json();
        console.log("Lofty sync result:", loftyResult);
      } catch (loftyError) {
        console.error("Error syncing to Lofty:", loftyError);
        // Don't throw - Zapier is the fallback
      }
    }

    console.log("Booking processed successfully - synced to Lofty CRM");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing booking notification:", error);
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
