import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, ChevronLeft, Home, Building2, DollarSign, TrendingDown, Crown, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { RelatedPresaleProjects } from "@/components/resale/RelatedPresaleProjects";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const ITEMS_PER_PAGE = 16;

// City configuration
const CITY_CONFIG: Record<string, {
  name: string;
  dbName: string;
}> = {
  "vancouver": { name: "Vancouver", dbName: "Vancouver" },
  "surrey": { name: "Surrey", dbName: "Surrey" },
  "burnaby": { name: "Burnaby", dbName: "Burnaby" },
  "coquitlam": { name: "Coquitlam", dbName: "Coquitlam" },
  "langley": { name: "Langley", dbName: "Langley" },
  "richmond": { name: "Richmond", dbName: "Richmond" },
  "delta": { name: "Delta", dbName: "Delta" },
  "abbotsford": { name: "Abbotsford", dbName: "Abbotsford" },
  "chilliwack": { name: "Chilliwack", dbName: "Chilliwack" },
  "new-westminster": { name: "New Westminster", dbName: "New Westminster" },
  "port-coquitlam": { name: "Port Coquitlam", dbName: "Port Coquitlam" },
  "port-moody": { name: "Port Moody", dbName: "Port Moody" },
  "white-rock": { name: "White Rock", dbName: "White Rock" },
  "north-vancouver": { name: "North Vancouver", dbName: "North Vancouver" },
  "maple-ridge": { name: "Maple Ridge", dbName: "Maple Ridge" },
};

// Price range configuration
const PRICE_RANGE_CONFIG: Record<string, {
  label: string;
  displayLabel: string;
  min: number;
  max: number;
  icon: typeof TrendingDown;
  description: string;
}> = {
  "under-500k": { 
    label: "Under $500K", 
    displayLabel: "Under $500,000",
    min: 0, 
    max: 500000,
    icon: TrendingDown,
    description: "Affordable new construction homes perfect for first-time buyers"
  },
  "under-750k": { 
    label: "Under $750K", 
    displayLabel: "Under $750,000",
    min: 0, 
    max: 750000,
    icon: TrendingDown,
    description: "Entry-level new homes with great value"
  },
  "under-1m": { 
    label: "Under $1M", 
    displayLabel: "Under $1,000,000",
    min: 0, 
    max: 1000000,
    icon: DollarSign,
    description: "Quality new construction homes under one million"
  },
  "under-1.5m": { 
    label: "Under $1.5M", 
    displayLabel: "Under $1,500,000",
    min: 0, 
    max: 1500000,
    icon: DollarSign,
    description: "Premium new homes with excellent finishes"
  },
  "under-2m": { 
    label: "Under $2M", 
    displayLabel: "Under $2,000,000",
    min: 0, 
    max: 2000000,
    icon: DollarSign,
    description: "High-end new construction properties"
  },
  "luxury": { 
    label: "$2M+ Luxury", 
    displayLabel: "$2,000,000+",
    min: 2000000, 
    max: 999999999,
    icon: Crown,
    description: "Luxury new homes with premium features and finishes"
  },
};

