import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPopup } from "@/components/conversion/SearchPopup";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useQuery } from "@tanstack/react-query";

const CITIES = [
  { slug: "any", name: "All" },
  { slug: "Vancouver", name: "Vancouver" },
  { slug: "Surrey", name: "Surrey" },
];

const PROJECT_TYPES = [
  { value: "any", label: "All" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Towns" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any" },
  { value: "750000", label: "Under $750K" },
  { value: "1000000", label: "Under $1M" },
];

const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "5", label: "5% or less" },
  { value: "10", label: "10% or less" },
];

const YEAR_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "2025", label: "2025" },
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

  // Fetch all published projects for counting
  const { data: allProjects = [] } = useQuery({
    queryKey: ["filter-projects-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, city, project_type, starting_price, deposit_percent, completion_year")
        .eq("is_published", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate matching count based on current filters
  const matchingCount = useMemo(() => {
    return allProjects.filter((project) => {
      if (filterCity !== "any" && project.city !== filterCity) return false;
      if (filterType !== "any" && project.project_type !== filterType) return false;
      if (filterPrice !== "any" && project.starting_price && project.starting_price > Number(filterPrice)) return false;
      if (filterDeposit !== "any" && project.deposit_percent && project.deposit_percent > Number(filterDeposit)) return false;
      if (filterYear !== "any") {
        if (filterYear === "2027") {
          if (project.completion_year && project.completion_year < 2027) return false;
        } else {
          if (project.completion_year && project.completion_year !== Number(filterYear)) return false;
        }
      }
      return true;
    }).length;
  }, [allProjects, filterCity, filterType, filterPrice, filterDeposit, filterYear]);
  
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

  const FilterChip = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        selected
          ? "bg-foreground text-background"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );

  return (
    <>
      {/* Transparent Gradient Bottom Bar */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 pointer-events-none",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        
        <div className="relative flex items-center justify-center gap-2 md:gap-3 lg:gap-4 px-6 py-4 pb-6 md:pb-8 pointer-events-auto">
          {/* WhatsApp Button */}
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

          {/* Search Button */}
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

          {/* Filter Button */}
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

      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Modern Filter Drawer */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-background border-t border-border/50 rounded-t-[20px] max-h-[85vh]">
          <DrawerTitle className="sr-only">Filter Projects</DrawerTitle>
          
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="px-5 pb-6 pt-2">
            {/* Header with close and reset */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setFilterOpen(false)}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <h2 className="text-base font-semibold">Filters</h2>
              <button
                onClick={handleResetFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Filters in compact grid */}
            <div className="space-y-4">
              {/* City */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  City
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <FilterChip
                      key={city.slug}
                      selected={filterCity === city.slug}
                      onClick={() => setFilterCity(city.slug)}
                    >
                      {city.name}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <FilterChip
                      key={type.value}
                      selected={filterType === type.value}
                      onClick={() => setFilterType(type.value)}
                    >
                      {type.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Price & Deposit Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Price
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_RANGES.map((price) => (
                      <FilterChip
                        key={price.value}
                        selected={filterPrice === price.value}
                        onClick={() => setFilterPrice(price.value)}
                      >
                        {price.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Deposit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEPOSIT_OPTIONS.map((deposit) => (
                      <FilterChip
                        key={deposit.value}
                        selected={filterDeposit === deposit.value}
                        onClick={() => setFilterDeposit(deposit.value)}
                      >
                        {deposit.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Completion Year
                </label>
                <div className="flex flex-wrap gap-2">
                  {YEAR_OPTIONS.map((year) => (
                    <FilterChip
                      key={year.value}
                      selected={filterYear === year.value}
                      onClick={() => setFilterYear(year.value)}
                    >
                      {year.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button with count */}
            <button
              onClick={handleApplyFilters}
              className={cn(
                "w-full mt-6 py-3.5 rounded-xl font-semibold text-base transition-all",
                "bg-foreground text-background",
                "active:scale-[0.98]"
              )}
            >
              Show {matchingCount} {matchingCount === 1 ? "Project" : "Projects"}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}