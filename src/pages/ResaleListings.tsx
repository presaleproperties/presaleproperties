import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, Map, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
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
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";
import { QuickFilterChips } from "@/components/search/QuickFilterChips";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
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
  { value: "Residential", label: "Residential" },
  { value: "Condo/Strata", label: "Condo" },
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
};

// Presale/Resale Toggle Component
function ListingTypeToggle() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full">
      <button
        onClick={() => navigate("/presale-projects")}
        className="px-4 py-2 rounded-full text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
      >
        Presales
      </button>
      <button
        className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-foreground text-background shadow-sm"
      >
        Resale
      </button>
    </div>
  );
}

export default function ResaleListings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
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

  const { data, isLoading } = useQuery({
    queryKey: ["resale-listings", filters, currentPage, enabledCities],
    queryFn: async () => {
      // Optimized query with proper filters for large datasets
      // Using a separate count query is more efficient than counting in the main query
      
      // Build the filter conditions once
      const buildFilters = (query: any) => {
        // Filter by enabled cities first
        if (enabledCities && enabledCities.length > 0 && filters.city === "any") {
          query = query.in("city", enabledCities);
        }
        if (filters.city !== "any") {
          query = query.eq("city", filters.city);
        }
        if (filters.propertyType !== "any") {
          // Search both property_type and property_sub_type for flexibility
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

      // Get total count (head: true makes this very fast)
      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active");
      countQuery = buildFilters(countQuery);
      const { count } = await countQuery;

      // Get paginated data with optimized column selection
      let query = supabase
        .from("mls_listings")
        .select("id, listing_id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, days_on_market, list_date, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active");
      query = buildFilters(query);

      // Apply sorting (using indexed columns for performance)
      switch (filters.sort) {
        case "price-asc":
          query = query.order("listing_price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("listing_price", { ascending: false });
          break;
        default:
          query = query.order("list_date", { ascending: false, nullsFirst: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: listingsData, error } = await query;
      if (error) throw error;

      return { listings: listingsData as MLSListing[], totalCount: count || 0 };
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const listings = data?.listings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter by search query client-side
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

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  const getFirstPhoto = (listing: MLSListing) => {
    if (!listing.photos) return null;
    if (Array.isArray(listing.photos) && listing.photos.length > 0) {
      const photo = listing.photos[0];
      // Handle different photo formats: {MediaURL}, {url}, or direct string
      return photo?.MediaURL || photo?.url || (typeof photo === 'string' ? photo : null);
    }
    return null;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  // SEO dynamic title
  const getSeoTitle = () => {
    const cityText = filters.city !== "any" ? filters.city : "Metro Vancouver";
    const typeText = filters.propertyType !== "any" ? filters.propertyType : "Homes";
    return `${typeText} for Sale in ${cityText} | MLS Listings | PresaleProperties`;
  };

  const getSeoDescription = () => {
    const cityText = filters.city !== "any" ? filters.city : "Metro Vancouver";
    return `Browse ${totalCount}+ resale homes, condos, and townhouses for sale in ${cityText}. Find your next home from active MLS listings with prices, photos, and details.`;
  };

  // Breadcrumb items
  const breadcrumbs = [
    { label: "For Sale", href: "/resale" },
    ...(filters.city !== "any" ? [{ label: filters.city }] : []),
  ];

  // Quick filter chips for beds
  const bedsChips = [
    { value: "1", label: "1+ Bed" },
    { value: "2", label: "2+ Beds" },
    { value: "3", label: "3+ Beds" },
    { value: "4", label: "4+ Beds" },
  ];

  // JSON-LD Structured Data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "For Sale", "item": "https://presaleproperties.com/resale" },
      ...(filters.city !== "any" ? [{ "@type": "ListItem", "position": 3, "name": filters.city }] : [])
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": getSeoTitle(),
    "description": getSeoDescription(),
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
        <link rel="canonical" href={`https://presaleproperties.com/resale${filters.city !== "any" ? `?city=${filters.city}` : ""}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background">
          <ConversionHeader />

          <main className="container py-6 md:py-8">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
              <Link to="/" className="hover:text-foreground transition-colors shrink-0">
                <Home className="h-3.5 w-3.5" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-1 shrink-0">
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Toggle + Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {filters.city !== "any" ? `${filters.city} Real Estate` : "Resale Properties"}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>
                  <span>active listings</span>
                  {filters.city !== "any" && (
                    <>
                      <span className="text-border">•</span>
                      <span>{filters.city}, BC</span>
                    </>
                  )}
                </p>
              </div>
              <ListingTypeToggle />
            </div>

            {/* Quick Filter Chips (like REW) */}
            <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <QuickFilterChips
                options={bedsChips}
                selected={filters.beds}
                onSelect={(v) => updateFilter("beds", v)}
              />
              <div className="h-4 w-px bg-border shrink-0" />
              {/* City chips */}
              <div className="flex items-center gap-2">
                {["Vancouver", "Burnaby", "Surrey", "Richmond", "Coquitlam"].map((city) => (
                  <button
                    key={city}
                    onClick={() => updateFilter("city", city === filters.city ? "any" : city)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      filters.city === city
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by city, neighborhood, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12"
                />
                <Link 
                  to="/resale-map" 
                  className="absolute right-1 p-2 rounded-md hover:bg-muted transition-colors"
                  title="View on map"
                >
                  <Map className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden relative">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterControls />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Desktop Sidebar Filters */}
              <aside className="hidden md:block w-[240px] shrink-0">
                <div className="sticky top-24 space-y-4 p-4 border rounded-lg bg-card">
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  <FilterControls />
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : filteredListings.length === 0 ? (
                  <div className="text-center py-16">
                    <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search criteria
                    </p>
                    <Button onClick={clearAllFilters}>Clear All Filters</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredListings.map((listing, index) => (
                        <ScrollReveal key={listing.id} delay={index * 0.05}>
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
                        </ScrollReveal>
                      ))}
                    </div>
                    <PaginationControls />
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Map Section */}
          <section className="py-12 bg-muted/30">
            <div className="container">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Explore on Map</h2>
                <p className="text-muted-foreground">Find resale properties near you</p>
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
                  <ResaleListingsMap listings={filteredListings} isLoading={isLoading} />
                </div>
              </Suspense>
              <div className="text-center mt-4">
                <Link to="/resale-map">
                  <Button variant="outline" className="gap-2">
                    <Map className="h-4 w-4" />
                    Open Full Map Search
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </PullToRefresh>
    </>
  );
}
