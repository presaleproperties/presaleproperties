import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useLocation, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, Map, LayoutGrid, Flame, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { FloatingBottomNav } from "@/components/mobile/FloatingBottomNav";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";

// Lazy load map component
const ProjectsMap = lazy(() => import("@/components/projects/ProjectsMap").then(m => ({ default: m.ProjectsMap })));

const ITEMS_PER_PAGE = 16;

const CITIES = [
  "Vancouver", 
  "Burnaby", 
  "Richmond", 
  "Surrey", 
  "Coquitlam", 
  "Port Coquitlam",
  "Port Moody",
  "North Vancouver", 
  "West Vancouver",
  "Langley",
  "Langley Township",
  "Delta",
  "Abbotsford",
  "Chilliwack",
  "Maple Ridge",
  "New Westminster",
  "White Rock"
];
const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
  { value: "mixed", label: "Mixed" },
];
const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-700000", label: "Under $700K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-900000", label: "Under $900K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];
const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any Deposit" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "15", label: "15%" },
  { value: "20", label: "20%" },
  { value: "25", label: "25%+" },
];
const COMPLETION_YEAR_OPTIONS = [
  { value: "any", label: "Any Year" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028+" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "verified", label: "Recently Verified" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "deposit-asc", label: "Lowest Deposit" },
  { value: "completion", label: "Completion Soonest" },
  { value: "investor", label: "Most Investor-Friendly" },
];

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  completion_year: number | null;
  starting_price: number | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  is_featured: boolean;
  last_verified_date: string | null;
  deposit_percent: number | null;
  assignment_allowed: string | null;
  near_skytrain: boolean | null;
  rental_restrictions: string | null;
  incentives_available: boolean | null;
  map_lat: number | null;
  map_lng: number | null;
};

// Presale/Move-In Ready Toggle Component
function PresaleToggle() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full">
      <button
        className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-foreground text-background shadow-sm"
      >
        Presale
      </button>
      <button
        onClick={() => navigate("/resale")}
        className="px-4 py-2 rounded-full text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
      >
        Move-In Ready
      </button>
    </div>
  );
}

