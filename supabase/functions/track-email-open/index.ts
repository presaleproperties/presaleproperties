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

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid"); // email_logs tracking_id
    const alertId = url.searchParams.get("aid");
    const clientId = url.searchParams.get("cid");
    const type = url.searchParams.get("t") || "open";

    if (!trackingId && !alertId && !clientId) {
      console.log("No tracking ID provided");
      return pixelResponse();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Track email_logs open via tracking_id
    if (trackingId) {
      // Get current log entry
      const { data: logEntry } = await supabase
        .from("email_logs")
        .select("id, opened_at, open_count")
        .eq("tracking_id", trackingId)
        .single();

      if (logEntry) {
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

        // If re-open (2nd+ open), notify admin
        if (!isFirstOpen && newCount >= 2) {
          const { data: emailLog } = await supabase
            .from("email_logs")
            .select("email_to, subject")
            .eq("id", logEntry.id)
            .single();

          if (emailLog) {
            await supabase.from("notifications_queue").insert({
              recipient_email: "info@presaleproperties.com",
              recipient_type: "admin",
              notification_type: "email_reopened",
              subject: `🔁 Email Re-opened: ${emailLog.email_to}`,
              body: `${emailLog.email_to} re-opened "${emailLog.subject}" (open #${newCount}).`,
              metadata: {
                email_log_id: logEntry.id,
                email_to: emailLog.email_to,
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
        activity_type: "email_open",
        page_url: req.headers.get("referer") || null,
        created_at: now,
      });
    }

    return pixelResponse();
  } catch (error) {
    console.error("Tracking error:", error);
    return pixelResponse();
  }
};

serve(handler);
