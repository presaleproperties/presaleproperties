import { useState } from "react";
import { Search } from "lucide-react";
import { SearchPopup } from "./SearchPopup";

export function FloatingSearchButton() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Floating Search Button - Bottom Center with Glassmorphism */}
      <button
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 bg-background/70 backdrop-blur-xl border border-white/20 rounded-full shadow-lg hover:shadow-xl hover:bg-background/80 transition-all duration-200 hover:scale-105"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search</span>
      </button>

      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
