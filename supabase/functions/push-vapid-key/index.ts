/**
 * push-vapid-key
 * Returns the VAPID public key so the browser can subscribe.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({ publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
