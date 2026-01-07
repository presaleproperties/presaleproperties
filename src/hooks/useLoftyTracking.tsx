import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Get cached webhook URL to avoid repeated DB calls
let cachedWebhookUrl: string | null = null;
let webhookUrlFetched = false;

const getWebhookUrl = async (): Promise<string | null> => {
  if (webhookUrlFetched) return cachedWebhookUrl;
  
  const { data: settingData } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "lofty_tracking_webhook")
    .maybeSingle();

  cachedWebhookUrl = settingData?.value as string | null;
  webhookUrlFetched = true;
  return cachedWebhookUrl;
};

// Track page view to Lofty via Zapier webhook
const sendToLofty = async (data: TrackingData) => {
  try {
    const webhookUrl = await getWebhookUrl();
    
    if (!webhookUrl) {
      console.log("Lofty tracking webhook not configured");
      return;
    }

    const payload = {
      event_type: "page_view",
      timestamp: new Date().toISOString(),
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      ...data,
    };

    console.log("Sending Lofty tracking event:", payload);

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    console.log("Lofty tracking event sent successfully");
  } catch (error) {
    console.error("Error sending Lofty tracking event:", error);
  }
};

// Track CTA clicks to Lofty
const trackCTAClick = async (data: CTAClickData) => {
  try {
    const webhookUrl = await getWebhookUrl();
    
    if (!webhookUrl) {
      console.log("Lofty tracking webhook not configured");
      return;
    }

    // Get UTM parameters from session storage
    const utmSource = sessionStorage.getItem("utm_source") || undefined;
    const utmMedium = sessionStorage.getItem("utm_medium") || undefined;
    const utmCampaign = sessionStorage.getItem("utm_campaign") || undefined;

    const payload = {
      event_type: "cta_click",
      timestamp: new Date().toISOString(),
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      ...data,
    };

    console.log("Sending Lofty CTA click event:", payload);

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(payload),
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
