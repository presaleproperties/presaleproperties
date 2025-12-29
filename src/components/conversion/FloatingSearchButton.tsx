import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { SearchPopup } from "./SearchPopup";

export function FloatingSearchButton() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Floating Search Button - All devices, responsive sizing */}
      <button
        onClick={() => setSearchOpen(true)}
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 hover:scale-105 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-foreground/70" />
        <span className="text-xs md:text-sm text-foreground/80">Search</span>
      </button>

      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
