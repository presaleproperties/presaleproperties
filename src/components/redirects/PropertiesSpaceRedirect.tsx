import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Catch-all redirect for /properties/* URLs that contain spaces, 'undefined', or malformed segments.
 * 
 * Handles Google-crawled broken URLs like:
 * - /properties/new westminster → /properties/new-westminster
 * - /properties/richmond/brighouse/undefined → /properties/richmond/brighouse
 * - /properties/richmond/undefined → /properties/richmond
 * - /properties/west-vancouver/dundarave/undefined → /properties/west-vancouver/dundarave
 */
export function PropertiesCleanupRedirect() {
  const location = useLocation();
  const decoded = decodeURIComponent(location.pathname);
  
  // Strip /undefined segments — redirect to parent path
  if (decoded.includes('/undefined')) {
    // Remove all /undefined occurrences and redirect to the remaining path
    const cleaned = decoded.replace(/\/undefined/g, '').replace(/\/+$/, '') || '/properties';
    // If cleaned is just /properties, redirect there
    return <Navigate to={`${cleaned}${location.search}${location.hash}`} replace />;
  }
  
  // Normalize spaces to hyphens
  const cleaned = decoded.replace(/\s+/g, '-').toLowerCase();
  
  if (cleaned !== decoded) {
    return <Navigate to={`${cleaned}${location.search}${location.hash}`} replace />;
  }
  
  // Nothing to fix — show 404
  return <NotFound />;
}
