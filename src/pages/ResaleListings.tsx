import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, Building2, Map, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PopularSearchesGrid } from "@/components/seo/PopularSearchesGrid";
import { UnifiedSearchFilters } from "@/components/search/UnifiedSearchFilters";
import { buildMapUrlFromGridFilters } from "@/lib/filterSync";

// Lazy load map component
const ResaleListingsMap = lazy(() => import("@/components/map/ResaleListingsMap").then(m => ({ default: m.ResaleListingsMap })));

const ITEMS_PER_PAGE = 16;

// Filter options matching presale structure
const CITY_OPTIONS = [
  { value: "any", label: "All Cities" },
  { value: "Vancouver", label: "Vancouver" },
  { value: "Burnaby", label: "Burnaby" },
  { value: "Richmond", label: "Richmond" },
  { value: "Surrey", label: "Surrey" },
  { value: "Coquitlam", label: "Coquitlam" },
  { value: "Port Coquitlam", label: "Port Coquitlam" },
  { value: "Port Moody", label: "Port Moody" },
  { value: "North Vancouver", label: "North Vancouver" },
  { value: "West Vancouver", label: "West Vancouver" },
  { value: "Langley", label: "Langley" },
  { value: "Delta", label: "Delta" },
  { value: "Abbotsford", label: "Abbotsford" },
  { value: "New Westminster", label: "New Westminster" },
  { value: "White Rock", label: "White Rock" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "Apartment/Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "House", label: "House" },
];

const PRICE_OPTIONS = [
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

const BATHS_OPTIONS = [
  { value: "any", label: "Any Baths" },
  { value: "1", label: "1+ Bath" },
  { value: "2", label: "2+ Baths" },
  { value: "3", label: "3+ Baths" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
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
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button
        onClick={() => navigate("/presale-projects")}
        className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Presale
      </button>
      <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-foreground text-background shadow-sm">
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
  
  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  const filters = {
    city: searchParams.get("city") || "any",
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
    baths: searchParams.get("baths") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Metro Vancouver cities
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
    "Pitt Meadows", "Tsawwassen", "Ladner"
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["resale-listings-2024", filters, currentPage, enabledCities],
    queryFn: async () => {
      const citiesToUse = enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities;
      
      const buildFilters = (query: any) => {
        // Handle multi-select city filter (comma-separated values)
        if (filters.city === "any") {
          query = query.in("city", citiesToUse);
        } else {
          const cities = filters.city.split(",").filter(Boolean);
          if (cities.length === 1) {
            query = query.eq("city", cities[0]);
          } else if (cities.length > 1) {
            query = query.in("city", cities);
          }
        }
        // Handle multi-select propertyType filter
        if (filters.propertyType !== "any") {
          const types = filters.propertyType.split(",").filter(Boolean);
          if (types.length === 1) {
            query = query.or(`property_type.ilike.%${types[0]}%,property_sub_type.ilike.%${types[0]}%`);
          } else if (types.length > 1) {
            // Build OR condition for multiple types
            const orConditions = types.map(t => `property_type.ilike.%${t}%,property_sub_type.ilike.%${t}%`).join(",");
            query = query.or(orConditions);
          }
        }
        if (filters.priceRange !== "any") {
          const [min, max] = filters.priceRange.split("-").map(Number);
          query = query.gte("listing_price", min).lte("listing_price", max);
        }
        if (filters.beds !== "any") {
          query = query.gte("bedrooms_total", parseInt(filters.beds));
        }
        if (filters.baths !== "any") {
          query = query.gte("bathrooms_total", parseInt(filters.baths));
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

  // Map query - all listings with coordinates
  const { data: mapListingsData } = useQuery({
    queryKey: ["resale-map-listings-2024", filters, enabledCities],
    queryFn: async () => {
      const citiesToUse = enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities;
      
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status, year_built, list_agent_name, list_office_name")
        .eq("mls_status", "Active")
        .gte("year_built", 2024)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      // Handle multi-select city filter
      if (filters.city === "any") {
        query = query.in("city", citiesToUse);
      } else {
        const cities = filters.city.split(",").filter(Boolean);
        if (cities.length === 1) {
          query = query.eq("city", cities[0]);
        } else if (cities.length > 1) {
          query = query.in("city", cities);
        }
      }
      // Handle multi-select propertyType filter
      if (filters.propertyType !== "any") {
        const types = filters.propertyType.split(",").filter(Boolean);
        if (types.length === 1) {
          query = query.or(`property_type.ilike.%${types[0]}%,property_sub_type.ilike.%${types[0]}%`);
        } else if (types.length > 1) {
          const orConditions = types.map(t => `property_type.ilike.%${t}%,property_sub_type.ilike.%${t}%`).join(",");
          query = query.or(orConditions);
        }
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }
      if (filters.baths !== "any") {
        query = query.gte("bathrooms_total", parseInt(filters.baths));
      }

      query = query.order("list_date", { ascending: false, nullsFirst: false }).limit(5000);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const mapListings = mapListingsData || [];
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
    await queryClient.invalidateQueries({ queryKey: ["resale-listings-2024"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.city !== "any",
    filters.propertyType !== "any",
    filters.priceRange !== "any",
    filters.beds !== "any",
    filters.baths !== "any",
  ].filter(Boolean).length;

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  // Filter config for UnifiedSearchFilters - matching presale structure
  const filterConfig = [
    { key: "city", label: "City", paramKey: "city", options: CITY_OPTIONS, multiSelect: true },
    { key: "propertyType", label: "Type", paramKey: "type", options: TYPE_OPTIONS, multiSelect: true },
    { key: "priceRange", label: "Price", paramKey: "price", options: PRICE_OPTIONS },
    { key: "beds", label: "Beds", paramKey: "beds", options: BEDS_OPTIONS },
    { key: "baths", label: "Baths", paramKey: "baths", options: BATHS_OPTIONS },
  ];

  // Build map URL with current filters for seamless transition
  const mapUrlWithFilters = useMemo(() => {
    return buildMapUrlFromGridFilters(searchParams, "resale");
  }, [searchParams]);

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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // SEO
  const canonicalUrl = `https://presaleproperties.com${location.pathname}`;
  
  const getSeoTitle = () => {
    if (filters.city === "any" && filters.propertyType === "any") {
      return "Move-In Ready Homes | Brand New Condos & Townhomes in Metro Vancouver";
    }
    const parts: string[] = ["NEW"];
    if (filters.propertyType !== "any") {
      const typeLabel = filters.propertyType === "Apartment/Condo" ? "Condos" : 
                        filters.propertyType === "Townhouse" ? "Townhomes" : 
                        filters.propertyType === "House" ? "Homes" : "Homes";
      parts.push(typeLabel);
    } else {
      parts.push("Homes, Condos & Townhomes");
    }
    parts.push("for Sale");
    if (filters.city !== "any") {
      parts.push(`in ${filters.city}`);
    } else {
      parts.push("in Metro Vancouver");
    }
    parts.push("| Brand New 2024-2026");
    return parts.join(" ");
  };

  const getSeoDescription = () => {
    if (filters.city === "any" && filters.propertyType === "any") {
      return `${totalCount.toLocaleString()}+ brand new condos, townhomes & houses for sale. Move-in ready homes built 2024-2026. Never lived in, with full warranty coverage.`;
    }
    const cityText = filters.city !== "any" ? filters.city : "Vancouver, Surrey, Burnaby, Coquitlam, Langley & more";
    const typeText = filters.propertyType === "Apartment/Condo" ? "new condos" : 
                     filters.propertyType === "Townhouse" ? "new townhomes" : 
                     filters.propertyType === "House" ? "new detached homes" :
                     "brand new homes, condos, townhomes & detached houses";
    return `Browse ${totalCount.toLocaleString()}+ ${typeText} for sale in ${cityText}, BC. All properties are new construction built 2024-2026. Move-in ready with photos, prices & virtual tours.`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": getSeoTitle(),
    "description": getSeoDescription(),
    "url": canonicalUrl,
    "numberOfItems": totalCount,
  };

  return (
    <>
      <Helmet>
        <title>{getSeoTitle()}</title>
        <meta name="description" content={getSeoDescription()} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={getSeoTitle()} />
        <meta property="og:description" content={getSeoDescription()} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
        <ConversionHeader />
        
        {/* Clean Header Section - matching presale structure */}
        <section className="bg-background border-b border-border">
          <div className="container px-4 py-4 md:py-5">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Move-In Ready</span>
              {filters.city !== "any" && (
                <>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{filters.city}</span>
                </>
              )}
            </nav>

            {/* Title & Toggle Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {filters.city !== "any" 
                    ? `Move-In Ready Homes in ${filters.city}` 
                    : "Move-In Ready New Homes"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> active listings
                </p>
              </div>
              <ListingTypeToggle />
            </div>
            
            {/* Unified Search & Filters - same as presale */}
            <UnifiedSearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by city, neighborhood, address..."
              filters={filterConfig}
              filterValues={filters}
              onFilterChange={updateFilter}
              sortOptions={SORT_OPTIONS}
              sortValue={filters.sort}
              onSortChange={(v) => updateFilter("sort", v)}
              mapLink={mapUrlWithFilters}
              resultCount={totalCount}
              onClearAll={clearAllFilters}
            />
          </div>
        </section>

        {/* Main Grid - same layout as presale */}
        <main className="container px-4 py-5 md:py-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No listings found</h2>
              <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
              <Button onClick={clearAllFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
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
        </main>

        {/* Map Section - same as presale */}
        <section className="py-10 bg-muted/30 border-t border-border">
          <div className="container px-4">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {filters.city !== "any" ? `${filters.city} on Map` : "Explore on Map"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Find move-in ready homes near you
              </p>
            </div>
            <Suspense fallback={
              <div className="h-[350px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <Map className="h-10 w-10 text-muted-foreground animate-pulse" />
              </div>
            }>
              <div className="rounded-xl overflow-hidden border border-border h-[350px]">
                <ResaleListingsMap listings={mapListings} />
              </div>
            </Suspense>
            <div className="text-center mt-4">
              <Link to={mapUrlWithFilters}>
                <Button variant="outline" className="gap-2">
                  <Map className="h-4 w-4" />
                  Open Full Map Search
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Popular Searches Grid */}
        <PopularSearchesGrid 
          defaultCity={filters.city !== "any" ? filters.city : "Vancouver"} 
        />

        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        <Footer />
        <FloatingBottomNav />
      </PullToRefresh>
    </>
  );
}
