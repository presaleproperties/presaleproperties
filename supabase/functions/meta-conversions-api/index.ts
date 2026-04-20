import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: "website";
  event_source_url: string;
  user_data: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, unknown>;
}

// SHA-256 hash for PII
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(phone: string): string {
  // Strip non-digits; if no leading country code and 10 digits, assume +1 (NA)
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) digits = "1" + digits;
  return digits;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("META_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Meta access token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "meta_pixel_id")
      .maybeSingle();

    const rawValue = settingData?.value;
    const pixelId = rawValue ? String(rawValue) : null;

    if (!pixelId) {
      console.error("Meta Pixel ID not configured in app_settings");
      return new Response(
        JSON.stringify({ error: "Pixel ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional CAPI test event code (configure in Events Manager → Test Events)
    const testEventCode = Deno.env.get("META_TEST_EVENT_CODE") || undefined;

    const body = await req.json();
    const {
      event_name = "Lead",
      event_id,
      email,
      phone,
      first_name,
      last_name,
      event_source_url,
      content_name,
      content_category,
      custom_data,
      fbc,
      fbp,
      client_user_agent,
    } = body;

    // Build hashed user data
    const userData: ConversionEvent["user_data"] = {
      client_user_agent: client_user_agent || req.headers.get("user-agent") || undefined,
      client_ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        undefined,
    };

    if (email) userData.em = [await hashValue(email)];
    if (phone) userData.ph = [await hashValue(normalizePhone(phone))];
    if (first_name) userData.fn = [await hashValue(first_name)];
    if (last_name) userData.ln = [await hashValue(last_name)];
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;

    const event: ConversionEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
      event_source_url: event_source_url || "",
      user_data: userData,
    };

    // Merge legacy content_name/content_category with custom_data
    const merged: Record<string, unknown> = { ...(custom_data || {}) };
    if (content_name && !merged.content_name) merged.content_name = content_name;
    if (content_category && !merged.content_category) merged.content_category = content_category;
    if (Object.keys(merged).length > 0) event.custom_data = merged;

    const payload: Record<string, unknown> = { data: [event] };
    if (testEventCode) payload.test_event_code = testEventCode;

    console.log("Meta CAPI →", event_name, { event_id, fbc: !!fbc, fbp: !!fbp });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta CAPI error:", result);
      return new Response(
        JSON.stringify({ error: result.error?.message || "Meta API error", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, events_received: result.events_received, event_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in meta-conversions-api:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
