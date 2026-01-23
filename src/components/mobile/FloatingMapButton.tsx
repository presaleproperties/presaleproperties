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
  
  // Hide on map search pages, detail pages, and ad landing pages (they have their own CTAs)
  const isMapPage = location.pathname === "/map-search";
  const isAdLandingPage = location.pathname === "/exclusive-offer";
  const isPresaleDetailPage = location.pathname.startsWith("/presale/") || location.pathname.startsWith("/presale-projects/");
  const isResaleDetailPage = /^\/resale\/[^/]+$/.test(location.pathname) && !["vancouver", "surrey", "burnaby", "langley", "coquitlam", "richmond", "delta", "abbotsford", "chilliwack"].includes(location.pathname.split("/")[2] || "");
  const isDetailPage = isPresaleDetailPage || isResaleDetailPage;
  
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
  
  if (isMapPage || isDetailPage || isAdLandingPage) return null;
  
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
        "w-14 h-14 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-[0_8px_32px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)]",
        "hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        "hover:scale-105 active:scale-95",
        "transition-all duration-300 ease-out",
        "lg:right-6",
        // Premium glow on first impression
        isPulsing && "animate-[map-glow_2s_ease-in-out_infinite]",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-24 opacity-0 pointer-events-none"
      )}
      aria-label={`View ${mapContext.city || "all"} projects on map`}
      style={{
        // Custom animation for smooth glow pulse
        ...(isPulsing && {
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 20px hsl(var(--primary) / 0.4)',
        })
      }}
    >
      {/* Ambient glow ring */}
      {isPulsing && (
        <span 
          className="absolute -inset-1.5 rounded-2xl opacity-60"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
      <Map className="h-6 w-6 relative z-10" />
    </Link>
  );
}