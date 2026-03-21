import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

// Twilio Sandbox WhatsApp number
const FROM_WHATSAPP = "whatsapp:+14155238886";
// Agent's WhatsApp number
const AGENT_WHATSAPP = "whatsapp:+16722581100";

interface WhatsAppNotificationRequest {
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  projectName: string;
  deckSlug?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    const { leadName, leadPhone, leadEmail, projectName, deckSlug }: WhatsAppNotificationRequest = await req.json();

    if (!leadName || !leadPhone || !leadEmail || !projectName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: leadName, leadPhone, leadEmail, projectName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { agent?: any; lead?: any; errors: string[] } = { errors: [] };

    // ── 1. Agent alert ────────────────────────────────────────────────────────
    const agentMessage = `🔔 *New Deck Lead!*

📋 *Project:* ${projectName}
👤 *Name:* ${leadName}
📱 *Phone:* ${leadPhone}
📧 *Email:* ${leadEmail}

They just unlocked your pitch deck. Follow up now! 💬`;

    try {
      const agentRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: AGENT_WHATSAPP,
          From: FROM_WHATSAPP,
          Body: agentMessage,
        }),
      });

      const agentData = await agentRes.json();
      if (!agentRes.ok) {
        console.error("Agent WhatsApp failed:", agentData);
        results.errors.push(`Agent message failed [${agentRes.status}]: ${JSON.stringify(agentData)}`);
      } else {
        results.agent = { sid: agentData.sid, status: agentData.status };
        console.log("Agent WhatsApp sent:", agentData.sid);
      }
    } catch (err) {
      console.error("Agent WhatsApp error:", err);
      results.errors.push(`Agent message error: ${err}`);
    }

    // ── 2. Lead welcome message ───────────────────────────────────────────────
    // Normalize lead phone to E.164 — strip non-digits, prepend + if needed
    const rawPhone = leadPhone.replace(/\D/g, "");
    const e164Phone = rawPhone.startsWith("1") ? `+${rawPhone}` : `+1${rawPhone}`;
    const leadWhatsApp = `whatsapp:${e164Phone}`;

    const firstName = leadName.trim().split(" ")[0];
    const leadMessage = `Hi ${firstName}! 👋

Thanks for unlocking the *${projectName}* pitch deck!

I'm reaching out to answer any questions you might have about the project — pricing, floor plans, deposit structure, or anything else.

Feel free to reply here anytime. Looking forward to connecting! 🏡`;

    try {
      const leadRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: leadWhatsApp,
          From: FROM_WHATSAPP,
          Body: leadMessage,
        }),
      });

      const leadData = await leadRes.json();
      if (!leadRes.ok) {
        console.error("Lead WhatsApp failed:", leadData);
        results.errors.push(`Lead message failed [${leadRes.status}]: ${JSON.stringify(leadData)}`);
      } else {
        results.lead = { sid: leadData.sid, status: leadData.status };
        console.log("Lead WhatsApp sent:", leadData.sid);
      }
    } catch (err) {
      console.error("Lead WhatsApp error:", err);
      results.errors.push(`Lead message error: ${err}`);
    }

    const success = !results.errors.length || results.agent || results.lead;

    return new Response(
      JSON.stringify({ success, ...results }),
      { status: success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
