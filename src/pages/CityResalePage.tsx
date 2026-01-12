import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, MapPin, ArrowRight, Map } from "lucide-react";
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
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { RelatedPresaleProjects } from "@/components/resale/RelatedPresaleProjects";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 16;

// City configuration with SEO data
const CITY_CONFIG: Record<string, {
  name: string;
  region: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  neighborhoods: string[];
}> = {
  "vancouver": {
    name: "Vancouver",
    region: "Metro Vancouver",
    metaTitle: "Homes for Sale in Vancouver, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Vancouver. Find condos, townhomes & houses for sale with photos, prices & details. New 2025 construction available.",
    h1: "Homes for Sale in Vancouver, BC",
    description: "Browse the latest MLS listings in Vancouver. Find condos, townhomes, and houses with pricing, photos, and property details.",
    neighborhoods: ["Downtown", "Mount Pleasant", "Kitsilano", "East Vancouver", "Yaletown", "Coal Harbour"]
  },
  "surrey": {
    name: "Surrey",
    region: "Fraser Valley",
    metaTitle: "Homes for Sale in Surrey, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Surrey. Find condos, townhomes & houses for sale in Cloverdale, South Surrey, Guildford & more.",
    h1: "Homes for Sale in Surrey, BC",
    description: "Explore homes for sale in Surrey. Browse condos, townhomes, and houses across City Centre, Cloverdale, South Surrey & more.",
    neighborhoods: ["City Centre", "Cloverdale", "South Surrey", "Guildford", "Fleetwood", "Clayton Heights"]
  },
  "coquitlam": {
    name: "Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Homes for Sale in Coquitlam, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Coquitlam. Find condos & townhomes near Evergreen Line and Burke Mountain.",
    h1: "Homes for Sale in Coquitlam, BC",
    description: "Find homes for sale in Coquitlam. Browse listings near Evergreen Line, Burke Mountain & Coquitlam Centre.",
    neighborhoods: ["Burquitlam", "Burke Mountain", "Coquitlam Centre", "Westwood Plateau", "Austin Heights"]
  },
  "burnaby": {
    name: "Burnaby",
    region: "Metro Vancouver",
    metaTitle: "Homes for Sale in Burnaby, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Burnaby. Find condos at Metrotown, Brentwood & Lougheed near SkyTrain.",
    h1: "Homes for Sale in Burnaby, BC",
    description: "Explore homes for sale in Burnaby. Browse listings at Metrotown, Brentwood, Lougheed & Edmonds near SkyTrain.",
    neighborhoods: ["Metrotown", "Brentwood", "Lougheed", "Edmonds", "Highgate", "Burnaby Heights"]
  },
  "delta": {
    name: "Delta",
    region: "South of Fraser",
    metaTitle: "Homes for Sale in Delta, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Delta. Find condos & townhomes in Tsawwassen, Ladner & North Delta.",
    h1: "Homes for Sale in Delta, BC",
    description: "Find homes for sale in Delta. Browse listings in Tsawwassen, Ladner & North Delta communities.",
    neighborhoods: ["Tsawwassen", "Ladner", "North Delta", "Sunbury"]
  },
  "langley": {
    name: "Langley",
    region: "Fraser Valley",
    metaTitle: "Homes for Sale in Langley, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Langley. Find condos & townhomes in Willoughby, Murrayville & Walnut Grove.",
    h1: "Homes for Sale in Langley, BC",
    description: "Explore homes for sale in Langley. Browse listings in Willoughby, Murrayville, Walnut Grove & more.",
    neighborhoods: ["Willowbrook", "Willoughby", "Murrayville", "Walnut Grove", "Langley City", "Aldergrove"]
  },
  "abbotsford": {
    name: "Abbotsford",
    region: "Fraser Valley",
    metaTitle: "Homes for Sale in Abbotsford, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Abbotsford. Find affordable condos & townhomes in West Abbotsford, Clearbrook & Mill Lake.",
    h1: "Homes for Sale in Abbotsford, BC",
    description: "Find homes for sale in Abbotsford. Browse listings in West Abbotsford, Clearbrook, Mill Lake & more.",
    neighborhoods: ["West Abbotsford", "Clearbrook", "Mill Lake", "Historic Downtown", "Auguston"]
  },
  "chilliwack": {
    name: "Chilliwack",
    region: "Fraser Valley",
    metaTitle: "Homes for Sale in Chilliwack, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Chilliwack. Find affordable condos, townhomes & houses in the Fraser Valley.",
    h1: "Homes for Sale in Chilliwack, BC",
    description: "Explore homes for sale in Chilliwack. Browse affordable listings in one of BC's fastest-growing cities.",
    neighborhoods: ["Sardis", "Vedder", "Downtown", "Promontory", "Rosedale"]
  },
  "richmond": {
    name: "Richmond",
    region: "Metro Vancouver",
    metaTitle: "Homes for Sale in Richmond, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Richmond. Find condos, townhomes & houses in City Centre, Steveston & Brighouse.",
    h1: "Homes for Sale in Richmond, BC",
    description: "Explore homes for sale in Richmond. Browse listings in City Centre, Steveston, Brighouse & more.",
    neighborhoods: ["City Centre", "Steveston", "Brighouse", "Ironwood", "West Cambie", "Hamilton"]
  },
  "new-westminster": {
    name: "New Westminster",
    region: "Metro Vancouver",
    metaTitle: "Homes for Sale in New Westminster, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in New Westminster. Find condos & townhomes near SkyTrain in Downtown, Sapperton & Queensborough.",
    h1: "Homes for Sale in New Westminster, BC",
    description: "Explore homes for sale in New Westminster. Browse listings near SkyTrain in Downtown, Sapperton & Queensborough.",
    neighborhoods: ["Downtown", "Sapperton", "Queensborough", "Uptown", "Brow of the Hill", "Queens Park"]
  },
  "port-coquitlam": {
    name: "Port Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Homes for Sale in Port Coquitlam, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Port Coquitlam. Find condos & townhomes in Citadel, Lincoln & Mary Hill.",
    h1: "Homes for Sale in Port Coquitlam, BC",
    description: "Find homes for sale in Port Coquitlam. Browse listings in Citadel, Lincoln, Mary Hill & Downtown.",
    neighborhoods: ["Citadel", "Lincoln", "Mary Hill", "Downtown", "Riverwood", "Oxford Heights"]
  },
  "port-moody": {
    name: "Port Moody",
    region: "Tri-Cities",
    metaTitle: "Homes for Sale in Port Moody, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in Port Moody. Find condos & townhomes near Evergreen Line in Inlet Centre & Moody Centre.",
    h1: "Homes for Sale in Port Moody, BC",
    description: "Explore homes for sale in Port Moody. Browse listings near Evergreen Line in Inlet Centre, Moody Centre & Newport.",
    neighborhoods: ["Inlet Centre", "Moody Centre", "Newport Village", "Glenayre", "Seaview", "College Park"]
  },
  "white-rock": {
    name: "White Rock",
    region: "South of Fraser",
    metaTitle: "Homes for Sale in White Rock, BC | MLS Listings | PresaleProperties",
    metaDescription: "Browse active MLS listings in White Rock. Find oceanfront condos, townhomes & houses near the beach.",
    h1: "Homes for Sale in White Rock, BC",
    description: "Find homes for sale in White Rock. Browse oceanfront listings near the beach and pier.",
    neighborhoods: ["West Beach", "East Beach", "Town Centre", "Uptown", "Ocean Park"]
  }
};

