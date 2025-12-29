import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPopup } from "@/components/conversion/SearchPopup";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CITIES = [
  { slug: "all", name: "All Metro Vancouver" },
  { slug: "vancouver", name: "Vancouver" },
  { slug: "surrey", name: "Surrey" },
  { slug: "langley", name: "Langley" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "delta", name: "Delta" },
  { slug: "richmond", name: "Richmond" },
  { slug: "abbotsford", name: "Abbotsford" },
];

interface MobileBottomNavProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export function MobileBottomNav({ selectedCity = "all", onCityChange }: MobileBottomNavProps) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("16722581100");
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;
  
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

  // Scroll detection for hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;
      
      // Only trigger if scroll difference exceeds threshold
      if (Math.abs(scrollDiff) > scrollThreshold) {
        if (scrollDiff > 0 && currentScrollY > 50) {
          // Scrolling down - hide
          setIsVisible(false);
        } else {
          // Scrolling up - show
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleLocationClick = () => {
    setLocationOpen(true);
  };

  const handleCitySelect = (slug: string) => {
    onCityChange?.(slug);
    setLocationOpen(false);
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
      {/* Transparent Gradient Bottom Bar - Hide on scroll */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        {/* Gradient fade background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center gap-2 px-6 py-4 pb-6 pointer-events-auto">
          {/* Location Button - Glass Circle */}
          <button
            onClick={handleLocationClick}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "shadow-lg",
              "active:scale-95 transition-all duration-150"
            )}
          >
            <MapPin className="h-4 w-4 text-foreground/80" />
          </button>

          {/* Search Button - Glass CTA */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "text-foreground/80 font-medium text-sm",
              "shadow-lg",
              "active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>

          {/* WhatsApp Button - Glass Circle */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "shadow-lg",
              "active:scale-95 transition-all duration-150"
            )}
          >
            {/* WhatsApp Logo - Clean outline style */}
            <svg 
              viewBox="0 0 24 24" 
              className="h-5 w-5 text-foreground/70"
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

      {/* Location Sheet */}
      <Sheet open={locationOpen} onOpenChange={setLocationOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-lg font-bold">Select Location</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 max-h-[50vh] overflow-y-auto pb-6">
            {CITIES.map((city) => (
              <button
                key={city.slug}
                onClick={() => handleCitySelect(city.slug)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  selectedCity === city.slug 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span className="font-medium text-sm">{city.name}</span>
                {selectedCity === city.slug && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
