/**
 * SEO Index Control Hook
 * 
 * Centralizes logic for determining if a page should be indexed.
 * 
 * NOINDEX patterns (tight — only truly non-indexable):
 * - /map-search (UI-only, no real content)
 * - Auth / admin / dashboard routes
 * - Coordinate/map params: lat, lng, zoom, mode
 * - Pure UI state params: sort, view, filter, q, search
 * 
 * INDEXABLE (previously over-blocked, now allowed):
 * - /presale-projects?city= → canonical to /presale-projects/{city}/condos
 * - /properties?city= → canonical to /properties/{city}
 * - All programmatic city/type/price pages
 * - Blog, guides, buyer education pages
 * 
 * CANONICAL rules:
 * - Filter pages → canonical to clean base URL (indexed)
 * - Param URLs → canonical to base path without params
 * - Every page MUST have an explicit self-referencing or pointed canonical
 */

import { useLocation, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

const SITE_URL = "https://presaleproperties.com";

// ⚠️ TIGHT noindex params — ONLY true UI/map coordinate params
// sort, filter, view, q, search are NOT noindex — they either have canonical
// targets or are content signals that should remain crawlable
const NOINDEX_PARAMS = [
  "lat", "lng", "zoom", "mode",   // map/UI-only coordinates
];

// Routes that should ALWAYS be noindexed
// CRITICAL: Keep this list minimal — only auth/admin/private/true-utility
const NOINDEX_ROUTES = [
  "/map-search",
  "/admin",
  "/dashboard",
  "/login",
  "/buyer/login",
  "/buyer/signup",
  "/buyer",
  "/buyer/dashboard",
  "/exclusive-offer",
  "/campaign",
  "/vip-access",
  "/404",
  "/developer",        // developer portal
  "/developer-portal",
  "/privacy",          // thin legal page — no search value
];

// Routes that should noindex when they have ANY query params (canonical to base path)
const NOINDEX_WITH_PARAMS_ROUTES = [
  "/calculator",
  "/roi-calculator",
  "/mortgage-calculator",
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
 * Determines SEO index/canonical strategy for the current page.
 * Strategy: Index aggressively, noindex only when truly necessary.
 */
export function useSeoRobots(): SeoRobotsResult {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const fullUrl = `${SITE_URL}${path}`;
    const hasParams = searchParams.toString().length > 0;
    
    // 1. Always-noindex routes (auth/admin/private only)
    const isNoindexRoute = NOINDEX_ROUTES.some(route => 
      path === route || path.startsWith(`${route}/`)
    );
    if (isNoindexRoute) {
      return {
        noindex: true,
        canonicalUrl: fullUrl,
        noindexReason: `Route in NOINDEX_ROUTES`,
        isFilterPage: false,
      };
    }
    
    // 2. Calculator/tool pages with ANY params → noindex, canonical to base
    const isNoindexWithParamsRoute = NOINDEX_WITH_PARAMS_ROUTES.some(route => path === route);
    if (isNoindexWithParamsRoute && hasParams) {
      return {
        noindex: true,
        canonicalUrl: fullUrl, // canonical to self (no params)
        noindexReason: `Tool page with params`,
        isFilterPage: false,
      };
    }

    // 3. Check for noindex query params (map/UI only)
    const hasNoindexParams = NOINDEX_PARAMS.some(param => searchParams.has(param));
    
    // 4. /presale-projects?city= → canonical to /presale-projects/{city}/condos (indexed)
    if (path === "/presale-projects" && searchParams.has("city")) {
      const cityParam = searchParams.get("city")?.toLowerCase().replace(/\s+/g, "-") || "";
      const typeParam = searchParams.get("type")?.toLowerCase() || "";
      const canonicalMap = typeParam === "townhome" ? CITY_TOWNHOME_CANONICAL_MAP : CITY_CANONICAL_MAP;
      const cleanCanonical = canonicalMap[cityParam];
      if (cleanCanonical) {
        return {
          noindex: true,
          canonicalUrl: `${SITE_URL}${cleanCanonical}`,
          noindexReason: `City filter → canonical ${cleanCanonical}`,
          isFilterPage: true,
        };
      }
      // Unknown city — canonical to hub
      return {
        noindex: true,
        canonicalUrl: `${SITE_URL}/presale-projects`,
        noindexReason: `Unknown city filter`,
        isFilterPage: true,
      };
    }
    
    // 5. /properties?city= → canonical to /properties/{city}
    if (path === "/properties" && searchParams.has("city")) {
      const cityParam = searchParams.get("city")?.toLowerCase().replace(/\s+/g, "-") || "";
      return {
        noindex: true,
        canonicalUrl: `${SITE_URL}/properties/${cityParam}`,
        noindexReason: `City filter → /properties/${cityParam}`,
        isFilterPage: true,
      };
    }
    
    // 6. Any URL with true noindex params (lat/lng/zoom/mode etc.)
    if (hasNoindexParams) {
      return {
        noindex: true,
        canonicalUrl: fullUrl, // self (params stripped by GlobalSEO)
        noindexReason: `UI params: ${NOINDEX_PARAMS.filter(p => searchParams.has(p)).join(", ")}`,
        isFilterPage: true,
      };
    }
    
    // 7. Default: index with self-referencing canonical
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
  if (url.includes("?")) return false;
  if (NOINDEX_ROUTES.some(route => url.startsWith(route))) return false;
  return true;
}

export function getNoindexParams(): string[] {
  return NOINDEX_PARAMS;
}

export function hasFilterParams(searchParams: URLSearchParams): boolean {
  return NOINDEX_PARAMS.some(param => searchParams.has(param));
}
