/**
 * Identity stitching — multiple deterministic hooks that collapse anonymous
 * presale_user_id sessions into known contacts:
 *
 *   1. Email links: ?lead=<crm_contact_id> or ?email=<base64> on landing
 *      → bind the current cookie to that contact and pre-cache the identity.
 *   2. VIP / agent / developer login → call bridge-stitch-identities so the
 *      auth user_id is glued to the same contact as their cookie.
 *   3. OTP-verified phone (pitch-deck unlock already does this) → handled
 *      by upsertProjectLead.
 */

import { supabase } from "@/integrations/supabase/client";
import { getPresaleUserId } from "@/lib/tracking/behaviorBuffer";
import { setKnownEmail } from "@/lib/tracking/streamBehavior";
import { enqueueIdentityStitch } from "@/lib/crm/outbox";
import { resolveCrmIdentity, clearCrmIdentityCache } from "@/lib/crm/resolveIdentity";

const STITCH_DONE_KEY = "pp_stitch_done_v1";

function hasStitched(token: string): boolean {
  try { return sessionStorage.getItem(STITCH_DONE_KEY) === token; }
  catch { return false; }
}

function markStitched(token: string): void {
  try { sessionStorage.setItem(STITCH_DONE_KEY, token); }
  catch { /* ignore */ }
}

/**
 * Run on every initial page load. Picks up email-link tokens from URL,
 * binds the current cookie to the known contact, and warms the identity cache.
 */
export async function stitchFromUrl(): Promise<void> {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const lead = params.get("lead");          // CRM contact id
  const emailRaw = params.get("e") || params.get("email");
  const decodedEmail = emailRaw
    ? (() => {
        try { return atob(emailRaw); } catch { return emailRaw; }
      })()
    : null;

  const token = `${lead ?? ""}|${decodedEmail ?? ""}`;
  if (!lead && !decodedEmail) return;
  if (hasStitched(token)) return;
  markStitched(token);

  if (decodedEmail && decodedEmail.includes("@")) {
    setKnownEmail(decodedEmail);
  }

  // Tell the CRM bridge: bind this cookie ↔ this contact
  await enqueueIdentityStitch({
    email: decodedEmail || undefined,
    presale_user_id: getPresaleUserId(),
    source: "email_link",
  });

  // Warm the identity cache so the very next render personalizes
  clearCrmIdentityCache();
  await resolveCrmIdentity({ email: decodedEmail || undefined, force: true });

  // Strip the params from the URL so they don't get bookmarked / shared
  params.delete("lead");
  params.delete("e");
  params.delete("email");
  const cleanQuery = params.toString();
  const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : "") + window.location.hash;
  window.history.replaceState({}, "", cleanUrl);
}

/**
 * Call when a user successfully signs in / signs up. Glues the auth user
 * to the cookie + email so the CRM has a single contact for them.
 */
export async function stitchFromAuth(): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user?.email) return;
    setKnownEmail(user.email);

    await enqueueIdentityStitch({
      email: user.email,
      presale_user_id: getPresaleUserId(),
      source: "auth_login",
    });

    clearCrmIdentityCache();
    await resolveCrmIdentity({ email: user.email, force: true });
  } catch { /* ignore */ }
}
