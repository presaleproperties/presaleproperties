import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Search, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { AISearchPopup } from "@/components/search/AISearchPopup";

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

  const handleCallClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_call_click", { page_path: location.pathname });
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}
      >
        {/* Subtle gradient for visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/45 to-transparent" />

        <div className="relative flex items-center justify-center gap-2 px-4 py-3 pointer-events-auto">
          {/* Primary: Book a Call */}
          <a
            href="tel:6722581100"
            onClick={handleCallClick}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full flex-1 max-w-[180px]",
              "h-12 px-5",
              "bg-primary text-primary-foreground font-semibold text-sm shadow-lg",
              "active:scale-95 transition-transform duration-150"
            )}
          >
            <Phone className="h-4 w-4" />
            <span>Book a Call</span>
          </a>

          {/* Secondary: Search */}
          <button
            onClick={handleSearchClick}
            aria-label="Search"
            className={cn(
              "flex items-center justify-center rounded-full",
              "h-12 w-12 shrink-0",
              "bg-background/95 backdrop-blur-md border border-border shadow-lg",
              "text-foreground",
              "active:scale-95 transition-transform duration-150"
            )}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AISearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
