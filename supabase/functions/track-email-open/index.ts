import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  const pixelResponse = () => new Response(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });

  const redirectResponse = (url: string) => new Response(null, {
    status: 302,
    headers: { "Location": url },
  });

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid"); // email_logs tracking_id
    const alertId = url.searchParams.get("aid");
    const clientId = url.searchParams.get("cid");
    const type = url.searchParams.get("t") || "open";
    const clickUrl = url.searchParams.get("url"); // destination URL for click tracking

    // Recommendation-email click context (set by buildRecommendationEmailHtml)
    const clickContext = {
      cta: url.searchParams.get("cta"),
      project_id: url.searchParams.get("pid"),
      project_slug: url.searchParams.get("pslug"),
      category: url.searchParams.get("cat"),
      city: url.searchParams.get("city"),
      neighborhood: url.searchParams.get("nbhd"),
      slot: url.searchParams.get("slot"),
      section: url.searchParams.get("section"),
    };
    const hasClickContext = Object.values(clickContext).some((v) => v !== null);

    if (!trackingId && !alertId && !clientId) {
      console.log("No tracking ID provided");
      return clickUrl ? redirectResponse(clickUrl) : pixelResponse();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // ── Track via tracking_id (email_logs) ──
    if (trackingId) {
      const { data: logEntry } = await supabase
        .from("email_logs")
        .select("id, opened_at, open_count, clicked_at, click_count, email_to, subject")
        .eq("tracking_id", trackingId)
        .single();

      if (logEntry) {
        if (type === "click") {
          // ── Click tracking ──
          const isFirstClick = !logEntry.clicked_at;
          const newClickCount = (logEntry.click_count || 0) + 1;

          await supabase
            .from("email_logs")
            .update({
              ...(isFirstClick ? { clicked_at: now } : {}),
              click_count: newClickCount,
              last_clicked_at: now,
              clicked_url: clickUrl || null,
              // Also count as an open if not already opened
              ...((!logEntry.opened_at) ? { opened_at: now } : {}),
              open_count: Math.max((logEntry.open_count || 0), 1),
            })
            .eq("id", logEntry.id);

          console.log(`Tracked click for tracking_id ${trackingId} (click #${newClickCount}, url: ${clickUrl})`);

          // Fire engagement event → Zapier/Lofty (fire-and-forget)
          supabase.functions.invoke("send-lead-engagement-event", {
            body: {
              email: logEntry.email_to,
              eventType: "email_clicked",
              eventData: { subject: logEntry.subject, clicked_url: clickUrl, click_count: newClickCount },
            },
          }).catch((e) => console.error("[engagement] email_clicked invoke failed:", e));

          // Notify admin on first click — high-intent signal
          if (isFirstClick) {
            await supabase.from("notifications_queue").insert({
              recipient_email: "info@presaleproperties.com",
              recipient_type: "admin",
              notification_type: "email_clicked",
              subject: `🔗 Email Link Clicked: ${logEntry.email_to}`,
              body: `${logEntry.email_to} clicked a link in "${logEntry.subject}". URL: ${clickUrl || "unknown"}`,
              metadata: {
                email_log_id: logEntry.id,
                email_to: logEntry.email_to,
                clicked_url: clickUrl,
                click_count: newClickCount,
              },
            });
          }
        } else {
          // ── Open tracking ──
          const isFirstOpen = !logEntry.opened_at;
          const newCount = (logEntry.open_count || 0) + 1;

          await supabase
            .from("email_logs")
            .update({
              ...(isFirstOpen ? { opened_at: now } : {}),
              open_count: newCount,
              last_opened_at: now,
            })
            .eq("id", logEntry.id);

          console.log(`Tracked email open for tracking_id ${trackingId} (open #${newCount})`);

          // Fire engagement event → Zapier/Lofty (only on first open to reduce noise)
          if (isFirstOpen) {
            supabase.functions.invoke("send-lead-engagement-event", {
              body: {
                email: logEntry.email_to,
                eventType: "email_opened",
                eventData: { subject: logEntry.subject, open_count: newCount },
              },
            }).catch((e) => console.error("[engagement] email_opened invoke failed:", e));
          }

          // If re-open (2nd+ open), notify admin
          if (!isFirstOpen && newCount >= 2) {
            await supabase.from("notifications_queue").insert({
              recipient_email: "info@presaleproperties.com",
              recipient_type: "admin",
              notification_type: "email_reopened",
              subject: `🔁 Email Re-opened: ${logEntry.email_to}`,
              body: `${logEntry.email_to} re-opened "${logEntry.subject}" (open #${newCount}).`,
              metadata: {
                email_log_id: logEntry.id,
                email_to: logEntry.email_to,
                open_count: newCount,
              },
            });
          }
        }
      }
    }

    // Existing alert tracking
    if (alertId) {
      const updateField = type === "click" ? "clicked_at" : "opened_at";
      await supabase
        .from("property_alerts")
        .update({ [updateField]: now })
        .eq("id", alertId)
        .is(updateField, null);
      console.log(`Tracked ${type} for alert ${alertId}`);
    } else if (clientId) {
      const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("property_alerts")
        .update({ opened_at: now })
        .eq("client_id", clientId)
        .gte("sent_at", recentThreshold)
        .is("opened_at", null);

      await supabase.from("client_activity").insert({
        client_id: clientId,
        activity_type: type === "click" ? "email_click" : "email_open",
        page_url: clickUrl || req.headers.get("referer") || null,
        created_at: now,
      });
    }

    // For click tracking, redirect to the destination URL
    if (type === "click" && clickUrl) {
      return redirectResponse(clickUrl);
    }

    return pixelResponse();
  } catch (error) {
    console.error("Tracking error:", error);
    // For clicks, try to redirect even on error
    try {
      const url = new URL(req.url);
      const clickUrl = url.searchParams.get("url");
      if (clickUrl) return redirectResponse(clickUrl);
    } catch { /* ignore */ }
    return pixelResponse();
  }
};

serve(handler);
