import { Helmet } from "@/components/seo/Helmet";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://presaleproperties.com";

/**
 * Canonical URL Component
 * 
 * Adds a proper canonical link tag to every page.
 * This component is designed to be used at the layout level
 * to ensure every page has a canonical URL, preventing duplicate content issues.
 * 
 * Rules:
 * 1. Filter/parameter URLs → canonical to clean base URL
 * 2. Trailing slashes → normalized to no trailing slash
 * 3. Pages with explicit canonical in their own Helmet → their canonical takes precedence
 */

interface CanonicalUrlProps {
  /** Override the automatic canonical URL */
  overrideUrl?: string;
}

export function CanonicalUrl({ overrideUrl }: CanonicalUrlProps) {
  const location = useLocation();
  
  // If an override is provided, use it directly
  if (overrideUrl) {
    return (
      <Helmet>
        <link rel="canonical" href={overrideUrl} />
      </Helmet>
    );
  }
  
  // Get clean path without trailing slashes
  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
  
  // Build canonical URL without query params (query params = noindex pages)
  const canonicalUrl = `${SITE_URL}${cleanPath}`;
  
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

/**
 * Get the canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.replace(/\/+$/, '') || '/';
  return `${SITE_URL}${cleanPath}`;
}
