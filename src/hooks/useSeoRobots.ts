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
 * 
 * CANONICAL rules:
 * - Filter pages → canonical to clean city/type page
 * - Parameter URLs → canonical to base path
 * - All pages must have explicit canonical
 */

import { useLocation, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

const SITE_URL = "https://presaleproperties.com";

// Query params that trigger noindex
const NOINDEX_PARAMS = [
  "lat", "lng", "zoom", "project", "sort", "view", 
  "page", "beds", "baths", "price", "type", "deposit", 
  "year", "status", "filter", "q", "search", "mode",
  "city", "neighborhood", "developer"
];

// Routes that should ALWAYS be noindexed (regardless of params)
const NOINDEX_ROUTES = [
  "/map-search",
  "/admin",
  "/dashboard",
  "/login",
  "/buyer/login",
  "/buyer/signup",
  "/buyer/dashboard",
  "/exclusive-offer",
  "/campaign",
  "/vip-access",
  "/404",
];

// Routes that should noindex when they have query params, canonical to base
const NOINDEX_WITH_PARAMS_ROUTES = [
  "/calculator",
  "/presale-projects",
  "/properties",
];

// City filter pages that should canonical to clean city pages (NEW URL structure)
const CITY_CANONICAL_MAP: Record<string, string> = {
  vancouver: "/presale-projects/vancouver/condos",
  surrey: "/presale-projects/surrey/condos",
  burnaby: "/presale-projects/burnaby/condos",
  coquitlam: "/presale-projects/coquitlam/condos",
  langley: "/presale-projects/langley/condos",
  richmond: "/presale-projects/richmond/condos",
  delta: "/presale-projects/delta/condos",
  abbotsford: "/presale-projects/abbotsford/condos",
  "north-vancouver": "/presale-projects/north-vancouver/condos",
  "new-westminster": "/presale-projects/new-westminster/condos",
  "port-coquitlam": "/presale-projects/port-coquitlam/condos",
  "port-moody": "/presale-projects/port-moody/condos",
  "maple-ridge": "/presale-projects/maple-ridge/condos",
  "white-rock": "/presale-projects/white-rock/condos",
};

// City townhome pages canonical map (NEW URL structure)
const CITY_TOWNHOME_CANONICAL_MAP: Record<string, string> = {
  vancouver: "/presale-projects/vancouver/townhomes",
  surrey: "/presale-projects/surrey/townhomes",
  burnaby: "/presale-projects/burnaby/townhomes",
  coquitlam: "/presale-projects/coquitlam/townhomes",
  langley: "/presale-projects/langley/townhomes",
  richmond: "/presale-projects/richmond/townhomes",
  delta: "/presale-projects/delta/townhomes",
  abbotsford: "/presale-projects/abbotsford/townhomes",
  "north-vancouver": "/presale-projects/north-vancouver/townhomes",
  "new-westminster": "/presale-projects/new-westminster/townhomes",
  "port-coquitlam": "/presale-projects/port-coquitlam/townhomes",
  "port-moody": "/presale-projects/port-moody/townhomes",
  "maple-ridge": "/presale-projects/maple-ridge/townhomes",
  "white-rock": "/presale-projects/white-rock/townhomes",
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
    const path = location.pathname.replace(/\/+$/, '') || '/'; // Normalize trailing slashes
    const fullUrl = `${SITE_URL}${path}`;
    
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
      const typeParam = searchParams.get("type")?.toLowerCase() || "";
      
      // Check if townhome type specified
      const canonicalMap = typeParam === "townhome" ? CITY_TOWNHOME_CANONICAL_MAP : CITY_CANONICAL_MAP;
      const cleanCanonical = canonicalMap[cityParam];
      
      if (cleanCanonical) {
        return {
          noindex: true, // noindex filter page, point to clean canonical
          canonicalUrl: `${SITE_URL}${cleanCanonical}`,
          noindexReason: `Filter page ?city=${cityParam} → canonical ${cleanCanonical}`,
          isFilterPage: true,
        };
      }
    }
    
    // Special case: /presale-projects with any filter params → canonical to base
    if (path === "/presale-projects" && hasNoindexParams) {
      return {
        noindex: true,
        canonicalUrl: `${SITE_URL}/presale-projects`,
        noindexReason: `Filter page with params → canonical to /presale-projects`,
        isFilterPage: true,
      };
    }
    
    // Special case: /properties with city filter → canonical to city page
    if (path === "/properties" && searchParams.has("city")) {
      const cityParam = searchParams.get("city")?.toLowerCase().replace(/\s+/g, "-") || "";
      return {
        noindex: true,
        canonicalUrl: `${SITE_URL}/properties/${cityParam}`,
        noindexReason: `Filter page ?city=${cityParam} → canonical to /properties/${cityParam}`,
        isFilterPage: true,
      };
    }
    
    // Check for any filter/param URLs
    if (hasNoindexParams) {
      return {
        noindex: true,
        canonicalUrl: fullUrl.split('?')[0], // Canonical to base path without params
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
export function getCityPresaleCanonical(city: string, type: "condos" | "townhomes" = "condos"): string {
  const normalized = city.toLowerCase().replace(/\s+/g, "-");
  const canonicalMap = type === "townhomes" ? CITY_TOWNHOME_CANONICAL_MAP : CITY_CANONICAL_MAP;
  return canonicalMap[normalized] || `/presale-projects?city=${encodeURIComponent(city)}`;
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

/**
 * Get the noindex params list for use in other components
 */
export function getNoindexParams(): string[] {
  return NOINDEX_PARAMS;
}

/**
 * Check if current URL has filter params that should trigger noindex
 */
export function hasFilterParams(searchParams: URLSearchParams): boolean {
  return NOINDEX_PARAMS.some(param => searchParams.has(param));
}
