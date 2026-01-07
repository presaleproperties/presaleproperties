import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface FloatingMapButtonProps {
  /** URL to navigate to when clicked */
  to?: string;
  /** Optional city filter to pass to map */
  city?: string;
}

export function FloatingMapButton({ to = "/map-search", city }: FloatingMapButtonProps) {
  const isMobile = useIsMobile();
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
  
  // Only show on mobile
  if (!isMobile) return null;
  
  const href = city ? `${to}?city=${encodeURIComponent(city)}` : to;

  return (
    <Link
      to={href}
      className={cn(
        "fixed bottom-6 left-4 z-50 flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full shadow-lg hover:bg-foreground/90 transition-all duration-300",
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
