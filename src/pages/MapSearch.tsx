import { useState, useMemo, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { 
  SlidersHorizontal, X, Map, LayoutGrid, 
  MapPin, Building2, ChevronDown, ChevronUp, Home, Bed, Bath,
  Building, HomeIcon, Warehouse, DollarSign, Search, Navigation
} from "lucide-react";

// SEO: This page is NOINDEX - dynamic map/filter URLs should not be indexed
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
import { MobileMapSearchBar } from "@/components/search/MobileMapSearchBar";
import { MultiSelectFilter, PRICE_RANGE_OPTIONS, priceMatchesRanges } from "@/components/search/MultiSelectFilter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";
import { useEnabledCities } from "@/hooks/useEnabledCities";
import type { CombinedListingsMapRef } from "@/components/map/CombinedListingsMap";

// Lazy load the combined map component
const CombinedListingsMap = lazy(() => 
  import("@/components/map/CombinedListingsMap").then(m => ({ default: m.CombinedListingsMap }))
);

// Session storage key for map state persistence
const MAP_STATE_KEY = "pp_map_state";

interface SavedMapState {
  center: { lat: number; lng: number };
  zoom: number;
  timestamp: number;
}

const CITIES = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", 
  "Port Coquitlam", "Port Moody", "North Vancouver", "West Vancouver",
  "Langley", "Delta", "Abbotsford", "New Westminster", "White Rock"
];