export default function PresaleProjects() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Get filter values from URL params
  const filters = {
    city: searchParams.get("city") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    depositPercent: searchParams.get("deposit") || "any",
    completionYear: searchParams.get("year") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Featured/Hot projects query
  const { data: hotProjects } = useQuery({
    queryKey: ["hot-projects-carousel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, view_count")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["presale-projects", filters, currentPage],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      // Apply filters to count query
      if (filters.city !== "any") {
        countQuery = countQuery.eq("city", filters.city);
      }
      if (filters.projectType !== "any") {
        countQuery = countQuery.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("starting_price", min).lte("starting_price", max);
      }
      if (filters.depositPercent !== "any") {
        const depositVal = parseInt(filters.depositPercent);
        countQuery = countQuery.lte("deposit_percent", depositVal);
      }
      if (filters.completionYear !== "any") {
        const yearVal = parseInt(filters.completionYear);
        if (yearVal >= 2028) {
          countQuery = countQuery.gte("completion_year", 2028);
        } else {
          countQuery = countQuery.eq("completion_year", yearVal);
        }
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured, last_verified_date, deposit_percent, assignment_allowed, near_skytrain, rental_restrictions, incentives_available, map_lat, map_lng")
        .eq("is_published", true);

      // Apply filters
      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }
      if (filters.depositPercent !== "any") {
        const depositVal = parseInt(filters.depositPercent);
        query = query.lte("deposit_percent", depositVal);
      }
      if (filters.completionYear !== "any") {
        const yearVal = parseInt(filters.completionYear);
        if (yearVal >= 2028) {
          query = query.gte("completion_year", 2028);
        } else {
          query = query.eq("completion_year", yearVal);
        }
      }

      // Apply sorting
      switch (filters.sort) {
        case "price-asc":
          query = query.order("starting_price", { ascending: true, nullsFirst: false });
          break;
        case "price-desc":
          query = query.order("starting_price", { ascending: false, nullsFirst: false });
          break;
        case "completion":
          query = query.order("completion_year", { ascending: true }).order("completion_month", { ascending: true });
          break;
        case "verified":
          query = query.order("last_verified_date", { ascending: false, nullsFirst: false });
          break;
        case "deposit-asc":
          query = query.order("deposit_percent", { ascending: true, nullsFirst: false });
          break;
        case "investor":
          query = query
            .order("deposit_percent", { ascending: true, nullsFirst: false })
            .order("starting_price", { ascending: true, nullsFirst: false });
          break;
        default:
          query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: projectsData, error } = await query;
      if (error) throw error;

      return { projects: projectsData as Project[], totalCount: count || 0 };
    },
  });

  const projects = data?.projects || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter by search query client-side
  const filteredProjects = useMemo(() => {
    if (!projects || !searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset to page 1 when filters change
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["presale-projects"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.city !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
    filters.depositPercent !== "any",
    filters.completionYear !== "any",
  ].filter(Boolean).length;

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Coming Soon</Badge>;
      case "registering":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Registering</Badge>;
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Selling Now</Badge>;
      case "sold_out":
        return <Badge variant="secondary">Sold Out</Badge>;
      default:
        return null;
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };

  const FilterControls = () => (
    <div className="space-y-4">
      {/* City */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">City</label>
        <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All Cities</SelectItem>
            {CITIES.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Project Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Project Type</label>
        <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Starting Price</label>
        <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deposit Percentage */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Deposit %</label>
        <Select value={filters.depositPercent} onValueChange={(v) => updateFilter("deposit", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Deposit" />
          </SelectTrigger>
          <SelectContent>
            {DEPOSIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Completion Year */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Completion Year</label>
        <Select value={filters.completionYear} onValueChange={(v) => updateFilter("year", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Year" />
          </SelectTrigger>
          <SelectContent>
            {COMPLETION_YEAR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | "...")[] = [];
      
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        
        if (currentPage > 3) pages.push("...");
        
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) pages.push(i);
        
        if (currentPage < totalPages - 2) pages.push("...");
        
        pages.push(totalPages);
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) => (
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="min-w-[36px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[16/11] w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Dynamic SEO based on filters
  const canonicalUrl = `https://presaleproperties.com${location.pathname}${location.search}`;
  
  const getSeoTitle = () => {
    const parts: string[] = [];
    
    if (filters.projectType !== "any") {
      const typeLabel = filters.projectType === "condo" ? "Presale Condos" : 
                        filters.projectType === "townhome" ? "Presale Townhomes" : "New Developments";
      parts.push(typeLabel);
    } else {
      parts.push("Presale Projects");
    }
    
    if (filters.city !== "any") {
      parts.push(`in ${filters.city}`);
    } else {
      parts.push("in Metro Vancouver");
    }
    
    
    return `${parts.join(" ")} | New Construction Homes | PresaleProperties.com`;
  };

  const getSeoDescription = () => {
    const cityText = filters.city !== "any" ? filters.city : "Vancouver, Surrey, Langley, Coquitlam, Burnaby, Delta & Abbotsford";
    const typeText = filters.projectType === "condo" ? "presale condos" : 
                     filters.projectType === "townhome" ? "presale townhomes" : 
                     "new construction condos, townhomes & homes";
    
    return `Browse ${totalCount}+ ${typeText} in ${cityText}. View floor plans, VIP pricing, deposit structures & register for early access to the best pre-construction developments.`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": getSeoTitle(),
    "description": getSeoDescription(),
    "url": canonicalUrl,
    "numberOfItems": totalCount,
    "itemListElement": filteredProjects?.slice(0, 10).map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": project.name,
        "url": `https://presaleproperties.com/presale-projects/${project.slug}`,
        "image": project.featured_image,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": project.city,
          "addressRegion": "BC",
          "addressCountry": "CA"
        }
      }
    })) || []
  };

  return (
    <>
      <Helmet>
        <title>{getSeoTitle()}</title>
        <meta name="title" content={getSeoTitle()} />
        <meta name="description" content={getSeoDescription()} />
        <meta name="keywords" content={`presale ${filters.city !== "any" ? filters.city : "Vancouver Surrey Langley Coquitlam Burnaby Delta Abbotsford"}, new construction condos, presale townhomes, pre-construction homes, VIP presale pricing, floor plans, Metro Vancouver real estate`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={getSeoTitle()} />
        <meta property="og:description" content={getSeoDescription()} />
        <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta property="og:locale" content="en_CA" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={getSeoTitle()} />
        <meta name="twitter:description" content={getSeoDescription()} />
        <meta name="twitter:image" content="https://presaleproperties.com/og-image.png" />
        
        {/* Geo */}
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={filters.city !== "any" ? filters.city : "Metro Vancouver"} />
        <meta name="author" content="PresaleProperties.com" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
        <ConversionHeader />
        
        {/* Compact Hero Section */}
        <section className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
          <div className="px-3 lg:container lg:px-4 pt-3 pb-4 md:pt-4 md:pb-6">
            {/* Breadcrumb - Single Line */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Presale Projects</span>
              {filters.city !== "any" && (
                <>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{filters.city}</span>
                </>
              )}
            </nav>

            {/* Title Row - Title left, Toggle right */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {filters.city !== "any" 
                    ? `Presale Projects in ${filters.city}` 
                    : "Pre-Construction New Homes"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{totalCount}</span> projects available
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="ml-2 text-primary hover:underline">
                      Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                    </button>
                  )}
                </p>
              </div>
              <PresaleToggle />
            </div>
            
            {/* City Filter Chips - Compact */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => updateFilter("city", "any")}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.city === "any"
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  All Cities
                </button>
                {["Surrey", "Langley", "Coquitlam", "Burnaby", "Vancouver", "Richmond", "Delta", "Abbotsford"].map((city) => (
                  <button
                    key={city}
                    onClick={() => updateFilter("city", city)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.city === city
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Hot Projects Carousel - only show when no filters active */}
        {activeFilterCount === 0 && hotProjects && hotProjects.length > 0 && (
          <ScrollReveal animation="fade-up">
            <section className="py-6 md:py-8 bg-muted/30 border-b border-border">
              <div className="container px-4">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Hottest Projects Right Now
                  </h2>
                </div>
                <div 
                  className="-mx-4 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '16px' }}
                >
                  <div className="flex gap-3 md:gap-4 pb-2">
                    {hotProjects.map((project, index) => (
                      <div 
                        key={project.id} 
                        className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] animate-fade-in"
                        style={{ 
                          scrollSnapAlign: 'start',
                          animationDelay: `${index * 75}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <PresaleProjectCard
                          id={project.id}
                          slug={project.slug}
                          name={project.name}
                          city={project.city}
                          neighborhood={project.neighborhood}
                          projectType={project.project_type}
                          status={project.status}
                          completionYear={project.completion_year}
                          startingPrice={project.starting_price}
                          featuredImage={project.featured_image}
                          galleryImages={project.gallery_images}
                          size="default"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        <main className="container px-4 py-4 md:py-8">

          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project, neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Map Button */}
              <Button 
                variant="outline" 
                className="h-10 px-3"
                onClick={() => window.location.href = '/map-search'}
              >
                <Map className="h-4 w-4 mr-2" />
                <span className="text-sm">Map</span>
              </Button>
              {/* Mobile Filters */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden relative h-10 px-3">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <span className="text-sm">Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterControls />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="w-[140px] sm:w-[180px] h-10 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-10 px-3"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-10 px-3"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              {filters.city !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {filters.city}
                  <button onClick={() => updateFilter("city", "any")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.projectType !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {TYPE_OPTIONS.find((t) => t.value === filters.projectType)?.label}
                  <button onClick={() => updateFilter("type", "any")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.priceRange !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {PRICE_RANGES.find((p) => p.value === filters.priceRange)?.label}
                  <button onClick={() => updateFilter("price", "any")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Sidebar Filters */}
            <aside aria-label="Project filters" className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-6 bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-4">Filter Projects</h3>
                <FilterControls />
              </div>
            </aside>

            {/* Main Content */}
            <section aria-label="Project listings" className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 md:py-20">
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">No projects found</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : viewMode === "map" ? (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} on map
                  </p>
                  <Suspense fallback={
                    <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                        <p>Loading map...</p>
                      </div>
                    </div>
                  }>
                    <div className="relative">
                      <ProjectsMap projects={filteredProjects} isLoading={isLoading} />
                    </div>
                  </Suspense>
                </>
              ) : (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {filteredProjects.map((project) => (
                      <PresaleProjectCard
                        key={project.id}
                        id={project.id}
                        slug={project.slug}
                        name={project.name}
                        city={project.city}
                        neighborhood={project.neighborhood}
                        projectType={project.project_type}
                        status={project.status}
                        completionYear={project.completion_year}
                        startingPrice={project.starting_price}
                        featuredImage={project.featured_image}
                        galleryImages={project.gallery_images}
                        size="large"
                      />
                    ))}
                  </div>

                  <PaginationControls />
                </>
              )}
            </section>
          </div>
        </main>

        {/* Map Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Explore on Map</h2>
              <p className="text-muted-foreground">Find presale projects near you</p>
            </div>
            <Suspense fallback={
              <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                  <p>Loading map...</p>
                </div>
              </div>
            }>
              <div className="rounded-xl overflow-hidden border border-border">
                <ProjectsMap projects={filteredProjects} isLoading={isLoading} />
              </div>
            </Suspense>
            <div className="text-center mt-4">
              <Link to="/map-search">
                <Button variant="outline" className="gap-2">
                  <Map className="h-4 w-4" />
                  Open Full Map Search
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ScrollReveal animation="fade-up">
          <NewConstructionBenefits />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        <Footer />
        <FloatingBottomNav />
      </PullToRefresh>
    </>
  );
}
