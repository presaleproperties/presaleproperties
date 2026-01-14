import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, ChevronLeft, Home, Building2, MapPin, SlidersHorizontal, X, Map } from "lucide-react";
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
import { RelatedPresaleProjects } from "@/components/resale/RelatedPresaleProjects";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const ITEMS_PER_PAGE = 16;

// City configuration with SEO data
const CITY_CONFIG: Record<string, {
  name: string;
  dbName: string;
  region: string;
}> = {
  "vancouver": { name: "Vancouver", dbName: "Vancouver", region: "Metro Vancouver" },
  "surrey": { name: "Surrey", dbName: "Surrey", region: "Fraser Valley" },
  "burnaby": { name: "Burnaby", dbName: "Burnaby", region: "Metro Vancouver" },
  "coquitlam": { name: "Coquitlam", dbName: "Coquitlam", region: "Tri-Cities" },
  "langley": { name: "Langley", dbName: "Langley", region: "Fraser Valley" },
  "richmond": { name: "Richmond", dbName: "Richmond", region: "Metro Vancouver" },
  "delta": { name: "Delta", dbName: "Delta", region: "South of Fraser" },
  "abbotsford": { name: "Abbotsford", dbName: "Abbotsford", region: "Fraser Valley" },
  "chilliwack": { name: "Chilliwack", dbName: "Chilliwack", region: "Fraser Valley" },
  "new-westminster": { name: "New Westminster", dbName: "New Westminster", region: "Metro Vancouver" },
  "port-coquitlam": { name: "Port Coquitlam", dbName: "Port Coquitlam", region: "Tri-Cities" },
  "port-moody": { name: "Port Moody", dbName: "Port Moody", region: "Tri-Cities" },
  "white-rock": { name: "White Rock", dbName: "White Rock", region: "South of Fraser" },
  "north-vancouver": { name: "North Vancouver", dbName: "North Vancouver", region: "North Shore" },
  "maple-ridge": { name: "Maple Ridge", dbName: "Maple Ridge", region: "Fraser Valley" },
};

// Property type configuration
const PROPERTY_TYPE_CONFIG: Record<string, {
  name: string;
  namePlural: string;
  dbFilters: string[];
}> = {
  "condos": { 
    name: "Condo", 
    namePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"]
  },
  "townhouses": { 
    name: "Townhouse", 
    namePlural: "Townhouses",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"]
  },
  "houses": { 
    name: "House", 
    namePlural: "Houses",
    dbFilters: ["Single Family", "Detached", "House", "Single Family Residence"]
  },
  "duplexes": { 
    name: "Duplex", 
    namePlural: "Duplexes",
    dbFilters: ["Duplex", "1/2 Duplex", "Half Duplex"]
  },
};

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
  list_office_name: string | null;
};

