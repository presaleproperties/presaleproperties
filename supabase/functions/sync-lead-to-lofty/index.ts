import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOFTY_BASE_URL = "https://api.lofty.com/v1.0/leads";
const LOFTY_SOURCE = "presaleproperties.com";

interface LoftySyncRequest {
  leadId?: string;
  bookingId?: string;
  leadData?: Record<string, any>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const loftyApiKey = Deno.env.get("LOFTY_API_KEY");
    if (!loftyApiKey) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "LOFTY_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = `token ${loftyApiKey}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: LoftySyncRequest = await req.json();
    const { leadId, bookingId, leadData } = body;

    console.log("sync-lead-to-lofty called:", { leadId, bookingId, hasDirectData: !!leadData });

    // ── Build contact payload ──────────────────────────────────────────────
    let firstName = "";
    let lastName = "";
    let email = "";
    let phone = "";
    let tags: string[] = [];
    let notesText = "";
    let supabaseLeadId: string | undefined;

    if (leadData) {
      // ── Direct data from useLeadSubmission hook ─────────────────────────
      firstName = leadData.firstName || "";
      lastName = leadData.lastName || "";
      email = leadData.email || "";
      phone = leadData.phone || "";
      supabaseLeadId = leadData.leadId;

      // Tags: project name, city, form type, temperature, source, property type
      const rawTags: (string | null | undefined)[] = [
        "presale",
        leadData.projectName ? leadData.projectName.toLowerCase().replace(/\s+/g, "-") : null,
        leadData.projectCity ? leadData.projectCity.toLowerCase().replace(/\s+/g, "-") : null,
        leadData.propertyType ? leadData.propertyType.toLowerCase().replace(/\s+/g, "-") : null,
        leadData.formType ? leadData.formType.replace(/_/g, "-") : null,
        leadData.leadTemperature || null,
        leadData.usedCalculator ? "used-calculator" : null,
        leadData.utmSource ? `src-${leadData.utmSource}` : null,
        leadData.sessionCount >= 2 ? "returning-visitor" : "new-visitor",
        leadData.isRealtor ? "realtor" : null,
      ];
      tags = rawTags.filter(Boolean) as string[];

      notesText = buildDirectNotes(leadData);
    } else if (leadId) {
      // ── Fetch from project_leads table ──────────────────────────────────
      const { data: lead, error } = await supabase
        .from("project_leads")
        .select(`*, presale_projects (name, city, neighborhood, developer_name, status, property_type)`)
        .eq("id", leadId)
        .single();

      if (error || !lead) throw new Error(`Lead not found: ${leadId}`);

      supabaseLeadId = leadId;
      const parsed = parseNames(lead.name, lead.message);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
      email = lead.email;
      phone = lead.phone || "";

      const project = lead.presale_projects as any;
      const rawTags: (string | null | undefined)[] = [
        "presale",
        project?.name ? project.name.toLowerCase().replace(/\s+/g, "-") : null,
        project?.city ? project.city.toLowerCase().replace(/\s+/g, "-") : null,
        project?.property_type ? project.property_type.toLowerCase().replace(/\s+/g, "-") : null,
        lead.lead_source ? lead.lead_source.replace(/_/g, "-") : null,
        lead.lead_temperature || null,
        lead.persona ? lead.persona.replace(/_/g, "-") : null,
        lead.agent_status === "i_am_realtor" ? "realtor" : null,
        lead.used_calculator ? "used-calculator" : null,
        lead.utm_source ? `src-${lead.utm_source}` : null,
      ];
      tags = rawTags.filter(Boolean) as string[];

      notesText = buildLeadNotes(lead, project);
    } else if (bookingId) {
      // ── Fetch from bookings table ───────────────────────────────────────
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(`*, presale_projects (name, city, neighborhood, developer_name)`)
        .eq("id", bookingId)
        .single();

      if (error || !booking) throw new Error(`Booking not found: ${bookingId}`);

      supabaseLeadId = bookingId;
      const parsed = parseNames(booking.name, null);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
      email = booking.email;
      phone = booking.phone || "";

      const project = booking.presale_projects as any;
      const rawTags: (string | null | undefined)[] = [
        "presale",
        "tour-request",
        (booking.project_name || project?.name) ? (booking.project_name || project?.name).toLowerCase().replace(/\s+/g, "-") : null,
        booking.project_city ? booking.project_city.toLowerCase().replace(/\s+/g, "-") : null,
        booking.buyer_type ? booking.buyer_type.replace(/_/g, "-") : null,
        booking.intent_score >= 70 ? "high-intent" : booking.intent_score >= 40 ? "medium-intent" : null,
        booking.utm_source ? `src-${booking.utm_source}` : null,
      ];
      tags = rawTags.filter(Boolean) as string[];

      notesText = buildBookingNotes(booking, project);
    } else {
      throw new Error("leadId, bookingId, or leadData required");
    }

