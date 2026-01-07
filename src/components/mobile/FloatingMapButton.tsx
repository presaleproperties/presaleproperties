import { Link, useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface FloatingMapButtonProps {
  /** URL to navigate to when clicked */
  to?: string;
  /** Optional city filter to pass to map */
  city?: string;
}

export function FloatingMapButton({ to = "/map-search", city }: FloatingMapButtonProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  
  // Hide on map search page
  const isMapPage = location.pathname === "/map-search";
  
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
  
  if (isMapPage) return null;
  
  const href = city ? `${to}?city=${encodeURIComponent(city)}` : to;

  return (
    <Link
      to={href}
      className={cn(
        "fixed bottom-6 right-4 z-50 flex items-center justify-center",
        "w-14 h-14 rounded-full",
        "bg-foreground text-background",
        "shadow-lg hover:bg-foreground/90",
        "hover:scale-110 active:scale-95",
        "lg:hidden", // Hide on desktop
        "transition-all duration-300",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-20 opacity-0 pointer-events-none"
      )}
      aria-label="View projects on map"
    >
      <MapPin className="h-6 w-6" />
    </Link>
  );
}
