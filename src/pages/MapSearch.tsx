import { useState, useMemo, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { generateProjectUrl } from "@/lib/seoUrls";
import { getListingUrl } from "@/lib/propertiesUrls";
import { Helmet } from "@/components/seo/Helmet";
import { toast } from "sonner";
import { 
  SlidersHorizontal, X, Map, LayoutGrid, Menu,
  MapPin, Building2, ChevronDown, ChevronUp, Home, Bed, Bath,
  Building, HomeIcon, Warehouse, DollarSign, Search, Navigation, Lock,
  PanelRightClose, PanelRightOpen
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
import { MobileMapFilters } from "@/components/map/MobileMapFilters";
import { MobileMapNavDrawer } from "@/components/map/MobileMapNavDrawer";
import { MapSearchBar } from "@/components/search/MapSearchBar";
import { MobileMapSearchBar } from "@/components/search/MobileMapSearchBar";
import { CityMultiSelectDropdown } from "@/components/search/CityMultiSelectDropdown";
import { MultiSelectFilter, PRICE_RANGE_OPTIONS, priceMatchesRanges } from "@/components/search/MultiSelectFilter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";
import { useEnabledCities } from "@/hooks/useEnabledCities";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { buildGridUrlFromMapFilters } from "@/lib/filterSync";
import { useMinYearBuilt, DEFAULT_MIN_YEAR_BUILT } from "@/hooks/useMinYearBuilt";
import type { CombinedListingsMapRef } from "@/components/map/CombinedListingsMap";

// Lazy load the combined map component
const CombinedListingsMap = lazy(() => 
  import("@/components/map/CombinedListingsMap").then(m => ({ default: m.CombinedListingsMap }))
);

// Session storage key for map state persistence
const MAP_STATE_KEY = "pp_map_state";
const MAP_UI_STATE_KEY = "pp_map_ui_state";

interface SavedMapState {
  center: { lat: number; lng: number };
  zoom: number;
  timestamp: number;
}

interface SavedUIState {
  selectedItemId: string | null;
  selectedItemType: "resale" | "presale" | "assignment" | null;
  focusedItemId: string | null;
  focusedItemType: "resale" | "presale" | "assignment" | null;
  showCarousel: boolean;
  carouselScrollLeft: number;
  desktopScrollTop: number;
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
  first_photo_url?: string | null;
};

const getResaleListingAddress = (listing: MLSListing): string => {
  const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
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

// Helper to restore UI state from sessionStorage
const getRestoredUIState = (): SavedUIState | null => {
  try {
    const stored = sessionStorage.getItem(MAP_UI_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SavedUIState;
      // Only use if less than 30 minutes old
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
};

export default function MapSearch() {
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();
  const { isVerified: isVerifiedAgent } = useVerifiedAgent();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  
  // Get admin-controlled minimum year built
  const { data: adminMinYear = DEFAULT_MIN_YEAR_BUILT } = useMinYearBuilt();
  
  // Refs defined early for state restoration
  const carouselRef = useRef<HTMLDivElement>(null);
  const desktopListRef = useRef<HTMLDivElement>(null);
  const hasRestoredScrollRef = useRef(false);
  
  // Restore UI state from sessionStorage for seamless back navigation
  const restoredUIState = useMemo(() => getRestoredUIState(), []);
  
  const [showCarousel, setShowCarousel] = useState(() => restoredUIState?.showCarousel ?? false);
  // Don't restore selected/focused item states - start fresh with no selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"resale" | "presale" | "assignment" | null>(null);
  const [focusedCarouselItemId, setFocusedCarouselItemId] = useState<string | null>(null);
  const [focusedCarouselItemType, setFocusedCarouselItemType] = useState<"resale" | "presale" | "assignment" | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredItemType, setHoveredItemType] = useState<"resale" | "presale" | "assignment" | null>(null);
  const [visibleResaleIds, setVisibleResaleIds] = useState<string[]>([]);
  const [visiblePresaleIds, setVisiblePresaleIds] = useState<string[]>([]);
  const [visibleAssignmentIds, setVisibleAssignmentIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isListInteracting, setIsListInteracting] = useState(false);
  // Initialize mapCenter from saved/URL state or default Vancouver center
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(() => {
    // Try to get center from saved state
    try {
      const stored = sessionStorage.getItem(MAP_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedMapState;
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.center;
        }
      }
    } catch (e) {}
    // Default to Vancouver center
    return { lat: 49.2827, lng: -123.1207 };
  });
  
  // Save UI state to sessionStorage whenever it changes
  const saveUIStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Debounce to avoid too many writes
    if (saveUIStateTimeoutRef.current) clearTimeout(saveUIStateTimeoutRef.current);
    saveUIStateTimeoutRef.current = setTimeout(() => {
      const state: SavedUIState = {
        selectedItemId,
        selectedItemType,
        focusedItemId: focusedCarouselItemId,
        focusedItemType: focusedCarouselItemType,
        showCarousel,
        carouselScrollLeft: carouselRef.current?.scrollLeft ?? 0,
        desktopScrollTop: desktopListRef.current?.scrollTop ?? 0,
        timestamp: Date.now()
      };
      try {
        sessionStorage.setItem(MAP_UI_STATE_KEY, JSON.stringify(state));
      } catch (e) {
        // Ignore storage errors
      }
    }, 200);
    
    return () => {
      if (saveUIStateTimeoutRef.current) clearTimeout(saveUIStateTimeoutRef.current);
    };
  }, [selectedItemId, selectedItemType, focusedCarouselItemId, focusedCarouselItemType, showCarousel]);
  // MOBILE + TABLET: prevent iOS/Android overscroll from revealing body background (white bands)
  useEffect(() => {
    if (!isMobileOrTablet) return;
    document.documentElement.classList.add("map-overscroll-lock");
    document.body.classList.add("map-overscroll-lock");
    return () => {
      document.documentElement.classList.remove("map-overscroll-lock");
      document.body.classList.remove("map-overscroll-lock");
    };
  }, [isMobileOrTablet]);
  
  // Check if URL has explicit location params that should override saved state
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlZoom = searchParams.get("zoom");
  const urlCity = searchParams.get("city");
  const urlCities = searchParams.get("cities");
  
  // Determine if we have explicit navigation context from URL
  // Note: "cities" (plural) is a filter param, not a navigation context — don't block saved state for it
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
    // Track center for distance-based sorting in carousel
    setMapCenter(center);
    
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

  // Embed mode: hide site header + mode toggle (used by /assignments page iframe)
  const isEmbed = searchParams.get("embed") === "1";
  
  // Sync mapMode when URL changes (e.g., navigating from another page)
  useEffect(() => {
    setMapMode(urlMode);
  }, [urlMode]);
  
  // Request user location on mount - but only if we don't have any map state context
  // IMPORTANT: Skip geolocation entirely if we have saved state or URL params to prevent map jumping
  useEffect(() => {
    if (locationRequested) return;
    
    // Skip geolocation if we have ANY map state context (prevents unwanted map movement on back-nav)
    if (effectiveMapState || savedMapState || urlDerivedMapState) {
      console.log("Skipping geolocation - map state exists");
      setLocationRequested(true);
      return;
    }
    
    setLocationRequested(true);
    
    // Only request location for completely fresh visits with no context
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
          enableHighAccuracy: false, // Use coarse location for faster response
          timeout: 5000, // Shorter timeout
          maximumAge: 300000 // Accept cached location for 5 minutes
        }
      );
    }
  }, [locationRequested, savedMapState, effectiveMapState, urlDerivedMapState]);

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

  // Handle pin hover → highlight card and scroll into view
  const handlePinHover = useCallback((id: string | null, type: "resale" | "presale" | "assignment" | null) => {
    setHoveredItemId(id);
    setHoveredItemType(type);
    if (id && desktopListRef.current) {
      const cardElement = desktopListRef.current.querySelector(`[data-item-id="${id}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  // Handle card hover → highlight pin on map (desktop only)
  const handleCardHover = useCallback((id: string | null, type: "resale" | "presale" | "assignment" | null) => {
    setHoveredItemId(id);
    setHoveredItemType(type);
    if (id && type && mapNavigationRef.current) {
      mapNavigationRef.current.highlightItem(id, type);
    } else if (!id && mapNavigationRef.current) {
      mapNavigationRef.current.clearHighlight();
    }
  }, []);

  // Track if we're in initial load state to prevent auto-selection
  // IMPORTANT: Skip this guard when restoring from back-navigation (savedMapState exists)
  // so the grid populates immediately instead of being blank for 1 second
  const isInitialLoadRef = useRef(!savedMapState);
  useEffect(() => {
    if (!isInitialLoadRef.current) return; // Already cleared for back-nav
    // Clear initial load flag after a short delay to allow map to stabilize
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleVisibleItemsChange = useCallback((resaleIds: string[], presaleIds: string[], assignmentIds?: string[]) => {
    // Skip update if user is interacting with the list (prevents card jumping)
    if (isListInteracting) return;
    
    // During initial load, don't update visible items (prevents unwanted selections)
    if (isInitialLoadRef.current) return;
    
    setVisibleResaleIds(resaleIds);
    setVisiblePresaleIds(presaleIds);
    if (assignmentIds) setVisibleAssignmentIds(assignmentIds);
  }, [isListInteracting]);

  // Hide carousel when user starts panning/zooming the map on mobile
  // IMPORTANT: Only hide on actual drag/pan gestures, not just touches (prevents accidental hiding)
  const mapDragStartedRef = useRef(false);
  const mapDragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleMapInteraction = useCallback(() => {
    // Mark that a drag has started - we'll only hide carousel after actual movement
    mapDragStartedRef.current = true;
    
    // Clear any existing timeout
    if (mapDragTimeoutRef.current) {
      clearTimeout(mapDragTimeoutRef.current);
    }
    
    // Use a longer delay on mobile to better distinguish tap from drag
    const delayMs = isMobileOrTablet ? 250 : 150;
    mapDragTimeoutRef.current = setTimeout(() => {
      if (mapDragStartedRef.current && isMobile) {
        setShowCarousel(false);
        setFocusedCarouselItemId(null);
        setFocusedCarouselItemType(null);
      }
      mapDragStartedRef.current = false;
    }, delayMs);
  }, [isMobile, isMobileOrTablet]);

  // Handle carousel scroll to detect centered item and update highlight
  // IMPORTANT: On mobile, do NOT fly map - just update highlight state to prevent jitter
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
      const itemType = closestCard.getAttribute('data-item-type') as "resale" | "presale" | "assignment";
      
      if (itemId && itemId !== focusedCarouselItemId) {
        setFocusedCarouselItemId(itemId);
        setFocusedCarouselItemType(itemType);
        
        // On mobile/tablet: Do NOT call highlightItem (which flies the map)
        // This prevents the jittery feedback loop between carousel scroll and map movement
        // The pin highlight will be handled via the highlightedItemId prop instead
        // Desktop still gets the fly-to behavior
        if (!isMobileOrTablet && mapNavigationRef.current) {
          mapNavigationRef.current.highlightItem(itemId, itemType);
        }
      }
    }
  }, [focusedCarouselItemId, isMobileOrTablet]);

  // Debounced scroll handler - longer debounce on mobile to prevent jitter
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedCarouselScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    // Longer debounce on mobile for stability
    const debounceMs = isMobileOrTablet ? 200 : 100;
    scrollTimeoutRef.current = setTimeout(handleCarouselScroll, debounceMs);
  }, [handleCarouselScroll, isMobileOrTablet]);

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

  // Handle carousel card tap - navigate directly to property detail page
  const handleCarouselCardTap = useCallback((id: string, type: "resale" | "presale" | "assignment", link: string) => {
    // Navigate directly to property page
    navigate(link);
  }, [navigate]);

  // Handle desktop list card click - navigate directly to property detail page
  // The Link component handles navigation naturally; this only handles assignment agent verification
  const handleDesktopCardClick = useCallback((e: React.MouseEvent, id: string, type: "resale" | "presale" | "assignment", link: string, lat: number | null, lng: number | null) => {
    // Just let the Link navigate naturally - no map interaction needed
    // Assignment verification is handled in the onClick before this is called
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
    // Year built filters
    yearBuiltMin: searchParams.get("yearMin") ? parseInt(searchParams.get("yearMin")!) : null,
    yearBuiltMax: searchParams.get("yearMax") ? parseInt(searchParams.get("yearMax")!) : null,
    // Square footage filters
    sqftMin: searchParams.get("sqftMin") ? parseInt(searchParams.get("sqftMin")!) : null,
    sqftMax: searchParams.get("sqftMax") ? parseInt(searchParams.get("sqftMax")!) : null,
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

  // Price slider state - sync from URL params so preset buttons update the slider
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin ? parseInt(filters.priceMin) : MIN_PRICE,
    filters.priceMax ? parseInt(filters.priceMax) : MAX_PRICE,
  ]);

  // Keep priceRange local state in sync with URL params (preset buttons update URL directly)
  useEffect(() => {
    const urlMin = filters.priceMin ? parseInt(filters.priceMin) : MIN_PRICE;
    const urlMax = filters.priceMax ? parseInt(filters.priceMax) : MAX_PRICE;
    setPriceRange(prev => {
      if (prev[0] !== urlMin || prev[1] !== urlMax) {
        return [urlMin, urlMax];
      }
      return prev;
    });
  }, [filters.priceMin, filters.priceMax]);

  // Fetch resale listings via optimized RPC (server-side filtering, no photos JSON blob)
  const { data: resaleListings, isLoading: resaleLoading, isFetching: resaleFetching } = useQuery<MLSListing[]>({
    queryKey: ["unified-map-resale-v4", selectedCities, selectedPropertyTypes, filters.propertyType, selectedPriceRanges, filters.priceMin, filters.priceMax, filters.beds, filters.baths, filters.daysOnSite, filters.sqftMin, filters.sqftMax, enabledCities, adminMinYear],
    queryFn: async () => {
      const minYear = adminMinYear ?? DEFAULT_MIN_YEAR_BUILT;

      // Compute listed_after date if daysOnSite filter is set
      let listedAfter: string | null = null;
      if (filters.daysOnSite !== "any") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.daysOnSite));
        listedAfter = daysAgo.toISOString().split("T")[0];
      }

      // Determine cities to pass
      const cities = selectedCities.length > 0 
        ? selectedCities 
        : (enabledCities && enabledCities.length > 0 ? enabledCities : null);

      // Determine price bounds (skip if using multi-select price ranges — filtered client-side)
      const priceMin = !selectedPriceRanges.length && filters.priceMin ? parseInt(filters.priceMin) : null;
      const priceMax = !selectedPriceRanges.length && filters.priceMax ? parseInt(filters.priceMax) : null;

      const { data, error } = await supabase.rpc("get_map_pins", {
        p_min_year: minYear,
        p_cities: cities,
        p_min_beds: filters.beds !== "any" ? parseInt(filters.beds) : null,
        p_min_baths: filters.baths !== "any" ? parseInt(filters.baths) : null,
        p_min_sqft: filters.sqftMin ? Number(filters.sqftMin) : null,
        p_max_sqft: filters.sqftMax ? Number(filters.sqftMax) : null,
        p_min_price: priceMin,
        p_max_price: priceMax,
        p_listed_after: listedAfter,
        p_limit: 2000,
      });

      if (error) throw error;

      // Map RPC result to MLSListing shape (photos field is synthesized from first_photo_url)
      let results: MLSListing[] = ((data as any[]) || []).map(row => ({
        ...row,
        mls_status: "Active",
        photos: row.first_photo_url ? [{ MediaURL: row.first_photo_url }] : [],
      }));
      
      // Client-side filtering for multi-select property types
      const typesToFilter = selectedPropertyTypes.length > 0 
        ? selectedPropertyTypes 
        : (filters.propertyType && filters.propertyType !== "any" ? [filters.propertyType] : []);
      if (typesToFilter.length > 0) {
        results = results.filter(l => {
          return typesToFilter.some(type => 
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
    staleTime: 8 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    // Skip heavy resale fetch when embedded as assignments-only map
    enabled: !(isEmbed && mapMode === "assignments"),
  });

  // Fetch presale projects
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery<PresaleProject[]>({
    queryKey: ["unified-map-presale-multi", selectedCities, selectedPriceRanges, filters.priceMin, filters.priceMax],
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
      } else {
        // Legacy single-value price filter support
        const legacyPriceMin = filters.priceMin ? parseInt(filters.priceMin) : null;
        const legacyPriceMax = filters.priceMax ? parseInt(filters.priceMax) : null;
        if (legacyPriceMin !== null || legacyPriceMax !== null) {
          results = results.filter(p => {
            if (!p.starting_price) return false;
            if (legacyPriceMin !== null && p.starting_price < legacyPriceMin) return false;
            if (legacyPriceMax !== null && p.starting_price > legacyPriceMax) return false;
            return true;
          });
        }
      }
      
      return results;
    },
    staleTime: 8 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // Keep showing previous data while refreshing
    // Skip presale fetch when embedded as assignments-only map
    enabled: !(isEmbed && mapMode === "assignments"),
  });

  // Fetch assignments (listings table) with coordinates from linked presale_projects
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
    featured_image: string | null;
    floor_plan_url: string | null;
    status: string;
  };

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["unified-map-assignments", selectedCities, selectedPriceRanges, filters.priceMin, filters.priceMax, filters.beds, filters.baths],
    queryFn: async () => {
      let query = (supabase as any)
        .from("listings")
        .select("id, title, project_name, city, neighborhood, assignment_price, beds, baths, interior_sqft, featured_image, floor_plan_url, status, project_id")
        .eq("status", "published")
        .eq("listing_type", "assignment");

      // Apply city filter
      if (selectedCities.length > 0) {
        query = query.in("city", selectedCities);
      }

      // Apply price filters
      const priceMin = filters.priceMin ? parseInt(filters.priceMin) : undefined;
      const priceMax = filters.priceMax ? parseInt(filters.priceMax) : undefined;
      if (priceMin) query = query.gte("assignment_price", priceMin);
      if (priceMax) query = query.lte("assignment_price", priceMax);

      // Apply bed/bath filters
      if (filters.beds && filters.beds !== "any") query = query.gte("beds", parseInt(filters.beds));
      if (filters.baths && filters.baths !== "any") query = query.gte("baths", parseInt(filters.baths));

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch coordinates from linked presale_projects
      const projectIds = [...new Set((data as any[]).map((l: any) => l.project_id).filter(Boolean))];
      let coordsMap: Record<string, { lat: number; lng: number }> = {};
      if (projectIds.length > 0) {
        const { data: projData } = await supabase
          .from("presale_projects")
          .select("id, map_lat, map_lng")
          .in("id", projectIds);
        if (projData) {
          for (const p of projData) {
            if (p.map_lat && p.map_lng) {
              coordsMap[p.id] = { lat: p.map_lat, lng: p.map_lng };
            }
          }
        }
      }

      return (data as any[]).map((l: any) => {
        const coords = l.project_id ? coordsMap[l.project_id] : null;
        return {
          id: l.id,
          title: l.title,
          project_name: l.project_name,
          city: l.city,
          neighborhood: l.neighborhood,
          assignment_price: l.assignment_price,
          beds: l.beds,
          baths: l.baths,
          interior_sqft: l.interior_sqft,
          featured_image: l.featured_image,
          floor_plan_url: l.floor_plan_url,
          status: l.status,
          map_lat: coords?.lat ?? null,
          map_lng: coords?.lng ?? null,
        };
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Only show loading if we have NO data yet - use cached data immediately on back navigation
  const hasAnyData = (resaleListings && resaleListings.length > 0) || 
                     (presaleProjects && presaleProjects.length > 0) || 
                     (assignments && assignments.length > 0);
  const isLoading = !hasAnyData && (resaleLoading || presaleLoading);
  
  // Show a subtle refetch indicator when pins are loading but we have cached data
  const isRefetching = hasAnyData && resaleFetching;

  // Track when map tiles are actually rendered
  const [mapTilesReady, setMapTilesReady] = useState(false);
  const mapTilesReadyCalledRef = useRef(false);
  const handleMapReady = useCallback(() => {
    if (!mapTilesReadyCalledRef.current) {
      mapTilesReadyCalledRef.current = true;
      setMapTilesReady(true);
    }
  }, []);
  // Reset when entering loading state
  useEffect(() => {
    if (isLoading) {
      setMapTilesReady(false);
      mapTilesReadyCalledRef.current = false;
    }
  }, [isLoading]);
  const showOverlay = isLoading || !mapTilesReady;

  // Pre-populate visible IDs on back navigation so the grid isn't blank
  // This uses the saved map bounds + cached data to instantly show cards
  const hasPrePopulatedRef = useRef(false);
  useEffect(() => {
    if (hasPrePopulatedRef.current) return;
    if (!savedMapState || !hasAnyData) return;
    
    hasPrePopulatedRef.current = true;
    
    // Approximate the saved viewport bounds (rough estimate based on zoom)
    const { center, zoom } = savedMapState;
    const latSpan = 360 / Math.pow(2, zoom); // rough degrees visible
    const lngSpan = latSpan * 1.5;
    const bounds = {
      north: center.lat + latSpan / 2,
      south: center.lat - latSpan / 2,
      east: center.lng + lngSpan / 2,
      west: center.lng - lngSpan / 2,
    };
    
    const inBounds = (lat: number | null, lng: number | null) => {
      if (!lat || !lng) return false;
      return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
    };
    
    if (resaleListings) {
      const ids = resaleListings.filter(l => inBounds(l.latitude, l.longitude)).map(l => l.id);
      if (ids.length > 0) setVisibleResaleIds(ids);
    }
    if (presaleProjects) {
      const ids = presaleProjects.filter(p => inBounds(p.map_lat, p.map_lng)).map(p => p.id);
      if (ids.length > 0) setVisiblePresaleIds(ids);
    }
    if (assignments) {
      const ids = assignments.filter(a => inBounds(a.map_lat, a.map_lng)).map(a => a.id);
      if (ids.length > 0) setVisibleAssignmentIds(ids);
    }
  }, [savedMapState, hasAnyData, resaleListings, presaleProjects, assignments]);

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

  // Helper: calculate distance from map center (for sorting)
  const getDistanceFromCenter = useCallback((lat: number | null, lng: number | null): number => {
    if (!lat || !lng || !mapCenter) return Infinity;
    const dLat = lat - mapCenter.lat;
    const dLng = lng - mapCenter.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }, [mapCenter]);

  // Visible items based on map viewport and mode - ONLY show items actually visible on map
  const visibleResaleListings = useMemo(() => {
    if (mapMode === "presale" || mapMode === "assignments") return [];
    // Only show items that are actually in the map viewport - no fallback
    if (visibleResaleIds.length === 0) return [];
    return filteredResaleListings.filter(l => visibleResaleIds.includes(l.id));
  }, [filteredResaleListings, visibleResaleIds, mapMode]);

  const visiblePresaleProjects = useMemo(() => {
    if (mapMode === "resale" || mapMode === "assignments") return [];
    // Only show items that are actually in the map viewport - no fallback
    if (visiblePresaleIds.length === 0) return [];
    return filteredPresaleProjects.filter(p => visiblePresaleIds.includes(p.id));
  }, [filteredPresaleProjects, visiblePresaleIds, mapMode]);

  const visibleAssignments = useMemo(() => {
    if (mapMode === "resale" || mapMode === "presale") return [];
    // Only show items that are actually in the map viewport - no fallback
    if (visibleAssignmentIds.length === 0) return [];
    return filteredAssignments.filter(a => visibleAssignmentIds.includes(a.id));
  }, [filteredAssignments, visibleAssignmentIds, mapMode]);

  // Combined visible items for display - sorted by distance from map center, interleaved for variety
  const visibleItems = useMemo(() => {
    type ItemWithDistance = { 
      type: "resale" | "presale" | "assignment"; 
      data: MLSListing | PresaleProject | Assignment;
      distance: number;
    };
    
    const items: ItemWithDistance[] = [];
    
    // Add presale projects with distance
    visiblePresaleProjects.forEach(p => {
      items.push({ 
        type: "presale", 
        data: p,
        distance: getDistanceFromCenter(p.map_lat, p.map_lng)
      });
    });
    
    // Add resale listings with distance
    visibleResaleListings.forEach(l => {
      items.push({ 
        type: "resale", 
        data: l,
        distance: getDistanceFromCenter(l.latitude, l.longitude)
      });
    });
    
    // Add assignments with distance
    visibleAssignments.forEach(a => {
      items.push({ 
        type: "assignment", 
        data: a,
        distance: getDistanceFromCenter(a.map_lat, a.map_lng)
      });
    });
    
    // Sort by distance from center (closest first)
    items.sort((a, b) => a.distance - b.distance);
    
    // Apply additional sorting if user selected price sort
    const sortValue = filters.sort;
    if (sortValue === "price_asc" || sortValue === "price_desc") {
      items.sort((a, b) => {
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
        
        return sortValue === "price_asc" ? priceA - priceB : priceB - priceA;
      });
    }
    
    // Track focused item to keep it in place
    const focusedId = focusedCarouselItemId;
    let finalItems = items.map(({ type, data }) => ({ type, data }));
    
    // If focused item is not in visible items, find and add it at the start
    if (focusedId) {
      const focusedIndex = finalItems.findIndex(item => 
        (item.type === "presale" && (item.data as PresaleProject).id === focusedId) ||
        (item.type === "resale" && (item.data as MLSListing).id === focusedId) ||
        (item.type === "assignment" && (item.data as Assignment).id === focusedId)
      );
      
      if (focusedIndex === -1) {
        // Focused item not in view - add it from full list
        const focusedPresale = filteredPresaleProjects.find(p => p.id === focusedId);
        if (focusedPresale) {
          finalItems.unshift({ type: "presale", data: focusedPresale });
        } else {
          const focusedResale = filteredResaleListings.find(l => l.id === focusedId);
          if (focusedResale) {
            finalItems.unshift({ type: "resale", data: focusedResale });
          } else {
            const focusedAssignment = filteredAssignments.find(a => a.id === focusedId);
            if (focusedAssignment) {
              finalItems.unshift({ type: "assignment", data: focusedAssignment });
            }
          }
        }
      }
    }
    
    // Cap visible items: 25 on mobile for performance, 40 on desktop
    const cap = isMobileOrTablet ? 25 : 40;
    return finalItems.slice(0, cap);
  }, [visibleResaleListings, visiblePresaleProjects, visibleAssignments, focusedCarouselItemId, filteredPresaleProjects, filteredResaleListings, filteredAssignments, filters.sort, getDistanceFromCenter]);

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

  // Assignments for search bar autocomplete
  const assignmentsForSearch = useMemo(() => {
    if (!assignments) return [];
    return assignments.map(a => ({
      id: a.id,
      title: a.title,
      project_name: a.project_name,
      city: a.city,
      neighborhood: a.neighborhood,
      assignment_price: a.assignment_price,
      map_lat: a.map_lat,
      map_lng: a.map_lng,
    }));
  }, [assignments]);

  // Ref for programmatic map navigation
  const mapNavigationRef = useRef<CombinedListingsMapRef>(null);

  // Restore scroll position and scroll to focused item on back navigation
  useEffect(() => {
    if (hasRestoredScrollRef.current || !restoredUIState) return;
    
    // Wait for data to be available
    const dataLoaded = (resaleListings && resaleListings.length > 0) || 
                       (presaleProjects && presaleProjects.length > 0);
    
    if (!dataLoaded) return;
    
    // Mark as restored to prevent repeated attempts
    hasRestoredScrollRef.current = true;
    
    // Restore scroll positions after a short delay to allow DOM to render
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Scroll to focused item in carousel
        if (focusedCarouselItemId && carouselRef.current) {
          const cardElement = carouselRef.current.querySelector(`[data-item-id="${focusedCarouselItemId}"]`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
          }
        }
        
        // Scroll to focused item in desktop list
        if (focusedCarouselItemId && desktopListRef.current) {
          const cardElement = desktopListRef.current.querySelector(`[data-item-id="${focusedCarouselItemId}"]`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        }
      }, 100);
    });
  }, [restoredUIState, focusedCarouselItemId, resaleListings, presaleProjects]);

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
        const proj = presaleProjects?.find(p => p.slug === suggestion.value);
        if (proj) {
          navigate(generateProjectUrl({ slug: proj.slug, neighborhood: proj.neighborhood || proj.city, projectType: proj.project_type as any }));
        } else {
          navigate(`/presale-projects/${suggestion.value}`);
        }
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
    } else if (suggestion.type === "assignment") {
      // Navigate to assignment location on map
      if (suggestion.lat && suggestion.lng && mapNavigationRef.current) {
        mapNavigationRef.current.flyTo(suggestion.lat, suggestion.lng, 17);
        toast.success(`Viewing ${suggestion.label}`);
        setSearchQuery("");
      } else {
        navigate(`/assignments/${suggestion.value}`);
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
    // Check both multi-select (types) and legacy single-select (type)
    selectedPropertyTypes.length > 0 || (filters.propertyType && filters.propertyType !== "any"),
    selectedPriceRanges.length > 0,
    filters.beds !== "any",
    filters.baths !== "any",
    filters.daysOnSite !== "any",
    filters.yearBuiltMin !== null,
    filters.yearBuiltMax !== null,
    priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE,
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
  const applyPriceFilter = useCallback(() => {
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
  }, [searchParams, setSearchParams, priceRange]);

  // Handle year built filter changes
  const handleYearBuiltChange = useCallback((minYear: number | null, maxYear: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (minYear) {
      newParams.set("yearMin", minYear.toString());
    } else {
      newParams.delete("yearMin");
    }
    if (maxYear) {
      newParams.set("yearMax", maxYear.toString());
    } else {
      newParams.delete("yearMax");
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle sqft filter changes
  const handleSqftChange = useCallback((minSqft: number | null, maxSqft: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (minSqft) {
      newParams.set("sqftMin", minSqft.toString());
    } else {
      newParams.delete("sqftMin");
    }
    if (maxSqft) {
      newParams.set("sqftMax", maxSqft.toString());
    } else {
      newParams.delete("sqftMax");
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle clear all filters including year built
  const handleClearAllFilters = useCallback(() => {
    clearAllFilters();
    setPriceRange([MIN_PRICE, MAX_PRICE]);
  }, [clearAllFilters]);

  // Build grid URL with current filters for seamless transition back to grid view
  const gridUrlWithFilters = useMemo(() => {
    const basePath = mapMode === "presale" ? "/presale-projects" : "/properties";
    return buildGridUrlFromMapFilters(searchParams, basePath);
  }, [searchParams, mapMode]);

  // Loading map element - premium branded overlay
  const loadingMapElement = (
    <div className="h-full w-full bg-background relative flex items-center justify-center overflow-hidden">
      {/* Subtle animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 1px, transparent 1px), radial-gradient(circle at 75% 75%, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      
      {/* Center content - offset when desktop panel is open */}
      <div 
        className={`relative z-10 flex flex-col items-center gap-5 animate-fade-in transition-transform duration-300 ease-out ${showList ? 'lg:-translate-x-[220px]' : ''}`}
      >
        {/* Animated map pin icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Map className="h-7 w-7 text-primary" />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground tracking-tight">Loading Properties</p>
          <p className="text-xs text-muted-foreground">Mapping your area...</p>
        </div>
        
        {/* Animated progress dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
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

  const totalCount = (filteredResaleListings?.length || 0) + (filteredPresaleProjects?.length || 0) + (filteredAssignments?.length || 0);

  const resultsSummary = useMemo(() => {
    const count = propertiesInViewCount > 0 ? propertiesInViewCount : totalCount;
    if (count === 0) return "No projects match your filters — try adjusting your search.";
    const typeLabel = mapMode === "presale" ? "presale projects" : mapMode === "resale" ? "properties" : mapMode === "assignments" ? "assignments" : "properties";
    const cityLabel = selectedCities.length === 1 ? `in ${selectedCities[0]}` : selectedCities.length > 1 ? `in ${selectedCities.length} cities` : "in Metro Vancouver";
    const suffix = propertiesInViewCount > 0 ? " in view" : "";
    return `Showing ${count.toLocaleString()} ${typeLabel} ${cityLabel}${suffix}`;
  }, [propertiesInViewCount, totalCount, mapMode, selectedCities]);

  return (
    <>
      <Helmet>
        <title>Map Search | Find New Homes in Metro Vancouver | PresaleProperties</title>
        <meta name="description" content="Search presale condos and move-in ready new homes on an interactive map. Find all new construction in Metro Vancouver." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://presaleproperties.com/map-search" />
        <meta property="og:title" content="Map Search | Find New Homes in Metro Vancouver | PresaleProperties" />
        <meta property="og:description" content="Search presale condos and move-in ready new homes on an interactive map. Find all new construction in Metro Vancouver." />
        <meta property="og:url" content="https://presaleproperties.com/map-search" />
        <meta property="og:type" content="website" />
      </Helmet>

        {/* Main container - edge-to-edge on mobile/tablet with safe area support */}
        {/* Uses map-page-root class for mobile/tablet full-bleed, lg:relative for desktop standard layout */}
        <div className="map-page-root lg:relative lg:h-[100dvh] lg:bg-background flex flex-col overflow-hidden">
        {/* Desktop only header — hidden in embed mode */}
        {!isEmbed && (
          <div className="hidden lg:block">
            <ConversionHeader alwaysVisible stickyOnMobile />
          </div>
        )}

        {/* Mobile/Tablet: Floating Search Bar with Autocomplete */}
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
            assignments={assignmentsForSearch}
            homeButton={
              <button 
                onClick={() => setMobileNavOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Menu className="h-4 w-4 text-muted-foreground/70" />
              </button>
            }
            filterButton={
              <button 
                onClick={() => setMobileFiltersOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors relative"
              >
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground/70" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            }
            listButton={
              <Link to={gridUrlWithFilters}>
                <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground/70" />
                </button>
              </Link>
            }
          />
        </div>
        
        {/* Mobile/Tablet Navigation Drawer */}
        <MobileMapNavDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        
        {/* Mobile/Tablet Filter Sheet */}
        <MobileMapFilters
          open={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          cities={CITIES}
          selectedCities={selectedCities}
          onCitiesChange={(cities) => updateMultiFilter("cities", cities)}
          priceRange={priceRange}
          onPriceRangeChange={(range) => {
            setPriceRange(range);
            const newParams = new URLSearchParams(searchParams);
            if (range[0] > MIN_PRICE) {
              newParams.set("priceMin", range[0].toString());
            } else {
              newParams.delete("priceMin");
            }
            if (range[1] < MAX_PRICE) {
              newParams.set("priceMax", range[1].toString());
            } else {
              newParams.delete("priceMax");
            }
            setSearchParams(newParams, { replace: true });
          }}
          minPrice={MIN_PRICE}
          maxPrice={MAX_PRICE}
          yearBuiltMin={filters.yearBuiltMin}
          yearBuiltMax={filters.yearBuiltMax}
          onYearBuiltChange={handleYearBuiltChange}
          sqftMin={filters.sqftMin}
          sqftMax={filters.sqftMax}
          onSqftChange={handleSqftChange}
          propertyTypes={PROPERTY_TYPES}
          selectedPropertyType={filters.propertyType || "any"}
          onPropertyTypeChange={(type) => updateFilter("type", type)}
          bedOptions={BED_OPTIONS}
          bathOptions={BATH_OPTIONS}
          selectedBeds={filters.beds}
          selectedBaths={filters.baths}
          onBedsChange={(beds) => updateFilter("beds", beds)}
          onBathsChange={(baths) => updateFilter("baths", baths)}
          onClearAll={handleClearAllFilters}
          onApply={() => setMobileFiltersOpen(false)}
          onApplyPreset={(preset) => {
            // Apply ALL preset changes atomically in ONE setSearchParams call
            // This avoids the stale-closure race condition where sequential
            // setSearchParams calls overwrite each other.
            const newParams = new URLSearchParams(searchParams);
            // Price
            if (preset.priceMin !== undefined && preset.priceMin > MIN_PRICE) {
              newParams.set("priceMin", preset.priceMin.toString());
            } else {
              newParams.delete("priceMin");
            }
            if (preset.priceMax !== undefined && preset.priceMax < MAX_PRICE) {
              newParams.set("priceMax", preset.priceMax.toString());
            } else {
              newParams.delete("priceMax");
            }
            // Property type
            if (preset.propertyType !== undefined) {
              if (preset.propertyType === "any" || preset.propertyType === "") {
                newParams.delete("type");
              } else {
                newParams.set("type", preset.propertyType);
              }
            }
            // Cities
            if (preset.cities !== undefined) {
              if (preset.cities.length === 0) {
                newParams.delete("cities");
                newParams.delete("city");
              } else {
                newParams.set("cities", preset.cities.join(","));
                newParams.delete("city");
              }
            }
            // Beds
            if (preset.beds !== undefined) {
              if (preset.beds === "any" || preset.beds === "") {
                newParams.delete("beds");
              } else {
                newParams.set("beds", preset.beds);
              }
            }
            // Update local price slider state too
            setPriceRange([
              preset.priceMin ?? MIN_PRICE,
              preset.priceMax ?? MAX_PRICE,
            ]);
            setSearchParams(newParams, { replace: true });
          }}
          activeFilterCount={activeFilterCount}
        />

        {/* Main Content - Map + Floating Panel Layout */}
        <div className="flex-1 flex overflow-hidden relative isolate">
          {/* Map Section - Always full width, panel floats on top */}
          <div className="relative h-full w-full">
            {/* Unified Mode Toggle - Floating on map (hidden in embed mode) */}
            {!isEmbed && (
              <>
                {/* Mobile/Tablet: Always sit below the search bar */}
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

                {/* Desktop: Centered at top of map - shifts left when panel is open */}
                <div
                  className="hidden lg:block absolute top-4 z-[1000] transition-all duration-300"
                  style={{
                    left: showList ? 'calc(50% - 210px)' : '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <UnifiedMapToggle
                    mode={mapMode}
                    onModeChange={handleModeChange}
                    presaleCount={filteredPresaleProjects?.length || 0}
                    resaleCount={filteredResaleListings?.length || 0}
                  />
                </div>
              </>
            )}

            {/* Desktop: Show Panel Button - appears when panel is hidden, shifts when panel opens */}
            <button
              onClick={() => setShowList(true)}
              className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-[1000] items-center justify-center w-6 h-12 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-md hover:bg-muted transition-all duration-300 ${
                showList ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              style={{ right: showList ? 'calc(420px + 16px)' : '12px' }}
              aria-label="Show property list"
            >
              <PanelRightOpen className="h-3.5 w-3.5 text-muted-foreground" />
            </button>


            <div className="absolute inset-0">
              <SafeMapWrapper height="h-full">
                <Suspense fallback={loadingMapElement}>
                  {totalCount === 0 && !isLoading ? (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground p-6">
                        <Home className="h-12 w-12 mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-2">No projects match your filters</h3>
                        <p className="text-sm mb-4">Try adjusting your search or clearing filters</p>
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
                      onItemHover={handlePinHover}
                      onVisibleItemsChange={handleVisibleItemsChange}
                      onMapInteraction={handleMapInteraction}
                      onMapStateChange={handleMapStateChange}
                      disablePopupsOnMobile={isMobileOrTablet}
                      centerOnUserLocation={!effectiveMapState}
                      initialUserLocation={userLocation}
                      savedMapState={effectiveMapState}
                      highlightedItemId={hoveredItemId || selectedItemId}
                      highlightedItemType={hoveredItemType || selectedItemType}
                      isVerifiedAgent={isVerifiedAgent}
                      panelOpen={showList}
                      mobileCarouselOpen={showCarousel}
                      onMapReady={handleMapReady}
                    />
                  )}
                </Suspense>
              </SafeMapWrapper>
              {/* Loading overlay - sits on top of map and fades out once tiles are ready */}
              <div
                className={`absolute inset-0 z-[500] pointer-events-none transition-opacity duration-500 ease-out ${showOverlay ? 'opacity-100' : 'opacity-0 invisible'}`}
              >
                {loadingMapElement}
              </div>
              
              {/* Refetch indicator - centered on visible map area, shifts when panel is open */}
              {isRefetching && !showOverlay && (
                <div 
                  className="absolute inset-0 z-[600] flex items-center justify-center pointer-events-none animate-fade-in"
                >
                  <div 
                    className={`flex flex-col items-center gap-2 px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-xl pointer-events-auto transition-transform duration-300 ease-out ${
                      showList ? 'lg:-translate-x-[220px]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                          style={{
                            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Loading pins…</span>
                  </div>
                </div>
              )}
            </div>


            {/* Show Carousel Button - When hidden - Premium Apple Maps style */}
            {/* Positioned above safe area with enough clearance for tablets */}
            {/* CRITICAL: Uses a full-width invisible barrier to prevent click-through to map */}
            {!showCarousel && visibleItems.length > 0 && (
              <div 
                className="absolute left-0 right-0 z-[1001] lg:hidden flex justify-center"
                style={{ 
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                  paddingBottom: '8px',
                  paddingTop: '8px'
                }}
                // Prevent ANY touch/click from reaching the map beneath
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCarousel(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCarousel(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 flex items-center gap-2 active:scale-[0.98] transition-transform touch-manipulation select-none"
                  aria-label="Show properties"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="text-sm font-semibold text-foreground">{propertiesInViewCount} Properties</span>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Bottom Carousel - Mobile/Tablet - Compact floating cards */}
            {/* CRITICAL: Entire carousel container captures touch events to prevent map interaction */}
            {showCarousel && visibleItems.length > 0 && (
              <div 
                className="absolute bottom-0 left-0 right-0 z-[1000] lg:hidden"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                 {/* Compact Carousel Header */}
                <div 
                  className="flex items-center justify-between pb-1" 
                  style={{ 
                    paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 12px)', 
                    paddingRight: 'calc(env(safe-area-inset-right, 0px) + 12px)' 
                  }}
                >
                  <span className="text-xs font-semibold text-foreground bg-white/95 dark:bg-background/95 backdrop-blur-xl px-3 py-1.5 rounded-lg shadow-lg border border-black/5 dark:border-white/10">
                    {propertiesInViewCount} Properties
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCarousel(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCarousel(false);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-black/5 dark:active:bg-white/10 transition-colors select-none"
                    aria-label="Hide properties"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Compact Carousel Cards */}
                <div 
                  ref={carouselRef}
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPaddingLeft: 'calc(env(safe-area-inset-left, 0px) + 12px)', scrollPaddingRight: 'calc(env(safe-area-inset-right, 0px) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 12px)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 12px)' }}
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
                      ? generateProjectUrl({ slug: (data as PresaleProject).slug, neighborhood: (data as PresaleProject).neighborhood || (data as PresaleProject).city, projectType: (data as PresaleProject).project_type as any }) 
                      : item.type === "assignment"
                      ? `/assignments/${(data as Assignment).id}`
                      : getListingUrl(
                          (data as MLSListing).listing_key,
                          getResaleListingAddress(data as MLSListing),
                          (data as MLSListing).city
                        );
                    const isFocused = focusedCarouselItemId === id;
                    
                    return (
                      <div 
                        key={`${item.type}-${id}`}
                        data-item-id={id}
                        data-item-type={item.type}
                        onClick={() => {
                          handleCarouselCardTap(id, item.type, link);
                        }}
                        className="snap-start shrink-0 w-[200px] sm:w-[220px] cursor-pointer"
                      >
                        <div className={`bg-background/95 backdrop-blur-xl rounded-xl shadow-lg border overflow-hidden transition-all duration-200 ${
                          isFocused 
                            ? 'border-primary ring-2 ring-primary/30 scale-[1.02]' 
                            : selectedItemId === id 
                              ? 'border-primary/50 ring-1 ring-primary/20' 
                              : isAssignment
                              ? 'border-amber-500/50'
                              : 'border-border/30 active:border-primary/50'
                        }`}>
                          {/* Compact image with price overlay */}
                          <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                            {isPresale ? (
                              (data as PresaleProject).featured_image ? (
                                <img src={(data as PresaleProject).featured_image!} alt={(data as PresaleProject).name} className="w-full h-full object-cover" loading="eager" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                  <Building2 className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )
                            ) : isAssignment ? (
                            (() => {
                              const assignImg = (data as Assignment).featured_image || (data as Assignment).floor_plan_url;
                              return assignImg ? (
                                <img src={assignImg} alt={(data as Assignment).project_name} className="w-full h-full object-cover" loading="eager" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
                                  <Building2 className="h-6 w-6 text-amber-500" />
                                </div>
                              );
                            })()
                            ) : (
                              getResalePhoto(data as MLSListing) ? (
                                <img 
                                  src={getResalePhoto(data as MLSListing)!} 
                                  alt={getResaleAddress(data as MLSListing)} 
                                  className="w-full h-full object-cover" 
                                  loading="eager"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                  <Home className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )
                            )}
                            {/* Gradient + price overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                            <div className="absolute bottom-1.5 left-2">
                              {isPresale && (
                                <span className="text-white/70 text-[9px] font-medium block leading-none mb-0.5">From</span>
                              )}
                              <span className="text-white font-bold text-sm leading-none drop-shadow-md">
                                {isPresale 
                                  ? formatPrice((data as PresaleProject).starting_price)
                                  : isAssignment
                                  ? formatPrice((data as Assignment).assignment_price)
                                  : formatPrice((data as MLSListing).listing_price)
                                }
                              </span>
                            </div>
                            <Badge className={`absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                              isPresale 
                                ? 'bg-foreground/90 text-background' 
                                : isAssignment
                                ? 'bg-amber-500 text-white'
                                : 'bg-primary/90 text-primary-foreground'
                            }`}>
                              {isPresale ? 'PRESALE' : isAssignment ? 'ASSIGNMENT' : 'MOVE-IN'}
                            </Badge>
                          </div>
                           {/* Compact info: Name + Location */}
                          <div className="px-2 pt-1.5 pb-2 space-y-0.5">
                            <h4 className="font-medium text-foreground text-xs line-clamp-1">
                              {isPresale 
                                ? (data as PresaleProject).name 
                                : isAssignment
                                ? (data as Assignment).project_name
                                : getResaleAddress(data as MLSListing)}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className="truncate">
                                {isPresale 
                                  ? (data as PresaleProject).city
                                  : isAssignment
                                  ? (data as Assignment).city
                                  : (data as MLSListing).city
                                }
                              </span>
                              {!isPresale && (
                                <>
                                  <span className="text-border">•</span>
                                  <span>{isAssignment ? (data as Assignment).beds : (data as MLSListing).bedrooms_total}bd</span>
                                  <span>{isAssignment ? (data as Assignment).baths : (data as MLSListing).bathrooms_total}ba</span>
                                  {!isAssignment && (data as MLSListing).living_area && (
                                    <span>{(data as MLSListing).living_area?.toLocaleString()}sf</span>
                                  )}
                                </>
                              )}
                              {isPresale && (data as PresaleProject).status && (
                                <span className="text-[9px] font-medium text-primary">
                                  {(data as PresaleProject).status === 'active' ? 'Selling' : 
                                   (data as PresaleProject).status === 'registering' ? 'Registering' : 
                                   (data as PresaleProject).status === 'coming_soon' ? 'Coming Soon' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Floating List Panel - Redesigned Premium UI */}
          <div className={`hidden lg:flex flex-col absolute top-2 bottom-2 right-2 z-[1001] w-[440px] bg-background/90 backdrop-blur-xl rounded-2xl border border-border/30 shadow-2xl transition-all duration-300 ease-out overflow-visible ${
            showList ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          }`}>
            {/* Collapse button - minimal pill on left edge */}
            <button
              onClick={() => setShowList(false)}
              className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-10 bg-background/95 backdrop-blur-sm border border-border/30 rounded-l-lg shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Hide property list"
            >
              <PanelRightClose className="h-3 w-3 text-muted-foreground" />
            </button>
            
            {/* Clean Header - Search + Filter Button Only */}
            <div className="shrink-0 p-3 pb-2 relative z-[100] overflow-visible">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <MapSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSuggestionSelect={handleSearchSuggestionSelect}
                    placeholder="Search city, project, address..."
                    cities={CITIES}
                    neighborhoods={neighborhoodsData || []}
                    projects={projectsForSearch}
                    listings={listingsForSearch}
                    assignments={assignmentsForSearch}
                    className="h-9 text-sm"
                  />
                </div>
                
                {/* Filter Button with label */}
                <Sheet open={desktopFiltersOpen} onOpenChange={setDesktopFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant={activeFilterCount > 0 ? "default" : "outline"} 
                      size="sm" 
                      className={cn(
                        "h-9 px-3 shrink-0 gap-2",
                        activeFilterCount > 0 && "bg-primary text-primary-foreground"
                      )}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="text-sm font-medium">Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center font-semibold">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
                    <SheetHeader className="pb-4 border-b">
                      <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto py-6 space-y-5">
                      {/* City Multi-Select Dropdown */}
                      <div>
                        <label className="text-sm font-semibold mb-2 block">City</label>
                        <CityMultiSelectDropdown
                          cities={CITIES}
                          selected={selectedCities}
                          onChange={(cities) => updateMultiFilter("cities", cities)}
                        />
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

                      {/* Year Built Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Year Built</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Minimum</label>
                            <Input
                              type="number"
                              placeholder="Any"
                              value={filters.yearBuiltMin || ""}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                handleYearBuiltChange(val, filters.yearBuiltMax);
                              }}
                              className="h-10"
                              min={adminMinYear}
                              max={new Date().getFullYear() + 2}
                            />
                          </div>
                          <span className="text-muted-foreground mt-5">-</span>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Maximum</label>
                            <Input
                              type="number"
                              placeholder="Any"
                              value={filters.yearBuiltMax || ""}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                handleYearBuiltChange(filters.yearBuiltMin, val);
                              }}
                              className="h-10"
                              min={adminMinYear}
                              max={new Date().getFullYear() + 2}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Square Footage Section */}
                      <div className="border-t pt-6">
                        <label className="text-base font-semibold mb-4 block">Square Footage</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Minimum</label>
                            <Input
                              type="number"
                              placeholder="Any"
                              value={filters.sqftMin || ""}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                handleSqftChange(val, filters.sqftMax);
                              }}
                              className="h-10"
                              min={0}
                            />
                          </div>
                          <span className="text-muted-foreground mt-5">-</span>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Maximum</label>
                            <Input
                              type="number"
                              placeholder="Any"
                              value={filters.sqftMax || ""}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                handleSqftChange(filters.sqftMin, val);
                              }}
                              className="h-10"
                              min={0}
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
                        Clear all
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
            </div>

            {/* Compact Results Bar */}
            <div className="px-2.5 py-1.5 border-y border-border/30 flex items-center justify-between bg-muted/20 relative z-10">
              <span className={cn("text-xs font-medium", totalCount === 0 ? "text-muted-foreground" : "text-foreground")}>
                {resultsSummary}
              </span>
              <div className="flex items-center gap-1.5">
                <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                  <SelectTrigger className="w-[90px] h-6 text-[10px] border-0 bg-transparent hover:bg-muted px-1.5 gap-1 rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border shadow-lg text-xs" style={{ zIndex: 10000 }}>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_asc">Price ↑</SelectItem>
                    <SelectItem value="price_desc">Price ↓</SelectItem>
                  </SelectContent>
                </Select>
                <Link to={mapMode === "presale" ? "/presale-projects" : "/properties"}>
                  <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted">
                    <LayoutGrid className="h-3 w-3" />
                    Grid
                  </button>
                </Link>
              </div>
            </div>

            {/* Property Grid - Maximized Space */}
            <div ref={desktopListRef} className="flex-1 overflow-y-auto p-2 relative z-0 rounded-b-2xl">
              <div className="grid grid-cols-2 gap-2">
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
                    ? generateProjectUrl({ slug: (data as PresaleProject).slug, neighborhood: (data as PresaleProject).neighborhood || (data as PresaleProject).city, projectType: (data as PresaleProject).project_type as any }) 
                    : item.type === "assignment"
                    ? `/assignments/${(data as Assignment).id}`
                    : getListingUrl(
                        (data as MLSListing).listing_key,
                        getResaleListingAddress(data as MLSListing),
                        (data as MLSListing).city
                      );
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
                  const isHovered = hoveredItemId === id;
                  
                  return (
                    <Link 
                      key={`${item.type}-${id}`}
                      to={link}
                      data-item-id={id}
                      onMouseEnter={() => handleCardHover(id, item.type)}
                      onMouseLeave={() => handleCardHover(null, null)}
                      onClick={(e) => {
                        handleDesktopCardClick(e, id, item.type, link, lat, lng);
                      }}
                      className={cn(
                        isPresale && mapMode === "all" ? "col-span-2" : ""
                      )}
                    >
                      <div className={cn(
                        "rounded-xl border overflow-hidden transition-all hover:shadow-lg group bg-card",
                        isPresale && mapMode === "all" ? "flex flex-row h-[140px]" : "",
                        (isFocused || isHovered)
                          ? 'border-primary ring-2 ring-primary/30 shadow-lg' 
                          : selectedItemId === id 
                            ? 'border-primary/50 ring-1 ring-primary/20' 
                            : isAssignment
                            ? 'border-amber-500/50 hover:border-amber-500'
                            : 'border-border hover:border-primary/50'
                      )}>
                        {/* Image with price overlay */}
                        <div className={cn(
                          "relative bg-muted overflow-hidden",
                          isPresale && mapMode === "all" 
                            ? "w-[200px] shrink-0 h-full" 
                            : "w-full aspect-[4/3]"
                        )}>
                          {isPresale ? (
                            (data as PresaleProject).featured_image ? (
                              <img src={(data as PresaleProject).featured_image!} alt={(data as PresaleProject).name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )
                          ) : isAssignment ? (
                            (() => {
                              const assignImg = (data as Assignment).featured_image || (data as Assignment).floor_plan_url;
                              return assignImg ? (
                                <img src={assignImg} alt={(data as Assignment).project_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
                                  <Building2 className="h-10 w-10 text-amber-500" />
                                </div>
                              );
                            })()
                          ) : (
                            getResalePhoto(data as MLSListing) ? (
                              <img 
                                src={getResalePhoto(data as MLSListing)!} 
                                alt={getResaleAddress(data as MLSListing)} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <Home className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )
                          )}
                          {/* Gradient overlay for price - only on non-wide cards */}
                          {!(isPresale && mapMode === "all") && (
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                          )}
                          {/* Price on image - only on non-wide cards */}
                          {!(isPresale && mapMode === "all") && (
                            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                              <div>
                                <span className="text-white/70 text-[10px] font-medium block leading-none mb-0.5">
                                  {isPresale ? 'From' : isAssignment ? 'Asking' : ''}
                                </span>
                                <span className="text-white font-bold text-xl lg:text-lg leading-none drop-shadow-md">
                                  {isPresale
                                    ? formatPrice((data as PresaleProject).starting_price)
                                    : isAssignment
                                    ? formatPrice((data as Assignment).assignment_price)
                                    : formatPrice((data as MLSListing).listing_price)
                                  }
                                </span>
                             </div>
                            </div>
                          )}
                          {/* Badge overlay */}
                          <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 font-semibold shadow-md ${
                            isPresale 
                              ? 'bg-foreground text-background' 
                              : isAssignment
                              ? 'bg-amber-500 text-white'
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
                        
                        {/* Compact info: Name, Location + Specs */}
                        <div className={cn(
                          "relative",
                          isPresale && mapMode === "all" 
                            ? "flex-1 px-3 py-2.5 flex flex-col justify-center" 
                            : "px-2.5 py-2"
                        )}>
                          <h4 className={cn(
                            "font-semibold text-foreground leading-tight line-clamp-1",
                            isPresale && mapMode === "all" ? "text-base" : "text-sm"
                          )}>
                            {isPresale 
                              ? (data as PresaleProject).name 
                              : isAssignment
                              ? (data as Assignment).project_name
                              : getResaleAddress(data as MLSListing)}
                          </h4>
                          <div className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                            {isPresale 
                              ? `${(data as PresaleProject).neighborhood || ''} · ${(data as PresaleProject).city}`
                              : isAssignment
                              ? `${(data as Assignment).neighborhood || (data as Assignment).city}`
                              : `${(data as MLSListing).neighborhood || (data as MLSListing).city}`
                            }
                          </div>
                          {/* Price + type for wide presale cards */}
                          {isPresale && mapMode === "all" && (
                            <div className="mt-1.5">
                              <span className="text-muted-foreground text-[10px] font-medium">From </span>
                              <span className="text-foreground font-bold text-lg leading-none">
                                {formatPrice((data as PresaleProject).starting_price)}
                              </span>
                              {(data as PresaleProject).project_type && (
                                <span className="text-muted-foreground text-[10px] ml-2 capitalize">
                                  {(data as PresaleProject).project_type}
                                </span>
                              )}
                            </div>
                          )}
                          {/* Specs for resale */}
                          {!isPresale && !isAssignment && (
                            <div className="text-muted-foreground text-[10px] lg:text-xs mt-0.5">
                              {(data as MLSListing).bedrooms_total || '-'} bd • {(data as MLSListing).bathrooms_total || '-'} ba{(data as MLSListing).living_area ? ` • ${(data as MLSListing).living_area?.toLocaleString()} sf` : ''}
                            </div>
                          )}
                          {/* Specs for assignments */}
                          {isAssignment && (
                            <div className="text-muted-foreground text-[10px] lg:text-xs mt-0.5">
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
