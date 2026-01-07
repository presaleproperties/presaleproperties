import { useState, useMemo, useCallback, lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, SlidersHorizontal, X, Map, LayoutGrid, 
  MapPin, Building2, ArrowLeft, ChevronDown, ChevronUp, Home, Bed, Bath
} from "lucide-react";
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
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load the map component
const ResaleListingsMap = lazy(() => 
  import("@/components/map/ResaleListingsMap").then(m => ({ default: m.ResaleListingsMap }))
);

const CITIES = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", 
  "Port Coquitlam", "Port Moody", "North Vancouver", "West Vancouver",
  "Langley", "Delta", "Abbotsford", "New Westminster", "White Rock"
];

const PROPERTY_TYPES = [
  { value: "any", label: "All Types" },
  { value: "Apartment/Condo", label: "Condos" },
  { value: "Townhouse", label: "Townhomes" },
  { value: "Single Family", label: "Houses" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-999999999", label: "$1.5M+" },
];

const BED_OPTIONS = [
  { value: "any", label: "Any Beds" },
  { value: "1", label: "1+ Bed" },
  { value: "2", label: "2+ Beds" },
  { value: "3", label: "3+ Beds" },
  { value: "4", label: "4+ Beds" },
];

type MLSListing = {
  id: string;
  listing_key: string;
  listing_price: number;
  city: string;
  neighborhood: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any;
  mls_status: string;
};

export default function ResaleMapSearch() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showCarousel, setShowCarousel] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [visibleListingIds, setVisibleListingIds] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const desktopListRef = useRef<HTMLDivElement>(null);

  const handleListingSelect = useCallback((listingId: string) => {
    setSelectedListingId(listingId);
    // Show carousel if hidden (mobile/tablet)
    setShowCarousel(true);
    
    // Small delay to ensure elements are rendered before scrolling
    setTimeout(() => {
      // Scroll carousel (mobile/tablet)
      if (carouselRef.current) {
        const cardElement = carouselRef.current.querySelector(`[data-listing-id="${listingId}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      // Scroll desktop list
      if (desktopListRef.current) {
        const cardElement = desktopListRef.current.querySelector(`[data-listing-id="${listingId}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, []);

  const handleVisibleListingsChange = useCallback((listingIds: string[]) => {
    setVisibleListingIds(listingIds);
  }, []);

  const filters = {
    city: searchParams.get("city") || "any",
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
  };

  const { data: allListings, isLoading } = useQuery({
    queryKey: ["resale-map-listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status")
        .in("mls_status", ["Active", "Pending"]);

      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.propertyType !== "any") {
        query = query.eq("property_sub_type", filters.propertyType);
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }

      query = query.order("listing_price", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as MLSListing[];
    },
  });

  const filteredListings = useMemo(() => {
    if (!allListings) return [];
    if (!searchQuery.trim()) return allListings;
    
    const q = searchQuery.toLowerCase();
    return allListings.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        (l.neighborhood?.toLowerCase() || "").includes(q) ||
        (l.street_name?.toLowerCase() || "").includes(q)
    );
  }, [allListings, searchQuery]);

  const mapListings = filteredListings;

  const visibleListings = useMemo(() => {
    if (visibleListingIds.length === 0) return filteredListings;
    return filteredListings.filter(l => visibleListingIds.includes(l.id));
  }, [filteredListings, visibleListingIds]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const activeFilterCount = [
    filters.city !== "any",
    filters.propertyType !== "any",
    filters.priceRange !== "any",
    filters.beds !== "any",
  ].filter(Boolean).length;

  const LoadingMap = () => (
    <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  const formatPrice = (price: number | null) => {
    if (!price) return 'TBA';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getAddress = (listing: MLSListing) => {
    const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
  };

  const getPhoto = (listing: MLSListing) => {
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      return listing.photos[0]?.MediaURL || null;
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Resale Map Search | Find Homes Near You | PresaleProperties</title>
        <meta name="description" content="Search resale homes on an interactive map. Find condos, townhomes, and houses for sale in Metro Vancouver." />
        <link rel="canonical" href="https://presaleproperties.com/resale-map" />
      </Helmet>

      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <ConversionHeader />

        {/* Search & Filter Bar */}
        <div className="border-b border-border bg-background z-40 shrink-0">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center gap-2 md:gap-4">
              <Link to="/resale">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by city, neighborhood..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Mobile Filters */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                        <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">All Cities</SelectItem>
                          {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Property Type</label>
                      <Select value={filters.propertyType} onValueChange={(v) => updateFilter("type", v)}>
                        <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Beds</label>
                      <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
                        <SelectTrigger><SelectValue placeholder="Any Beds" /></SelectTrigger>
                        <SelectContent>
                          {BED_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price</label>
                      <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                        <SelectTrigger><SelectValue placeholder="Any Price" /></SelectTrigger>
                        <SelectContent>
                          {PRICE_RANGES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" onClick={clearAllFilters} className="w-full">
                        <X className="h-4 w-4 mr-2" /> Clear All
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Cities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Cities</SelectItem>
                    {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filters.propertyType} onValueChange={(v) => updateFilter("type", v)}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
                  <SelectTrigger className="w-[110px] h-9"><SelectValue placeholder="Any Beds" /></SelectTrigger>
                  <SelectContent>
                    {BED_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Any Price" /></SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Toggle List Button */}
              <Button
                variant={showList ? "outline" : "default"}
                size="sm"
                className="hidden lg:flex gap-2"
                onClick={() => setShowList(!showList)}
              >
                {showList ? <Map className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {showList ? "Expand Map" : "Show List"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - isolate creates stacking context to contain map z-indexes */}
        <div className="flex-1 flex overflow-hidden relative isolate">
          {/* Map Section */}
          <div className={`relative transition-all duration-300 h-full w-full ${showList ? "lg:w-3/5" : "lg:w-full"}`}>
            {/* Presale/Resale Toggle - Minimal pill style */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="flex bg-background/90 backdrop-blur-sm rounded-full p-0.5 shadow-md border border-border/50 text-xs">
                <Link to="/map-search">
                  <button className="px-3 py-1.5 rounded-full font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Presale
                  </button>
                </Link>
                <button className="px-3 py-1.5 rounded-full font-medium bg-foreground text-background">
                  Resale
                </button>
              </div>
            </div>

            <div className="absolute inset-0">
              <SafeMapWrapper height="h-full">
                <Suspense fallback={<LoadingMap />}>
                  {isLoading ? (
                    <LoadingMap />
                  ) : mapListings.length === 0 ? (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground p-6">
                        <Home className="h-12 w-12 mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-2">No listings found</h3>
                        <p className="text-sm mb-4">Try adjusting your filters</p>
                        <Button onClick={clearAllFilters} size="sm">Clear Filters</Button>
                      </div>
                    </div>
                  ) : (
                    <ResaleListingsMap 
                      listings={mapListings}
                      onListingSelect={handleListingSelect}
                      onVisibleListingsChange={handleVisibleListingsChange}
                    />
                  )}
                </Suspense>
              </SafeMapWrapper>
            </div>

            {/* Toggle button when carousel is hidden - right side, minimal */}
            {!showCarousel && visibleListings.length > 0 && (
              <div className="absolute bottom-4 right-4 z-[1100] safe-bottom lg:hidden">
                <button
                  onClick={() => setShowCarousel(true)}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border border-border/30 hover:bg-background transition-colors"
                  aria-label="Show listings"
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Bottom Carousel - Mobile/Tablet */}
            {showCarousel && visibleListings.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-[1100] lg:hidden">
                {/* Carousel with count and minimal toggle on right */}
                <div className="bg-background/95 backdrop-blur-sm border-t border-border/30 pt-2 pb-2 safe-bottom">
                  <div className="flex items-center justify-between px-4 md:px-6 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {visibleListings.length} listing{visibleListings.length !== 1 ? "s" : ""} in view
                    </span>
                    <button
                      onClick={() => setShowCarousel(false)}
                      className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                      aria-label="Hide listings"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div 
                    ref={carouselRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-6 pb-2 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {visibleListings.slice(0, 30).map((listing) => (
                      <Link 
                        key={listing.id} 
                        to={`/resale/${listing.listing_key}`}
                        data-listing-id={listing.id}
                        className="snap-start shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                      >
                        <div className={`bg-card rounded-xl shadow-lg border-2 overflow-hidden transition-all hover:shadow-xl ${
                          selectedListingId === listing.id 
                            ? 'border-primary ring-2 ring-primary/20 animate-selection-pulse' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-muted">
                            {getPhoto(listing) ? (
                              <img src={getPhoto(listing)!} alt={getAddress(listing)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
                              {listing.mls_status}
                            </Badge>
                          </div>
                          <div className="p-2.5 sm:p-3">
                            <h4 className="font-semibold text-foreground text-sm truncate">{getAddress(listing)}</h4>
                            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs truncate">{listing.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-foreground text-sm">{formatPrice(listing.listing_price)}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                                {listing.bedrooms_total && <><Bed className="h-3 w-3" /> {listing.bedrooms_total}</>}
                                {listing.bathrooms_total && <><Bath className="h-3 w-3 ml-1" /> {listing.bathrooms_total}</>}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop List Panel */}
          <div className={`hidden lg:flex flex-col border-l border-border bg-background transition-all duration-300 ease-out ${
            showList ? "w-2/5 opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}>
              <div className="shrink-0 px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {visibleListings.length} Listing{visibleListings.length !== 1 ? "s" : ""} in view
                  </h3>
                  <Link to="/resale">
                    <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">View All →</Button>
                  </Link>
                </div>
              </div>
              
              <div ref={desktopListRef} className="flex-1 overflow-y-auto p-4">
                {visibleListings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-10 w-10 mx-auto mb-2" />
                    <p>No listings in current view</p>
                    <p className="text-xs mt-1">Zoom out to see more</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {visibleListings.slice(0, 30).map((listing) => (
                      <Link key={listing.id} to={`/resale/${listing.listing_key}`} className="block" data-listing-id={listing.id}>
                        <div className={`bg-card rounded-lg border overflow-hidden transition-all hover:shadow-md hover:border-primary/50 ${
                          selectedListingId === listing.id ? 'ring-2 ring-primary border-primary animate-selection-pulse' : 'border-border'
                        }`}>
                          <div className="relative w-full aspect-[4/3] bg-muted">
                            {getPhoto(listing) ? (
                              <img src={getPhoto(listing)!} alt={getAddress(listing)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                              {listing.mls_status}
                            </Badge>
                          </div>
                          <div className="p-2.5">
                            <h4 className="font-semibold text-sm text-foreground truncate">{getAddress(listing)}</h4>
                            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">{listing.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="font-bold text-sm text-foreground">{formatPrice(listing.listing_price)}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {listing.bedrooms_total && <><Bed className="h-3 w-3" />{listing.bedrooms_total}</>}
                                {listing.bathrooms_total && <><Bath className="h-3 w-3 ml-1" />{listing.bathrooms_total}</>}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
