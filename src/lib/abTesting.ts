/**
 * A/B Testing — visitor-stable variant assignment with weighted distribution.
 * Variants are loaded from `ab_test_variants` table; assignments persist
 * to `ab_test_assignments` so we can compute conversion per variant.
 */
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "./tracking/identifiers";

const STORAGE_PREFIX = "pp_ab_";

interface Variant {
  variant_key: string;
  variant_name: string;
  weight: number;
  config: Record<string, unknown>;
}

/** Deterministic hash → 0..99 from visitor + test_key (so the same visitor
 *  always sees the same variant, even before the DB write completes). */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 100;
}

function pickByWeight(variants: Variant[], bucket: number): Variant {
  let cumulative = 0;
  const total = variants.reduce((s, v) => s + v.weight, 0) || 1;
  for (const v of variants) {
    cumulative += (v.weight / total) * 100;
    if (bucket < cumulative) return v;
  }
  return variants[variants.length - 1];
}

export async function getVariant(testKey: string): Promise<Variant | null> {
  if (typeof window === "undefined") return null;

  const cacheKey = `${STORAGE_PREFIX}${testKey}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fallthrough */ }
  }

  const { data: variants, error } = await supabase
    .from("ab_test_variants")
    .select("variant_key, variant_name, weight, config")
    .eq("test_key", testKey)
    .eq("is_active", true);

  if (error || !variants || variants.length === 0) return null;

  const visitorId = getVisitorId();
  const bucket = hash(visitorId + ":" + testKey);
  const chosen = pickByWeight(variants as Variant[], bucket);

  localStorage.setItem(cacheKey, JSON.stringify(chosen));

  // Persist assignment (best-effort, non-blocking)
  supabase.from("ab_test_assignments").upsert(
    { visitor_id: visitorId, test_key: testKey, variant_key: chosen.variant_key },
    { onConflict: "visitor_id,test_key" }
  ).then(() => undefined);

  return chosen;
}

/** Mark the visitor's current assignment as converted (called on lead submit). */
export async function markVariantConverted(testKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  const visitorId = getVisitorId();
  await supabase
    .from("ab_test_assignments")
    .update({ converted: true })
    .eq("visitor_id", visitorId)
    .eq("test_key", testKey);
}
