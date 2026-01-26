import { Navigate, useLocation, useParams } from "react-router-dom";

/**
 * Redirect component for legacy /resale/* URLs to new /properties/* URLs
 * This ensures SEO value is preserved via 301 redirects
 */
export function ResaleToPropertiesRedirect() {
  const location = useLocation();
  const params = useParams();
  
  // Replace /resale with /properties in the current path
  const newPath = location.pathname.replace(/^\/resale/, '/properties');
  const newUrl = `${newPath}${location.search}${location.hash}`;
  
  return <Navigate to={newUrl} replace />;
}
