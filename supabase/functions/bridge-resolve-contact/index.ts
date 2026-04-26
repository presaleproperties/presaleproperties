// bridge-resolve-contact — public endpoint the website calls to ask
// "what does the CRM know about this person?". Returns assigned agent,
// stage, tags, hot-lead flag. Cached client-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email ? String(body.email).trim().toLowerCase() : null;
    const presale_user_id = body?.presale_user_id ? String(body.presale_user_id) : null;
    const phone = body?.phone ? String(body.phone) : null;

    if (!email && !presale_user_id && !phone) {
      return json({ known: false });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try local mirror first (fast)
    const { data, error } = await supabase.rpc("resolve_crm_identity", {
      p_email: email,
      p_presale_user_id: presale_user_id,
      p_phone: phone,
    });
    if (error) throw error;

    return json(data ?? { known: false });
  } catch (err) {
    console.error("[bridge-resolve-contact]", err);
    return json({ known: false, error: err instanceof Error ? err.message : String(err) }, 200);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=60",
    },
  });
}
