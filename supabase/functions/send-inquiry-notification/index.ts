import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};




// ── Rate Limiting ─────────────────────────────────────────────────────────────
const RL_WINDOW = 3600; // seconds
const RL_MAX = 10;

async function rateLimited(req: Request, funcKey: string): Promise<boolean> {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon").split(",")[0].trim();
    const key = `${funcKey}:${ip}`;
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - RL_WINDOW * 1000).toISOString();
    const { count, error } = await sb.from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("rate_key", key).gte("created_at", since);
    if (error) return false;
    if ((count ?? 0) >= RL_MAX) return true;
    await sb.from("rate_limit_log").insert({ rate_key: key });
    return false;
  } catch { return false; }
}
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 10; // max 10 requests per IP per hour


Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  // Rate limit check
  if (await rateLimited(req, "send-inquiry-notification")) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" }
    });
  }

  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { listingId, fromAgentId, toAgentId, message } = await req.json();

    console.log("Processing inquiry notification:", { listingId, fromAgentId, toAgentId });

    // Get listing details
    const { data: listing } = await supabase
      .from("listings")
      .select("title, project_name, assignment_price")
      .eq("id", listingId)
      .single();

    // Get from agent profile
    const { data: fromProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", fromAgentId)
      .single();

    const { data: fromAgent } = await supabase
      .from("agent_profiles")
      .select("brokerage_name")
      .eq("user_id", fromAgentId)
      .single();

    // Get to agent profile (recipient)
    const { data: toProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", toAgentId)
      .single();

    if (!toProfile?.email) {
      console.log("No recipient email found");
      return new Response(
        JSON.stringify({ success: false, error: "Recipient email not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-CA', { 
        style: 'currency', 
        currency: 'CAD',
        maximumFractionDigits: 0 
      }).format(price);
    };

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#f5c542;font-size:24px;font-weight:700;">🔔 New Assignment Inquiry</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;color:#333;font-size:16px;line-height:1.6;">
                Hi ${toProfile.full_name || 'there'},
              </p>
              <p style="margin:0 0 24px;color:#333;font-size:16px;line-height:1.6;">
                You have a new inquiry about your assignment listing:
              </p>
              
              <!-- Listing Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-weight:600;color:#333;font-size:18px;">${listing?.project_name || 'Assignment'}</p>
                    <p style="margin:0 0 4px;color:#666;font-size:14px;">${listing?.title || ''}</p>
                    <p style="margin:0;color:#f5c542;font-weight:700;font-size:20px;">${listing?.assignment_price ? formatPrice(listing.assignment_price) : ''}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Agent Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-weight:600;color:#333;">${fromProfile?.full_name || 'Agent'}</p>
                    <p style="margin:0 0 4px;color:#666;font-size:14px;">${fromAgent?.brokerage_name || ''}</p>
                    <p style="margin:0;color:#2563eb;font-size:14px;">${fromProfile?.email}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <div style="background-color:#fafafa;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-weight:600;color:#333;font-size:14px;">Message:</p>
                <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">"${message}"</p>
              </div>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://presaleproperties.com/dashboard/messages" 
                       style="display:inline-block;background:linear-gradient(135deg,#f5c542 0%,#e5a832 100%);color:#1a1a2e;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#888;font-size:12px;">
                PresaleProperties.com • Agent Portal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PresaleProperties <notifications@presaleproperties.com>",
        to: [toProfile.email],
        subject: `New Inquiry: ${listing?.project_name || 'Your Assignment'}`,
        html: emailHtml
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send failed:", errorText);
      throw new Error(`Email failed: ${errorText}`);
    }

    console.log("Inquiry notification sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending inquiry notification:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
