import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMapButtonProps {
  /** URL to navigate to when clicked */
  to?: string;
  /** Optional city filter to pass to map */
  city?: string;
}

export function FloatingMapButton({ to = "/map-search", city }: FloatingMapButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past first viewport height
      const scrollThreshold = window.innerHeight * 0.5;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    // Check initial scroll position
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Hide on desktop (lg and above)
  const href = city ? `${to}?city=${encodeURIComponent(city)}` : to;

  return (
    <Link
      to={href}
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full shadow-lg hover:bg-foreground/90 transition-all duration-300",
        "lg:hidden", // Hide on desktop
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-16 opacity-0 pointer-events-none"
      )}
    >
      <MapPin className="h-5 w-5" />
      <span className="font-semibold tracking-wide">MAP</span>
    </Link>
  );
}
