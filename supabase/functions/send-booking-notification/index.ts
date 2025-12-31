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
      
      const webhookPayload = {
        // Lead info
        lead_id: data.booking_id || `booking-${Date.now()}`,
        lead_name: data.name,
        lead_email: data.email,
        lead_phone: data.phone || "",
        lead_notes: data.notes || "",
        lead_persona: data.persona || data.buyer_type || "",
        lead_home_size: data.home_size || "",
        lead_agent_status: data.agent_status || "",
        is_realtor: data.agent_status === "i_am_realtor" ? "Yes" : "No",
        has_realtor: data.agent_status === "yes" ? "Yes" : "No",
        submitted_at: new Date().toISOString(),
        
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
        
        // Source
        source: "PresaleProperties.com",
        form_type: "Booking Form",
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

    // Email sending removed - all booking communication handled via Lofty CRM through Zapier
    console.log("Booking processed successfully - Zapier webhook will handle CRM sync to Lofty");

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
