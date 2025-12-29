import { useState, useEffect, useRef, useMemo } from "react";
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
  { value: "750000", label: "<$750K" },
  { value: "1000000", label: "<$1M" },
];

const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "5", label: "≤5%" },
  { value: "10", label: "≤10%" },
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

  const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </button>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        
        <div className="relative flex items-center justify-center gap-2 md:gap-3 lg:gap-4 px-6 py-4 pb-6 md:pb-8 pointer-events-auto">
          <button
            onClick={handleMessageClick}
            className={cn(
              "flex items-center justify-center rounded-full",
              "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14",
              "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg",
              "hover:bg-white/20 active:scale-95 transition-all duration-150"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-foreground/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          </button>

          <button
            onClick={handleSearchClick}
            className={cn(
              "flex items-center gap-2 md:gap-2.5 rounded-full",
              "px-4 py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3.5",
              "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg",
              "text-foreground/80 font-medium text-sm md:text-base lg:text-lg",
              "hover:bg-white/20 active:scale-95 transition-all duration-150"
            )}
          >
            <Search className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14",
              "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg",
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

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-4">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-sm font-semibold text-center">Filter Projects</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5 block">City</span>
              <div className="flex flex-wrap gap-1">
                {CITIES.map((c) => <Chip key={c.slug} selected={filterCity === c.slug} onClick={() => setFilterCity(c.slug)}>{c.name}</Chip>)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5 block">Type</span>
              <div className="flex flex-wrap gap-1">
                {PROJECT_TYPES.map((t) => <Chip key={t.value} selected={filterType === t.value} onClick={() => setFilterType(t.value)}>{t.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5 block">Price</span>
              <div className="flex flex-wrap gap-1">
                {PRICE_RANGES.map((p) => <Chip key={p.value} selected={filterPrice === p.value} onClick={() => setFilterPrice(p.value)}>{p.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5 block">Deposit</span>
              <div className="flex flex-wrap gap-1">
                {DEPOSIT_OPTIONS.map((d) => <Chip key={d.value} selected={filterDeposit === d.value} onClick={() => setFilterDeposit(d.value)}>{d.label}</Chip>)}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleResetFilters}>Reset</Button>
            <Button size="sm" className="flex-1" onClick={handleApplyFilters}>
              Show {matchingCount} Projects
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}