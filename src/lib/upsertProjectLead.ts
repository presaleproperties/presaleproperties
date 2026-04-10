import { supabase } from "@/integrations/supabase/client";
import { postToDealsFlow } from "@/lib/postToDealsFlow";

/**
 * Upsert a project lead — if a lead with the same email already exists,
 * merge the new source into lead_sources and update fields. Otherwise insert.
 * Returns the lead ID (existing or new).
 */
export async function upsertProjectLead(
  leadData: Record<string, any>
): Promise<string> {
  const email = (leadData.email || "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  // Check for existing lead by email
  const { data: existing } = await (supabase as any)
    .from("project_leads")
    .select("id, lead_sources, lead_source, message, intent_score")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const lead = existing[0];
    const existingSources: string[] = lead.lead_sources || [];
    const newSource = leadData.lead_source || leadData.form_type || "";
    const mergedSources = new Set(existingSources);
    if (newSource) mergedSources.add(newSource);
    if (lead.lead_source) mergedSources.add(lead.lead_source);

    // Append message if new one provided
    const mergedMessage =
      lead.message && leadData.message
        ? `${lead.message}\n---\n${leadData.message}`
        : leadData.message || lead.message || "";

    // Keep higher intent score
    const bestIntent = Math.max(lead.intent_score || 0, leadData.intent_score || 0);

    const updatePayload: Record<string, any> = {
      lead_sources: Array.from(mergedSources),
      message: mergedMessage,
      intent_score: bestIntent || undefined,
    };

    // Update name/phone if provided and missing
    if (leadData.name) updatePayload.name = leadData.name;
    if (leadData.phone) updatePayload.phone = leadData.phone;
    if (leadData.lead_source) updatePayload.lead_source = leadData.lead_source;
    if (leadData.form_type) updatePayload.form_type = leadData.form_type;
    if (leadData.project_id) updatePayload.project_id = leadData.project_id;
    if (leadData.persona) updatePayload.persona = leadData.persona;
    if (leadData.visitor_id) updatePayload.visitor_id = leadData.visitor_id;
    if (leadData.session_id) updatePayload.session_id = leadData.session_id;
    if (leadData.utm_source) updatePayload.utm_source = leadData.utm_source;
    if (leadData.utm_medium) updatePayload.utm_medium = leadData.utm_medium;
    if (leadData.utm_campaign) updatePayload.utm_campaign = leadData.utm_campaign;

    await (supabase as any)
      .from("project_leads")
      .update(updatePayload)
      .eq("id", lead.id);

    // Fire-and-forget to DealsFlow CRM
    postToDealsFlow({
      name: leadData.name,
      email,
      phone: leadData.phone,
      project: leadData.project_name || "",
      source: leadData.lead_source || leadData.form_type || "website",
      buyer_type: leadData.persona || "",
    });

    return lead.id;
  }

  // New lead — insert
  const newId = leadData.id || crypto.randomUUID();
  const insertPayload = {
    ...leadData,
    id: newId,
    email,
    lead_sources: leadData.lead_source ? [leadData.lead_source] : [],
  };

  const { error } = await (supabase as any)
    .from("project_leads")
    .insert(insertPayload);

  if (error) throw error;

  // Fire-and-forget to DealsFlow CRM
  postToDealsFlow({
    name: leadData.name,
    email,
    phone: leadData.phone,
    project: leadData.project_name || "",
    source: leadData.lead_source || leadData.form_type || "website",
    buyer_type: leadData.persona || "",
  });

  return newId;
}
