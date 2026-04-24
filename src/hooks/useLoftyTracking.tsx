import { useEffect, useRef, useCallback } from "react";
import { safeTrackingInvoke } from "@/lib/tracking/safeInvoke";

interface PageViewData {
  page_type: "project" | "listing" | "blog" | "page";
  page_url: string;
  page_title: string;
  referrer?: string;
}

interface ProjectViewData extends PageViewData {
  page_type: "project";
  project_id: string;
  project_name: string;
  project_city: string;
  project_neighborhood: string;
  project_status: string;
  project_type: string;
  starting_price?: number | null;
}

interface ListingViewData extends PageViewData {
  page_type: "listing";
  listing_id: string;
  listing_title: string;
  listing_city: string;
  listing_price: number;
  listing_beds: number;
  listing_baths: number;
}

interface CTAClickData {
  cta_type: string;
  cta_label: string;
  cta_location: string;
  project_id?: string;
  project_name?: string;
  listing_id?: string;
  listing_address?: string;
}

type TrackingData = PageViewData | ProjectViewData | ListingViewData;

// Generate or retrieve a unique visitor ID
const getVisitorId = (): string => {
  const key = "lofty_visitor_id";
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
};

// Get session ID (refreshes after 30 min of inactivity)
const getSessionId = (): string => {
  const key = "lofty_session_id";
  const timestampKey = "lofty_session_timestamp";
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  const lastTimestamp = localStorage.getItem(timestampKey);
  const now = Date.now();
  
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId || !lastTimestamp || (now - parseInt(lastTimestamp)) > SESSION_TIMEOUT) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  
  localStorage.setItem(timestampKey, now.toString());
  return sessionId;
};

// Track page view via the server-side edge function (webhook URL never exposed to client)
const sendToLofty = async (data: TrackingData) => {
  try {
    const payload = {
      activity_type: "page_view",
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      page_url: data.page_url,
      page_title: data.page_title,
      referrer: data.referrer,
      device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      // Include project/listing-specific data
      ...("project_id" in data ? { project_id: data.project_id, project_name: data.project_name, city: data.project_city } : {}),
      ...("listing_id" in data ? { listing_key: data.listing_id, project_name: data.listing_title, city: data.listing_city, price: data.listing_price } : {}),
    };

    // Route through the edge function - webhook forwarding happens server-side
    await supabase.functions.invoke("track-client-activity", {
      body: payload,
    });
  } catch (error) {
    console.error("Error sending tracking event:", error);
  }
};

// Track CTA clicks via edge function
const trackCTAClick = async (data: CTAClickData) => {
  try {
    const payload = {
      activity_type: "contact_form",
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      page_url: window.location.href,
      page_title: document.title,
      project_id: data.project_id,
      project_name: data.project_name,
      utm_source: sessionStorage.getItem("utm_source") || undefined,
      utm_medium: sessionStorage.getItem("utm_medium") || undefined,
      utm_campaign: sessionStorage.getItem("utm_campaign") || undefined,
      device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    };

    await supabase.functions.invoke("track-client-activity", {
      body: payload,
    });
  } catch (error) {
    console.error("Error sending CTA click event:", error);
  }
};

// Hook for tracking project views
export function useLoftyProjectTracking(project: {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  status: string;
  project_type: string;
  starting_price?: number | null;
} | null) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (project && !hasTracked.current) {
      hasTracked.current = true;
      
      sendToLofty({
        page_type: "project",
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || undefined,
        project_id: project.id,
        project_name: project.name,
        project_city: project.city,
        project_neighborhood: project.neighborhood,
        project_status: project.status,
        project_type: project.project_type,
        starting_price: project.starting_price,
      });
    }
  }, [project]);
}

// Hook for tracking listing views
export function useLoftyListingTracking(listing: {
  id: string;
  title: string;
  city: string;
  assignment_price: number;
  beds: number;
  baths: number;
} | null) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (listing && !hasTracked.current) {
      hasTracked.current = true;
      
      sendToLofty({
        page_type: "listing",
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || undefined,
        listing_id: listing.id,
        listing_title: listing.title,
        listing_city: listing.city,
        listing_price: listing.assignment_price,
        listing_beds: listing.beds,
        listing_baths: listing.baths,
      });
    }
  }, [listing]);
}

// Hook for tracking generic page views
export function useLoftyPageTracking(pageTitle: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      
      sendToLofty({
        page_type: "page",
        page_url: window.location.href,
        page_title: pageTitle,
        referrer: document.referrer || undefined,
      });
    }
  }, [pageTitle]);
}

// Hook for CTA click tracking with memoized callback
export function useLoftyCTATracking() {
  const trackClick = useCallback((
    ctaType: string,
    ctaLabel: string,
    ctaLocation: string,
    context?: {
      project_id?: string;
      project_name?: string;
      listing_id?: string;
      listing_address?: string;
    }
  ) => {
    trackCTAClick({
      cta_type: ctaType,
      cta_label: ctaLabel,
      cta_location: ctaLocation,
      ...context,
    });
  }, []);

  return { trackClick };
}

// Export the raw tracking functions
export { sendToLofty, trackCTAClick, getVisitorId, getSessionId };
