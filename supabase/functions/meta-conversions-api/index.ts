import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionEvent {
  event_name: string;
  event_time: number;
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
  custom_data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
  };
}

// SHA-256 hash for PII
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Normalize phone to E.164-ish format
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
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

    // Fetch pixel ID from app_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "meta_pixel_id")
      .maybeSingle();

    // Handle both string and numeric pixel IDs (JSON can store numbers)
    const rawValue = settingData?.value;
    const pixelId = rawValue ? String(rawValue) : null;
    
    if (!pixelId) {
      console.error("Meta Pixel ID not configured in app_settings");
      return new Response(
        JSON.stringify({ error: "Pixel ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      event_name = "Lead",
      email,
      phone,
      first_name,
      last_name,
      event_source_url,
      content_name,
      content_category,
      fbc,
      fbp,
      client_user_agent,
    } = body;

    // Build hashed user data
    const userData: ConversionEvent["user_data"] = {
      client_user_agent: client_user_agent || req.headers.get("user-agent") || undefined,
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                         req.headers.get("cf-connecting-ip") || undefined,
    };

    if (email) {
      userData.em = [await hashValue(email)];
    }
    if (phone) {
      userData.ph = [await hashValue(normalizePhone(phone))];
    }
    if (first_name) {
      userData.fn = [await hashValue(first_name)];
    }
    if (last_name) {
      userData.ln = [await hashValue(last_name)];
    }
    if (fbc) {
      userData.fbc = fbc;
    }
    if (fbp) {
      userData.fbp = fbp;
    }

    const event: ConversionEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: event_source_url || "",
      user_data: userData,
    };

    if (content_name || content_category) {
      event.custom_data = {
        content_name,
        content_category,
      };
    }

    const payload = {
      data: [event],
    };

    console.log("Sending to Meta CAPI:", JSON.stringify(payload, null, 2));

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

    console.log("Meta CAPI success:", result);

    return new Response(
      JSON.stringify({ success: true, events_received: result.events_received }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in meta-conversions-api:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
