import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AISearchPopup } from "@/components/search/AISearchPopup";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const CITIES = [
  { slug: "any", name: "Any City" },
  { slug: "Vancouver", name: "Vancouver" },
  { slug: "Surrey", name: "Surrey" },
];

const PROJECT_TYPES = [
  { value: "any", label: "Any Type" },
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "750000", label: "Under $750K" },
  { value: "1000000", label: "Under $1M" },
];

const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any Deposit" },
  { value: "5", label: "5% or Less" },
  { value: "10", label: "10% or Less" },
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

  // Fetch projects for counting
  const { data: allProjects = [] } = useQuery({
    queryKey: ["filter-projects-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, city, project_type, starting_price, deposit_percent")
        .eq("is_published", true);
      if (error) throw error;
      return data || [];
    },
  });

  const matchingCount = useMemo(() => {
    return allProjects.filter((project) => {
      if (filterCity !== "any" && project.city !== filterCity) return false;
      if (filterType !== "any" && project.project_type !== filterType) return false;
      if (filterPrice !== "any" && project.starting_price && project.starting_price > Number(filterPrice)) return false;
      if (filterDeposit !== "any" && project.deposit_percent && project.deposit_percent > Number(filterDeposit)) return false;
      return true;
    }).length;
  }, [allProjects, filterCity, filterType, filterPrice, filterDeposit]);
  
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

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in presale properties. Can you help me?")}`;

  const handleSearchClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_search_click", { page_path: location.pathname });
    }
    setSearchOpen(true);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (filterCity !== "any") params.set("city", filterCity);
    if (filterType !== "any") params.set("projectType", filterType);
    if (filterPrice !== "any") params.set("maxPrice", filterPrice);
    if (filterDeposit !== "any") params.set("depositPercent", filterDeposit);
    
    navigate(`/presale-projects${params.toString() ? `?${params.toString()}` : ""}`);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterCity("any");
    setFilterType("any");
    setFilterPrice("any");
    setFilterDeposit("any");
  };

  const handleMessageClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "mobile_message_click", { page_path: location.pathname });
    }
    window.open(whatsappLink, "_blank");
  };

  const hasActiveFilters = filterCity !== "any" || filterType !== "any" || filterPrice !== "any" || filterDeposit !== "any";

  const FilterRow = ({ 
    label, 
    options, 
    value, 
    onChange 
  }: { 
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              value === opt.value
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

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
        
        <div className="relative flex items-center justify-center gap-3 md:gap-4 px-6 py-5 pb-7 md:pb-8 pointer-events-auto">
          {/* WhatsApp Button */}
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center rounded-full",
              "h-12 w-12 md:h-14 md:w-14",
              "bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl",
              "hover:bg-white/25 active:scale-95 transition-all duration-150"
            )}
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          </button>

          {/* Search Button - Matching other icons style */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 rounded-full",
              "px-5 py-3 md:px-6 md:py-3.5",
              "bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl",
              "text-white font-medium",
              "text-sm md:text-base",
              "hover:bg-white/25 active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-4 w-4 md:h-5 md:w-5" />
            <span>Search</span>
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12 md:h-14 md:w-14",
              "bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl",
              "hover:bg-white/25 active:scale-95 transition-all duration-150"
            )}
            aria-label="Filter projects"
          >
            <SlidersHorizontal className="h-5 w-5 md:h-6 md:w-6 text-white" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full border-2 border-black/30 flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      <AISearchPopup open={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-6 pt-3">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="sr-only">
            <SheetTitle>Filter Projects</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-3">
            <FilterRow 
              label="City" 
              options={CITIES.map(c => ({ value: c.slug, label: c.name }))} 
              value={filterCity} 
              onChange={setFilterCity} 
            />
            <FilterRow 
              label="Type" 
              options={PROJECT_TYPES} 
              value={filterType} 
              onChange={setFilterType} 
            />
            <FilterRow 
              label="Price" 
              options={PRICE_RANGES} 
              value={filterPrice} 
              onChange={setFilterPrice} 
            />
            <FilterRow 
              label="Deposit" 
              options={DEPOSIT_OPTIONS} 
              value={filterDeposit} 
              onChange={setFilterDeposit} 
            />
          </div>

          <div className="flex gap-3 mt-5">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleResetFilters}>
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={handleApplyFilters}>
              View {matchingCount} Projects
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}