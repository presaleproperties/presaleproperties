// TEMPORARY E2E TEST HELPER — generates a signed approve/reject token
// using the same algorithm as send-lead-push, so we can verify the link works.
// DELETE AFTER TESTING.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacHex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId")!;
  const action = (url.searchParams.get("action") ?? "approve") as "approve" | "reject";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const payload = { leadId, action, exp: Math.floor(Date.now() / 1000) + 3600 };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacHex(serviceKey, payloadB64);
  const token = `${payloadB64}.${sig}`;
  return new Response(JSON.stringify({
    token,
    url: `${supabaseUrl}/functions/v1/approve-lead-link?token=${token}`,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
