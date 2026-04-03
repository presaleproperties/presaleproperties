import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pending deck_return_visit notifications
    const { data: pending, error: fetchErr } = await supabase
      .from("notifications_queue")
      .select("*")
      .eq("notification_type", "deck_return_visit")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending return-visit notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      throw new Error("Missing Twilio configuration");
    }

    // Admin WhatsApp number — send notifications here
    const ADMIN_WHATSAPP = "whatsapp:+16047834021";

    const results = [];

    for (const notif of pending) {
      const meta = notif.metadata || {};
      const leadLabel = meta.lead_name || meta.lead_email || "Anonymous visitor";
      const projectName = meta.project_name || "Unknown project";
      const visitNum = meta.visit_number || 2;
      const slug = meta.slug || "";

      const message =
        `🔁 *Return Visit Alert*\n\n` +
        `*${leadLabel}* just reopened the *${projectName}* pitch deck` +
        ` (visit #${visitNum}).\n\n` +
        (meta.lead_email ? `📧 ${meta.lead_email}\n` : "") +
        `🔗 https://presaleproperties.com/deck/${slug}`;

      try {
        const twilioRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: ADMIN_WHATSAPP,
            From: `whatsapp:${TWILIO_FROM}`,
            Body: message,
          }),
        });

        const twilioData = await twilioRes.json();

        if (!twilioRes.ok) {
          console.error("Twilio error:", twilioData);
          await supabase
            .from("notifications_queue")
            .update({ status: "failed" })
            .eq("id", notif.id);
          results.push({ id: notif.id, status: "failed", error: twilioData });
        } else {
          await supabase
            .from("notifications_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notif.id);
          results.push({ id: notif.id, status: "sent", sid: twilioData.sid });
        }
      } catch (sendErr: any) {
        console.error("Send error:", sendErr);
        await supabase
          .from("notifications_queue")
          .update({ status: "failed" })
          .eq("id", notif.id);
        results.push({ id: notif.id, status: "failed", error: sendErr.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
