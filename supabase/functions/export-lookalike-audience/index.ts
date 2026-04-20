// export-lookalike-audience — returns CSV of hashed (SHA256) email + phone
// for all hot leads in last 30 days. Use as a Custom Audience seed in Meta Ads Manager.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await admin
    .from("project_leads")
    .select("email, phone, first_name, last_name")
    .eq("lead_temperature", "hot")
    .gte("created_at", since)
    .not("email", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const rows = ["email,phone,fn,ln"];
  for (const l of leads || []) {
    const e = await sha256(l.email || "");
    const p = l.phone ? await sha256(l.phone.replace(/\D/g, "")) : "";
    const fn = l.first_name ? await sha256(l.first_name) : "";
    const ln = l.last_name ? await sha256(l.last_name) : "";
    rows.push(`${e},${p},${fn},${ln}`);
  }

  return new Response(rows.join("\n"), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lookalike-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
});
