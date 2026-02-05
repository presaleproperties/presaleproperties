import { Link, useLocation } from "react-router-dom";
import { Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";

// City slug to display name mapping
const CITY_SLUG_MAP: Record<string, string> = {
  surrey: "Surrey",
  langley: "Langley",
  coquitlam: "Coquitlam",
  burnaby: "Burnaby",
  vancouver: "Vancouver",
  richmond: "Richmond",
  delta: "Delta",
  abbotsford: "Abbotsford",
  "port-moody": "Port Moody",
  "new-westminster": "New Westminster",
  "north-vancouver": "North Vancouver",
  "west-vancouver": "West Vancouver",
  "white-rock": "White Rock",
};

export function FloatingMapButton() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  
  // Hide on map search pages, detail pages, ad landing pages, and admin/agent portals
  const isMapPage = location.pathname === "/map-search";
  const isAdLandingPage = location.pathname === "/exclusive-offer";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isForAgentsPage = location.pathname === "/for-agents";
  
  // Detail pages for all property types
  const isPresaleDetailPage = location.pathname.startsWith("/presale/") || location.pathname.startsWith("/presale-projects/");
  const isMLSPropertyDetailPage = location.pathname.startsWith("/properties/");
  const isAssignmentDetailPage = location.pathname.startsWith("/assignments/");
  const isDetailPage = isPresaleDetailPage || isMLSPropertyDetailPage || isAssignmentDetailPage;
  
  // Parse current route to extract context (city, type, neighborhood)
  const mapContext = useMemo(() => {
    const path = location.pathname;
    
    // Check for resale pages first
    if (path.startsWith("/resale")) {
      return { isResale: true, city: null, type: null, neighborhood: null };
    }
    
    // Pattern: /:citySlug-presale-condos or /:citySlug-presale-townhomes
    const cityProductMatch = path.match(/^\/([a-z-]+)-presale-(condos|townhomes)$/);
    if (cityProductMatch) {
      const citySlug = cityProductMatch[1];
      const productType = cityProductMatch[2] === "condos" ? "condo" : "townhome";
      const cityName = CITY_SLUG_MAP[citySlug];
      if (cityName) {
        return { isResale: false, city: cityName, type: productType, neighborhood: null };
      }
    }
    
    // Pattern: /:citySlug-:neighborhood-presale (neighborhood pages)
    const neighborhoodMatch = path.match(/^\/([a-z-]+)-([a-z-]+)-presale$/);
    if (neighborhoodMatch) {
      const citySlug = neighborhoodMatch[1];
      const cityName = CITY_SLUG_MAP[citySlug];
      if (cityName) {
        // We can filter by city at least
        return { isResale: false, city: cityName, type: null, neighborhood: neighborhoodMatch[2] };
      }
    }
    
    // Pattern: /presale-condos/:citySlug (old format)
    const oldFormatMatch = path.match(/^\/presale-condos\/([a-z-]+)$/);
    if (oldFormatMatch) {
      const citySlug = oldFormatMatch[1];
      const cityName = CITY_SLUG_MAP[citySlug];
      if (cityName) {
        return { isResale: false, city: cityName, type: null, neighborhood: null };
      }
    }
    
    // Pattern: /presale-projects (all projects)
    if (path === "/presale-projects") {
      return { isResale: false, city: null, type: null, neighborhood: null };
    }
    
    // Default - no specific context
    return { isResale: false, city: null, type: null, neighborhood: null };
  }, [location.pathname]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDiff = currentScrollY - lastScrollY.current;
          
          // Show when scrolling up or at top, hide when scrolling down
          if (currentScrollY < 50) {
            setIsVisible(true);
          } else if (scrollDiff > 5) {
            // Scrolling down
            setIsVisible(false);
          } else if (scrollDiff < -5) {
            // Scrolling up
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  if (isMapPage || isDetailPage || isAdLandingPage || isAdminPage || isDashboardPage || isForAgentsPage) return null;
  
  // Build the map URL with context-aware params
  const buildMapUrl = () => {
    // For resale pages, link to unified map with resale mode
    if (mapContext.isResale) {
      return "/map-search?mode=resale";
    }
    
    const params = new URLSearchParams();
    
    if (mapContext.city) {
      params.set("city", mapContext.city);
    }
    if (mapContext.type) {
      params.set("type", mapContext.type);
    }
    
    const queryString = params.toString();
    return queryString ? `/map-search?${queryString}` : "/map-search";
  };

  return (
    <Link
      to={buildMapUrl()}
      className={cn(
        "fixed bottom-6 right-4 z-50",
        "flex items-center justify-center",
        "w-12 h-12 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg",
        "hover:bg-primary/90",
        "active:scale-95",
        "transition-all duration-200",
        "lg:right-6",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-20 opacity-0 pointer-events-none"
      )}
      aria-label={`View ${mapContext.city || "all"} projects on map`}
    >
      <Map className="h-5 w-5" />
    </Link>
  );
}