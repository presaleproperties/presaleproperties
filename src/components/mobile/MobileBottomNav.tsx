import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Map, MessageCircle } from "lucide-react";
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

  const handleMapClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_map_search_click", {
        page_path: location.pathname,
      });
    }
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center gap-4 px-6 py-4 pb-6 pointer-events-auto">
          {/* Map Search Button - Primary/Center */}
          <Link
            to="/presale-projects?view=map"
            onClick={handleMapClick}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full",
              "bg-foreground text-background font-semibold",
              "shadow-lg active:scale-95 transition-all duration-150"
            )}
          >
            <Map className="h-5 w-5" />
            <span>Map Search</span>
          </Link>

          {/* Message Button - Right */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-full",
              "bg-green-500 text-white",
              "shadow-lg active:scale-95 transition-all duration-150"
            )}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search Popup */}
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
