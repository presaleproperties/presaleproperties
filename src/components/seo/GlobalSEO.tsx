import { useLocation, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useSeoRobots } from "@/hooks/useSeoRobots";

const SITE_URL = "https://presaleproperties.com";

/**
 * Global SEO Component
 * 
 * Handles site-wide SEO concerns:
 * 1. Canonical URLs - Ensures every page has a proper canonical
 * 2. Robots meta - Dynamic noindex for filter/param pages
 * 3. Base meta tags that apply to all pages
 * 
 * This should be placed in the App.tsx layout to ensure consistent SEO across all pages.
 * Individual pages can still override these with their own Helmet tags (later Helmet tags win).
 */
export function GlobalSEO() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { noindex, canonicalUrl, isFilterPage } = useSeoRobots();
  
  // Clean path without trailing slashes
  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
  
  // For filter pages, canonical should point to base URL without params
  const effectiveCanonicalUrl = isFilterPage 
    ? canonicalUrl // useSeoRobots already computes the correct canonical for filter pages
    : `${SITE_URL}${cleanPath}`;
  
  // Robots directive
  const robotsContent = noindex 
    ? "noindex, follow" 
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return (
    <Helmet>
      {/* Default canonical - individual pages can override */}
      <link rel="canonical" href={effectiveCanonicalUrl} />
      
      {/* Robots meta - critical for preventing duplicate content */}
      <meta name="robots" content={robotsContent} />
      
      {/* Only noindex via googlebot for coordinate/UI-specific params (not pagination) */}
      {(searchParams.has("lat") || searchParams.has("lng") || searchParams.has("zoom") || searchParams.has("mode")) && (
        <meta name="googlebot" content="noindex, follow" />
      )}
    </Helmet>
  );
}
