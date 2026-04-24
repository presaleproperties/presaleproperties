/**
 * Safe wrapper around `supabase.functions.invoke` for analytics / tracking calls.
 *
 * Tracking is best-effort: a failure to deliver an event must NEVER surface as a
 * user-visible error, break rendering, or pollute the console with red errors.
 *
 * Behaviour:
 *  - Fire-and-forget. Returns a Promise that always resolves; callers may await
 *    it but never need to try/catch.
 *  - Network failures (`Failed to fetch`, `TypeError`, `AbortError`) are
 *    swallowed silently. These are common in:
 *      • the Lovable preview iframe (fetch proxy intercepts POSTs)
 *      • clients with ad-blockers / privacy extensions
 *      • offline / flaky network conditions
 *  - Real errors (non-network) are logged at `debug` level in development only.
 *  - Returns `{ ok: boolean }` so curious callers can branch, but most should
 *    just call and forget.
 */

import { supabase } from "@/integrations/supabase/client";

const DEBUG = import.meta.env.DEV;

export interface SafeInvokeResult {
  ok: boolean;
}

/**
 * Patterns that indicate a transport-layer failure rather than a real bug.
 * These are silenced unconditionally.
 */
function isTransportError(err: unknown): boolean {
  if (!err) return false;
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
      ? err.message
      : String((err as { message?: unknown })?.message ?? "");
  if (!message) return false;
  return (
    /failed to fetch/i.test(message) ||
    /network ?error/i.test(message) ||
    /load failed/i.test(message) ||
    /aborted/i.test(message) ||
    /timeout/i.test(message) ||
    err instanceof TypeError
  );
}

/**
 * Invoke a Supabase edge function for tracking purposes.
 * Always resolves — never throws.
 */
export async function safeTrackingInvoke(
  functionName: string,
  body: Record<string, unknown>
): Promise<SafeInvokeResult> {
  try {
    const { error } = await supabase.functions.invoke(functionName, { body });
    if (error) {
      if (isTransportError(error)) {
        // Silent: expected in preview / ad-blocker scenarios.
        return { ok: false };
      }
      if (DEBUG) {
        console.debug(`[tracking] ${functionName} returned error:`, error);
      }
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    if (isTransportError(err)) {
      return { ok: false };
    }
    if (DEBUG) {
      console.debug(`[tracking] ${functionName} threw:`, err);
    }
    return { ok: false };
  }
}