    if (!email) throw new Error("Email is required to sync to Lofty");

    console.log("Prepared contact:", { firstName, lastName, email, phone, tags });

    // ── Search for existing contact by email ──────────────────────────────
    let existingLoftyId: string | null = null;

    try {
      const searchRes = await fetch(
        `${LOFTY_BASE_URL}?email=${encodeURIComponent(email)}&limit=1`,
        {
          method: "GET",
          headers: { "Accept": "application/json", "Authorization": authHeader },
        }
      );

      if (searchRes.ok) {
        const searchText = await searchRes.text();
        console.log("Lofty search response:", searchRes.status, searchText.substring(0, 300));

        let searchData: any;
        try { searchData = JSON.parse(searchText); } catch { searchData = null; }

        // Lofty returns { data: [...] } or array directly — extract list
        const contacts: any[] = Array.isArray(searchData)
          ? searchData
          : (searchData?.data || searchData?.leads || searchData?.results || []);

        if (contacts.length > 0) {
          // Lofty uses "leadId" as primary identifier (not "id")
          existingLoftyId = String(
            contacts[0].leadId || contacts[0].lead_id || contacts[0].id || ""
          ) || null;
          console.log("Found existing Lofty contact:", existingLoftyId, "raw keys:", Object.keys(contacts[0]));
        }
      } else {
        console.warn("Lofty search failed:", searchRes.status);
      }
    } catch (searchErr) {
      console.warn("Lofty search error (will create new):", searchErr);
    }

