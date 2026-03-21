import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER") || "+15005550006"; // fallback to Twilio test number

// Rate limiting: max 3 OTPs per phone per hour
const RL_WINDOW = 3600;
const RL_MAX = 3;

async function rateLimited(phone: string): Promise<boolean> {
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const key = `sms_otp:${phone}`;
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

// Normalize phone to E.164 (Canadian/US assumption if no country code)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("+")) return raw.replace(/[^\d+]/g, "");
  return `+${digits}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return new Response(JSON.stringify({ error: "Valid phone number is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhone(phone.trim());

    // Rate limit check
    if (await rateLimited(normalizedPhone)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait before trying again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Reuse email_verification_codes table — use phone as "email" field with prefix
    const phoneKey = `phone:${normalizedPhone}`;
    await sb.from("email_verification_codes").delete().eq("email", phoneKey);

    const { error: insertError } = await sb.from("email_verification_codes").insert({
      email: phoneKey,
      code,
      expires_at: expiresAt,
    });

    if (insertError) throw new Error("Failed to store OTP code");

    // Send SMS via Twilio
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      throw new Error("Twilio credentials not configured");
    }

    const smsBody = new URLSearchParams({
      To: normalizedPhone,
      From: TWILIO_FROM,
      Body: `Your PresaleProperties verification code is: ${code}\n\nValid for 10 minutes. Do not share this code.`,
    });

    const smsRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: smsBody,
    });

    if (!smsRes.ok) {
      const errData = await smsRes.json().catch(() => ({}));
      console.error("Twilio SMS error:", JSON.stringify(errData));
      throw new Error("Failed to send SMS. Please check your phone number and try again.");
    }

    console.log(`OTP sent to ${normalizedPhone}`);

    return new Response(JSON.stringify({ success: true, message: "Verification code sent via SMS" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-sms-otp error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to send verification code" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
