import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { SearchPopup } from "./SearchPopup";
import { supabase } from "@/integrations/supabase/client";

export function FloatingSearchButton() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");

  useEffect(() => {
    const fetchWhatsapp = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) setWhatsappNumber(data.value as string);
    };
    fetchWhatsapp();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
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

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in learning about presale projects. Can you help me?")}`;

  const handleWhatsAppClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_whatsapp_float", {
        page_path: window.location.pathname,
        source: "floating_button",
      });
    }
    window.open(whatsappLink, "_blank");
  };

  return (
    <>
      {/* Unified Floating Action Bar */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 md:gap-3 px-1.5 py-1.5 md:px-2 md:py-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-lg transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        {/* Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-foreground/70" />
          <span className="text-xs md:text-sm text-foreground/80">Search</span>
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
          aria-label="Chat on WhatsApp"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-3.5 w-3.5 md:h-4 md:w-4 text-foreground/70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
          </svg>
          <span className="text-xs md:text-sm text-foreground/80">WhatsApp</span>
        </button>
      </div>

      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
