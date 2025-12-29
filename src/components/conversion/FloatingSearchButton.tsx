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
      {/* Floating Search Button - Bottom Center with Glassmorphism */}
      <button
        onClick={() => setSearchOpen(true)}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 bg-background/70 backdrop-blur-xl border border-white/20 rounded-full shadow-lg hover:shadow-xl hover:bg-background/80 transition-all duration-300 hover:scale-105 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search</span>
      </button>

      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