const PROPERTY_TYPES = [
  { value: "any", label: "All Types" },
  { value: "Condo", label: "Condos" },
  { value: "Townhouse", label: "Townhouses" },
  { value: "House", label: "Houses" },
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

export default function ResalePriceRangePage() {
  const { citySlug, priceRange } = useParams<{ citySlug: string; priceRange: string }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const cityConfig = citySlug ? CITY_CONFIG[citySlug.toLowerCase()] : null;
  const priceConfig = priceRange ? PRICE_RANGE_CONFIG[priceRange.toLowerCase()] : null;

  const filters = {
    propertyType: searchParams.get("type") || "any",
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["resale-price-range-listings", citySlug, priceRange, filters, currentPage],
    queryFn: async () => {
      if (!cityConfig || !priceConfig) return { listings: [], totalCount: 0 };

      // Count query
      let countQuery = supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .ilike("city", cityConfig.dbName)
        .gte("year_built", 2024)
        .gte("listing_price", priceConfig.min)
        .lte("listing_price", priceConfig.max);

      if (filters.propertyType !== "any") {
        countQuery = countQuery.or(`property_type.ilike.%${filters.propertyType}%,property_sub_type.ilike.%${filters.propertyType}%`);
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
        .gte("listing_price", priceConfig.min)
        .lte("listing_price", priceConfig.max);

      if (filters.propertyType !== "any") {
        query = query.or(`property_type.ilike.%${filters.propertyType}%,property_sub_type.ilike.%${filters.propertyType}%`);
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
    enabled: !!cityConfig && !!priceConfig,
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
    await queryClient.invalidateQueries({ queryKey: ["resale-price-range-listings", citySlug, priceRange] });
  }, [queryClient, citySlug, priceRange]);

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  if (!cityConfig || !priceConfig) {
    return <NotFound />;
  }

  const PriceIcon = priceConfig.icon;

  // SEO content
  const pageTitle = `New Homes ${priceConfig.label} in ${cityConfig.name} | 2025+ Construction | PresaleProperties`;
  const pageDescription = `Find ${totalCount}+ new construction homes ${priceConfig.label.toLowerCase()} in ${cityConfig.name}, BC. ${priceConfig.description}. Move-in ready 2025+ built homes.`;
  const canonicalUrl = `https://presaleproperties.com/resale/${citySlug}/${priceRange}`;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `New Homes ${priceConfig.label} in ${cityConfig.name}`,
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
      { "@type": "ListItem", "position": 4, "name": priceConfig.label }
    ]
  };

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
          <span className="text-foreground font-medium">{priceConfig.label}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PriceIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              New Homes {priceConfig.label} in {cityConfig.name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {totalCount} new construction homes • {priceConfig.description}
          </p>
        </div>

        {/* Price Range Switcher */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PRICE_RANGE_CONFIG).map(([slug, config]) => (
            <Link key={slug} to={`/resale/${citySlug}/${slug}`}>
              <Button
                variant={priceRange === slug ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {config.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select value={filters.propertyType} onValueChange={(v) => updateFilter("type", v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Any Beds" /></SelectTrigger>
            <SelectContent>
              {BEDS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Listings Grid */}
        <PullToRefresh onRefresh={handleRefresh}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[320px] rounded-xl" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <PriceIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Homes in This Price Range</h3>
              <p className="text-muted-foreground mb-6">
                No new construction homes {priceConfig.label.toLowerCase()} currently available.
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

        {/* Related Presale Projects */}
        <div className="mt-12 border-t pt-8">
          <RelatedPresaleProjects
            city={cityConfig.name}
            title={`Presale Projects in ${cityConfig.name}`}
            subtitle="Buy before completion at today's prices"
          />
        </div>

        {/* Internal Links Section */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-6">Explore {cityConfig.name} New Homes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">By Price Range</h3>
              <div className="space-y-1">
                {Object.entries(PRICE_RANGE_CONFIG).map(([slug, config]) => (
                  <Link 
                    key={slug} 
                    to={`/resale/${citySlug}/${slug}`}
                    className={`block ${priceRange === slug ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    {config.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">By Property Type</h3>
              <div className="space-y-1">
                <Link to={`/resale/${citySlug}/condos`} className="block text-muted-foreground hover:text-primary">Condos</Link>
                <Link to={`/resale/${citySlug}/townhouses`} className="block text-muted-foreground hover:text-primary">Townhouses</Link>
                <Link to={`/resale/${citySlug}/houses`} className="block text-muted-foreground hover:text-primary">Houses</Link>
                <Link to={`/resale/${citySlug}/duplexes`} className="block text-muted-foreground hover:text-primary">Duplexes</Link>
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
              <h3 className="font-medium mb-2">Same Price in Other Cities</h3>
              <div className="space-y-1">
                {Object.entries(CITY_CONFIG)
                  .filter(([slug]) => slug !== citySlug)
                  .slice(0, 4)
                  .map(([slug, config]) => (
                    <Link 
                      key={slug} 
                      to={`/resale/${slug}/${priceRange}`}
                      className="block text-muted-foreground hover:text-primary"
                    >
                      {config.name}
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
