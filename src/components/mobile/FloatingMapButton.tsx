import { Link, useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMapButtonProps {
  /** URL to navigate to when clicked */
  to?: string;
  /** Optional city filter to pass to map */
  city?: string;
}

export function FloatingMapButton({ to = "/map-search", city }: FloatingMapButtonProps) {
  const location = useLocation();
  
  // Hide on map search page and desktop
  const isMapPage = location.pathname === "/map-search";
  if (isMapPage) return null;
  
  const href = city ? `${to}?city=${encodeURIComponent(city)}` : to;

  return (
    <Link
      to={href}
      className={cn(
        "fixed bottom-6 right-4 z-50 flex items-center justify-center",
        "w-14 h-14 rounded-full",
        "bg-foreground text-background",
        "shadow-lg hover:bg-foreground/90 transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "lg:hidden" // Hide on desktop
      )}
      aria-label="View projects on map"
    >
      <MapPin className="h-6 w-6" />
    </Link>
  );
}
