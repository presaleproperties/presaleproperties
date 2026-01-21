import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  // Always return the pixel first for performance
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
    const alertId = url.searchParams.get("aid");
    const clientId = url.searchParams.get("cid");
    const type = url.searchParams.get("t") || "open"; // "open" or "click"

    if (!alertId && !clientId) {
      console.log("No tracking ID provided");
      return pixelResponse();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    if (alertId) {
      // Track specific alert open/click
      const updateField = type === "click" ? "clicked_at" : "opened_at";
      
      const { error } = await supabase
        .from("property_alerts")
        .update({ [updateField]: now })
        .eq("id", alertId)
        .is(updateField, null); // Only update if not already set

      if (error) {
        console.error(`Error updating alert ${alertId}:`, error);
      } else {
        console.log(`Tracked ${type} for alert ${alertId}`);
      }
    } else if (clientId) {
      // Track email open at client level (for emails with multiple properties)
      // Update all recent alerts for this client that don't have an opened_at
      const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from("property_alerts")
        .update({ opened_at: now })
        .eq("client_id", clientId)
        .gte("sent_at", recentThreshold)
        .is("opened_at", null);

      if (error) {
        console.error(`Error updating alerts for client ${clientId}:`, error);
      } else {
        console.log(`Tracked open for client ${clientId}`);
      }

      // Also log to client_activity
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
    return pixelResponse(); // Always return the pixel
  }
};

serve(handler);
