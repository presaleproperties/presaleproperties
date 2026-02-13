import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Redirect component for legacy /resale/* URLs to new /properties/* URLs
 * This ensures SEO value is preserved via 301 redirects
 * 
 * Handles malformed URLs:
 * - URLs with 'undefined' segments → render 404 inline
 * - URLs with empty segments → clean them up
 */
export function ResaleToPropertiesRedirect() {
  const location = useLocation();
  
  // Check for malformed URLs with 'undefined' segments
  if (location.pathname.includes('/undefined')) {
    return <NotFound />;
  }
  
  // Clean up any double slashes and replace /resale with /properties
  const cleanPath = location.pathname
    .replace(/\/+/g, '/') // Remove double slashes
    .replace(/^\/resale/, '/properties');
  
  const newUrl = `${cleanPath}${location.search}${location.hash}`;
  
  return <Navigate to={newUrl} replace />;
}
