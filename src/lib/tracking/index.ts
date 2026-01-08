/**
 * Behavioral Tracking System
 * 
 * Central export for all tracking functionality.
 * Initialize on app load, then use individual tracking functions.
 */

// Identity
export { getVisitorId, getSessionId, generateEventId } from "./identifiers";

// Attribution
export { initAttribution, getAttributionData, getReferrer } from "./attribution";
export type { UtmParams } from "./attribution";

// Events
export {
  trackPageView,
  trackPropertyView,
  trackSearch,
  trackFloorplanView,
  trackFloorplanDownload,
  trackFavoriteAdd,
  trackFavoriteRemove,
  trackCTAClick,
  trackFormStart,
  trackFormSubmit,
  sendEvent,
} from "./events";

export type {
  PropertyViewData,
  SearchData,
  FloorplanViewData,
  FloorplanDownloadData,
  FavoriteData,
  CTAClickData,
  FormStartData,
  FormSubmitData,
} from "./events";
