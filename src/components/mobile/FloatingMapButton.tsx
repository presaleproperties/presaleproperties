import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingMapButtonProps {
  /** URL to navigate to when clicked */
  to?: string;
  /** Optional city filter to pass to map */
  city?: string;
}

export function FloatingMapButton({ to = "/map-search", city }: FloatingMapButtonProps) {
  const isMobile = useIsMobile();
  
  // Only show on mobile
  if (!isMobile) return null;
  
  const href = city ? `${to}?city=${encodeURIComponent(city)}` : to;

  return (
    <Link
      to={href}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full shadow-lg hover:bg-foreground/90 transition-colors"
    >
      <MapPin className="h-5 w-5" />
      <span className="font-semibold tracking-wide">MAP</span>
    </Link>
  );
}
