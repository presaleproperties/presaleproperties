import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("+")) return raw.replace(/[^\d+]/g, "");
  return `+${digits}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Phone and code are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhone(phone.trim());
    const phoneKey = `phone:${normalizedPhone}`;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: record, error } = await sb
      .from("email_verification_codes")
      .select("*")
      .eq("email", phoneKey)
      .maybeSingle();

    if (error || !record) {
      return new Response(JSON.stringify({ error: "No verification code found. Please request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if locked out
    if (record.locked_until && new Date(record.locked_until) > new Date()) {
      return new Response(JSON.stringify({ error: "Too many failed attempts. Please request a new code." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await sb.from("email_verification_codes").delete().eq("email", phoneKey);
      return new Response(JSON.stringify({ error: "Verification code has expired. Please request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check code
    if (record.code !== code.trim()) {
      const attempts = (record.failed_attempts || 0) + 1;
      const updateData: any = { failed_attempts: attempts };
      if (attempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await sb.from("email_verification_codes").update(updateData).eq("email", phoneKey);

      return new Response(JSON.stringify({ error: "Incorrect code. Please try again.", attemptsLeft: Math.max(0, 5 - attempts) }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Code is correct — mark verified and clean up
    await sb.from("email_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("email", phoneKey);

    // Clean up after a short delay (let the UI read success first)
    setTimeout(async () => {
      await sb.from("email_verification_codes").delete().eq("email", phoneKey);
    }, 5000);

    return new Response(JSON.stringify({ success: true, verified: true, phone: normalizedPhone }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("verify-sms-otp error:", err);
    return new Response(JSON.stringify({ error: "Verification failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