    // ── UPDATE existing contact ───────────────────────────────────────────
    if (existingLoftyId && existingLoftyId !== "null" && existingLoftyId !== "undefined") {
      console.log("Updating existing Lofty contact:", existingLoftyId);

      // Build a "return visit" note to append
      const returnNote = buildReturnVisitNote(notesText);

      // Try to add a note via the notes endpoint first
      try {
        const noteRes = await fetch(`${LOFTY_BASE_URL}/${existingLoftyId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({ content: returnNote, note: returnNote }),
        });
        const noteBody = await noteRes.text();
        console.log("Lofty add note response:", noteRes.status, noteBody.substring(0, 200));
      } catch (noteErr) {
        console.warn("Notes endpoint failed:", noteErr);
      }

      // Also update the contact record to merge tags
      const updatePayload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || undefined,
        tags: tags,
        source: LOFTY_SOURCE,
        note: returnNote,
        notes: returnNote,
      };

      const updateRes = await fetch(`${LOFTY_BASE_URL}/${existingLoftyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(updatePayload),
      });

      const updateBody = await updateRes.text();
      console.log("Lofty PUT update response:", updateRes.status, updateBody.substring(0, 300));

      // Update supabase lofty_id regardless
      if (supabaseLeadId) {
        await supabase.from("project_leads" as any).update({
          lofty_id: existingLoftyId,
          lofty_synced_at: new Date().toISOString(),
        }).eq("id", supabaseLeadId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          loftyId: existingLoftyId,
          action: "updated",
          message: "Existing Lofty contact updated with return visit note",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CREATE new contact ────────────────────────────────────────────────
    console.log("Creating new Lofty contact for:", email);

    const createPayload = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone || undefined,
      source: LOFTY_SOURCE,
      tags: tags,
      note: notesText,
      notes: notesText,
    };

    console.log("Lofty CREATE payload:", {
      ...createPayload,
      note: `[${createPayload.note?.length ?? 0} chars]`,
    });

    const createRes = await fetch(LOFTY_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(createPayload),
    });

    const createBody = await createRes.text();
    console.log("Lofty CREATE response:", createRes.status, createBody.substring(0, 500));

    if (createRes.ok) {
      let createData: any;
      try { createData = JSON.parse(createBody); } catch { createData = {}; }

      const loftyId = String(createData?.leadId || createData?.id || createData?.lead_id || "");

      // Save loftyId back to supabase
      if (supabaseLeadId && loftyId) {
        await supabase.from("project_leads" as any).update({
          lofty_id: loftyId,
          lofty_synced_at: new Date().toISOString(),
        }).eq("id", supabaseLeadId);
      }

      return new Response(
        JSON.stringify({ success: true, loftyId, action: "created" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Lofty API error", status: createRes.status, details: createBody }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("sync-lead-to-lofty error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNames(name: string, message: string | null): { firstName: string; lastName: string } {
  if (message) {
    const firstMatch = message.match(/First Name:\s*([^|]+)/i);
    const lastMatch = message.match(/Last Name:\s*([^|]+)/i);
    if (firstMatch && lastMatch) {
      return { firstName: firstMatch[1].trim(), lastName: lastMatch[1].trim() };
    }
  }
  const parts = (name || "").trim().split(/\s+/);
  return parts.length >= 2
    ? { firstName: parts[0], lastName: parts.slice(1).join(" ") }
    : { firstName: parts[0] || "", lastName: "" };
}

function buildReturnVisitNote(latestActivity: string): string {
  const ts = new Date().toLocaleString("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  return [
    `════════════════════════════════`,
    `🔄 LEAD RETURNED TO SITE`,
    `   ${ts} (Pacific Time)`,
    `════════════════════════════════`,
    "",
    latestActivity,
  ].join("\n");
}

function buildDirectNotes(d: any): string {
  const lines: string[] = [];

  lines.push("════════════════════════════════════");
  lines.push("  LEAD FROM PRESALEPROPERTIES.COM");
  lines.push("════════════════════════════════════");
  lines.push("");

  // ── Contact Details ──
  lines.push("📋 CONTACT DETAILS");
  lines.push(`   Name:    ${d.firstName || ""} ${d.lastName || ""}`.trim());
  lines.push(`   Email:   ${d.email || ""}`);
  if (d.phone) lines.push(`   Phone:   ${d.phone}`);
  lines.push("");

  // ── Form / Project ──
  lines.push("📍 FORM & PROJECT");
  lines.push(`   Form Type:  ${(d.formType || "website").replace(/_/g, " ")}`);
  if (d.projectName) lines.push(`   Project:    ${d.projectName}`);
  if (d.projectCity) lines.push(`   City:       ${d.projectCity}`);
  if (d.propertyType) lines.push(`   Type:       ${d.propertyType}`);
  lines.push("");

  // ── Page Context ──
  lines.push("🔗 PAGE SUBMITTED FROM");
  if (d.currentPageTitle) lines.push(`   Title: ${d.currentPageTitle}`);
  if (d.currentPageUrl) lines.push(`   URL:   ${d.currentPageUrl}`);
  if (d.landingPage && d.landingPage !== d.currentPageUrl) lines.push(`   Landed On: ${d.landingPage}`);
  lines.push("");

  // ── Lead Selections ──
  const hasSelections = d.isRealtor || d.persona || d.homeSize || d.timeline || d.agentStatus;
  if (hasSelections) {
    lines.push("✅ FORM SELECTIONS");
    if (d.persona) {
      const personaMap: Record<string, string> = {
        investor: "Investor",
        first_time_buyer: "First-Time Buyer",
        family: "Upsizer/Family",
        downsizer: "Downsizer",
      };
      lines.push(`   Buyer Type: ${personaMap[d.persona] || d.persona}`);
    }
    if (d.homeSize) {
      const sizeMap: Record<string, string> = {
        studio: "Studio", "1bed": "1 Bedroom", "2bed": "2 Bedroom",
        "3bed": "3+ Bedroom", townhome: "Townhome",
      };
      lines.push(`   Looking For: ${sizeMap[d.homeSize] || d.homeSize}`);
    }
    if (d.timeline) {
      const tlMap: Record<string, string> = {
        "0_3_months": "0-3 months (Ready Now)",
        "3_6_months": "3-6 months",
        "6_12_months": "6-12 months",
        "12_plus_months": "12+ months",
      };
      lines.push(`   Timeline: ${tlMap[d.timeline] || d.timeline}`);
    }
    if (d.agentStatus) {
      const agentMap: Record<string, string> = {
        i_am_realtor: "Is a Realtor",
        yes: "Working with a Realtor",
        no: "No Realtor",
      };
      lines.push(`   Realtor Status: ${agentMap[d.agentStatus] || d.agentStatus}`);
    }
    if (d.isRealtor) lines.push(`   Is Realtor: Yes`);
    lines.push("");
  }

  // ── Message ──
  if (d.message) {
    lines.push("💬 MESSAGE");
    lines.push(`   "${d.message}"`);
    lines.push("");
  }

  // ── Lead Intelligence ──
  lines.push("📊 LEAD INTELLIGENCE");
  lines.push(`   Score:   ${d.leadScore ?? 0}/12`);
  lines.push(`   Temp:    ${(d.leadTemperature || "cold").toUpperCase()}`);
  lines.push(`   Device:  ${d.deviceType || "unknown"}`);
  if (d.userLanguage) lines.push(`   Language: ${d.userLanguage}`);
  lines.push("");

  // ── Traffic Source ──
  lines.push("🎯 TRAFFIC SOURCE");
  lines.push(`   Source:   ${d.utmSource || "direct"}`);
  if (d.utmMedium) lines.push(`   Medium:   ${d.utmMedium}`);
  if (d.utmCampaign) lines.push(`   Campaign: ${d.utmCampaign}`);
  if (d.utmTerm) lines.push(`   Term:     ${d.utmTerm}`);
  if (d.referrerUrl) lines.push(`   Referrer: ${d.referrerUrl}`);
  lines.push("");

  // ── Behaviour ──
  lines.push("🧭 BEHAVIOUR ON SITE");
  lines.push(`   Pages Viewed:    ${d.pagesViewed ?? 0}`);
  lines.push(`   Time on Site:    ${d.timeOnSite ?? 0}s`);
  lines.push(`   Visit Number:    ${d.sessionCount ?? 1}`);
  if (d.firstVisitDate) lines.push(`   First Visit:     ${d.firstVisitDate}`);
  lines.push(`   Used Calculator: ${d.usedCalculator ? "YES ✓" : "No"}`);

  if (d.pagesVisited) {
    let pages: string[] = [];
    try { pages = typeof d.pagesVisited === "string" ? JSON.parse(d.pagesVisited) : (d.pagesVisited || []); } catch { pages = []; }
    if (pages.length > 0) lines.push(`   Pages Visited:   ${pages.join(" → ")}`);
  }

  if (d.calculatorData) {
    lines.push("");
    lines.push("🔢 CALCULATOR INPUTS");
    const calc = typeof d.calculatorData === "string" ? d.calculatorData : JSON.stringify(d.calculatorData, null, 2);
    lines.push(`   ${calc}`);
  }

  return lines.join("\n");
}

function buildLeadNotes(lead: any, project: any): string {
  const lines: string[] = [];

  lines.push("════════════════════════════════════");
  lines.push("  LEAD FROM PRESALEPROPERTIES.COM");
  lines.push("════════════════════════════════════");
  lines.push("");

  // Contact
  lines.push("📋 CONTACT DETAILS");
  lines.push(`   Name:  ${lead.name || ""}`);
  lines.push(`   Email: ${lead.email || ""}`);
  if (lead.phone) lines.push(`   Phone: ${lead.phone}`);
  lines.push("");

  // Project
  lines.push("📍 PROJECT INTEREST");
  if (project?.name) lines.push(`   Project:   ${project.name}`);
  if (project?.city) lines.push(`   City:      ${project.city}${project.neighborhood ? `, ${project.neighborhood}` : ""}`);
  if (project?.property_type) lines.push(`   Type:      ${project.property_type}`);
  if (project?.developer_name) lines.push(`   Developer: ${project.developer_name}`);
  if (project?.status) lines.push(`   Status:    ${project.status}`);
  lines.push("");

  // Page
  if (lead.landing_page || lead.project_url) {
    lines.push("🔗 PAGE SUBMITTED FROM");
    if (lead.landing_page) lines.push(`   URL: ${lead.landing_page}`);
    else if (lead.project_url) lines.push(`   URL: ${lead.project_url}`);
    lines.push("");
  }

  // Buyer Profile
  const hasProfile = lead.persona || lead.home_size || lead.timeline || lead.agent_status;
  if (hasProfile) {
    lines.push("✅ BUYER PROFILE");
    if (lead.persona) {
      const p: Record<string, string> = { investor: "Investor", first_time_buyer: "First-Time Buyer", family: "Upsizer/Family", downsizer: "Downsizer" };
      lines.push(`   Buyer Type:  ${p[lead.persona] || lead.persona}`);
    }
    if (lead.home_size) {
      const s: Record<string, string> = { studio: "Studio", "1bed": "1 Bedroom", "2bed": "2 Bedroom", "3bed": "3+ Bedroom", townhome: "Townhome" };
      lines.push(`   Looking For: ${s[lead.home_size] || lead.home_size}`);
    }
    if (lead.timeline) {
      const t: Record<string, string> = { "0_3_months": "0-3 months", "3_6_months": "3-6 months", "6_12_months": "6-12 months", "12_plus_months": "12+ months" };
      lines.push(`   Timeline:    ${t[lead.timeline] || lead.timeline}`);
    }
    if (lead.agent_status) {
      const a: Record<string, string> = { i_am_realtor: "Is a Realtor", yes: "Working with Realtor", no: "No Realtor" };
      lines.push(`   Realtor:     ${a[lead.agent_status] || lead.agent_status}`);
    }
    lines.push("");
  }

  if (lead.message) {
    lines.push("💬 MESSAGE");
    lines.push(`   "${lead.message}"`);
    lines.push("");
  }

  lines.push("📊 LEAD INTELLIGENCE");
  lines.push(`   Score: ${lead.lead_score || lead.intent_score || 0}`);
  lines.push(`   Temp:  ${(lead.lead_temperature || "cold").toUpperCase()}`);
  if (lead.device_type) lines.push(`   Device: ${lead.device_type}`);
  lines.push("");

  if (lead.utm_source || lead.referrer) {
    lines.push("🎯 TRAFFIC SOURCE");
    if (lead.utm_source) lines.push(`   Source:   ${lead.utm_source}`);
    if (lead.utm_medium) lines.push(`   Medium:   ${lead.utm_medium}`);
    if (lead.utm_campaign) lines.push(`   Campaign: ${lead.utm_campaign}`);
    if (lead.referrer) lines.push(`   Referrer: ${lead.referrer}`);
    lines.push("");
  }

  lines.push("🧭 BEHAVIOUR");
  lines.push(`   Pages Viewed: ${lead.pages_viewed || 0}`);
  lines.push(`   Time on Site: ${lead.time_on_site || 0}s`);
  lines.push(`   Session #:    ${lead.session_count || 1}`);
  if (lead.used_calculator) lines.push(`   Used Calculator: YES ✓`);

  const td = lead.tracking_data as any;
  if (td?.pagesVisited?.length > 0) {
    lines.push(`   Pages Visited: ${(td.pagesVisited as string[]).join(" → ")}`);
  }

  return lines.join("\n");
}

function buildBookingNotes(booking: any, project: any): string {
  const lines: string[] = [];

  lines.push("════════════════════════════════════");
  lines.push("  TOUR BOOKING — PRESALEPROPERTIES.COM");
  lines.push("════════════════════════════════════");
  lines.push("");

  lines.push("📋 CONTACT DETAILS");
  lines.push(`   Name:  ${booking.name || ""}`);
  lines.push(`   Email: ${booking.email || ""}`);
  if (booking.phone) lines.push(`   Phone: ${booking.phone}`);
  lines.push("");

  lines.push("📅 APPOINTMENT");
  lines.push(`   Project: ${booking.project_name || project?.name || "Unknown"}`);
  if (booking.project_city || project?.city) lines.push(`   City:    ${booking.project_city || project?.city}`);
  if (booking.appointment_date) lines.push(`   Date:    ${booking.appointment_date}`);
  if (booking.appointment_time) lines.push(`   Time:    ${booking.appointment_time}`);
  if (booking.appointment_type) lines.push(`   Type:    ${booking.appointment_type === "preview" ? "Sales Centre Preview" : "Private Showing"}`);
  if (booking.project_url) lines.push(`   URL:     ${booking.project_url}`);
  lines.push("");

  lines.push("✅ BUYER PROFILE");
  if (booking.buyer_type) {
    const b: Record<string, string> = { investor: "Investor", first_time: "First-Time Buyer", first_time_buyer: "First-Time Buyer", upgrader: "Upgrading/Upsizing" };
    lines.push(`   Type:     ${b[booking.buyer_type] || booking.buyer_type}`);
  }
  if (booking.timeline) {
    const t: Record<string, string> = { "0_3_months": "0-3 months (Ready Now)", "3_6_months": "3-6 months", "6_12_months": "6-12 months", "12_plus_months": "12+ months" };
    lines.push(`   Timeline: ${t[booking.timeline] || booking.timeline}`);
  }
  lines.push("");

  if (booking.notes) {
    lines.push("💬 NOTES");
    lines.push(`   "${booking.notes}"`);
    lines.push("");
  }

  lines.push("📊 INTENT SCORE");
  lines.push(`   Score: ${booking.intent_score || 0}/100`);
  if ((booking.intent_score || 0) >= 70) lines.push(`   ⭐ HIGH INTENT - Priority Follow-up`);

  if (booking.utm_source || booking.referrer) {
    lines.push("");
    lines.push("🎯 TRAFFIC SOURCE");
    if (booking.utm_source) lines.push(`   Source: ${booking.utm_source}${booking.utm_medium ? ` / ${booking.utm_medium}` : ""}`);
    if (booking.utm_campaign) lines.push(`   Campaign: ${booking.utm_campaign}`);
    if (booking.referrer) lines.push(`   Referrer: ${booking.referrer}`);
  }

  return lines.join("\n");
}