const PROPERTY_TYPES = [
  { value: "any", label: "All Types" },
  { value: "Condo", label: "Condo" },
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
  photos: any | null;
  days_on_market: number | null;
  list_date: string | null;
  year_built: number | null;
};

export default function CityResalePage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Extract city slug from URL path: /resale/vancouver -> vancouver
  const citySlug = location.pathname.split('/').pop() || '';
  const cityConfig = citySlug ? CITY_CONFIG[citySlug.toLowerCase()] : null;

  const filters = {
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["city-resale-listings", citySlug, filters, currentPage],
    queryFn: async () => {
      if (!cityConfig) return { listings: [], totalCount: 0 };

      // First, get total count - always filter for 2025+ builds
      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .ilike("city", cityConfig.name)
        .gte("year_built", 2025);

      // Apply filters to count query
      if (filters.propertyType !== "any") {
        countQuery = countQuery.or(`property_type.ilike.%${filters.propertyType}%,property_sub_type.ilike.%${filters.propertyType}%`);
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        countQuery = countQuery.gte("bedrooms_total", parseInt(filters.beds));
      }

      const { count } = await countQuery;

      // Then get paginated data - always filter for 2025+ builds
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, list_date, year_built")
        .eq("mls_status", "Active")
        .ilike("city", cityConfig.name)
        .gte("year_built", 2025);

      // Apply filters
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
    enabled: !!cityConfig,
  });

  const listings = data?.listings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "" || value === "false") {
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
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["city-resale-listings", citySlug] });
  }, [queryClient, citySlug]);

  const activeFilterCount = [
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

  if (!cityConfig) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">City Not Found</h1>
            <p className="text-muted-foreground mb-4">We couldn't find listings for this city.</p>
            <Button asChild>
              <Link to="/resale">Browse All New Homes</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Info Badge - All listings are 2025+ */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
        <span className="text-sm font-medium text-primary">✓ Showing 2025+ New Construction Only</span>
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
        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) => (
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => goToPage(page)} className="min-w-[36px]">
                {page}
              </Button>
            )
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  // JSON-LD Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "For Sale", "item": "https://presaleproperties.com/resale" },
      { "@type": "ListItem", "position": 3, "name": cityConfig.name }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{cityConfig.metaTitle}</title>
        <meta name="description" content={cityConfig.metaDescription} />
        <link rel="canonical" href={`https://presaleproperties.com/resale/${citySlug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="min-h-screen bg-background">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-muted/50 to-background pt-20 pb-8 md:pt-24 md:pb-12">
            <div className="container px-4 sm:px-6">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span>/</span>
                <Link to="/resale" className="hover:text-foreground transition-colors">For Sale</Link>
                <span>/</span>
                <span className="text-foreground">{cityConfig.name}</span>
              </nav>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {cityConfig.region}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {cityConfig.h1}
                  </h1>
                  <p className="text-muted-foreground max-w-2xl">
                    {cityConfig.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalCount} active listings
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/resale-map">
                      <Map className="h-4 w-4 mr-2" />
                      View Map
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Filters + Listings */}
          <section className="py-6 md:py-8">
            <div className="container px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block w-64 shrink-0">
                  <div className="sticky top-24 bg-card rounded-xl border p-4">
                    <h3 className="font-semibold mb-4">Filters</h3>
                    <FilterControls />
                  </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Mobile Filter Bar */}
                  <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Filters
                          {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[85vh]">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 pb-20 overflow-y-auto">
                          <FilterControls />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
                          <Button onClick={() => setMobileFiltersOpen(false)} className="w-full">
                            Show {totalCount} Results
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Info Badge - All listings are 2025+ */}
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-xs">
                      ✓ 2025+ New Construction Only
                    </Badge>
                  </div>

                  {/* Listings Grid */}
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {listings.map((listing) => (
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-card rounded-xl border">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Listings Found</h3>
                      <p className="text-muted-foreground mb-4">Try adjusting your filters or check back later.</p>
                      <Button onClick={clearAllFilters}>Clear All Filters</Button>
                    </div>
                  )}

                  <PaginationControls />
                </div>
              </div>
            </div>
          </section>

          {/* Neighborhoods */}
          {cityConfig.neighborhoods.length > 0 && (
            <section className="py-8 md:py-12 bg-muted/30">
              <div className="container px-4 sm:px-6">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Browse by Neighbourhood</h2>
                <div className="flex flex-wrap gap-2">
                  {cityConfig.neighborhoods.map((neighborhood) => (
                    <Badge key={neighborhood} variant="secondary" className="text-sm py-1.5 px-3">
                      {neighborhood}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Related Presale Projects */}
          <RelatedPresaleProjects 
            city={cityConfig.name}
            title={`Presale Projects in ${cityConfig.name}`}
            subtitle="Buy before completion and customize your new home"
          />

          <BuyerCTASection />
        </main>
      </PullToRefresh>

      <Footer />
    </>
  );
}
