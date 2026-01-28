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

const MAP_BUTTON_PULSE_KEY = "map_button_pulse_shown";

export function FloatingMapButton() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(() => {
    // Only pulse if not shown before in this session
    return !sessionStorage.getItem(MAP_BUTTON_PULSE_KEY);
  });
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

  // Stop pulsing after 3 seconds and mark as shown
  useEffect(() => {
    if (!isPulsing) return;
    
    const timer = setTimeout(() => {
      setIsPulsing(false);
      sessionStorage.setItem(MAP_BUTTON_PULSE_KEY, "true");
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPulsing]);
  
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
        "ring-2 ring-offset-2 ring-offset-transparent",
        "shadow-[0_4px_24px_rgba(245,194,67,0.4),0_0_0_1px_rgba(255,255,255,0.1)]",
        "hover:shadow-[0_6px_32px_rgba(245,194,67,0.5),0_0_0_1px_rgba(255,255,255,0.15)]",
        "hover:scale-105",
        "active:scale-95",
        "transition-all duration-300",
        "lg:right-6",
        // Subtle glow effect on first impression
        isPulsing 
          ? "ring-primary/50 shadow-[0_0_16px_4px_rgba(245,194,67,0.45),0_4px_24px_rgba(0,0,0,0.3)]"
          : "ring-primary/30 hover:ring-primary/50",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-20 opacity-0 pointer-events-none"
      )}
      aria-label={`View ${mapContext.city || "all"} projects on map`}
    >
      {/* Subtle pulse ring animation on first impression */}
      {isPulsing && (
        <span className="absolute -inset-1 rounded-full bg-blue-400/15 animate-pulse" />
      )}
      <Map className="h-5 w-5 relative z-10" />
    </Link>
  );
}