import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the heavy search popup - only loaded when user taps search
const AISearchPopup = lazy(() => 
  import("@/components/search/AISearchPopup").then(m => ({ default: m.AISearchPopup }))
);

export function FloatingBottomNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;
      
      if (Math.abs(scrollDiff) > scrollThreshold) {
        if (scrollDiff > 0 && currentScrollY > 50) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_search_click", { page_path: location.pathname });
    }
    setSearchOpen(true);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        {/* Subtle gradient for visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        
        <div className="relative flex items-center justify-center px-6 py-4 pointer-events-auto">
          {/* Search Button - icon and text are inline, zero-delay render */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 rounded-full",
              "px-5 py-3",
              "bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
              "text-foreground font-medium text-sm",
              "hover:bg-background active:scale-95 transition-all duration-200"
            )}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Only mount the heavy popup when it's been opened at least once */}
      {searchOpen && (
        <Suspense fallback={null}>
          <AISearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      )}
    </>
  );
}