// City coordinates for centering map when navigating from city pages
const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Vancouver": { lat: 49.2827, lng: -123.1207, zoom: 12 },
  "Burnaby": { lat: 49.2488, lng: -122.9805, zoom: 12 },
  "Richmond": { lat: 49.1666, lng: -123.1336, zoom: 12 },
  "Surrey": { lat: 49.1913, lng: -122.8490, zoom: 11 },
  "Coquitlam": { lat: 49.2838, lng: -122.7932, zoom: 12 },
  "Port Coquitlam": { lat: 49.2625, lng: -122.7811, zoom: 13 },
  "Port Moody": { lat: 49.2849, lng: -122.8316, zoom: 13 },
  "North Vancouver": { lat: 49.3165, lng: -123.0688, zoom: 12 },
  "West Vancouver": { lat: 49.3270, lng: -123.1662, zoom: 12 },
  "Langley": { lat: 49.1044, lng: -122.6600, zoom: 12 },
  "Delta": { lat: 49.0847, lng: -123.0586, zoom: 12 },
  "Abbotsford": { lat: 49.0504, lng: -122.3045, zoom: 12 },
  "New Westminster": { lat: 49.2057, lng: -122.9110, zoom: 13 },
  "White Rock": { lat: 49.0253, lng: -122.8029, zoom: 13 },
};

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
type MapMode = "all" | "presale" | "resale" | "assignments";

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
  const isMobileOrTablet = useIsMobileOrTablet();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showCarousel, setShowCarousel] = useState(false); // Hidden by default on mobile, shows when property clicked
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"resale" | "presale" | "assignment" | null>(null);
  const [focusedCarouselItemId, setFocusedCarouselItemId] = useState<string | null>(null); // For tap-to-focus-to-navigate
  const [focusedCarouselItemType, setFocusedCarouselItemType] = useState<"resale" | "presale" | "assignment" | null>(null);
  const [visibleResaleIds, setVisibleResaleIds] = useState<string[]>([]);
  const [visiblePresaleIds, setVisiblePresaleIds] = useState<string[]>([]);
  const [visibleAssignmentIds, setVisibleAssignmentIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isListInteracting, setIsListInteracting] = useState(false); // Pause visible updates during list click

  // MOBILE ONLY: prevent iOS/Android overscroll from revealing body background (white bands)
  useEffect(() => {
    if (!isMobile) return;
    document.documentElement.classList.add("map-overscroll-lock");
    document.body.classList.add("map-overscroll-lock");
    return () => {
      document.documentElement.classList.remove("map-overscroll-lock");
      document.body.classList.remove("map-overscroll-lock");
    };
  }, [isMobile]);
  
  // Check if URL has explicit location params that should override saved state
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlZoom = searchParams.get("zoom");
  const urlCity = searchParams.get("city");
  
  // Determine if we have explicit navigation context from URL
  const hasUrlLocationContext = !!(urlLat && urlLng) || !!urlCity;
  
  // Persisted map state - restored from sessionStorage ONLY if no URL context
  const [savedMapState, setSavedMapState] = useState<SavedMapState | null>(() => {
    // If URL has explicit location context, don't restore saved state
    if (hasUrlLocationContext) {
      console.log("URL has location context, skipping saved state restoration");
      return null;
    }
    
    try {
      const stored = sessionStorage.getItem(MAP_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedMapState;
        // Only use if less than 30 minutes old
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          console.log("Restoring map state:", parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.log("Failed to restore map state:", e);
    }
    return null;
  });
  
  // Compute initial map position from URL params
  const urlDerivedMapState = useMemo((): SavedMapState | null => {
    // Priority 1: Explicit lat/lng in URL
    if (urlLat && urlLng) {
      return {
        center: { lat: parseFloat(urlLat), lng: parseFloat(urlLng) },
        zoom: urlZoom ? parseInt(urlZoom) : 14,
        timestamp: Date.now()
      };
    }
    
    // Priority 2: City name in URL - use city coordinates
    if (urlCity) {
      const cityCoords = CITY_COORDINATES[urlCity];
      if (cityCoords) {
        return {
          center: { lat: cityCoords.lat, lng: cityCoords.lng },
          zoom: cityCoords.zoom,
          timestamp: Date.now()
        };
      }
    }
    
    return null;
  }, [urlLat, urlLng, urlZoom, urlCity]);
  
  // Effective map state: URL params take precedence over saved state
  const effectiveMapState = urlDerivedMapState || savedMapState;
  
  // Callback to save map state when it changes
  const handleMapStateChange = useCallback((center: { lat: number; lng: number }, zoom: number) => {
    const state: SavedMapState = {
      center,
      zoom,
      timestamp: Date.now()
    };
    try {
      sessionStorage.setItem(MAP_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage errors
    }
  }, []);
  
  // Read mode from URL param, sync state when URL changes
  const urlMode = (searchParams.get("mode") as MapMode) || "all";
  const [mapMode, setMapMode] = useState<MapMode>(urlMode);
  
  // Sync mapMode when URL changes (e.g., navigating from another page)
  useEffect(() => {
    setMapMode(urlMode);
  }, [urlMode]);
  
  // Request user location on mount - but only if we don't have any map state context
  useEffect(() => {
    if (locationRequested) return;
    if (effectiveMapState) {
      // Skip geolocation if we have map state (from URL or saved) - user has explicit context
      setLocationRequested(true);
      return;
    }
    setLocationRequested(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("User location obtained:", pos.coords.latitude, pos.coords.longitude);
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.log("Location permission denied or unavailable:", error.message);
          // User denied permission or location unavailable - map will use default view
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    }
  }, [locationRequested, savedMapState]);
  
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

  // handleItemSelect is called when a PIN on the map is clicked
  // It should scroll the list to show the selected card
  const handleItemSelect = useCallback((id: string, type: "resale" | "presale" | "assignment") => {
    setSelectedItemId(id);
    setSelectedItemType(type);
    setFocusedCarouselItemId(id);
    setFocusedCarouselItemType(type);
    setShowCarousel(true);
    
    // Scroll to the card in carousel/list (only when clicking from MAP, not from list)
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

  const handleVisibleItemsChange = useCallback((resaleIds: string[], presaleIds: string[], assignmentIds?: string[]) => {
    // Skip update if user is interacting with the list (prevents card jumping)
    if (isListInteracting) return;
    setVisibleResaleIds(resaleIds);
    setVisiblePresaleIds(presaleIds);
    if (assignmentIds) setVisibleAssignmentIds(assignmentIds);
  }, [isListInteracting]);

  // Hide carousel when user starts panning/zooming the map on mobile
  const handleMapInteraction = useCallback(() => {
    if (isMobile) {
      setShowCarousel(false);
      setFocusedCarouselItemId(null); // Clear focus when map is interacted with
      setFocusedCarouselItemType(null);
    }
  }, [isMobile]);

  // Handle carousel scroll to detect centered item and fly map to it
  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    // Find the card closest to center
    const cards = container.querySelectorAll('[data-item-id]');
    let closestCard: Element | null = null;
    let closestDistance = Infinity;
    
    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
      }
    });
    
    if (closestCard && closestDistance < 80) { // Within threshold
      const itemId = closestCard.getAttribute('data-item-id');
      const itemType = closestCard.getAttribute('data-item-type') as "resale" | "presale";
      
      if (itemId && itemId !== focusedCarouselItemId) {
        setFocusedCarouselItemId(itemId);
        setFocusedCarouselItemType(itemType);
        
        // Fly map to this item's pin
        if (mapNavigationRef.current) {
          mapNavigationRef.current.highlightItem(itemId, itemType);
        }
      }
    }
  }, [focusedCarouselItemId]);

  // Debounced scroll handler
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedCarouselScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(handleCarouselScroll, 100);
  }, [handleCarouselScroll]);

  // Attach scroll listener to carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    carousel.addEventListener('scroll', debouncedCarouselScroll, { passive: true });
    return () => {
      carousel.removeEventListener('scroll', debouncedCarouselScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [debouncedCarouselScroll, showCarousel]);

  // Handle carousel card tap - first tap focuses, second tap navigates
  const handleCarouselCardTap = useCallback((id: string, type: "resale" | "presale" | "assignment", link: string) => {
    if (focusedCarouselItemId === id) {
      // Already focused - navigate to detail page
      navigate(link);
    } else {
      // First tap - focus and fly to pin
      setFocusedCarouselItemId(id);
      setFocusedCarouselItemType(type);
      
      if (mapNavigationRef.current) {
        mapNavigationRef.current.highlightItem(id, type);
      }
    }
  }, [focusedCarouselItemId, navigate]);

  // Handle desktop list card click - same pattern: first click focuses & flies to pin, second click navigates
  const handleDesktopCardClick = useCallback((e: React.MouseEvent, id: string, type: "resale" | "presale" | "assignment", link: string, lat: number | null, lng: number | null) => {
    if (focusedCarouselItemId === id) {
      // Already focused - navigate to detail page (let the link work naturally)
      return;
    }
    
    // First click - prevent navigation, focus and fly to pin
    e.preventDefault();
    
    // Pause visible items updates to prevent card jumping
    setIsListInteracting(true);
    
    setFocusedCarouselItemId(id);
    setFocusedCarouselItemType(type);
    setSelectedItemId(id);
    setSelectedItemType(type);
    
    if (mapNavigationRef.current) {
      // Fly to the location first
      if (lat && lng) {
        mapNavigationRef.current.flyTo(lat, lng, 16);
      }
      // Highlight the pin with animation
      mapNavigationRef.current.highlightItem(id, type);
    }
    
    // Resume visible items updates after fly animation completes
    setTimeout(() => {
      setIsListInteracting(false);
    }, 1000);
  }, [focusedCarouselItemId]);

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

  // Parse multi-select filters from URL (comma-separated)
  const parseMultiParam = (param: string | null): string[] => {
    if (!param || param === "any") return [];
    return param.split(",").filter(Boolean);
  };

  const filters = {
    cities: parseMultiParam(searchParams.get("cities")),
    propertyTypes: parseMultiParam(searchParams.get("types")),
    priceRanges: parseMultiParam(searchParams.get("prices")),
    // Legacy single-value support for backwards compat
    city: searchParams.get("city") || "",
    propertyType: searchParams.get("type") || "",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    beds: searchParams.get("beds") || "any",
    baths: searchParams.get("baths") || "any",
    daysOnSite: searchParams.get("days") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  // Merged cities (combine legacy single city with multi-select)
  const selectedCities = useMemo(() => {
    if (filters.cities.length > 0) return filters.cities;
    if (filters.city && filters.city !== "any") return [filters.city];
    return [];
  }, [filters.cities, filters.city]);

  // Track previous cities to detect user-initiated filter changes
  const prevSelectedCitiesRef = useRef<string[]>([]);
  
  // Fly map to selected cities when city filter changes
  useEffect(() => {
    // Skip if no cities selected or if this is the initial render
    if (selectedCities.length === 0) {
      prevSelectedCitiesRef.current = [];
      return;
    }
    
    // Check if cities actually changed (not just initial mount)
    const citiesChanged = 
      prevSelectedCitiesRef.current.length !== selectedCities.length ||
      !selectedCities.every(c => prevSelectedCitiesRef.current.includes(c));
    
    if (!citiesChanged) return;
    
    prevSelectedCitiesRef.current = selectedCities;
    
    // Wait for map to be ready
    if (!mapNavigationRef.current) return;
    
    if (selectedCities.length === 1) {
      // Single city - fly directly to it
      const cityCoords = CITY_COORDINATES[selectedCities[0]];
      if (cityCoords) {
        mapNavigationRef.current.flyTo(cityCoords.lat, cityCoords.lng, cityCoords.zoom);
      }
    } else {
      // Multiple cities - calculate bounds and fit map to show all
      const validCoords = selectedCities
        .map(city => CITY_COORDINATES[city])
        .filter(Boolean);
      
      if (validCoords.length > 0) {
        // Calculate center of all selected cities
        const avgLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
        const avgLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;
        
        // Use a wider zoom for multiple cities
        const zoom = validCoords.length <= 2 ? 11 : validCoords.length <= 4 ? 10 : 9;
        
        mapNavigationRef.current.flyTo(avgLat, avgLng, zoom);
      }
    }
  }, [selectedCities]);

  // Merged property types
  const selectedPropertyTypes = useMemo(() => {
    if (filters.propertyTypes.length > 0) return filters.propertyTypes;
    if (filters.propertyType && filters.propertyType !== "any") return [filters.propertyType];
    return [];
  }, [filters.propertyTypes, filters.propertyType]);

  // Selected price ranges
  const selectedPriceRanges = filters.priceRanges;

  // Price slider state
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin ? parseInt(filters.priceMin) : MIN_PRICE,
    filters.priceMax ? parseInt(filters.priceMax) : MAX_PRICE,
  ]);

  // Fetch resale listings (2024+ builds only - move-in ready new construction)
  // IMPORTANT: this page is frequently used right after admins change the enabled-city scope.
  // We intentionally keep this query “hot” so the count and markers update immediately.
  const { data: resaleListings, isLoading: resaleLoading } = useQuery<MLSListing[]>({
    queryKey: ["unified-map-resale-2024-multi", selectedCities, selectedPropertyTypes, selectedPriceRanges, filters.beds, filters.baths, filters.daysOnSite, enabledCities],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select(
          "id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, street_suffix, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status, year_built, list_agent_name, list_office_name"
        )
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .gte("year_built", 2024);

      // Filter by selected cities (multi-select)
      if (selectedCities.length > 0) {
        query = query.in("city", selectedCities);
      } else if (enabledCities && enabledCities.length > 0) {
        // Default to enabled cities from admin portal
        query = query.in("city", enabledCities);
      }

      // Property types and price ranges are filtered client-side for multi-select OR logic
      if (filters.baths !== "any") {
        query = query.gte("bathrooms_total", parseInt(filters.baths));
      }
      if (filters.daysOnSite !== "any") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.daysOnSite));
        query = query.gte("list_date", daysAgo.toISOString().split("T")[0]);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }

      // NOTE: The backend caps max rows per request, so we page in chunks and merge.
      // Keep the total bounded for performance.
      const pageSize = 1000;
      const maxRows = 6000;

      const all: MLSListing[] = [];
      for (let offset = 0; offset < maxRows; offset += pageSize) {
        const { data, error } = await query
          .order("list_date", { ascending: false, nullsFirst: false })
          .order("listing_price", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        const chunk = (data || []) as MLSListing[];
        all.push(...chunk);

        if (chunk.length < pageSize) break;
      }

      // De-dupe defensively
      const byId = new globalThis.Map<string, MLSListing>();
      for (const l of all) byId.set(l.id, l);
      let results = Array.from(byId.values());
      
      // Client-side filtering for multi-select property types
      if (selectedPropertyTypes.length > 0) {
        results = results.filter(l => {
          return selectedPropertyTypes.some(type => 
            l.property_type?.toLowerCase().includes(type.toLowerCase()) ||
            l.property_sub_type?.toLowerCase().includes(type.toLowerCase())
          );
        });
      }
      
      // Client-side filtering for multi-select price ranges
      if (selectedPriceRanges.length > 0) {
        results = results.filter(l => priceMatchesRanges(l.listing_price, selectedPriceRanges));
      }
      
      return results;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  // Fetch presale projects
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery<PresaleProject[]>({
    queryKey: ["unified-map-presale-multi", selectedCities, selectedPriceRanges],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .not("map_lat", "is", null)
        .not("map_lng", "is", null);

      // Filter by selected cities
      if (selectedCities.length > 0) {
        query = query.in("city", selectedCities);
      }

      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      let results = data as PresaleProject[];
      
      // Client-side filtering for multi-select price ranges
      if (selectedPriceRanges.length > 0) {
        results = results.filter(p => p.starting_price && priceMatchesRanges(p.starting_price, selectedPriceRanges));
      }
      
      return results;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch assignments (listings table)
  type Assignment = {
    id: string;
    title: string;
    project_name: string;
    city: string;
    neighborhood: string | null;
    assignment_price: number;
    beds: number;
    baths: number;
    interior_sqft: number | null;
    map_lat: number | null;
    map_lng: number | null;
    status: string;
  };

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["unified-map-assignments", selectedCities, filters.beds, filters.baths],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, project_name, city, neighborhood, assignment_price, beds, baths, interior_sqft, map_lat, map_lng, status")
        .eq("status", "published")
        .not("map_lat", "is", null)
        .not("map_lng", "is", null);

      // City filter
      if (selectedCities.length > 0) {
        query = query.in("city", selectedCities);
      }

      // Beds filter
      if (filters.beds && filters.beds !== "any") {
        const bedsNum = parseInt(filters.beds);
        if (bedsNum === 5) {
          query = query.gte("beds", 5);
        } else {
          query = query.eq("beds", bedsNum);
        }
      }

      // Baths filter
      if (filters.baths && filters.baths !== "any") {
        const bathsNum = parseInt(filters.baths);
        if (bathsNum === 4) {
          query = query.gte("baths", 4);
        } else {
          query = query.gte("baths", bathsNum);
        }
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = resaleLoading || presaleLoading || assignmentsLoading;

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

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (!searchQuery.trim()) return assignments;
    
    const q = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.project_name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.neighborhood?.toLowerCase() || "").includes(q)
    );
  }, [assignments, searchQuery]);

  // Visible items based on map viewport and mode
  const visibleResaleListings = useMemo(() => {
    if (mapMode === "presale" || mapMode === "assignments") return [];
    if (visibleResaleIds.length === 0) return filteredResaleListings.slice(0, 30);
    return filteredResaleListings.filter(l => visibleResaleIds.includes(l.id)).slice(0, 30);
  }, [filteredResaleListings, visibleResaleIds, mapMode]);

  const visiblePresaleProjects = useMemo(() => {
    if (mapMode === "resale" || mapMode === "assignments") return [];
    if (visiblePresaleIds.length === 0) return filteredPresaleProjects.slice(0, 30);
    return filteredPresaleProjects.filter(p => visiblePresaleIds.includes(p.id)).slice(0, 30);
  }, [filteredPresaleProjects, visiblePresaleIds, mapMode]);

  const visibleAssignments = useMemo(() => {
    if (mapMode === "resale" || mapMode === "presale") return [];
    if (visibleAssignmentIds.length === 0) return filteredAssignments.slice(0, 30);
    return filteredAssignments.filter(a => visibleAssignmentIds.includes(a.id)).slice(0, 30);
  }, [filteredAssignments, visibleAssignmentIds, mapMode]);

  // Combined visible items for display - with focused item pinned in place and sorted
  const visibleItems = useMemo(() => {
    const items: Array<{ type: "resale" | "presale" | "assignment"; data: MLSListing | PresaleProject | Assignment }> = [];
    
    // Track if focused item is already in visible items
    let focusedItemIncluded = false;
    const focusedId = focusedCarouselItemId;
    
    // Add presale projects
    visiblePresaleProjects.forEach(p => {
      if (p.id === focusedId) focusedItemIncluded = true;
      items.push({ type: "presale", data: p });
    });
    
    // Add resale listings
    visibleResaleListings.forEach(l => {
      if (l.id === focusedId) focusedItemIncluded = true;
      items.push({ type: "resale", data: l });
    });
    
    // Add assignments
    visibleAssignments.forEach(a => {
      if (a.id === focusedId) focusedItemIncluded = true;
      items.push({ type: "assignment", data: a });
    });
    
    // If focused item is not in visible items, find and add it to maintain stability
    if (focusedId && !focusedItemIncluded) {
      const focusedPresale = filteredPresaleProjects.find(p => p.id === focusedId);
      if (focusedPresale) {
        items.unshift({ type: "presale", data: focusedPresale });
      } else {
        const focusedResale = filteredResaleListings.find(l => l.id === focusedId);
        if (focusedResale) {
          items.unshift({ type: "resale", data: focusedResale });
        } else {
          const focusedAssignment = filteredAssignments.find(a => a.id === focusedId);
          if (focusedAssignment) {
            items.unshift({ type: "assignment", data: focusedAssignment });
          }
        }
      }
    }
    
    // Apply sorting based on filter
    const sortedItems = [...items];
    const sortValue = filters.sort;
    
    sortedItems.sort((a, b) => {
      const priceA = a.type === "presale" 
        ? (a.data as PresaleProject).starting_price || 0 
        : a.type === "resale" 
        ? (a.data as MLSListing).listing_price || 0
        : (a.data as Assignment).assignment_price || 0;
      const priceB = b.type === "presale" 
        ? (b.data as PresaleProject).starting_price || 0 
        : b.type === "resale"
        ? (b.data as MLSListing).listing_price || 0
        : (b.data as Assignment).assignment_price || 0;
      
      if (sortValue === "price_asc") {
        return priceA - priceB;
      } else if (sortValue === "price_desc") {
        return priceB - priceA;
      }
      // Default: newest (already sorted by list_date from query)
      return 0;
    });
    
    return sortedItems.slice(0, 40);
  }, [visibleResaleListings, visiblePresaleProjects, visibleAssignments, focusedCarouselItemId, filteredPresaleProjects, filteredResaleListings, filteredAssignments, filters.sort]);

  // Actual count of properties in view (not capped) for display
  const propertiesInViewCount = useMemo(() => {
    const resaleCount = (mapMode === "presale" || mapMode === "assignments") ? 0 : visibleResaleIds.length;
    const presaleCount = (mapMode === "resale" || mapMode === "assignments") ? 0 : visiblePresaleIds.length;
    const assignmentCount = (mapMode === "resale" || mapMode === "presale") ? 0 : visibleAssignmentIds.length;
    return resaleCount + presaleCount + assignmentCount;
  }, [visibleResaleIds, visiblePresaleIds, visibleAssignmentIds, mapMode]);

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
    return presaleProjects.map(p => ({ 
      name: p.name, 
      city: p.city, 
      slug: p.slug,
      map_lat: p.map_lat,
      map_lng: p.map_lng,
    }));
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
      latitude: l.latitude,
      longitude: l.longitude,
    }));
  }, [resaleListings]);

  // Ref for programmatic map navigation
  const mapNavigationRef = useRef<CombinedListingsMapRef>(null);

  const handleSearchSuggestionSelect = useCallback((suggestion: { type: string; value: string; city?: string; label: string; lat?: number; lng?: number }) => {
    if (suggestion.type === "city") {
      // Navigate map to city coordinates
      const cityCoords = CITY_COORDINATES[suggestion.value];
      if (cityCoords && mapNavigationRef.current) {
        mapNavigationRef.current.flyTo(cityCoords.lat, cityCoords.lng, cityCoords.zoom);
        toast.success(`Viewing ${suggestion.value}`);
      }
      updateFilter("city", suggestion.value);
      setSearchQuery("");
    } else if (suggestion.type === "neighborhood") {
      // Navigate to neighborhood (use city coords as fallback)
      if (suggestion.city) {
        const cityCoords = CITY_COORDINATES[suggestion.city];
        if (cityCoords && mapNavigationRef.current) {
          mapNavigationRef.current.flyTo(cityCoords.lat, cityCoords.lng, 13);
        }
        updateFilter("city", suggestion.city);
      }
      setSearchQuery(suggestion.label);
      toast.success(`Viewing ${suggestion.label}`);
    } else if (suggestion.type === "project") {
      // Navigate to project location on map, or go to detail page
      if (suggestion.lat && suggestion.lng && mapNavigationRef.current) {
        mapNavigationRef.current.flyTo(suggestion.lat, suggestion.lng, 16);
        toast.success(`Viewing ${suggestion.label}`);
        setSearchQuery("");
      } else {
        navigate(`/presale-projects/${suggestion.value}`);
      }
    } else if (suggestion.type === "listing") {
      // Navigate to listing location on map
      if (suggestion.lat && suggestion.lng && mapNavigationRef.current) {
        mapNavigationRef.current.flyTo(suggestion.lat, suggestion.lng, 17);
        toast.success(`Viewing ${suggestion.label}`);
        setSearchQuery("");
      } else {
        navigate(`/properties/${suggestion.value}`);
      }
    }
  }, [navigate, updateFilter]);

  // Handle location button in search bar
  const handleLocationRequest = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    toast.loading("Finding your location...", { id: "location" });
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (mapNavigationRef.current) {
          mapNavigationRef.current.flyTo(latitude, longitude, 14);
        }
        toast.success("Location found!", { id: "location" });
      },
      (error) => {
        console.log("Geolocation error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable location in your browser settings.", { id: "location" });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location unavailable. Please try again.", { id: "location" });
        } else {
          toast.error("Could not get your location. Please try again.", { id: "location" });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (mapMode !== "all") {
      newParams.set("mode", mapMode);
    }
    setSearchParams(newParams);
    setSearchQuery("");
  };

  const activeFilterCount = [
    selectedCities.length > 0,
    selectedPropertyTypes.length > 0,
    selectedPriceRanges.length > 0,
    filters.beds !== "any",
    filters.baths !== "any",
    filters.daysOnSite !== "any",
  ].filter(Boolean).length;

  // Multi-select filter update handlers
  const updateMultiFilter = useCallback((key: string, values: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    // Clear legacy single-value params when using multi-select
    if (key === "cities") newParams.delete("city");
    if (key === "types") newParams.delete("type");
    if (key === "prices") {
      newParams.delete("priceMin");
      newParams.delete("priceMax");
    }
    
    if (values.length === 0) {
      newParams.delete(key);
    } else {
      newParams.set(key, values.join(","));
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://presaleproperties.com/map-search" />
      </Helmet>

        {/* Main container - edge-to-edge on mobile/tablet with safe area support */}
        {/* Uses map-page-root class for mobile/tablet full-bleed, lg:relative for desktop standard layout */}
        <div className="map-page-root lg:relative lg:h-[100dvh] lg:bg-background flex flex-col overflow-hidden">
        {/* Desktop only header */}
        <div className="hidden lg:block">
          <ConversionHeader alwaysVisible stickyOnMobile />
        </div>

        {/* Mobile/Tablet: Floating Search Bar with Autocomplete */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          {/* Mobile/Tablet: Search bar with safe area awareness - positioned below notch/status bar */}
          <div 
            className="lg:hidden absolute left-0 right-0 z-[1002] px-3 map-safe-left map-safe-right" 
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
            <MobileMapSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSuggestionSelect={handleSearchSuggestionSelect}
              onLocationRequest={handleLocationRequest}
              cities={CITIES}
              cityCoordinates={CITY_COORDINATES}
              neighborhoods={neighborhoodsData || []}
              projects={projectsForSearch}
              listings={listingsForSearch}
              homeButton={
                <Link to="/">
                  <button className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <Home className="h-4 w-4 text-muted-foreground/70" />
                  </button>
                </Link>
              }
              filterButton={
                <SheetTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground/70" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
              }
              listButton={
                <Link to={mapMode === "presale" ? "/presale-projects" : "/resale"}>
                  <button className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground/70" />
                  </button>
                </Link>
              }
            />
          </div>
          
          {/* Filter Sheet Content */}
          <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-3xl">
            <SheetHeader className="pb-4 border-b">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
              <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto py-5 space-y-6">
              {/* City - Multi-select at top */}
              <div>
                <label className="text-sm font-semibold mb-3 block">City</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        onClick={() => {
                          if (isSelected) {
                            updateMultiFilter("cities", selectedCities.filter(c => c !== city));
                          } else {
                            updateMultiFilter("cities", [...selectedCities, city]);
                          }
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary text-primary"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
                {selectedCities.length > 0 && (
                  <button 
                    onClick={() => updateMultiFilter("cities", [])}
                    className="text-xs text-muted-foreground mt-3 hover:text-foreground"
                  >
                    Clear cities
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="border-t pt-5">
                <label className="text-sm font-semibold mb-3 block">Price Range</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="No Min"
                    value={priceRange[0] > MIN_PRICE ? formatPriceLabel(priceRange[0]) : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val) setPriceRange([parseInt(val), priceRange[1]]);
                    }}
                    onBlur={applyPriceFilter}
                    className="h-12 text-base rounded-xl"
                  />
                  <span className="text-muted-foreground font-medium">—</span>
                  <Input
                    type="text"
                    placeholder="No Max"
                    value={priceRange[1] < MAX_PRICE ? formatPriceLabel(priceRange[1]) : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val) setPriceRange([priceRange[0], parseInt(val)]);
                    }}
                    onBlur={applyPriceFilter}
                    className="h-12 text-base rounded-xl"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="border-t pt-5">
                <label className="text-sm font-semibold mb-3 block">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateFilter("type", opt.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          filters.propertyType === opt.value
                            ? "bg-primary/15 border-primary text-primary"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="border-t pt-5">
                <label className="text-sm font-semibold mb-3 block">Bedrooms</label>
                <div className="flex flex-wrap gap-2">
                  {BED_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter("beds", opt.value)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium min-w-[52px] transition-all ${
                        filters.beds === opt.value
                          ? "bg-primary/15 border-primary text-primary"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="border-t pt-5">
                <label className="text-sm font-semibold mb-3 block">Bathrooms</label>
                <div className="flex flex-wrap gap-2">
                  {BATH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter("baths", opt.value)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium min-w-[52px] transition-all ${
                        filters.baths === opt.value
                          ? "bg-primary/15 border-primary text-primary"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="border-t pt-4 flex-row gap-3 pb-[env(safe-area-inset-bottom)]">
              <Button 
                variant="outline" 
                onClick={() => {
                  clearAllFilters();
                  setPriceRange([MIN_PRICE, MAX_PRICE]);
                }} 
                className="flex-1 h-12 rounded-xl"
              >
                Clear All
              </Button>
              <Button onClick={() => setMobileFiltersOpen(false)} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90">
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Main Content - Map + Panel Layout */}
        <div className="flex-1 flex overflow-hidden relative isolate">
          {/* Map Section - ~60% width when list is shown (REW-style ratio) */}
          <div className={`relative transition-all duration-300 h-full w-full ${showList ? "lg:w-[60%]" : "lg:w-full"}`}>
            {/* Unified Mode Toggle - Floating on map */}
            {/* Mobile/Tablet: Always sit below the search bar (avoid overlap on tablet browser UI) */}
            <div 
              className="absolute z-[1000] lg:hidden left-1/2 -translate-x-1/2"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px + 72px)' }}
            >
              <UnifiedMapToggle
                mode={mapMode}
                onModeChange={handleModeChange}
                presaleCount={filteredPresaleProjects?.length || 0}
                resaleCount={filteredResaleListings?.length || 0}
              />
            </div>
            
            {/* Desktop: Centered at top of map */}
            <div className="hidden lg:block absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
              <UnifiedMapToggle
                mode={mapMode}
                onModeChange={handleModeChange}
                presaleCount={filteredPresaleProjects?.length || 0}
                resaleCount={filteredResaleListings?.length || 0}
              />
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
                      ref={mapNavigationRef}
                      resaleListings={filteredResaleListings}
                      presaleProjects={filteredPresaleProjects}
                      assignments={filteredAssignments}
                      mode={mapMode}
                      onListingSelect={handleItemSelect}
                      onVisibleItemsChange={handleVisibleItemsChange}
                      onMapInteraction={handleMapInteraction}
                      onMapStateChange={handleMapStateChange}
                      disablePopupsOnMobile={isMobileOrTablet}
                      centerOnUserLocation={!effectiveMapState}
                      initialUserLocation={userLocation}
                      savedMapState={effectiveMapState}
                    />
                  )}
                </Suspense>
              </SafeMapWrapper>
            </div>

            {/* Show Carousel Button - When hidden - Premium Apple Maps style */}
            {/* Positioned above safe area with enough clearance for tablets */}
            {!showCarousel && visibleItems.length > 0 && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 z-[1001] lg:hidden"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              >
                <button
                  onClick={() => setShowCarousel(true)}
                  className="px-5 py-3 rounded-2xl bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 flex items-center gap-2 active:scale-[0.98] transition-transform"
                  aria-label="Show properties"
                >
                  <span className="text-sm font-semibold text-foreground">{propertiesInViewCount} Properties</span>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Bottom Carousel - Mobile/Tablet - Floating above map, Premium Apple Maps style */}
            {/* Use safe bottom inset with minimum padding to prevent cutoff on tablets */}
            {showCarousel && visibleItems.length > 0 && (
              <div 
                className="absolute bottom-0 left-0 right-0 z-[1000] lg:hidden pointer-events-none"
              >
                {/* Carousel Header */}
                <div className="flex items-center justify-between pb-2 pt-1 pointer-events-auto" style={{ paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 16px)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 16px)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground bg-white/95 dark:bg-background/95 backdrop-blur-xl px-4 py-2 rounded-xl shadow-xl border border-black/5 dark:border-white/10">
                      {propertiesInViewCount} Properties
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCarousel(false)}
                    className="w-10 h-10 rounded-xl bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-black/5 dark:active:bg-white/10 transition-colors"
                    aria-label="Hide properties"
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Carousel Cards */}
                <div 
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory pointer-events-auto"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 16px)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 16px)' }}
                >
                  {visibleItems.map((item) => {
                    const isPresale = item.type === "presale";
                    const isAssignment = item.type === "assignment";
                    const data = item.data;
                    const id = item.type === "presale" 
                      ? (data as PresaleProject).id 
                      : item.type === "assignment"
                      ? (data as Assignment).id
                      : (data as MLSListing).id;
                    const link = item.type === "presale" 
                      ? `/presale-projects/${(data as PresaleProject).slug}` 
                      : item.type === "assignment"
                      ? `/assignments/${(data as Assignment).id}`
                      : `/resale/${(data as MLSListing).listing_key}`;
                    const isFocused = focusedCarouselItemId === id;
                    
                    return (
                      <div 
                        key={`${item.type}-${id}`}
                        data-item-id={id}
                        data-item-type={item.type}
                        onClick={() => handleCarouselCardTap(id, item.type, link)}
                        className="snap-start shrink-0 w-[240px] sm:w-[280px] cursor-pointer"
                      >
                        <div className={`bg-background/95 backdrop-blur-xl rounded-2xl shadow-lg border overflow-hidden transition-all duration-200 ${
                          isFocused 
                            ? 'border-primary ring-2 ring-primary/30 scale-[1.02]' 
                            : selectedItemId === id 
                              ? 'border-primary/50 ring-1 ring-primary/20' 
                              : 'border-border/30 active:border-primary/50'
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
                            <Badge className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                              isPresale 
                                ? 'bg-foreground/90 text-background' 
                                : isAssignment
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-primary/90 text-primary-foreground'
                            }`}>
                              {isPresale ? 'PRESALE' : isAssignment ? 'ASSIGNMENT' : 'MOVE-IN'}
                            </Badge>
                            {/* Tap indicator for focused card */}
                            {isFocused && (
                              <div className="absolute bottom-2 right-2 bg-foreground/90 text-background text-[9px] font-semibold px-2 py-1 rounded-md">
                                TAP TO VIEW
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-1">
                            {/* Price */}
                            <div className="font-bold text-foreground text-lg">
                              {isPresale 
                                ? formatPrice((data as PresaleProject).starting_price)
                                : isAssignment
                                ? formatPrice((data as Assignment).assignment_price)
                                : formatPrice((data as MLSListing).listing_price)
                              }
                            </div>
                            
                            {/* Name/Address */}
                            <h4 className="font-medium text-foreground text-sm line-clamp-1">
                              {isPresale 
                                ? (data as PresaleProject).name 
                                : isAssignment
                                ? (data as Assignment).project_name
                                : getResaleAddress(data as MLSListing)}
                            </h4>
                            
                            {/* Location */}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">
                                {isPresale 
                                  ? `${(data as PresaleProject).neighborhood}, ${(data as PresaleProject).city}`
                                  : isAssignment
                                  ? `${(data as Assignment).neighborhood || (data as Assignment).city}`
                                  : `${(data as MLSListing).neighborhood || (data as MLSListing).city}`
                                }
                              </span>
                            </div>
                            
                            {/* Specs for resale and assignment */}
                            {!isPresale && !isAssignment && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                                {(data as MLSListing).bedrooms_total && (
                                  <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" /> {(data as MLSListing).bedrooms_total}
                                  </span>
                                )}
                                {(data as MLSListing).bathrooms_total && (
                                  <span className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" /> {(data as MLSListing).bathrooms_total}
                                  </span>
                                )}
                                {(data as MLSListing).living_area && (
                                  <span>{(data as MLSListing).living_area?.toLocaleString()} sf</span>
                                )}
                              </div>
                            )}
                            
                            {/* Specs for assignment */}
                            {isAssignment && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Bed className="h-3 w-3" /> {(data as Assignment).beds}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" /> {(data as Assignment).baths}
                                </span>
                                {(data as Assignment).interior_sqft && (
                                  <span>{(data as Assignment).interior_sqft?.toLocaleString()} sf</span>
                                )}
                              </div>
                            )}
                            
                            {/* Status for presale */}
                            {isPresale && (
                              <div className="text-xs text-muted-foreground pt-0.5 capitalize">
                                {(data as PresaleProject).status?.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop List Panel - ~40% width for REW-style layout */}
          <div className={`hidden lg:flex flex-col border-l border-border bg-background transition-all duration-300 ease-out ${
            showList ? "w-[40%] min-w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}>
            {/* Top Bar - Search + Filter + Quick Filters */}
            <div className="shrink-0 border-b border-border bg-background relative z-50">
              {/* Search Bar Row */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-3">
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
                <Sheet open={desktopFiltersOpen} onOpenChange={setDesktopFiltersOpen}>
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
                    
                    <div className="flex-1 overflow-y-auto py-6 space-y-6">
                      {/* City Multi-Select at top */}
                      <div>
                        <label className="text-base font-semibold mb-3 block">City</label>
                        <div className="flex flex-wrap gap-2">
                          {CITIES.map((city) => {
                            const isSelected = selectedCities.includes(city);
                            return (
                              <button
                                key={city}
                                onClick={() => {
                                  if (isSelected) {
                                    updateMultiFilter("cities", selectedCities.filter(c => c !== city));
                                  } else {
                                    updateMultiFilter("cities", [...selectedCities, city]);
                                  }
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border hover:border-foreground/30 text-foreground"
                                }`}
                              >
                                {city}
                              </button>
                            );
                          })}
                        </div>
                        {selectedCities.length > 0 && (
                          <button 
                            onClick={() => updateMultiFilter("cities", [])}
                            className="text-xs text-muted-foreground mt-2 hover:text-foreground"
                          >
                            Clear cities
                          </button>
                        )}
                      </div>

                      {/* Price Range Section */}
                      <div className="border-t pt-6">
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
                        onClick={() => setDesktopFiltersOpen(false)} 
                        className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                      >
                        DONE
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Quick Filters Row - Multi-Select for City, Home Type, Price Range + Bed/Bath */}
              <div className="flex items-center gap-2 px-3 pb-2.5 relative z-50">
                {/* City Multi-Select */}
                <MultiSelectFilter
                  options={CITIES.map(city => ({ value: city, label: city }))}
                  selected={selectedCities}
                  onChange={(values) => updateMultiFilter("cities", values)}
                  placeholder="Cities"
                  icon={MapPin}
                  allLabel="All Cities"
                />
                
                {/* Home Type Multi-Select */}
                <MultiSelectFilter
                  options={PROPERTY_TYPES.filter(t => t.value !== "any").map(opt => ({ 
                    value: opt.value, 
                    label: opt.label,
                    icon: opt.icon || undefined
                  }))}
                  selected={selectedPropertyTypes}
                  onChange={(values) => updateMultiFilter("types", values)}
                  placeholder="Home Type"
                  icon={Home}
                  allLabel="Any Type"
                />
                
                {/* Price Range Multi-Select */}
                <MultiSelectFilter
                  options={PRICE_RANGE_OPTIONS}
                  selected={selectedPriceRanges}
                  onChange={(values) => updateMultiFilter("prices", values)}
                  placeholder="Price"
                  icon={DollarSign}
                  allLabel="Any Price"
                />
                
                {/* Bedrooms Dropdown */}
                <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
                  <SelectTrigger className={cn(
                    "h-8 text-xs min-w-[90px] font-normal rounded-md border bg-background hover:bg-accent hover:text-accent-foreground [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:gap-1.5",
                    filters.beds !== "any" && "border-primary/50 bg-primary/5"
                  )}>
                    <Bed className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{filters.beds === "any" ? "Beds" : filters.beds === "0" ? "Studio" : `${filters.beds}+`}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-[9999]" position="popper" sideOffset={4}>
                    {BED_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value === "any" ? "Any Beds" : opt.label === "Studio" ? "Studio" : `${opt.label}+ Bed`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Bathrooms Dropdown */}
                <Select value={filters.baths} onValueChange={(v) => updateFilter("baths", v)}>
                  <SelectTrigger className={cn(
                    "h-8 text-xs min-w-[90px] font-normal rounded-md border bg-background hover:bg-accent hover:text-accent-foreground [&>span]:flex [&>span]:flex-row [&>span]:items-center [&>span]:gap-1.5",
                    filters.baths !== "any" && "border-primary/50 bg-primary/5"
                  )}>
                    <Bath className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{filters.baths === "any" ? "Baths" : `${filters.baths}+`}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-[9999]" position="popper" sideOffset={4}>
                    {BATH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value === "any" ? "Any Baths" : `${opt.label} Bath`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Clear Filters - only show if filters active */}
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => {
                      clearAllFilters();
                      setPriceRange([MIN_PRICE, MAX_PRICE]);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results Header - Count + Sort + Map/List Toggle */}
            <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-muted/30 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {propertiesInViewCount > 0 ? propertiesInViewCount : totalCount} {propertiesInViewCount > 0 ? "in view" : "Results"}
                </span>
                <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                  <SelectTrigger className="w-[110px] h-7 text-xs border border-border bg-background hover:bg-muted px-2 gap-1 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-[100]">
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
            <div ref={desktopListRef} className="flex-1 overflow-y-auto p-4 relative z-0">
              <div className="grid grid-cols-2 gap-4">
                {visibleItems.map((item) => {
                  const isPresale = item.type === "presale";
                  const isAssignment = item.type === "assignment";
                  const data = item.data;
                  const id = item.type === "presale" 
                    ? (data as PresaleProject).id 
                    : item.type === "assignment"
                    ? (data as Assignment).id
                    : (data as MLSListing).id;
                  const link = item.type === "presale" 
                    ? `/presale-projects/${(data as PresaleProject).slug}` 
                    : item.type === "assignment"
                    ? `/assignments/${(data as Assignment).id}`
                    : `/resale/${(data as MLSListing).listing_key}`;
                  const lat = item.type === "presale" 
                    ? (data as PresaleProject).map_lat 
                    : item.type === "assignment"
                    ? (data as Assignment).map_lat
                    : (data as MLSListing).latitude;
                  const lng = item.type === "presale" 
                    ? (data as PresaleProject).map_lng 
                    : item.type === "assignment"
                    ? (data as Assignment).map_lng
                    : (data as MLSListing).longitude;
                  const isFocused = focusedCarouselItemId === id;
                  
                  return (
                    <Link 
                      key={`${item.type}-${id}`}
                      to={link}
                      data-item-id={id}
                      onClick={(e) => handleDesktopCardClick(e, id, item.type, link, lat, lng)}
                    >
                      <div className={`rounded-xl border overflow-hidden transition-all hover:shadow-lg group bg-card ${
                        isFocused 
                          ? 'border-primary ring-2 ring-primary/30 shadow-lg' 
                          : selectedItemId === id 
                            ? 'border-primary/50 ring-1 ring-primary/20' 
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
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          {/* Badge overlay */}
                          <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 font-semibold shadow-md ${
                            isPresale 
                              ? 'bg-foreground text-background' 
                              : isAssignment
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {isPresale ? 'PRESALE' : isAssignment ? 'ASSIGNMENT' : 'MOVE-IN'}
                          </Badge>
                          {/* Click hint for focused item */}
                          {isFocused && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none animate-fade-in">
                              <span className="text-xs font-semibold text-primary bg-background/90 px-3 py-1.5 rounded-full shadow-md">
                                Click to view details
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content - REW-style compact info */}
                        <div className="p-2.5 space-y-1">
                          {/* Price - Prominent */}
                          <div className="font-bold text-foreground text-base leading-tight">
                            {isPresale
                              ? formatPrice((data as PresaleProject).starting_price)
                              : isAssignment
                              ? formatPrice((data as Assignment).assignment_price)
                              : formatPrice((data as MLSListing).listing_price)
                            }
                          </div>
                          
                          {/* Address */}
                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                            {isPresale 
                              ? (data as PresaleProject).name 
                              : isAssignment
                              ? (data as Assignment).project_name
                              : getResaleAddress(data as MLSListing)}
                          </h4>
                          
                          {/* Location */}
                          <div className="text-muted-foreground text-xs line-clamp-1">
                            {isPresale 
                              ? `${(data as PresaleProject).neighborhood} • ${(data as PresaleProject).city}`
                              : isAssignment
                              ? `${(data as Assignment).neighborhood || (data as Assignment).city}`
                              : `${(data as MLSListing).neighborhood || (data as MLSListing).city}`
                            }
                          </div>
                          
                          {/* Specs for resale */}
                          {!isPresale && !isAssignment && (
                            <div className="text-muted-foreground text-xs">
                              {(data as MLSListing).bedrooms_total || '-'} bd • {(data as MLSListing).bathrooms_total || '-'} ba{(data as MLSListing).living_area ? ` • ${(data as MLSListing).living_area?.toLocaleString()} sf` : ''}
                            </div>
                          )}
                          
                          {/* Specs for assignments */}
                          {isAssignment && (
                            <div className="text-muted-foreground text-xs">
                              {(data as Assignment).beds} bd • {(data as Assignment).baths} ba{(data as Assignment).interior_sqft ? ` • ${(data as Assignment).interior_sqft?.toLocaleString()} sf` : ''}
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
