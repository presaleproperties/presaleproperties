/**
 * send-lead-engagement-event
 *
 * Fires an enriched payload to Zapier (→ Lofty CRM) whenever a lead's state
 * changes after creation: email opened, email clicked, deck viewed,
 * workflow enrolled, template sent, intent score change, etc.
 *
 * Webhook URL is read from app_settings.zapier_engagement_webhook
 * (falls back to env ZAPIER_ENGAGEMENT_WEBHOOK).
 *
 * Body: { leadId?, email?, eventType, eventData? }
 *  - Either leadId or email is required so we can resolve the lead.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EngagementEvent =
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_replied"
  | "deck_viewed"
  | "deck_revisited"
  | "workflow_enrolled"
  | "workflow_completed"
  | "template_sent"
  | "template_scheduled"
  | "intent_score_changed"
  | "phone_verified"
  | "vip_joined"
  | "high_value_page_view"
  | "form_started"
  | "form_abandoned";

interface RequestBody {
  leadId?: string;
  email?: string;
  eventType: EngagementEvent;
  eventData?: Record<string, unknown>;
}

function tier(score: number | null | undefined): "Hot" | "Warm" | "Cold" {
  const s = score ?? 0;
  if (s >= 70) return "Hot";
  if (s >= 40) return "Warm";
  return "Cold";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { leadId, email, eventType, eventData = {} } = body;

    if (!eventType) {
      return new Response(JSON.stringify({ error: "eventType is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!leadId && !email) {
      return new Response(
        JSON.stringify({ error: "leadId or email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve webhook URL
    let webhookUrl = Deno.env.get("ZAPIER_ENGAGEMENT_WEBHOOK") || "";
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_engagement_webhook")
      .maybeSingle();
    if (
      setting?.value &&
      typeof setting.value === "string" &&
      setting.value.trim()
    ) {
      webhookUrl = setting.value.trim();
    }

    if (!webhookUrl) {
      console.log("[engagement] No webhook URL configured — skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: "no_webhook" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Resolve lead ──
    let lead: any = null;
    if (leadId) {
      const { data } = await supabase
        .from("project_leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();
      lead = data;
    }
    if (!lead && email) {
      const { data } = await supabase
        .from("project_leads")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lead = data;
    }

    if (!lead) {
      console.log("[engagement] Lead not found — sending minimal payload");
    }

    // ── Engagement aggregations ──
    const targetEmail = lead?.email || email!;

    const [emailLogsRes, deckVisitsRes, jobsRes, attributionRes, clientRes] =
      await Promise.all([
        supabase
          .from("email_logs")
          .select("opened_at, clicked_at, sent_at, open_count, click_count")
          .eq("email_to", targetEmail),
        supabase
          .from("deck_visits")
          .select("created_at, project_name, visit_number")
          .eq("lead_email", targetEmail)
          .order("created_at", { ascending: false }),
        supabase
          .from("email_jobs")
          .select("workflow_id, scheduled_at, status, template_id")
          .eq("to_email", targetEmail)
          .order("scheduled_at", { ascending: false })
          .limit(10),
        lead?.visitor_id
          ? supabase
              .from("attribution_touches")
              .select("*")
              .eq("visitor_id", lead.visitor_id)
              .order("touch_at", { ascending: true })
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("clients")
          .select(
            "intent_score, total_property_views, total_site_visits, last_seen_at, last_email_opened_at",
          )
          .eq("email", targetEmail)
          .maybeSingle(),
      ]);

    const emailLogs = emailLogsRes.data ?? [];
    const totalEmailsSent = emailLogs.length;
    const totalEmailsOpened = emailLogs.filter((l) => l.opened_at).length;
    const totalEmailsClicked = emailLogs.filter((l) => l.clicked_at).length;

    const deckVisits = deckVisitsRes.data ?? [];
    const enrolledWorkflows = Array.from(
      new Set(
        (jobsRes.data ?? [])
          .filter((j) => j.workflow_id && j.status !== "cancelled")
          .map((j) => j.workflow_id as string),
      ),
    );
    const queuedJob = (jobsRes.data ?? []).find((j) => j.status === "queued");

    const touches = attributionRes.data ?? [];
    const firstTouch = touches[0];
    const lastTouch = touches[touches.length - 1];
    const daysSinceFirstTouch = firstTouch
      ? Math.floor(
          (Date.now() - new Date(firstTouch.touch_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const client = clientRes.data;
    const intentScore = lead?.intent_score ?? client?.intent_score ?? 0;

    // ── Build payload ──
    const payload = {
      // Event metadata
      event_type: eventType,
      event_at: new Date().toISOString(),
      event_data: eventData,

      // Lead identity
      lead_id: lead?.id || null,
      lead_email: targetEmail,
      lead_name: lead?.name || "",
      lead_phone: lead?.phone || "",

      // Intent
      intent_score: intentScore,
      intent_tier: tier(intentScore),
      lead_temperature: tier(intentScore).toLowerCase(),

      // Engagement
      total_emails_sent: totalEmailsSent,
      total_emails_opened: totalEmailsOpened,
      total_emails_clicked: totalEmailsClicked,
      last_email_opened_at: client?.last_email_opened_at || null,
      total_property_views: client?.total_property_views ?? 0,
      total_site_visits: client?.total_site_visits ?? 0,
      last_seen_at: client?.last_seen_at || null,

      pitch_deck_visits: deckVisits.length,
      last_deck_viewed: deckVisits[0]?.project_name || null,
      last_deck_viewed_at: deckVisits[0]?.created_at || null,

      // Workflow state
      enrolled_workflows: enrolledWorkflows,
      next_scheduled_email_at: queuedJob?.scheduled_at || null,

      // Attribution
      first_touch_source: firstTouch?.utm_source || lead?.utm_source || null,
      first_touch_medium: firstTouch?.utm_medium || lead?.utm_medium || null,
      first_touch_campaign:
        firstTouch?.utm_campaign || lead?.utm_campaign || null,
      first_touch_landing_page:
        firstTouch?.landing_url || lead?.landing_page || null,
      first_touch_at: firstTouch?.touch_at || lead?.created_at || null,
      last_touch_source: lastTouch?.utm_source || lead?.utm_source || null,
      last_touch_medium: lastTouch?.utm_medium || lead?.utm_medium || null,
      last_touch_campaign:
        lastTouch?.utm_campaign || lead?.utm_campaign || null,
      touch_count: touches.length,
      days_since_first_touch: daysSinceFirstTouch,

      // Lifecycle flags
      is_hot_lead: intentScore >= 70,
      is_vip: lead?.is_vip || false,

      // Tags for Lofty Smart Lists
      tags_array: [
        "PresaleProperties.com",
        `Event: ${eventType}`,
        `Intent: ${tier(intentScore)}`,
        ...(deckVisits.length > 0 ? ["Deck Viewed"] : []),
        ...(enrolledWorkflows.length > 0 ? ["In Workflow"] : []),
        ...(intentScore >= 70 ? ["Hot Lead"] : []),
      ],

      source: "PresaleProperties.com",
    };

    console.log(
      `[engagement] Firing ${eventType} for ${targetEmail} → Zapier`,
    );

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error(`[engagement] Webhook failed: ${resp.status} ${txt}`);
      return new Response(
        JSON.stringify({ success: false, status: resp.status, error: txt }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[engagement] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
