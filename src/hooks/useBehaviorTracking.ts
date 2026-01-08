/**
 * React hooks for behavioral tracking
 * Provides easy integration with components
 */

import { useEffect, useRef, useCallback } from "react";
import {
  trackPropertyView,
  trackSearch,
  trackFloorplanView,
  trackFloorplanDownload,
  trackFavoriteAdd,
  trackFavoriteRemove,
  trackCTAClick,
  trackFormStart,
  trackFormSubmit,
  PropertyViewData,
  SearchData,
  FloorplanViewData,
  FloorplanDownloadData,
  FavoriteData,
  CTAClickData,
  FormStartData,
  FormSubmitData,
} from "@/lib/tracking";

/**
 * Track property/project view once when data is available
 */
export function usePropertyViewTracking(data: PropertyViewData | null) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (data && !hasTracked.current) {
      hasTracked.current = true;
      trackPropertyView(data);
    }
  }, [data]);
}

/**
 * Get callbacks for tracking various events
 */
export function useBehaviorTracking() {
  const onSearch = useCallback((data: SearchData) => {
    trackSearch(data);
  }, []);

  const onFloorplanView = useCallback((data: FloorplanViewData) => {
    trackFloorplanView(data);
  }, []);

  const onFloorplanDownload = useCallback((data: FloorplanDownloadData) => {
    trackFloorplanDownload(data);
  }, []);

  const onFavoriteAdd = useCallback((data: FavoriteData) => {
    trackFavoriteAdd(data);
  }, []);

  const onFavoriteRemove = useCallback((data: FavoriteData) => {
    trackFavoriteRemove(data);
  }, []);

  const onCTAClick = useCallback((data: CTAClickData) => {
    trackCTAClick(data);
  }, []);

  const onFormStart = useCallback((data: FormStartData) => {
    trackFormStart(data);
  }, []);

  const onFormSubmit = useCallback((data: FormSubmitData) => {
    trackFormSubmit(data);
  }, []);

  return {
    onSearch,
    onFloorplanView,
    onFloorplanDownload,
    onFavoriteAdd,
    onFavoriteRemove,
    onCTAClick,
    onFormStart,
    onFormSubmit,
  };
}

/**
 * Track form start when form is first interacted with
 */
export function useFormStartTracking(formName: string, formLocation: string) {
  const hasTracked = useRef(false);

  const trackStart = useCallback(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackFormStart({ form_name: formName, form_location: formLocation });
    }
  }, [formName, formLocation]);

  return trackStart;
}

// Re-export types for convenience
export type {
  PropertyViewData,
  SearchData,
  FloorplanViewData,
  FloorplanDownloadData,
  FavoriteData,
  CTAClickData,
  FormStartData,
  FormSubmitData,
};
