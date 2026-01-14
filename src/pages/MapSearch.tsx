import { useState, useMemo, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  SlidersHorizontal, X, Map, LayoutGrid, 
  MapPin, Building2, ChevronDown, ChevronUp, Home, Bed, Bath,
  Building, HomeIcon, Warehouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { UnifiedMapToggle } from "@/components/map/UnifiedMapToggle";
import { MapSearchBar } from "@/components/search/MapSearchBar";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnabledCities } from "@/hooks/useEnabledCities";

// Lazy load the combined map component
const CombinedListingsMap = lazy(() => 
  import("@/components/map/CombinedListingsMap").then(m => ({ default: m.CombinedListingsMap }))
);

const CITIES = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", 
  "Port Coquitlam", "Port Moody", "North Vancouver", "West Vancouver",
  "Langley", "Delta", "Abbotsford", "New Westminster", "White Rock"
];

const PROPERTY_TYPES = [
  { value: "any", label: "Any", icon: null },
  { value: "Apartment/Condo", label: "Condo", icon: Building },
  { value: "Townhouse", label: "Townhouse", icon: Warehouse },
  { value: "Single Family", label: "House", icon: HomeIcon },
];

const BED_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

const BATH_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const DAYS_ON_SITE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "24 hrs" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "28", label: "28 days" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Latest" },
  { value: "price_asc", label: "Price (Low)" },
  { value: "price_desc", label: "Price (High)" },
];

// Price constants
const MIN_PRICE = 0;
const MAX_PRICE = 5000000;
const PRICE_STEP = 50000;
type MapMode = "all" | "presale" | "resale";

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
  list_agent_name?: string | null;
  list_office_name?: string | null;
};

type PresaleProject = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: string;
  project_type: string;
  starting_price: number | null;
  featured_image: string | null;
  map_lat: number | null;
  map_lng: number | null;
};

