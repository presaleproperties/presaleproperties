// bridge-get-lead-behavior — full activity timeline for a lead, by email or visitor_id.
// Aggregates client_activity, deck_visits, and email_logs (opens/clicks)
// into one chronological feed for DealsFlow's lead profile.
//
// Query: ?email=<addr>  OR  ?visitor_id=<id>   (one required)
// Optional: ?days=<n> (default 90), ?limit=<n> (default 200)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") || "").trim().toLowerCase() || null;
    const visitorId = (url.searchParams.get("visitor_id") || "").trim() || null;
    if (!email && !visitorId) return bridgeJson({ error: "email or visitor_id required" }, 400);

    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "90", 10), 1), 365);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "200", 10), 1), 1000);
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve all visitor_ids associated with this email (project_leads)
    const visitorIds = new Set<string>();
    if (visitorId) visitorIds.add(visitorId);
    if (email) {
      const { data: leadRows } = await supabase
        .from("project_leads")
        .select("visitor_id")
        .eq("email", email)
        .not("visitor_id", "is", null);
      for (const r of leadRows ?? []) if (r.visitor_id) visitorIds.add(r.visitor_id);
    }

    const visitorList = Array.from(visitorIds);

    // 1. client_activity (page views, property views, CTA clicks, etc.)
    let activities: any[] = [];
    if (visitorList.length > 0) {
      const { data } = await supabase
        .from("client_activity")
        .select("activity_type, project_name, listing_key, page_url, page_title, duration_seconds, city, created_at, visitor_id")
        .in("visitor_id", visitorList)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit);
      activities = data ?? [];
    }

    // 2. deck_visits
    let deckVisits: any[] = [];
    {
      let q = supabase.from("deck_visits")
        .select("slug, project_name, lead_email, visitor_id, visit_number, device_type, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (email && visitorList.length > 0) {
        q = q.or(`lead_email.eq.${email},visitor_id.in.(${visitorList.join(",")})`);
      } else if (email) {
        q = q.eq("lead_email", email);
      } else if (visitorList.length > 0) {
        q = q.in("visitor_id", visitorList);
      }
      const { data } = await q;
      deckVisits = data ?? [];
    }

    // 3. email_logs (opens/clicks) by email
    let emails: any[] = [];
    if (email) {
      const { data } = await supabase
        .from("email_logs")
        .select("subject, template_type, status, sent_at, opened_at, open_count, last_opened_at, clicked_at, click_count, last_clicked_at, clicked_url")
        .eq("email_to", email)
        .gte("sent_at", since)
        .order("sent_at", { ascending: false })
        .limit(limit);
      emails = data ?? [];
    }

    // 4. Lead profile + score
    let lead: any = null;
    if (email) {
      const { data } = await supabase
        .from("project_leads")
        .select("id, name, email, phone, persona, lead_source, utm_source, utm_medium, utm_campaign, project_id, realtor_risk_score, approval_status, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lead = data;
    }

    // Build a unified timeline
    const timeline: Array<{ at: string; kind: string; detail: any }> = [];
    for (const a of activities) timeline.push({ at: a.created_at, kind: `activity:${a.activity_type}`, detail: a });
    for (const d of deckVisits) timeline.push({ at: d.created_at, kind: "deck_visit", detail: d });
    for (const e of emails) {
      timeline.push({ at: e.sent_at, kind: "email_sent", detail: e });
      if (e.opened_at) timeline.push({ at: e.opened_at, kind: "email_opened", detail: { subject: e.subject, open_count: e.open_count } });
      if (e.clicked_at) timeline.push({ at: e.clicked_at, kind: "email_clicked", detail: { subject: e.subject, url: e.clicked_url, click_count: e.click_count } });
    }
    timeline.sort((a, b) => (a.at < b.at ? 1 : -1));

    return bridgeJson({
      lead,
      visitor_ids: visitorList,
      counts: {
        activities: activities.length,
        deck_visits: deckVisits.length,
        emails_sent: emails.length,
        emails_opened: emails.filter((e) => e.opened_at).length,
        emails_clicked: emails.filter((e) => e.clicked_at).length,
      },
      timeline: timeline.slice(0, limit),
    });
  } catch (e) {
    console.error("[bridge-get-lead-behavior]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
