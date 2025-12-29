import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPopup } from "@/components/conversion/SearchPopup";
import { supabase } from "@/integrations/supabase/client";

export function MobileBottomNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("16722581100");
  
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

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in presale properties. Can you help me?")}`;

  const handleSearchClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_search_click", {
        page_path: location.pathname,
      });
    }
    setSearchOpen(true);
  };

  const handleMessageClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_message_click", {
        page_path: location.pathname,
      });
    }
    window.open(whatsappLink, "_blank");
  };

  return (
    <>
      {/* Transparent Gradient Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
        {/* Gradient fade background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center gap-4 px-6 py-5 pb-7 pointer-events-auto">
          {/* Search Button - Primary Glass CTA */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2.5 px-8 py-3.5 rounded-full",
              "bg-white/25 backdrop-blur-xl",
              "border border-white/40",
              "text-white font-semibold text-base",
              "shadow-lg shadow-black/20",
              "active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>

          {/* WhatsApp Button - Glass Circle with Outline Logo */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center h-14 w-14 rounded-full",
              "bg-white/25 backdrop-blur-xl",
              "border border-white/40",
              "shadow-lg shadow-black/20",
              "active:scale-95 transition-all duration-150"
            )}
          >
            {/* WhatsApp Logo - Clean outline style */}
            <svg 
              viewBox="0 0 24 24" 
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Popup - Glass Style */}
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
