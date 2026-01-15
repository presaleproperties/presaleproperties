import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoftySyncRequest {
  leadId?: string;
  bookingId?: string;
  leadData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    tags?: string[];
    source?: string;
    projectName?: string;
    projectCity?: string;
    intentScore?: number;
    visitorId?: string;
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

interface LoftyContact {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, string>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const loftyApiKey = Deno.env.get("LOFTY_API_KEY");
    
    if (!loftyApiKey) {
      console.log("LOFTY_API_KEY not configured, skipping direct sync");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "LOFTY_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { leadId, bookingId, leadData }: LoftySyncRequest = await req.json();
    console.log("Syncing to Lofty:", { leadId, bookingId, hasDirectData: !!leadData });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let contactData: LoftyContact;
    let leadSource = "Website";
    let projectContext = "";

    // If direct lead data is provided, use it
    if (leadData) {
      contactData = {
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone || undefined,
        source: leadData.source || "PresaleProperties.com",
        tags: leadData.tags || ["Website Lead"],
        notes: buildNotes(leadData),
        custom_fields: {
          visitor_id: leadData.visitorId || "",
          session_id: leadData.sessionId || "",
          intent_score: String(leadData.intentScore || 0),
          utm_source: leadData.utmSource || "",
          utm_medium: leadData.utmMedium || "",
          utm_campaign: leadData.utmCampaign || "",
        },
      };
      projectContext = leadData.projectName || "";
    }
    // Fetch from project_leads table
    else if (leadId) {
      const { data: lead, error } = await supabase
        .from("project_leads")
        .select(`
          *,
          presale_projects (name, city, neighborhood, developer_name, status)
        `)
        .eq("id", leadId)
        .single();

      if (error || !lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      const { firstName, lastName } = parseNames(lead.name, lead.message);
      const project = lead.presale_projects as any;
      projectContext = project?.name || "";

      // Build tags based on lead attributes
      const tags: string[] = ["Website Lead", "Presale Interest"];
      if (lead.persona === "investor") tags.push("Investor");
      if (lead.persona === "first_time_buyer") tags.push("First Time Buyer");
      if (lead.persona === "family") tags.push("Upsizer");
      if (lead.agent_status === "i_am_realtor") tags.push("Realtor");
      if (lead.lead_source === "scheduler") tags.push("Tour Request");
      if (lead.lead_source === "floor_plan_request") tags.push("Floor Plan Request");
      if (lead.intent_score && lead.intent_score >= 50) tags.push("High Intent");
      if (project?.city) tags.push(project.city);

      contactData = {
        first_name: firstName,
        last_name: lastName,
        email: lead.email,
        phone: lead.phone || undefined,
        source: "PresaleProperties.com",
        tags,
        notes: buildLeadNotes(lead, project),
        custom_fields: {
          visitor_id: lead.visitor_id || "",
          session_id: lead.session_id || "",
          intent_score: String(lead.intent_score || 0),
          project_name: project?.name || "",
          project_city: project?.city || "",
          project_neighborhood: project?.neighborhood || "",
          home_size: lead.home_size || "",
          persona: lead.persona || "",
          utm_source: lead.utm_source || "",
          utm_medium: lead.utm_medium || "",
          utm_campaign: lead.utm_campaign || "",
        },
      };
      leadSource = getLeadSourceLabel(lead.lead_source);
    }
    // Fetch from bookings table
    else if (bookingId) {
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(`
          *,
          presale_projects (name, city, neighborhood, developer_name)
        `)
        .eq("id", bookingId)
        .single();

      if (error || !booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      const { firstName, lastName } = parseNames(booking.name, null);
      const project = booking.presale_projects as any;
      projectContext = booking.project_name || project?.name || "";

      const tags: string[] = ["Website Lead", "Tour Request", "Presale Interest"];
      if (booking.buyer_type === "investor") tags.push("Investor");
      if (booking.buyer_type === "first_time_buyer") tags.push("First Time Buyer");
      if (booking.intent_score && booking.intent_score >= 50) tags.push("High Intent");
      if (booking.project_city) tags.push(booking.project_city);

      contactData = {
        first_name: firstName,
        last_name: lastName,
        email: booking.email,
        phone: booking.phone || undefined,
        source: "PresaleProperties.com",
        tags,
        notes: buildBookingNotes(booking, project),
        custom_fields: {
          visitor_id: booking.visitor_id || "",
          session_id: booking.session_id || "",
          intent_score: String(booking.intent_score || 0),
          project_name: projectContext,
          appointment_date: booking.appointment_date || "",
          appointment_time: booking.appointment_time || "",
          appointment_type: booking.appointment_type || "",
          buyer_type: booking.buyer_type || "",
          timeline: booking.timeline || "",
          utm_source: booking.utm_source || "",
          utm_medium: booking.utm_medium || "",
          utm_campaign: booking.utm_campaign || "",
        },
      };
      leadSource = "Tour Booking";
    } else {
      throw new Error("Either leadId, bookingId, or leadData is required");
    }

    // Call Lofty API to create/update contact
    // Lofty Open API uses versioned base paths (v1.0). Some accounts may still accept v1.
    const loftyPayload = {
      // Lofty expects camelCase fields
      firstName: contactData.first_name,
      lastName: contactData.last_name,
      email: contactData.email,
      phone: contactData.phone,
      source: leadSource,
      notes: contactData.notes,
      tags: contactData.tags,
      // Helpful extra context (safe to ignore if Lofty doesn't recognize it)
      inquirySource: projectContext ? `${projectContext} - PresaleProperties.com` : "PresaleProperties.com",
    };

    const loftyUrls = [
      "https://api.lofty.com/v1.0/leads",
      "https://api.lofty.com/v1/leads",
    ];

    const authHeadersToTry = [
      `token ${loftyApiKey}`,
      `Bearer ${loftyApiKey}`,
    ];

    let lastStatus: number | null = null;
    let lastBody = "";

    for (const url of loftyUrls) {
      for (const auth of authHeadersToTry) {
        const authMode = auth.startsWith("token ") ? "token" : "bearer";
        console.log(`Calling Lofty API (${authMode}) -> ${url}`);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": auth,
          },
          body: JSON.stringify(loftyPayload),
        });

        const bodyText = await res.text();
        lastStatus = res.status;
        lastBody = bodyText;

        console.log("Lofty API response:", res.status);

        if (res.ok) {
          let loftyData: any;
          try {
            loftyData = JSON.parse(bodyText);
          } catch {
            loftyData = { raw: bodyText };
          }

          console.log("Lead synced to Lofty successfully");
          return new Response(
            JSON.stringify({
              success: true,
              loftyId: loftyData?.id || loftyData?.lead_id,
              message: "Lead synced to Lofty CRM",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If auth failed, try next auth/header combo.
        if (res.status === 401 || res.status === 403) {
          continue;
        }

        // For non-auth errors (400/422/500), don't spam retries.
        return new Response(
          JSON.stringify({
            success: false,
            error: "Lofty API error",
            status: res.status,
            details: bodyText,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // All attempts failed (likely auth)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Lofty API error",
        status: lastStatus,
        details: lastBody,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error syncing to Lofty:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions
function parseNames(name: string, message: string | null): { firstName: string; lastName: string } {
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
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }
  return { firstName: parts[0] || "", lastName: "" };
}

function getLeadSourceLabel(source: string | null): string {
  switch (source) {
    case "scheduler": return "Tour Request";
    case "floor_plan_request": return "Floor Plan Request";
    case "callback_request": return "Callback Request";
    case "general_inquiry": return "General Inquiry";
    default: return "Website Lead";
  }
}

function buildNotes(data: LoftySyncRequest["leadData"]): string {
  const lines: string[] = [];
  if (data?.notes) lines.push(data.notes);
  if (data?.projectName) lines.push(`Project Interest: ${data.projectName}`);
  if (data?.projectCity) lines.push(`City: ${data.projectCity}`);
  if (data?.intentScore) lines.push(`Intent Score: ${data.intentScore}`);
  if (data?.utmSource) lines.push(`Source: ${data.utmSource}/${data.utmMedium || ""}`);
  return lines.join("\n");
}

function buildLeadNotes(lead: any, project: any): string {
  const lines: string[] = [];
  lines.push(`Lead from PresaleProperties.com`);
  if (project?.name) lines.push(`Project: ${project.name}`);
  if (project?.city) lines.push(`City: ${project.city}, ${project.neighborhood || ""}`);
  if (lead.persona) lines.push(`Buyer Type: ${lead.persona}`);
  if (lead.home_size) lines.push(`Looking For: ${lead.home_size}`);
  if (lead.agent_status) lines.push(`Realtor Status: ${lead.agent_status}`);
  if (lead.intent_score) lines.push(`Intent Score: ${lead.intent_score}`);
  if (lead.message) lines.push(`Message: ${lead.message}`);
  if (lead.landing_page) lines.push(`Landing Page: ${lead.landing_page}`);
  return lines.join("\n");
}

function buildBookingNotes(booking: any, project: any): string {
  const lines: string[] = [];
  lines.push(`Tour Booking from PresaleProperties.com`);
  lines.push(`Project: ${booking.project_name || project?.name || "Unknown"}`);
  if (booking.appointment_date) lines.push(`Requested Date: ${booking.appointment_date}`);
  if (booking.appointment_time) lines.push(`Requested Time: ${booking.appointment_time}`);
  if (booking.appointment_type) lines.push(`Type: ${booking.appointment_type}`);
  if (booking.buyer_type) lines.push(`Buyer Type: ${booking.buyer_type}`);
  if (booking.timeline) lines.push(`Timeline: ${booking.timeline}`);
  if (booking.intent_score) lines.push(`Intent Score: ${booking.intent_score}`);
  if (booking.notes) lines.push(`Notes: ${booking.notes}`);
  return lines.join("\n");
}
