import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/tracking/identifiers";

type OffMarketEvent =
  | "page_view"
  | "listing_view"
  | "unlock_request"
  | "unit_view"
  | "floorplan_download"
  | "pricing_download"
  | "whatsapp_click"
  | "call_click"
  | "inquiry_submit";

export function trackOffMarketEvent(
  eventType: OffMarketEvent,
  listingId?: string,
  unitId?: string
) {
  const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";

  supabase
    .from("off_market_analytics")
    .insert({
      event_type: eventType,
      listing_id: listingId || null,
      unit_id: unitId || null,
      visitor_id: getVisitorId(),
      device,
      referrer: document.referrer || null,
    } as any)
    .then(({ error }) => {
      if (error) console.warn("[OffMarketAnalytics]", error.message);
    });
}

const ACCESS_KEY = "off_market_approved_emails";

export function getApprovedEmail(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function setApprovedEmail(email: string) {
  localStorage.setItem(ACCESS_KEY, email);
}

export async function checkAccess(listingId: string, email: string): Promise<boolean> {
  const { data } = await supabase
    .from("off_market_access")
    .select("status")
    .eq("listing_id", listingId)
    .eq("email", email)
    .eq("status", "approved")
    .maybeSingle();
  return !!data;
}
