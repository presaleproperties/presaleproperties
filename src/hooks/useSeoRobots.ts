/**
 * SEO Index Control Hook
 * 
 * Centralizes logic for determining if a page should be indexed.
 * Implements PART 1 — INDEX CONTROL from the SEO strategy.
 * 
 * NOINDEX patterns:
 * - /map-search*
 * - URLs with ?lat=, ?lng=, ?zoom=, ?project=, ?sort=, ?view=
 * - Filter pages like /presale-projects?city=X
 * - Any dynamically generated UI/map URLs
 */

import { useLocation, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

// Query params that trigger noindex
const NOINDEX_PARAMS = [
  "lat", "lng", "zoom", "project", "sort", "view", 
  "page", "beds", "baths", "price", "type", "deposit", 
  "year", "status", "filter", "q", "search"
];

// Routes that should ALWAYS be noindexed
const NOINDEX_ROUTES = [
  "/map-search",
  "/admin",
  "/dashboard",
  "/login",
  "/buyer/login",
  "/buyer/signup",
  "/exclusive-offer",
  "/campaign",
  "/vip-access",
];

// City filter pages that should canonical to clean city pages
const CITY_CANONICAL_MAP: Record<string, string> = {
  vancouver: "/vancouver-presale-condos",
  surrey: "/surrey-presale-condos",
  burnaby: "/burnaby-presale-condos",
  coquitlam: "/coquitlam-presale-condos",
  langley: "/langley-presale-condos",
  richmond: "/richmond-presale-condos",
  delta: "/delta-presale-condos",
  abbotsford: "/abbotsford-presale-condos",
  "north-vancouver": "/north-vancouver-presale-condos",
  "new-westminster": "/new-westminster-presale-condos",
  "port-coquitlam": "/port-coquitlam-presale-condos",
  "port-moody": "/port-moody-presale-condos",
  "maple-ridge": "/maple-ridge-presale-condos",
  "white-rock": "/white-rock-presale-condos",
};

export interface SeoRobotsResult {
  /** Whether the page should be noindexed */
  noindex: boolean;
  /** The canonical URL to use (may differ from current URL for filter pages) */
  canonicalUrl: string;
  /** Reason for noindex (for debugging) */
  noindexReason?: string;
  /** Whether this is a filter/param page that should point to a clean canonical */
  isFilterPage: boolean;
}

/**
 * Determines SEO index/canonical strategy for the current page
 */
export function useSeoRobots(): SeoRobotsResult {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    const path = location.pathname;
    const fullUrl = `https://presaleproperties.com${path}`;
    
    // Check if route is in always-noindex list
    const isNoindexRoute = NOINDEX_ROUTES.some(route => 
      path === route || path.startsWith(`${route}/`) || path.startsWith(route)
    );
    
    if (isNoindexRoute) {
      return {
        noindex: true,
        canonicalUrl: fullUrl,
        noindexReason: `Route ${path} is in NOINDEX_ROUTES`,
        isFilterPage: false,
      };
    }
    
    // Check for noindex query params
    const hasNoindexParams = NOINDEX_PARAMS.some(param => searchParams.has(param));
    
    // Special case: /presale-projects with city param should canonical to city page
    if (path === "/presale-projects" && searchParams.has("city")) {
      const cityParam = searchParams.get("city")?.toLowerCase().replace(/\s+/g, "-") || "";
      const cleanCanonical = CITY_CANONICAL_MAP[cityParam];
      
      if (cleanCanonical) {
        return {
          noindex: true, // noindex filter page, point to clean canonical
          canonicalUrl: `https://presaleproperties.com${cleanCanonical}`,
          noindexReason: `Filter page ?city=${cityParam} → canonical ${cleanCanonical}`,
          isFilterPage: true,
        };
      }
    }
    
    // Check for any filter/param URLs
    if (hasNoindexParams) {
      return {
        noindex: true,
        canonicalUrl: fullUrl, // Self-canonical but noindex
        noindexReason: `URL contains noindex params: ${NOINDEX_PARAMS.filter(p => searchParams.has(p)).join(", ")}`,
        isFilterPage: true,
      };
    }
    
    // Default: index with self-referencing canonical
    return {
      noindex: false,
      canonicalUrl: fullUrl,
      isFilterPage: false,
    };
  }, [location.pathname, searchParams]);
}

/**
 * Get the canonical URL for a city's presale page
 */
export function getCityPresaleCanonical(city: string): string {
  const normalized = city.toLowerCase().replace(/\s+/g, "-");
  return CITY_CANONICAL_MAP[normalized] || `/presale-projects?city=${encodeURIComponent(city)}`;
}

/**
 * Check if a URL should be included in sitemap
 */
export function shouldIncludeInSitemap(url: string): boolean {
  // Never include routes with query params
  if (url.includes("?")) return false;
  
  // Never include noindex routes
  if (NOINDEX_ROUTES.some(route => url.startsWith(route))) return false;
  
  return true;
}
