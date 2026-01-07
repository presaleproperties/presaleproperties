import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, Map, LayoutGrid, Home } from "lucide-react";
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
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";

// Lazy load map component
const ResaleMap = lazy(() => import("@/components/resale/ResaleMap").then(m => ({ default: m.ResaleMap })));

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
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const filters = {
    city: searchParams.get("city") || "any",
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["resale-listings", filters, currentPage],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active");

      // Apply filters to count query
      if (filters.city !== "any") {
        countQuery = countQuery.eq("city", filters.city);
      }
      if (filters.propertyType !== "any") {
        countQuery = countQuery.ilike("property_type", `%${filters.propertyType}%`);
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        countQuery = countQuery.gte("bedrooms_total", parseInt(filters.beds));
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("mls_listings")
        .select("id, listing_id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, days_on_market, list_date")
        .eq("mls_status", "Active");

      // Apply filters
      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.propertyType !== "any") {
        query = query.ilike("property_type", `%${filters.propertyType}%`);
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }

      // Apply sorting
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

  return (
    <>
      <Helmet>
        <title>Resale Listings | MLS Properties for Sale | PresaleProperties</title>
        <meta name="description" content="Browse resale homes, condos, and townhouses for sale in Metro Vancouver. Find your next home from active MLS listings." />
        <link rel="canonical" href="https://presaleproperties.com/resale" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background">
          <ConversionHeader />

          <main className="container py-6 md:py-8">
            {/* Toggle + Title */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <ListingTypeToggle />
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Resale Properties
                </h1>
                <p className="text-muted-foreground mt-1">
                  {totalCount} active listings in Metro Vancouver
                </p>
              </div>
            </div>

            {/* Search + Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by city, neighborhood, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
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

                <div className="hidden md:flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="h-8 px-3"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>

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
                ) : viewMode === "map" ? (
                  <div className="h-[600px] rounded-xl overflow-hidden border">
                    <SafeMapWrapper height="h-full">
                      <Suspense fallback={<div className="h-full bg-muted animate-pulse" />}>
                        <ResaleMap listings={filteredListings} />
                      </Suspense>
                    </SafeMapWrapper>
                  </div>
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
                          <Link to={`/resale/${listing.listing_key}`} className="block group">
                            <div className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                              <div className="relative aspect-[4/3] bg-muted">
                                {getFirstPhoto(listing) ? (
                                  <img
                                    src={getFirstPhoto(listing)}
                                    alt={getAddress(listing)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Home className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600">
                                  Active
                                </Badge>
                                {listing.days_on_market && listing.days_on_market <= 7 && (
                                  <Badge className="absolute top-3 right-3 bg-primary">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                    {formatPrice(listing.listing_price)}
                                  </h3>
                                  {listing.property_sub_type && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {listing.property_sub_type}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                  {getAddress(listing)}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {listing.bedrooms_total && (
                                    <span>{listing.bedrooms_total} bed</span>
                                  )}
                                  {listing.bathrooms_total && (
                                    <span>{listing.bathrooms_total} bath</span>
                                  )}
                                  {listing.living_area && (
                                    <span>{listing.living_area.toLocaleString()} sqft</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </ScrollReveal>
                      ))}
                    </div>
                    <PaginationControls />
                  </>
                )}
              </div>
            </div>
          </main>

          <BuyerCTASection />
          <Footer />
        </div>
      </PullToRefresh>
    </>
  );
}