export default function ResalePropertyTypePage() {
  const { citySlug, propertyType } = useParams<{ citySlug: string; propertyType: string }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cityConfig = citySlug ? CITY_CONFIG[citySlug.toLowerCase()] : null;
  const propertyTypeConfig = propertyType ? PROPERTY_TYPE_CONFIG[propertyType.toLowerCase()] : null;

  const filters = {
    priceRange: searchParams.get("price") || "any",
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["resale-property-type-listings", citySlug, propertyType, filters, currentPage],
    queryFn: async () => {
      if (!cityConfig || !propertyTypeConfig) return { listings: [], totalCount: 0 };

      // Build property type filter
      const typeFilters = propertyTypeConfig.dbFilters
        .map(t => `property_type.ilike.%${t}%,property_sub_type.ilike.%${t}%`)
        .join(",");

      // Count query
      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .ilike("city", cityConfig.dbName)
        .gte("year_built", 2024)
        .or(typeFilters);

      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        countQuery = countQuery.gte("bedrooms_total", parseInt(filters.beds));
      }

      const { count } = await countQuery;

      // Data query
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, list_date, year_built, list_office_name")
        .eq("mls_status", "Active")
        .ilike("city", cityConfig.dbName)
        .gte("year_built", 2024)
        .or(typeFilters);

      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("listing_price", min).lte("listing_price", max);
      }
      if (filters.beds !== "any") {
        query = query.gte("bedrooms_total", parseInt(filters.beds));
      }

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

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data: listingsData, error } = await query;
      if (error) throw error;

      return { listings: listingsData as MLSListing[], totalCount: count || 0 };
    },
    enabled: !!cityConfig && !!propertyTypeConfig,
  });

  const listings = data?.listings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any") {
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

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["resale-property-type-listings", citySlug, propertyType] });
  }, [queryClient, citySlug, propertyType]);

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  if (!cityConfig || !propertyTypeConfig) {
    return <NotFound />;
  }

  // SEO content
  const pageTitle = `New ${propertyTypeConfig.namePlural} for Sale in ${cityConfig.name} | 2025+ Construction | PresaleProperties`;
  const pageDescription = `Browse ${totalCount}+ new construction ${propertyTypeConfig.namePlural.toLowerCase()} for sale in ${cityConfig.name}, BC. Built 2025 or later. Move-in ready homes with photos, prices & details.`;
  const canonicalUrl = `https://presaleproperties.com/resale/${citySlug}/${propertyType}`;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `New ${propertyTypeConfig.namePlural} in ${cityConfig.name}`,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "Move-In Ready", "item": "https://presaleproperties.com/resale" },
      { "@type": "ListItem", "position": 3, "name": cityConfig.name, "item": `https://presaleproperties.com/resale/${citySlug}` },
      { "@type": "ListItem", "position": 4, "name": propertyTypeConfig.namePlural }
    ]
  };

  const FilterControls = () => (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
        <span className="text-sm font-medium text-primary">✓ 2025+ New Construction Only</span>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Price Range</label>
        <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
          <SelectTrigger><SelectValue placeholder="Any Price" /></SelectTrigger>
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
          <SelectTrigger><SelectValue placeholder="Any Beds" /></SelectTrigger>
          <SelectContent>
            {BEDS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0"><Home className="h-3.5 w-3.5" /></Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/resale" className="hover:text-foreground transition-colors shrink-0">Move-In Ready</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to={`/resale/${citySlug}`} className="hover:text-foreground transition-colors shrink-0">{cityConfig.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{propertyTypeConfig.namePlural}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            New {propertyTypeConfig.namePlural} for Sale in {cityConfig.name}
          </h1>
          <p className="text-muted-foreground">
            {totalCount} new construction {propertyTypeConfig.namePlural.toLowerCase()} built 2025 or later
          </p>
        </div>

        {/* Property Type Switcher */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PROPERTY_TYPE_CONFIG).map(([slug, config]) => (
            <Link key={slug} to={`/resale/${citySlug}/${slug}`}>
              <Button
                variant={propertyType === slug ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {config.namePlural}
              </Button>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <FilterControls />
              
              {/* Related Links */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-sm mb-3">Explore More</h3>
                <div className="space-y-2 text-sm">
                  <Link to={`/resale/${citySlug}`} className="block text-primary hover:underline">
                    All {cityConfig.name} Listings
                  </Link>
                  <Link to={`/${citySlug}-presale-condos`} className="block text-primary hover:underline">
                    {cityConfig.name} Presale Condos
                  </Link>
                  <Link to={`/${citySlug}-presale-townhomes`} className="block text-primary hover:underline">
                    {cityConfig.name} Presale Townhomes
                  </Link>
                  <Link to="/calculator" className="block text-primary hover:underline">
                    Investment Calculator
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterControls />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Sort */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {totalCount} {propertyTypeConfig.namePlural.toLowerCase()} found
              </span>
              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Listings Grid */}
            <PullToRefresh onRefresh={handleRefresh}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-[320px] rounded-xl" />
                  ))}
                </div>
              ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((listing) => (
                    <ResaleListingCard
                      key={listing.id}
                      id={listing.id}
                      listingKey={listing.listing_key}
                      price={listing.listing_price}
                      address={getAddress(listing)}
                      city={listing.city}
                      neighborhood={listing.neighborhood}
                      propertyType={listing.property_sub_type || listing.property_type}
                      beds={listing.bedrooms_total}
                      baths={listing.bathrooms_total}
                      sqft={listing.living_area}
                      photos={listing.photos}
                      daysOnMarket={listing.days_on_market}
                      yearBuilt={listing.year_built}
                      listOfficeName={listing.list_office_name}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No {propertyTypeConfig.namePlural} Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No new construction {propertyTypeConfig.namePlural.toLowerCase()} match your criteria.
                  </p>
                  <Link to={`/resale/${citySlug}`}>
                    <Button>View All {cityConfig.name} Listings</Button>
                  </Link>
                </div>
              )}
            </PullToRefresh>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Related Presale Projects */}
        <div className="mt-12 border-t pt-8">
          <RelatedPresaleProjects
            city={cityConfig.name}
            title={`Presale ${propertyTypeConfig.namePlural} in ${cityConfig.name}`}
            subtitle="Buy before completion and customize your new home"
          />
        </div>

        {/* Internal Links Section */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-6">Explore {cityConfig.name} New Homes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">By Property Type</h3>
              <div className="space-y-1">
                {Object.entries(PROPERTY_TYPE_CONFIG).map(([slug, config]) => (
                  <Link 
                    key={slug} 
                    to={`/resale/${citySlug}/${slug}`}
                    className="block text-muted-foreground hover:text-primary"
                  >
                    {config.namePlural}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">By Price Range</h3>
              <div className="space-y-1">
                <Link to={`/resale/${citySlug}/under-750k`} className="block text-muted-foreground hover:text-primary">Under $750K</Link>
                <Link to={`/resale/${citySlug}/under-1m`} className="block text-muted-foreground hover:text-primary">Under $1M</Link>
                <Link to={`/resale/${citySlug}/under-1.5m`} className="block text-muted-foreground hover:text-primary">Under $1.5M</Link>
                <Link to={`/resale/${citySlug}/luxury`} className="block text-muted-foreground hover:text-primary">$2M+ Luxury</Link>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Presale Projects</h3>
              <div className="space-y-1">
                <Link to={`/${citySlug}-presale-condos`} className="block text-muted-foreground hover:text-primary">Presale Condos</Link>
                <Link to={`/${citySlug}-presale-townhomes`} className="block text-muted-foreground hover:text-primary">Presale Townhomes</Link>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Other Cities</h3>
              <div className="space-y-1">
                {Object.entries(CITY_CONFIG)
                  .filter(([slug]) => slug !== citySlug)
                  .slice(0, 4)
                  .map(([slug, config]) => (
                    <Link 
                      key={slug} 
                      to={`/resale/${slug}/${propertyType}`}
                      className="block text-muted-foreground hover:text-primary"
                    >
                      {config.name} {propertyTypeConfig.namePlural}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
