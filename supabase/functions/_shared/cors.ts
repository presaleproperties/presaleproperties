/**
 * Shared CORS configuration for all edge functions.
 * Restricts to presaleproperties.com instead of wildcard *.
 * 
 * Usage:
 *   import { getCorsHeaders } from "../_shared/cors.ts";
 *   const corsHeaders = getCorsHeaders(req);
 */

const ALLOWED_ORIGINS = [
  "https://presaleproperties.com",
  "https://www.presaleproperties.com",
  // Allow Supabase studio for admin functions
  "https://supabase.com",
  "https://app.supabase.com",
  // Lovable preview domains
  "https://id-preview--08acf871-484d-4365-9aab-01fdfa4c35be.lovable.app",
  "https://08acf871-484d-4365-9aab-01fdfa4c35be.lovableproject.com",
];

// Dev/staging origins — only allowed when not in production
const DEV_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isProd = Deno.env.get("ENVIRONMENT") === "production";

  const allowed = isProd
    ? ALLOWED_ORIGINS
    : [...ALLOWED_ORIGINS, ...DEV_ORIGINS];

  const allowedOrigin = allowed.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback to main domain

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Simple rate limiter using Supabase KV (via postgres function)
 * Returns true if request should be blocked (over limit)
 */
export async function isRateLimited(
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error) return false; // fail open — don't block if rate limiter errors
    return data === true; // blocked
  } catch {
    return false;
  }
}