export default function MapSearch() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showCarousel, setShowCarousel] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"resale" | "presale" | null>(null);
  const [visibleResaleIds, setVisibleResaleIds] = useState<string[]>([]);
  const [visiblePresaleIds, setVisiblePresaleIds] = useState<string[]>([]);
  
  // Read mode from URL param, sync state when URL changes
  const urlMode = (searchParams.get("mode") as MapMode) || "all";
  const [mapMode, setMapMode] = useState<MapMode>(urlMode);
  
  // Sync mapMode when URL changes (e.g., navigating from another page)
  useEffect(() => {
    setMapMode(urlMode);
  }, [urlMode]);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const desktopListRef = useRef<HTMLDivElement>(null);

  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  // Fetch neighborhoods from presale projects for autocomplete
  const { data: neighborhoodsData } = useQuery({
    queryKey: ["neighborhoods-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("neighborhood, city")
        .eq("is_published", true)
        .not("neighborhood", "is", null);
      if (error) throw error;
      const unique: Record<string, { neighborhood: string; city: string }> = {};
      data?.forEach(row => {
        const key = `${row.neighborhood}-${row.city}`;
        if (!unique[key]) {
          unique[key] = { neighborhood: row.neighborhood, city: row.city };
        }
      });
      return Object.values(unique);
    },
    staleTime: 10 * 60 * 1000,
  });

  const handleItemSelect = useCallback((id: string, type: "resale" | "presale") => {
    setSelectedItemId(id);
    setSelectedItemType(type);
    setShowCarousel(true);
    
    setTimeout(() => {
      if (carouselRef.current) {
        const cardElement = carouselRef.current.querySelector(`[data-item-id="${id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      if (desktopListRef.current) {
        const cardElement = desktopListRef.current.querySelector(`[data-item-id="${id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, []);

  const handleVisibleItemsChange = useCallback((resaleIds: string[], presaleIds: string[]) => {
    setVisibleResaleIds(resaleIds);
    setVisiblePresaleIds(presaleIds);
  }, []);

  const handleModeChange = useCallback((newMode: MapMode) => {
    setMapMode(newMode);
    const newParams = new URLSearchParams(searchParams);
    if (newMode === "all") {
      newParams.delete("mode");
    } else {
      newParams.set("mode", newMode);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const filters = {
    city: searchParams.get("city") || "any",
    propertyType: searchParams.get("type") || "any",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    beds: searchParams.get("beds") || "any",
    baths: searchParams.get("baths") || "any",
    daysOnSite: searchParams.get("days") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  // Price slider state
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin ? parseInt(filters.priceMin) : MIN_PRICE,
    filters.priceMax ? parseInt(filters.priceMax) : MAX_PRICE,
  ]);

  // Fetch resale listings (2025+ builds)
  const { data: resaleListings, isLoading: resaleLoading } = useQuery({
    queryKey: ["unified-map-resale-2025", filters, enabledCities],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, street_suffix, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status, year_built, list_agent_name, list_office_name")
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .gte("year_built", 2024);

      // Filter by enabled cities from admin portal when no specific city selected
      if (enabledCities && enabledCities.length > 0 && filters.city === "any") {
        query = query.in("city", enabledCities);
      }

      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.propertyType !== "any") {
        query = query.or(`property_type.ilike.%${filters.propertyType}%,property_sub_type.ilike.%${filters.propertyType}%`);
      }
      if (filters.priceMin) {
        query = query.gte("listing_price", parseInt(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte("listing_price", parseInt(filters.priceMax));
      }
      if (filters.baths !== "any") {
        query = query.gte("bathrooms_total", parseInt(filters.baths));
      }
      if (filters.daysOnSite !== "any") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.daysOnSite));
        query = query.gte("list_date", daysAgo.toISOString().split('T')[0]);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }

      // Order by recency - no hard cap, show all results for accurate count
      query = query.order("list_date", { ascending: false, nullsFirst: false }).order("listing_price", { ascending: false }).limit(3000);

      const { data, error } = await query;
      if (error) throw error;
      return data as MLSListing[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch presale projects
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery({
    queryKey: ["unified-map-presale", filters],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .not("map_lat", "is", null)
        .not("map_lng", "is", null);

      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.priceMin) {
        query = query.gte("starting_price", parseInt(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte("starting_price", parseInt(filters.priceMax));
      }

      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as PresaleProject[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = resaleLoading || presaleLoading;

  const filteredResaleListings = useMemo(() => {
    if (!resaleListings) return [];
    if (!searchQuery.trim()) return resaleListings;
    
    const q = searchQuery.toLowerCase();
    return resaleListings.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        (l.neighborhood?.toLowerCase() || "").includes(q) ||
        (l.street_name?.toLowerCase() || "").includes(q)
    );
  }, [resaleListings, searchQuery]);

  const filteredPresaleProjects = useMemo(() => {
    if (!presaleProjects) return [];
    if (!searchQuery.trim()) return presaleProjects;
    
    const q = searchQuery.toLowerCase();
    return presaleProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [presaleProjects, searchQuery]);

  // Visible items based on map viewport and mode
  const visibleResaleListings = useMemo(() => {
    if (mapMode === "presale") return [];
    if (visibleResaleIds.length === 0) return filteredResaleListings.slice(0, 30);
    return filteredResaleListings.filter(l => visibleResaleIds.includes(l.id)).slice(0, 30);
  }, [filteredResaleListings, visibleResaleIds, mapMode]);

  const visiblePresaleProjects = useMemo(() => {
    if (mapMode === "resale") return [];
    if (visiblePresaleIds.length === 0) return filteredPresaleProjects.slice(0, 30);
    return filteredPresaleProjects.filter(p => visiblePresaleIds.includes(p.id)).slice(0, 30);
  }, [filteredPresaleProjects, visiblePresaleIds, mapMode]);

  // Combined visible items for display
  const visibleItems = useMemo(() => {
    const items: Array<{ type: "resale" | "presale"; data: MLSListing | PresaleProject }> = [];
    visiblePresaleProjects.forEach(p => items.push({ type: "presale", data: p }));
    visibleResaleListings.forEach(l => items.push({ type: "resale", data: l }));
    return items.slice(0, 40);
  }, [visibleResaleListings, visiblePresaleProjects]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const projectsForSearch = useMemo(() => {
    if (!presaleProjects) return [];
    return presaleProjects.map(p => ({ name: p.name, city: p.city, slug: p.slug }));
  }, [presaleProjects]);

  // Listings for search bar autocomplete (MLS# and address search)
  const listingsForSearch = useMemo(() => {
    if (!resaleListings) return [];
    return resaleListings.map(l => ({
      listing_key: l.listing_key,
      city: l.city,
      street_number: l.street_number,
      street_name: l.street_name,
      street_suffix: l.street_suffix,
      listing_price: l.listing_price,
    }));
  }, [resaleListings]);

  const handleSearchSuggestionSelect = useCallback((suggestion: { type: string; value: string; city?: string; label: string }) => {
    if (suggestion.type === "city") {
      updateFilter("city", suggestion.value);
      setSearchQuery("");
    } else if (suggestion.type === "neighborhood") {
      if (suggestion.city) {
        updateFilter("city", suggestion.city);
      }
      setSearchQuery(suggestion.label);
    } else if (suggestion.type === "project") {
      navigate(`/presale-projects/${suggestion.value}`);
    } else if (suggestion.type === "listing") {
      navigate(`/resale/${suggestion.value}`);
    }
  }, [navigate, updateFilter]);

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (mapMode !== "all") {
      newParams.set("mode", mapMode);
    }
    setSearchParams(newParams);
    setSearchQuery("");
  };

  const activeFilterCount = [
    filters.city !== "any",
    filters.propertyType !== "any",
    filters.priceMin !== "",
    filters.priceMax !== "",
    filters.beds !== "any",
    filters.baths !== "any",
    filters.daysOnSite !== "any",
  ].filter(Boolean).length;

  // Helper to format price display
  const formatPriceLabel = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${(value / 1000).toFixed(0)}K`;
  };

  // Apply price filter from slider
  const applyPriceFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    if (priceRange[0] > MIN_PRICE) {
      newParams.set("priceMin", priceRange[0].toString());
    } else {
      newParams.delete("priceMin");
    }
    if (priceRange[1] < MAX_PRICE) {
      newParams.set("priceMax", priceRange[1].toString());
    } else {
      newParams.delete("priceMax");
    }
    setSearchParams(newParams);
  };

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
    return `$${price.toLocaleString()}`;
  };

  const getResaleAddress = (listing: MLSListing) => {
    const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
  };

  const getResalePhoto = (listing: MLSListing) => {
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      return listing.photos[0]?.MediaURL || null;
    }
    return null;
  };

  const totalCount = (filteredResaleListings?.length || 0) + (filteredPresaleProjects?.length || 0);

  return (
    <>
      <Helmet>
        <title>Map Search | Find New Homes in Metro Vancouver | PresaleProperties</title>
        <meta name="description" content="Search presale condos and move-in ready new homes on an interactive map. Find all new construction in Metro Vancouver." />
        <link rel="canonical" href="https://presaleproperties.com/map-search" />
      </Helmet>

      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <ConversionHeader />

        {/* Main Content - Map + Panel Layout */}
        <div className="flex-1 flex overflow-hidden relative isolate">
          {/* Map Section - ~60% width when list is shown (REW-style ratio) */}
          <div className={`relative transition-all duration-300 h-full w-full ${showList ? "lg:w-[60%]" : "lg:w-full"}`}>
            {/* Unified Mode Toggle - Floating on map */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
              <UnifiedMapToggle
                mode={mapMode}
                onModeChange={handleModeChange}
                presaleCount={filteredPresaleProjects?.length || 0}
                resaleCount={filteredResaleListings?.length || 0}
              />
            </div>

            {/* List View Button - Mobile/Tablet - top right */}
            <div className="absolute top-3 right-3 z-[1001] lg:hidden">
              <Link to={mapMode === "presale" ? "/presale-projects" : "/resale"}>
                <button className="w-9 h-9 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                </button>
              </Link>
            </div>

            <div className="absolute inset-0">
              <SafeMapWrapper height="h-full">
                <Suspense fallback={<LoadingMap />}>
                  {isLoading ? (
                    <LoadingMap />
                  ) : totalCount === 0 ? (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground p-6">
                        <Home className="h-12 w-12 mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-2">No properties found</h3>
                        <p className="text-sm mb-4">Try adjusting your filters</p>
                        <Button onClick={clearAllFilters} size="sm">Clear Filters</Button>
                      </div>
                    </div>
                  ) : (
                    <CombinedListingsMap 
                      resaleListings={filteredResaleListings}
                      presaleProjects={filteredPresaleProjects}
                      mode={mapMode}
                      onListingSelect={handleItemSelect}
                      onVisibleItemsChange={handleVisibleItemsChange}
                    />
                  )}
                </Suspense>
              </SafeMapWrapper>
            </div>

            {/* Bottom Carousel - Mobile/Tablet - Floating above map */}
            {showCarousel && visibleItems.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-[1000] lg:hidden safe-bottom">
                <div className="flex items-center justify-between px-4 pb-2 pt-1">
                  <span className="text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    {visibleItems.length} properties in view
                  </span>
                  <button
                    onClick={() => setShowCarousel(false)}
                    className="w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 flex items-center justify-center"
                    aria-label="Hide properties"
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div 
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto px-4 pb-4 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >

            {/* Show Carousel Button - When hidden */}
            {!showCarousel && visibleItems.length > 0 && (
              <div className="absolute bottom-4 right-4 z-[1000] lg:hidden safe-bottom">
                <button
                  onClick={() => setShowCarousel(true)}
                  className="w-8 h-8 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center"
                  aria-label="Show properties"
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
                  {visibleItems.map((item) => {
                    const isPresale = item.type === "presale";
                    const data = item.data;
                    const id = isPresale ? (data as PresaleProject).id : (data as MLSListing).id;
                    const link = isPresale 
                      ? `/presale-projects/${(data as PresaleProject).slug}` 
                      : `/resale/${(data as MLSListing).listing_key}`;
                    
                    return (
                      <Link 
                        key={`${item.type}-${id}`}
                        to={link}
                        data-item-id={id}
                        className="snap-start shrink-0 w-[220px] sm:w-[260px]"
                      >
                        <div className={`bg-card rounded-xl shadow-lg border-2 overflow-hidden transition-all ${
                          selectedItemId === id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border/40 hover:border-primary/50'
                        }`}>
                          <div className="relative w-full aspect-[16/10] bg-muted">
                            {isPresale ? (
                              (data as PresaleProject).featured_image ? (
                                <img src={(data as PresaleProject).featured_image!} alt={(data as PresaleProject).name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )
                            ) : (
                              getResalePhoto(data as MLSListing) ? (
                                <img src={getResalePhoto(data as MLSListing)!} alt={getResaleAddress(data as MLSListing)} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )
                            )}
                            <Badge className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 ${
                              isPresale 
                                ? 'bg-foreground/90 text-background' 
                                : 'bg-primary/90 text-primary-foreground'
                            }`}>
                              {isPresale ? 'PRESALE' : 'MOVE-IN READY'}
                            </Badge>
                          </div>
                          <div className="p-3 space-y-1">
                            {/* Price */}
                            <div className="font-bold text-foreground text-base">
                              {isPresale 
                                ? formatPrice((data as PresaleProject).starting_price)
                                : formatPrice((data as MLSListing).listing_price)
                              }
                            </div>
                            
                            {/* Name/Address */}
                            <h4 className="font-medium text-foreground text-sm line-clamp-1">
                              {isPresale ? (data as PresaleProject).name : getResaleAddress(data as MLSListing)}
                            </h4>
                            
                            {/* Location */}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">
                                {isPresale 
                                  ? `${(data as PresaleProject).neighborhood}, ${(data as PresaleProject).city}`
                                  : `${(data as MLSListing).neighborhood || (data as MLSListing).city}`
                                }
                              </span>
                            </div>
                            
                            {/* Specs for resale */}
                            {!isPresale && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                {(data as MLSListing).bedrooms_total && (
                                  <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" /> {(data as MLSListing).bedrooms_total} bed
                                  </span>
                                )}
                                {(data as MLSListing).bathrooms_total && (
                                  <span className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" /> {(data as MLSListing).bathrooms_total} bath
                                  </span>
                                )}
                                {(data as MLSListing).living_area && (
                                  <span>{(data as MLSListing).living_area?.toLocaleString()} sf</span>
                                )}
                              </div>
                            )}
                            
                            {/* Status for presale */}
                            {isPresale && (
                              <div className="text-xs text-muted-foreground pt-1 capitalize">
                                {(data as PresaleProject).status?.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop List Panel - ~40% width for REW-style layout */}
          <div className={`hidden lg:flex flex-col border-l border-border bg-background transition-all duration-300 ease-out ${
            showList ? "w-[40%] min-w-[420px] max-w-[560px] opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}>
            {/* Top Bar - Search + Filter + Map/List toggle (REW style) */}
            <div className="shrink-0 p-3 border-b border-border bg-background">
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="flex-1">
                  <MapSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSuggestionSelect={handleSearchSuggestionSelect}
                    placeholder="City, MLS#, Address..."
                    cities={CITIES}
                    neighborhoods={neighborhoodsData || []}
                    projects={projectsForSearch}
                    listings={listingsForSearch}
                    className="h-9"
                  />
                </div>
                
                {/* Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 px-3 shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                      FILTER
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full ml-1">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
                    <SheetHeader className="pb-4 border-b">
                      <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto py-6 space-y-8">
                      {/* Price Range Section */}
                      <div>
                        <label className="text-base font-semibold mb-4 block">Price range</label>
                        <Slider
                          value={priceRange}
                          min={MIN_PRICE}
                          max={MAX_PRICE}
                          step={PRICE_STEP}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          onValueCommit={applyPriceFilter}
                          className="mb-4"
                        />
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Minimum</label>
                            <Input
                              type="text"
                              placeholder="No Min"
                              value={priceRange[0] > MIN_PRICE ? formatPriceLabel(priceRange[0]) : ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                if (val) setPriceRange([parseInt(val), priceRange[1]]);
                              }}
                              onBlur={applyPriceFilter}
                              className="h-10"
                            />
                          </div>
                          <span className="text-muted-foreground mt-5">-</span>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Maximum</label>
                            <Input
                              type="text"
                              placeholder="No Max"
                              value={priceRange[1] < MAX_PRICE ? formatPriceLabel(priceRange[1]) : ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                if (val) setPriceRange([priceRange[0], parseInt(val)]);
                              }}
                              onBlur={applyPriceFilter}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Property Type Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Property Type</label>
                        <div className="flex flex-wrap gap-2">
                          {PROPERTY_TYPES.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => updateFilter("type", opt.value)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                  filters.propertyType === opt.value
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border hover:border-foreground/30 text-foreground"
                                }`}
                              >
                                {Icon && <Icon className="h-4 w-4" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bedrooms Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Bedrooms</label>
                        <div className="flex flex-wrap gap-2">
                          {BED_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateFilter("beds", opt.value)}
                              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[56px] ${
                                filters.beds === opt.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border hover:border-foreground/30 text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bathrooms Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Bathrooms</label>
                        <div className="flex flex-wrap gap-2">
                          {BATH_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateFilter("baths", opt.value)}
                              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[56px] ${
                                filters.baths === opt.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border hover:border-foreground/30 text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Days on Site Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Days on site</label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_ON_SITE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateFilter("days", opt.value)}
                              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                filters.daysOnSite === opt.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border hover:border-foreground/30 text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* City Section - keep dropdown for convenience */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">City</label>
                        <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="All Cities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">All Cities</SelectItem>
                            {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Footer with Clear/Done buttons */}
                    <SheetFooter className="border-t pt-4 flex-row gap-3">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          clearAllFilters();
                          setPriceRange([MIN_PRICE, MAX_PRICE]);
                        }} 
                        className="flex-1"
                      >
                        CLEAR FILTERS
                      </Button>
                      <Button 
                        onClick={() => setMobileFiltersOpen(false)} 
                        className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                      >
                        DONE
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Results Header - Count + Sort + Map/List Toggle */}
            <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {totalCount} Results
                </span>
                <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                  <SelectTrigger className="w-[100px] h-7 text-xs border-0 bg-transparent shadow-none px-1 gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Map/List toggle buttons */}
              <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setShowList(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    showList ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Map className="h-3.5 w-3.5" />
                  Map
                </button>
                <Link to={mapMode === "presale" ? "/presale-projects" : "/resale"}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    List
                  </button>
                </Link>
              </div>
            </div>

            {/* Scrollable Grid - REW-style sizing with our branding */}
            <div ref={desktopListRef} className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {visibleItems.map((item) => {
                  const isPresale = item.type === "presale";
                  const data = item.data;
                  const id = isPresale ? (data as PresaleProject).id : (data as MLSListing).id;
                  const link = isPresale 
                    ? `/presale-projects/${(data as PresaleProject).slug}` 
                    : `/resale/${(data as MLSListing).listing_key}`;
                  
                  return (
                    <Link 
                      key={`${item.type}-${id}`}
                      to={link}
                      data-item-id={id}
                    >
                      <div className={`rounded-xl border overflow-hidden transition-all hover:shadow-lg group bg-card ${
                        selectedItemId === id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}>
                        {/* Large Image - 3:2 aspect ratio matching REW */}
                        <div className="relative w-full aspect-[3/2] bg-muted overflow-hidden">
                          {isPresale ? (
                            (data as PresaleProject).featured_image ? (
                              <img src={(data as PresaleProject).featured_image!} alt={(data as PresaleProject).name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )
                          ) : (
                            getResalePhoto(data as MLSListing) ? (
                              <img src={getResalePhoto(data as MLSListing)!} alt={getResaleAddress(data as MLSListing)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )
                          )}
                          {/* Badge overlay */}
                          <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 font-semibold shadow-md ${
                            isPresale 
                              ? 'bg-foreground text-background' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {isPresale ? 'PRESALE' : 'MOVE-IN'}
                          </Badge>
                        </div>
                        
                        {/* Content - REW-style compact info */}
                        <div className="p-2.5 space-y-1">
                          {/* Price - Prominent */}
                          <div className="font-bold text-foreground text-base leading-tight">
                            {isPresale
                              ? formatPrice((data as PresaleProject).starting_price)
                              : formatPrice((data as MLSListing).listing_price)
                            }
                          </div>
                          
                          {/* Address */}
                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                            {isPresale ? (data as PresaleProject).name : getResaleAddress(data as MLSListing)}
                          </h4>
                          
                          {/* Location */}
                          <div className="text-muted-foreground text-xs line-clamp-1">
                            {isPresale 
                              ? `${(data as PresaleProject).neighborhood} • ${(data as PresaleProject).city}`
                              : `${(data as MLSListing).neighborhood || (data as MLSListing).city}`
                            }
                          </div>
                          
                          {/* Specs for resale */}
                          {!isPresale && (
                            <div className="text-muted-foreground text-xs">
                              {(data as MLSListing).bedrooms_total || '-'} bd • {(data as MLSListing).bathrooms_total || '-'} ba{(data as MLSListing).living_area ? ` • ${(data as MLSListing).living_area?.toLocaleString()} sf` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              {visibleItems.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No properties in current view</p>
                  <p className="text-xs text-muted-foreground mt-1">Try zooming out or panning the map</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
