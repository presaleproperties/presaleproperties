import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
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
      // Build tags from provided data
      const tags: string[] = [];
      if (leadData.projectName) tags.push(leadData.projectName);
      if (leadData.projectCity) tags.push(leadData.projectCity);
      if (leadData.tags) tags.push(...leadData.tags.filter(t => !tags.includes(t)));
      if (tags.length === 0) tags.push("Website Lead");
      tags.push("Presale");
      
      console.log("Direct leadData tags:", tags);
      
      contactData = {
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone || undefined,
        source: leadData.source || "PresaleProperties.com",
        tags,
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

      // Build tags based on lead attributes - these appear in Lofty's Tag field
      const tags: string[] = [];
      
      // Priority tags: Project and City (most important for filtering)
      if (project?.name) tags.push(project.name);
      if (project?.city) tags.push(project.city);
      if (project?.neighborhood) tags.push(project.neighborhood);
      
      // Lead source/form type
      if (lead.lead_source === "scheduler") tags.push("Tour Request");
      else if (lead.lead_source === "floor_plan_request") tags.push("Floor Plan Request");
      else if (lead.lead_source === "callback_request") tags.push("Callback Request");
      else tags.push("Website Lead");
      
      // Buyer type
      if (lead.persona === "investor") tags.push("Investor");
      if (lead.persona === "first_time_buyer") tags.push("First Time Buyer");
      if (lead.persona === "family") tags.push("Upsizer");
      
      // Agent status
      if (lead.agent_status === "i_am_realtor") tags.push("Realtor");
      
      // Intent level
      if (lead.intent_score && lead.intent_score >= 70) tags.push("High Intent");
      else if (lead.intent_score && lead.intent_score >= 40) tags.push("Medium Intent");
      
      // Always add presale interest
      tags.push("Presale");
      
      console.log("Lead tags to sync:", tags);

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

      // Build tags - project and city first for filtering
      const tags: string[] = [];
      if (projectContext) tags.push(projectContext);
      if (booking.project_city) tags.push(booking.project_city);
      if (booking.project_neighborhood) tags.push(booking.project_neighborhood);
      tags.push("Tour Request");
      if (booking.buyer_type === "investor") tags.push("Investor");
      if (booking.buyer_type === "first_time_buyer") tags.push("First Time Buyer");
      if (booking.intent_score && booking.intent_score >= 70) tags.push("High Intent");
      else if (booking.intent_score && booking.intent_score >= 40) tags.push("Medium Intent");
      tags.push("Presale");
      
      console.log("Booking tags to sync:", tags);

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

    // Determine working auth header first
    const authHeadersToTry = [
      `token ${loftyApiKey}`,
      `Bearer ${loftyApiKey}`,
    ];
    
    let workingAuth = "";
    let baseUrl = "";
    
    // Find working auth by testing with a search request
    const searchUrls = [
      "https://api.lofty.com/v1.0/leads",
      "https://api.lofty.com/v1/leads",
    ];
    
    for (const url of searchUrls) {
      for (const auth of authHeadersToTry) {
        try {
          // Search for existing contact by email
          const searchUrl = `${url}?email=${encodeURIComponent(contactData.email || "")}`;
          console.log(`Searching for existing contact: ${searchUrl}`);
          
          const searchRes = await fetch(searchUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": auth,
            },
          });
          
          if (searchRes.ok) {
            workingAuth = auth;
            baseUrl = url;
            
            const searchBody = await searchRes.text();
            let existingContacts: any[] = [];
            
            try {
              const parsed = JSON.parse(searchBody);
              existingContacts = Array.isArray(parsed) ? parsed : (parsed.data || parsed.leads || []);
            } catch {
              existingContacts = [];
            }
            
            console.log(`Found ${existingContacts.length} existing contacts for email: ${contactData.email}`);
            
            // If contact exists, update it instead of creating new
            if (existingContacts.length > 0) {
              const existingId = existingContacts[0].id || existingContacts[0].lead_id;
              
              // Merge tags - add new tags without removing existing ones
              const existingTags = existingContacts[0].tags || [];
              const newTags = contactData.tags || [];
              const mergedTags = [...new Set([...existingTags, ...newTags])];
              
              // Append to notes instead of replacing
              const existingNotes = existingContacts[0].notes || "";
              const timestamp = new Date().toISOString().split("T")[0];
              const newNotes = `\n\n═══ NEW ACTIVITY (${timestamp}) ═══\n${contactData.notes}`;
              const mergedNotes = existingNotes + newNotes;
              
              const updatePayload = {
                firstName: contactData.first_name,
                lastName: contactData.last_name,
                email: contactData.email,
                phone: contactData.phone || existingContacts[0].phone,
                tags: mergedTags,
                notes: mergedNotes,
                // Update source to reflect latest interaction
                source: existingContacts[0].source || "PresaleProperties.com",
              };
              
              console.log(`Updating existing contact ${existingId} with merged tags:`, mergedTags);
              
              const updateRes = await fetch(`${baseUrl}/${existingId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": workingAuth,
                },
                body: JSON.stringify(updatePayload),
              });
              
              const updateBody = await updateRes.text();
              console.log("Lofty UPDATE response:", updateRes.status, updateBody);
              
              if (updateRes.ok) {
                return new Response(
                  JSON.stringify({
                    success: true,
                    loftyId: existingId,
                    message: "Existing contact updated in Lofty CRM",
                    action: "updated",
                  }),
                  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              
              // If PUT fails, try PATCH
              const patchRes = await fetch(`${baseUrl}/${existingId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": workingAuth,
                },
                body: JSON.stringify(updatePayload),
              });
              
              const patchBody = await patchRes.text();
              console.log("Lofty PATCH response:", patchRes.status, patchBody);
              
              if (patchRes.ok) {
                return new Response(
                  JSON.stringify({
                    success: true,
                    loftyId: existingId,
                    message: "Existing contact patched in Lofty CRM",
                    action: "patched",
                  }),
                  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
            
            break; // Found working auth, proceed to create new contact
          }
        } catch (err) {
          console.log(`Search attempt failed: ${err}`);
          continue;
        }
      }
      if (workingAuth) break;
    }
    
    // Create new contact if no existing one found
    const loftyPayload = {
      firstName: contactData.first_name,
      lastName: contactData.last_name,
      email: contactData.email,
      phone: contactData.phone,
      source: leadSource,
      notes: contactData.notes,
      tags: contactData.tags,
      inquirySource: projectContext ? `${projectContext} - PresaleProperties.com` : "PresaleProperties.com",
    };

    const loftyUrls = baseUrl ? [baseUrl] : [
      "https://api.lofty.com/v1.0/leads",
      "https://api.lofty.com/v1/leads",
    ];
    
    const authsToUse = workingAuth ? [workingAuth] : authHeadersToTry;

    let lastStatus: number | null = null;
    let lastBody = "";

    for (const url of loftyUrls) {
      for (const auth of authsToUse) {
        const authMode = auth.startsWith("token ") ? "token" : "bearer";
        console.log(`Creating new lead via Lofty API (${authMode}) -> ${url}`);

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

        console.log("Lofty POST response:", res.status);

        if (res.ok) {
          let loftyData: any;
          try {
            loftyData = JSON.parse(bodyText);
          } catch {
            loftyData = { raw: bodyText };
          }

          console.log("New lead created in Lofty successfully");
          return new Response(
            JSON.stringify({
              success: true,
              loftyId: loftyData?.id || loftyData?.lead_id,
              message: "New lead created in Lofty CRM",
              action: "created",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (res.status === 401 || res.status === 403) {
          continue;
        }

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

    // All attempts failed
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
  const sections: string[] = [];
  
  // Header
  sections.push("═══ LEAD FROM PRESALEPROPERTIES.COM ═══");
  
  // Project Interest
  if (data?.projectName || data?.projectCity) {
    sections.push("");
    sections.push("📍 PRIMARY INTEREST");
    if (data?.projectName) sections.push(`   Project: ${data.projectName}`);
    if (data?.projectCity) sections.push(`   City: ${data.projectCity}`);
  }
  
  // Lead Quality
  sections.push("");
  sections.push("📊 LEAD QUALITY");
  sections.push(`   Intent Score: ${data?.intentScore || 0}/100`);
  
  // Message
  if (data?.notes) {
    sections.push("");
    sections.push("💬 MESSAGE");
    sections.push(`   ${data.notes}`);
  }
  
  // Traffic Source
  if (data?.utmSource || data?.utmMedium || data?.utmCampaign) {
    sections.push("");
    sections.push("🔗 TRAFFIC SOURCE");
    if (data?.utmSource) sections.push(`   Source: ${data.utmSource}`);
    if (data?.utmMedium) sections.push(`   Medium: ${data.utmMedium}`);
    if (data?.utmCampaign) sections.push(`   Campaign: ${data.utmCampaign}`);
  }
  
  return sections.join("\n");
}

function buildLeadNotes(lead: any, project: any): string {
  const sections: string[] = [];
  
  // Header
  sections.push("═══ LEAD FROM PRESALEPROPERTIES.COM ═══");
  
  // Primary Interest
  sections.push("");
  sections.push("📍 PRIMARY INTEREST");
  if (project?.name) sections.push(`   Project: ${project.name}`);
  if (project?.city) sections.push(`   Location: ${project.city}${project.neighborhood ? `, ${project.neighborhood}` : ""}`);
  if (project?.developer_name) sections.push(`   Developer: ${project.developer_name}`);
  if (project?.status) sections.push(`   Status: ${project.status}`);
  
  // Browsing Behavior
  const projectInterest = Array.isArray(lead.project_interest) ? lead.project_interest : [];
  const cityInterest = Array.isArray(lead.city_interest) ? lead.city_interest : [];
  
  if (projectInterest.length > 0 || cityInterest.length > 0) {
    sections.push("");
    sections.push("👁️ BROWSING BEHAVIOR");
    if (projectInterest.length > 0) {
      sections.push(`   Projects Viewed: ${projectInterest.join(", ")}`);
    }
    if (cityInterest.length > 0) {
      sections.push(`   Cities Explored: ${cityInterest.join(", ")}`);
    }
  }
  
  // Buyer Profile
  sections.push("");
  sections.push("👤 BUYER PROFILE");
  if (lead.persona) {
    const personaLabels: Record<string, string> = {
      investor: "Investor",
      first_time_buyer: "First-Time Buyer",
      family: "Upsizer/Family",
      downsizer: "Downsizer",
    };
    sections.push(`   Buyer Type: ${personaLabels[lead.persona] || lead.persona}`);
  }
  if (lead.home_size) {
    const sizeLabels: Record<string, string> = {
      studio: "Studio",
      "1bed": "1 Bedroom",
      "2bed": "2 Bedroom",
      "3bed": "3+ Bedroom",
      townhome: "Townhome",
    };
    sections.push(`   Looking For: ${sizeLabels[lead.home_size] || lead.home_size}`);
  }
  if (lead.timeline) {
    const timelineLabels: Record<string, string> = {
      "0_3_months": "0-3 months (Ready Now)",
      "3_6_months": "3-6 months",
      "6_12_months": "6-12 months",
      "12_plus_months": "12+ months",
    };
    sections.push(`   Timeline: ${timelineLabels[lead.timeline] || lead.timeline}`);
  }
  if (lead.agent_status) {
    const agentLabels: Record<string, string> = {
      i_am_realtor: "Is a Realtor",
      yes: "Working with Realtor",
      no: "No Realtor",
      working_with_realtor: "Working with Realtor",
    };
    sections.push(`   Realtor: ${agentLabels[lead.agent_status] || lead.agent_status}`);
  }
  
  // Lead Quality Score
  sections.push("");
  sections.push("📊 LEAD QUALITY");
  sections.push(`   Intent Score: ${lead.intent_score || 0}/100`);
  if (lead.intent_score >= 70) {
    sections.push(`   ⭐ HIGH INTENT - Priority Follow-up`);
  } else if (lead.intent_score >= 40) {
    sections.push(`   📈 Medium Intent - Nurture Sequence`);
  }
  
  // Message from Lead
  if (lead.message) {
    // Extract just the message part, removing the First Name/Last Name prefix if present
    let cleanMessage = lead.message;
    const msgMatch = lead.message.match(/\|[^|]*$/);
    if (msgMatch) {
      cleanMessage = msgMatch[0].replace(/^\|\s*/, "").trim();
    } else if (!lead.message.includes("First Name:")) {
      cleanMessage = lead.message;
    }
    if (cleanMessage && cleanMessage.length > 5) {
      sections.push("");
      sections.push("💬 MESSAGE");
      sections.push(`   "${cleanMessage}"`);
    }
  }
  
  // Traffic Attribution
  if (lead.utm_source || lead.referrer || lead.landing_page) {
    sections.push("");
    sections.push("🔗 TRAFFIC SOURCE");
    if (lead.utm_source) sections.push(`   Source: ${lead.utm_source}${lead.utm_medium ? ` / ${lead.utm_medium}` : ""}`);
    if (lead.utm_campaign) sections.push(`   Campaign: ${lead.utm_campaign}`);
    if (lead.referrer) sections.push(`   Referrer: ${lead.referrer}`);
    if (lead.landing_page) {
      // Extract just the path for readability
      try {
        const url = new URL(lead.landing_page);
        sections.push(`   Converted On: ${url.pathname}`);
      } catch {
        sections.push(`   Converted On: ${lead.landing_page}`);
      }
    }
  }
  
  // Tracking IDs (useful for support/debugging)
  if (lead.visitor_id || lead.session_id) {
    sections.push("");
    sections.push("🔍 TRACKING");
    if (lead.visitor_id) sections.push(`   Visitor ID: ${lead.visitor_id}`);
    if (lead.session_id) sections.push(`   Session: ${lead.session_id}`);
  }
  
  return sections.join("\n");
}

function buildBookingNotes(booking: any, project: any): string {
  const sections: string[] = [];
  
  // Header
  sections.push("═══ TOUR BOOKING FROM PRESALEPROPERTIES.COM ═══");
  
  // Appointment Details
  sections.push("");
  sections.push("📅 APPOINTMENT REQUEST");
  sections.push(`   Project: ${booking.project_name || project?.name || "Unknown"}`);
  if (booking.appointment_date) sections.push(`   Date: ${booking.appointment_date}`);
  if (booking.appointment_time) sections.push(`   Time: ${booking.appointment_time}`);
  if (booking.appointment_type) {
    const typeLabel = booking.appointment_type === "preview" ? "Sales Center Preview" : "Private Showing";
    sections.push(`   Type: ${typeLabel}`);
  }
  
  // Location
  if (project?.city || booking.project_city) {
    sections.push("");
    sections.push("📍 LOCATION");
    sections.push(`   City: ${project?.city || booking.project_city}`);
    if (project?.neighborhood || booking.project_neighborhood) {
      sections.push(`   Area: ${project?.neighborhood || booking.project_neighborhood}`);
    }
  }
  
  // Buyer Profile
  sections.push("");
  sections.push("👤 BUYER PROFILE");
  if (booking.buyer_type) {
    const buyerLabels: Record<string, string> = {
      investor: "Investor",
      first_time: "First-Time Buyer",
      first_time_buyer: "First-Time Buyer",
      upgrader: "Upgrading/Upsizing",
      other: "Other",
    };
    sections.push(`   Type: ${buyerLabels[booking.buyer_type] || booking.buyer_type}`);
  }
  if (booking.timeline) {
    const timelineLabels: Record<string, string> = {
      "0_3_months": "0-3 months (Ready Now)",
      "3_6_months": "3-6 months",
      "6_12_months": "6-12 months",
      "12_plus_months": "12+ months",
    };
    sections.push(`   Timeline: ${timelineLabels[booking.timeline] || booking.timeline}`);
  }
  
  // Lead Quality
  sections.push("");
  sections.push("📊 LEAD QUALITY");
  sections.push(`   Intent Score: ${booking.intent_score || 0}/100`);
  if (booking.intent_score >= 70) {
    sections.push(`   ⭐ HIGH INTENT - Priority Follow-up`);
  }
  
  // Notes
  if (booking.notes) {
    sections.push("");
    sections.push("💬 NOTES");
    sections.push(`   "${booking.notes}"`);
  }
  
  // Traffic Source
  if (booking.utm_source || booking.referrer) {
    sections.push("");
    sections.push("🔗 TRAFFIC SOURCE");
    if (booking.utm_source) sections.push(`   Source: ${booking.utm_source}${booking.utm_medium ? ` / ${booking.utm_medium}` : ""}`);
    if (booking.utm_campaign) sections.push(`   Campaign: ${booking.utm_campaign}`);
  }
  
  // Tracking
  if (booking.visitor_id || booking.session_id) {
    sections.push("");
    sections.push("🔍 TRACKING");
    if (booking.visitor_id) sections.push(`   Visitor ID: ${booking.visitor_id}`);
    if (booking.session_id) sections.push(`   Session: ${booking.session_id}`);
  }
  
  return sections.join("\n");
}
