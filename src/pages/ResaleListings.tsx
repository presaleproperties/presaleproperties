import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
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
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { RelatedContent } from "@/components/home/RelatedContent";
import { useEnabledCities } from "@/hooks/useEnabledCities";

// Lazy load map component
const ResaleListingsMap = lazy(() => import("@/components/map/ResaleListingsMap").then(m => ({ default: m.ResaleListingsMap })));

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
  "Delta",
  "Abbotsford",
  "New Westminster",
  "White Rock"
];

const PROPERTY_TYPES = [
  { value: "any", label: "All Types" },
  { value: "Apartment/Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "House", label: "House" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];

const BEDS_OPTIONS = [
  { value: "any", label: "Any Beds" },
  { value: "1", label: "1+ Bed" },
  { value: "2", label: "2+ Beds" },
  { value: "3", label: "3+ Beds" },
  { value: "4", label: "4+ Beds" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

type MLSListing = {
  id: string;
  listing_id: string;
  listing_key: string;
  listing_price: number;
  mls_status: string;
  property_type: string;
  property_sub_type: string | null;
  city: string;
  neighborhood: string | null;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any | null;
  days_on_market: number | null;
  list_date: string | null;
  list_agent_name: string | null;
  list_office_name: string | null;
  virtual_tour_url: string | null;
  year_built: number | null;
  created_at: string | null;
};

// Presale/Move-In Ready Toggle Component
function ListingTypeToggle() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full shrink-0">
      <button
        onClick={() => navigate("/presale-projects")}
        className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-background/50"
      >
        Presale
      </button>
      <button
        className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all bg-foreground text-background shadow-sm cursor-default"
      >
        Move-In Ready
      </button>
    </div>
  );
}

export default function ResaleListings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  
  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  const filters = {
    city: searchParams.get("city") || "any",
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Metro Vancouver cities - exclude Vancouver Island cities like Langford
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
    "Pitt Meadows", "Tsawwassen", "Ladner"
  ];

  // Featured/Hot listings query - newest 2025+ listings
  const { data: hotListings } = useQuery({
    queryKey: ["hot-resale-listings-2025", enabledCities],
    queryFn: async () => {
      const citiesToUse = enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities;
      
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, list_agent_name, list_office_name, virtual_tour_url, year_built, created_at")
        .eq("mls_status", "Active")
        .in("city", citiesToUse)
        .gte("year_built", 2024)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as MLSListing[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["resale-listings-2025", filters, currentPage, enabledCities],
    queryFn: async () => {
      const citiesToUse = enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities;
      
      const buildFilters = (query: any) => {
        // Always filter by enabled cities when no specific city is selected
        if (filters.city === "any") {
          query = query.in("city", citiesToUse);
        } else {
          query = query.eq("city", filters.city);
        }
        if (filters.propertyType !== "any") {
          query = query.or(`property_type.ilike.%${filters.propertyType}%,property_sub_type.ilike.%${filters.propertyType}%`);
        }
        if (filters.priceRange !== "any") {
          const [min, max] = filters.priceRange.split("-").map(Number);
          query = query.gte("listing_price", min).lte("listing_price", max);
        }
        if (filters.beds !== "any") {
          query = query.gte("bedrooms_total", parseInt(filters.beds));
        }
        return query;
      };

      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .gte("year_built", 2024);
      countQuery = buildFilters(countQuery);
      const { count } = await countQuery;

      let query = supabase
        .from("mls_listings")
        .select("id, listing_id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, days_on_market, list_date, list_agent_name, list_office_name, virtual_tour_url, year_built, created_at")
        .eq("mls_status", "Active")
        .gte("year_built", 2024);
      query = buildFilters(query);

      switch (filters.sort) {
        case "price-asc":
          query = query.order("listing_price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("listing_price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: listingsData, error } = await query;
      if (error) throw error;

      return { listings: listingsData as MLSListing[], totalCount: count || 0 };
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const listings = data?.listings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const filteredListings = useMemo(() => {
    if (!listings || !searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (l) =>
        l.city?.toLowerCase().includes(q) ||
        l.neighborhood?.toLowerCase().includes(q) ||
        l.street_name?.toLowerCase().includes(q) ||
        l.unparsed_address?.toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
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
    await queryClient.invalidateQueries({ queryKey: ["resale-listings"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.city !== "any",
    filters.propertyType !== "any",
    filters.priceRange !== "any",
    filters.beds !== "any",
  ].filter(Boolean).length;

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  const FilterControls = () => (
    <div className="space-y-4">
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

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Property Type</label>
        <Select value={filters.propertyType} onValueChange={(v) => updateFilter("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Price Range</label>
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

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Bedrooms</label>
        <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Beds" />
          </SelectTrigger>
          <SelectContent>
            {BEDS_OPTIONS.map((opt) => (
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

  // Dynamic SEO
  const canonicalUrl = `https://presaleproperties.com${location.pathname}${location.search}`;
  
  const getSeoTitle = () => {
    const parts: string[] = [];
    
    if (filters.propertyType !== "any") {
      const typeLabel = filters.propertyType === "Apartment/Condo" ? "Condos" : 
                        filters.propertyType === "Townhouse" ? "Townhouses" : "Homes";
      parts.push(typeLabel);
    } else {
      parts.push("Homes");
    }
    
    parts.push("for Sale");
    
    if (filters.city !== "any") {
      parts.push(`in ${filters.city}`);
    } else {
      parts.push("in Metro Vancouver");
    }
    
    return `${parts.join(" ")} | MLS Listings | PresaleProperties.com`;
  };

  const getSeoDescription = () => {
    const cityText = filters.city !== "any" ? filters.city : "Vancouver, Surrey, Burnaby, Coquitlam & more";
    const typeText = filters.propertyType === "Apartment/Condo" ? "condos" : 
                     filters.propertyType === "Townhouse" ? "townhouses" : 
                     "homes, condos & townhouses";
    
    return `Browse ${totalCount.toLocaleString()}+ ${typeText} for sale in ${cityText}. View MLS listings with photos, prices & details.`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": getSeoTitle(),
    "description": getSeoDescription(),
    "url": canonicalUrl,
    "numberOfItems": totalCount,
    "itemListElement": filteredListings?.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": getAddress(listing),
        "url": `https://presaleproperties.com/resale/${listing.listing_key}`,
        "offers": {
          "@type": "Offer",
          "price": listing.listing_price,
          "priceCurrency": "CAD"
        }
      }
    })) || []
  };

  return (
    <>
      <Helmet>
        <title>{getSeoTitle()}</title>
        <meta name="description" content={getSeoDescription()} />
        <meta name="keywords" content={`${filters.city !== "any" ? filters.city : "Vancouver Surrey Burnaby Coquitlam Langley"} real estate, homes for sale, condos, townhouses, MLS listings, Metro Vancouver`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={getSeoTitle()} />
        <meta property="og:description" content={getSeoDescription()} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PresaleProperties.com" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getSeoTitle()} />
        <meta name="twitter:description" content={getSeoDescription()} />
        
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={filters.city !== "any" ? filters.city : "Metro Vancouver"} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
        <ConversionHeader />
        
        <section className="bg-background border-b border-border py-4 sm:py-8 md:py-12">
          <div className="container px-4">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
              <Link to="/" className="hover:text-foreground transition-colors shrink-0">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
              <Link to="/resale" className="hover:text-foreground transition-colors shrink-0">
                Move-In Ready
              </Link>
              {filters.city !== "any" && (
                <>
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground font-medium shrink-0">{filters.city}</span>
                </>
              )}
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="max-w-3xl">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
                  {filters.city !== "any" 
                    ? `Move-In Ready Homes in ${filters.city}` 
                    : "Move-In Ready New Homes"}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>
                  <span>active listings</span>
                  {activeFilterCount > 0 && (
                    <>
                      <span className="text-border">•</span>
                      <button 
                        onClick={clearAllFilters}
                        className="text-primary hover:underline"
                      >
                        Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                      </button>
                    </>
                  )}
                </p>
              </div>
              <ListingTypeToggle />
            </div>
            
            {/* Quick City Filter Chips */}
            <div className="mt-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => updateFilter("city", "any")}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.city === "any"
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  All Cities
                </button>
                {["Vancouver", "Surrey", "Burnaby", "Coquitlam", "Richmond", "Langley", "Delta", "Abbotsford"].map((city) => (
                  <button
                    key={city}
                    onClick={() => updateFilter("city", city)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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

        {/* Hot Listings Carousel - only show when no filters active */}
        {activeFilterCount === 0 && hotListings && hotListings.length > 0 && (
          <ScrollReveal animation="fade-up">
            <section className="py-6 md:py-8 bg-muted/30 border-b border-border">
              <div className="container px-4">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    Newest Listings
                  </h2>
                </div>
                <div 
                  className="-mx-4 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '16px' }}
                >
                  <div className="flex gap-3 md:gap-4 pb-2">
                    {hotListings.map((listing, index) => (
                      <div 
                        key={listing.id} 
                        className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] animate-fade-in"
                        style={{ 
                          scrollSnapAlign: 'start',
                          animationDelay: `${index * 75}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <ResaleListingCard
                          id={listing.id}
                          listingKey={listing.listing_key}
                          price={listing.listing_price}
                          address={getAddress(listing)}
                          city={listing.city}
                          neighborhood={listing.neighborhood}
                          propertyType={listing.property_type}
                          propertySubType={listing.property_sub_type}
                          beds={listing.bedrooms_total}
                          baths={listing.bathrooms_total}
                          sqft={listing.living_area}
                          photos={Array.isArray(listing.photos) ? listing.photos : []}
                          daysOnMarket={listing.days_on_market}
                          status={listing.mls_status}
                          listAgentName={listing.list_agent_name}
                          listOfficeName={listing.list_office_name}
                          virtualTourUrl={listing.virtual_tour_url}
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
                placeholder="Search by city, neighborhood, address..."
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
                onClick={() => navigate('/map-search?mode=resale')}
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
              {filters.propertyType !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.label}
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
              {filters.beds !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {BEDS_OPTIONS.find((b) => b.value === filters.beds)?.label}
                  <button onClick={() => updateFilter("beds", "any")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-6 bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-4">Filter Listings</h3>
                <FilterControls />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 md:py-20">
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">No listings found</h2>
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
                    Showing {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} on map
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
                      <div className="h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-border">
                        <ResaleListingsMap listings={filteredListings} />
                      </div>
                    </div>
                  </Suspense>
                </>
              ) : (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    Showing {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {filteredListings.map((listing) => (
                      <ResaleListingCard
                        key={listing.id}
                        id={listing.id}
                        listingKey={listing.listing_key}
                        price={listing.listing_price}
                        address={getAddress(listing)}
                        city={listing.city}
                        neighborhood={listing.neighborhood}
                        propertyType={listing.property_type}
                        propertySubType={listing.property_sub_type}
                        beds={listing.bedrooms_total}
                        baths={listing.bathrooms_total}
                        sqft={listing.living_area}
                        photos={Array.isArray(listing.photos) ? listing.photos : []}
                        daysOnMarket={listing.days_on_market}
                        status={listing.mls_status}
                        listAgentName={listing.list_agent_name}
                        listOfficeName={listing.list_office_name}
                        virtualTourUrl={listing.virtual_tour_url}
                      />
                    ))}
                  </div>

                  <PaginationControls />
                </>
              )}
            </div>
          </div>
        </main>

        {/* Map Section */}
        {viewMode !== "map" && (
          <section className="py-12 bg-muted/30">
            <div className="container px-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Explore on Map</h2>
                <p className="text-muted-foreground">Find homes near you</p>
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
                  <div className="h-[400px] lg:h-[500px]">
                    <ResaleListingsMap listings={filteredListings} />
                  </div>
                </div>
              </Suspense>
              <div className="text-center mt-4">
                <Link to="/map-search?mode=resale">
                  <Button variant="outline" className="gap-2">
                    <Map className="h-4 w-4" />
                    Open Full Map Search
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        <Footer />
        <FloatingBottomNav />
      </PullToRefresh>
    </>
  );
}
