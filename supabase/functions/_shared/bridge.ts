// Shared helpers for all bridge-* edge functions.
// Auth: every bridge endpoint requires the BRIDGE_SECRET shared secret.
// CORS: open (*) — secret in header is the gate.

export const bridgeCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-bridge-secret, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function bridgeJson(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...bridgeCorsHeaders, "Content-Type": "application/json" },
  });
}

/** Returns null if authorized, or a 401 Response if not. */
export function checkBridgeAuth(req: Request): Response | null {
  const expected = Deno.env.get("BRIDGE_SECRET");
  const provided = req.headers.get("x-bridge-secret") || "";
  if (!expected || provided !== expected) {
    return bridgeJson({ error: "Unauthorized" }, 401);
  }
  return null;
}

/** Standard CORS preflight handler. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: bridgeCorsHeaders });
  }
  return null;
}
