/**
 * Preflight send log helper
 * ─────────────────────────────────────────────────────────────────────────
 * Persists pre-flight checklist results to `preflight_send_log` so admins
 * can review compliance for the last N sends and troubleshoot repeatedly
 * blocked attempts.
 *
 * Usage from a Send dialog:
 *   const logId = await logPreflightAttempt({ checks, ctx, asset });
 *   try {
 *     await sendEmail(...);
 *     await markPreflightSendResult(logId, { succeeded: true });
 *   } catch (e) {
 *     await markPreflightSendResult(logId, { succeeded: false, error: e.message });
 *   }
 *
 * Logging is best-effort — never throws, never blocks a send.
 */
import { supabase } from "@/integrations/supabase/client";

export interface LoggedCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  blocking: boolean;
  detail?: string;
}

interface LogArgs {
  checks: LoggedCheck[];
  /** True when the user actually clicked Send after seeing the checklist. */
  sendAttempted: boolean;
  ctx: {
    subject: string;
    recipientCount: number;
    label?: string;
  };
  assetId?: string | null;
}

function summarize(checks: LoggedCheck[]) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const blockers = checks.filter(
    (c) => c.blocking && c.status !== "pass",
  ).length;
  let status: "passed" | "passed_with_warnings" | "blocked";
  if (blockers > 0) status = "blocked";
  else if (warn > 0) status = "passed_with_warnings";
  else status = "passed";
  return {
    status,
    total_checks: checks.length,
    passed_count: passed,
    warn_count: warn,
    blocker_count: blockers,
  };
}

export async function logPreflightAttempt(args: LogArgs): Promise<string | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    const summary = summarize(args.checks);

    const { data, error } = await (supabase as any)
      .from("preflight_send_log")
      .insert({
        user_id: userId,
        asset_id: args.assetId ?? null,
        template_label: args.ctx.label ?? null,
        subject: args.ctx.subject ?? null,
        recipient_count: args.ctx.recipientCount,
        send_attempted: args.sendAttempted,
        checks: args.checks,
        ...summary,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[preflight-log] insert failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.warn("[preflight-log] insert threw:", e);
    return null;
  }
}

export async function markPreflightSendResult(
  logId: string | null,
  result: { succeeded: boolean; error?: string | null },
) {
  if (!logId) return;
  try {
    await (supabase as any)
      .from("preflight_send_log")
      .update({
        send_succeeded: result.succeeded,
        send_error: result.error ?? null,
      })
      .eq("id", logId);
  } catch (e) {
    console.warn("[preflight-log] update failed:", e);
  }
}
