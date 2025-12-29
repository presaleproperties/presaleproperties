import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Phone } from "lucide-react";
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
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center gap-3 px-6 py-4 pb-6 pointer-events-auto">
          {/* Search Button - Glass style */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full",
              "bg-white/20 backdrop-blur-md border border-white/30",
              "text-foreground font-semibold",
              "shadow-lg active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>

          {/* WhatsApp Button - Glass style with phone in message bubble */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "relative flex items-center justify-center h-12 w-12 rounded-full",
              "bg-white/20 backdrop-blur-md border border-white/30",
              "shadow-lg active:scale-95 transition-all duration-150"
            )}
          >
            {/* Message bubble background */}
            <svg 
              viewBox="0 0 24 24" 
              className="h-7 w-7 text-green-500 fill-current"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            {/* Phone icon centered */}
            <Phone className="absolute h-3.5 w-3.5 text-white fill-white" />
          </button>
        </div>
      </div>

      {/* Search Popup */}
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
