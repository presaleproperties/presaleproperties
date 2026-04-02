import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function phoneFormats(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const d = digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
  const e164 = d.length === 10 ? `+1${d}` : digits ? `+${digits}` : "";
  const formatted = d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}` : "";
  return [...new Set([raw, e164, digits, d, formatted].filter(Boolean))];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, listingId } = await req.json().catch(() => ({}));

    if (!email && !phone) {
      return new Response(JSON.stringify({ error: "Email or phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let approved = false;
    let matchedEmail: string | null = null;

    if (email) {
      let query = supabase
        .from("off_market_access")
        .select("email")
        .eq("status", "approved")
        .ilike("email", String(email).trim());

      if (listingId) query = query.eq("listing_id", listingId);

      const { data } = await query.limit(1);
      if (data?.length) {
        approved = true;
        matchedEmail = data[0].email;
      }
    }

    if (!approved && phone) {
      let query = supabase
        .from("off_market_access")
        .select("email")
        .eq("status", "approved")
        .in("phone", phoneFormats(String(phone)));

      if (listingId) query = query.eq("listing_id", listingId);

      const { data } = await query.limit(1);
      if (data?.length) {
        approved = true;
        matchedEmail = data[0].email;
      }
    }

    return new Response(JSON.stringify({ approved, email: matchedEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
