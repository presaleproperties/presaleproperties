import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPopup } from "@/components/conversion/SearchPopup";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const CITIES = [
  { slug: "any", name: "All Cities" },
  { slug: "Vancouver", name: "Vancouver" },
  { slug: "Surrey", name: "Surrey" },
  { slug: "Langley", name: "Langley" },
  { slug: "Coquitlam", name: "Coquitlam" },
  { slug: "Burnaby", name: "Burnaby" },
  { slug: "Delta", name: "Delta" },
  { slug: "Richmond", name: "Richmond" },
  { slug: "Abbotsford", name: "Abbotsford" },
];

const PROJECT_TYPES = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
  { value: "mixed", label: "Mixed" },
  { value: "duplex", label: "Duplexes" },
  { value: "single_family", label: "Single Family" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "500000", label: "Under $500K" },
  { value: "750000", label: "Under $750K" },
  { value: "1000000", label: "Under $1M" },
  { value: "1500000", label: "Under $1.5M" },
];

const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any Deposit" },
  { value: "5", label: "Up to 5%" },
  { value: "10", label: "Up to 10%" },
  { value: "15", label: "Up to 15%" },
  { value: "20", label: "Up to 20%" },
];

const YEAR_OPTIONS = [
  { value: "any", label: "Any Year" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027+" },
];

interface FloatingBottomNavProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export function FloatingBottomNav({ selectedCity = "any", onCityChange }: FloatingBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("16722581100");
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  // Filter state
  const [filterCity, setFilterCity] = useState("any");
  const [filterType, setFilterType] = useState("any");
  const [filterPrice, setFilterPrice] = useState("any");
  const [filterDeposit, setFilterDeposit] = useState("any");
  const [filterYear, setFilterYear] = useState("any");
  
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

  const handleFilterClick = () => {
    setFilterOpen(true);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (filterCity !== "any") params.set("city", filterCity);
    if (filterType !== "any") params.set("projectType", filterType);
    if (filterPrice !== "any") params.set("maxPrice", filterPrice);
    if (filterDeposit !== "any") params.set("depositPercent", filterDeposit);
    if (filterYear !== "any") params.set("completionYear", filterYear);
    
    navigate(`/presale-projects${params.toString() ? `?${params.toString()}` : ""}`);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterCity("any");
    setFilterType("any");
    setFilterPrice("any");
    setFilterDeposit("any");
    setFilterYear("any");
  };

  const handleMessageClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_message_click", {
        page_path: location.pathname,
      });
    }
    window.open(whatsappLink, "_blank");
  };

  const hasActiveFilters = filterCity !== "any" || filterType !== "any" || filterPrice !== "any" || filterDeposit !== "any" || filterYear !== "any";

  return (
    <>
      {/* Transparent Gradient Bottom Bar - Visible on all devices, hide on scroll */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        {/* Gradient fade background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        
        {/* Button container - responsive sizing */}
        <div className="relative flex items-center justify-center gap-2 md:gap-3 lg:gap-4 px-6 py-4 pb-6 md:pb-8 pointer-events-auto">
          {/* WhatsApp Button - Glass Circle (LEFT) */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center rounded-full",
              "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "shadow-lg",
              "hover:bg-white/20 active:scale-95 transition-all duration-150"
            )}
          >
            {/* WhatsApp Logo - Clean outline style */}
            <svg 
              viewBox="0 0 24 24" 
              className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-foreground/70"
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

          {/* Search Button - Glass CTA (CENTER) */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 md:gap-2.5 rounded-full",
              "px-4 py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3.5",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "text-foreground/80 font-medium text-sm md:text-base lg:text-lg",
              "shadow-lg",
              "hover:bg-white/20 active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            <span>Search</span>
          </button>

          {/* Filter Button - Glass Circle (RIGHT) */}
          <button
            onClick={handleFilterClick}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/20",
              "shadow-lg",
              "hover:bg-white/20 active:scale-95 transition-all duration-150"
            )}
          >
            <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-foreground/80" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
            )}
          </button>
        </div>
      </div>

      {/* Search Popup - Glass Style */}
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-lg font-bold">Filter Projects</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-5 pb-6">
            {/* City */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">City</label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((city) => (
                  <button
                    key={city.slug}
                    onClick={() => setFilterCity(city.slug)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      filterCity === city.slug
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Project Type</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      filterType === type.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Price */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Starting Price</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((price) => (
                  <button
                    key={price.value}
                    onClick={() => setFilterPrice(price.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      filterPrice === price.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {price.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposit */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Deposit</label>
              <div className="flex flex-wrap gap-2">
                {DEPOSIT_OPTIONS.map((deposit) => (
                  <button
                    key={deposit.value}
                    onClick={() => setFilterDeposit(deposit.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      filterDeposit === deposit.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {deposit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Completion Year</label>
              <div className="flex flex-wrap gap-2">
                {YEAR_OPTIONS.map((year) => (
                  <button
                    key={year.value}
                    onClick={() => setFilterYear(year.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      filterYear === year.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {year.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
