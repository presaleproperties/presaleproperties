import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
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

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        {/* Enhanced gradient for better visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        <div className="relative flex items-center justify-center px-6 py-5 pb-7 md:pb-8 pointer-events-auto">
          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 rounded-full",
              "px-6 py-3.5",
              "bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl",
              "text-white font-medium text-sm",
              "hover:bg-white/25 active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      <AISearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}