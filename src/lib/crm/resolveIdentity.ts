/**
 * Resolve what the CRM knows about the current visitor.
 *
 * Returns assigned agent (name, photo, phone, calendly), lifecycle stage,
 * tags, hot-lead flag. Cached in sessionStorage for the tab so we don't
 * round-trip on every page.
 */

import { supabase } from "@/integrations/supabase/client";
import { getPresaleUserId } from "@/lib/tracking/behaviorBuffer";

export interface CrmAgent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  calendly_url?: string;
}

export interface CrmIdentity {
  known: boolean;
  crm_contact_id?: string;
  email?: string;
  lifecycle_stage?: string;
  tags?: string[];
  hot_lead?: boolean;
  last_activity_at?: string;
  assigned_agent?: CrmAgent | null;
}

const CACHE_KEY = "pp_crm_identity";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

interface CachedIdentity { v: CrmIdentity; at: number; key: string }

function readCache(key: string): CrmIdentity | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedIdentity;
    if (parsed.key !== key) return null;
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.v;
  } catch { return null; }
}

function writeCache(key: string, v: CrmIdentity): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ v, at: Date.now(), key }));
  } catch { /* ignore */ }
}

function getKnownEmail(): string | undefined {
  try {
    return (
      sessionStorage.getItem("pp_known_email") ||
      localStorage.getItem("pp_known_email") ||
      undefined
    );
  } catch { return undefined; }
}

export async function resolveCrmIdentity(opts: {
  email?: string;
  phone?: string;
  force?: boolean;
} = {}): Promise<CrmIdentity> {
  const email = (opts.email || getKnownEmail() || "").trim().toLowerCase();
  const presale_user_id = getPresaleUserId();
  const phone = opts.phone;
  const cacheKey = `${email}|${presale_user_id}|${phone ?? ""}`;

  if (!opts.force) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }

  if (!email && !presale_user_id && !phone) {
    return { known: false };
  }

  try {
    const { data, error } = await supabase.functions.invoke("bridge-resolve-contact", {
      body: { email, presale_user_id, phone },
    });
    if (error) throw error;
    const result = (data ?? { known: false }) as CrmIdentity;
    writeCache(cacheKey, result);
    return result;
  } catch {
    return { known: false };
  }
}

export function clearCrmIdentityCache(): void {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}
