import { useEffect, useMemo } from "react";

const UTM_STORAGE_KEY = "presale_utm_params";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_page?: string;
}

/**
 * Captures UTM parameters from URL and stores them in sessionStorage.
 * Returns the stored UTM data for use in form submissions.
 */
export function useUtmTracking(): UtmData {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const existingData = getStoredUtmData();
    
    // Only capture if we have new UTM params or no existing data
    const hasNewUtmParams = UTM_PARAMS.some(param => urlParams.has(param));
    
    if (hasNewUtmParams || !existingData.landing_page) {
      const utmData: UtmData = {
        utm_source: urlParams.get("utm_source") || existingData.utm_source,
        utm_medium: urlParams.get("utm_medium") || existingData.utm_medium,
        utm_campaign: urlParams.get("utm_campaign") || existingData.utm_campaign,
        utm_content: urlParams.get("utm_content") || existingData.utm_content,
        utm_term: urlParams.get("utm_term") || existingData.utm_term,
        referrer: existingData.referrer || document.referrer || undefined,
        landing_page: existingData.landing_page || window.location.pathname,
      };
      
      // Only store non-empty values
      const cleanedData = Object.fromEntries(
        Object.entries(utmData).filter(([_, v]) => v)
      );
      
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(cleanedData));
    }
  }, []);

  return useMemo(() => getStoredUtmData(), []);
}

/**
 * Gets stored UTM data from sessionStorage
 */
export function getStoredUtmData(): UtmData {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Gets UTM data for form submissions (call at submission time for fresh data)
 */
export function getUtmDataForSubmission(): UtmData {
  return getStoredUtmData();
}
