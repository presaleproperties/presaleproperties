import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Home, Bed } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import NotFound from "./NotFound";

const ITEMS_PER_PAGE = 24;

// City configuration with SEO-friendly names
const CITY_CONFIG: Record<string, { name: string; dbName: string }> = {
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
  "west-vancouver": { name: "West Vancouver", dbName: "West Vancouver" },
};

// Bedroom configuration
const BEDROOM_CONFIG: Record<string, { label: string; beds: number; description: string }> = {
  "1-bedroom": { label: "1 Bedroom", beds: 1, description: "Perfect for singles and couples. Ideal starter homes with lower price points." },
  "2-bedroom": { label: "2 Bedroom", beds: 2, description: "Popular choice for couples, roommates, or small families. Great investment potential." },
  "3-bedroom": { label: "3 Bedroom", beds: 3, description: "Family-sized homes with room to grow. Space for a home office or guest room." },
  "4-bedroom": { label: "4+ Bedroom", beds: 4, description: "Spacious family homes. Often includes townhouses and detached houses." },
};

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhouse", label: "Townhouses" },
  { value: "house", label: "Houses" },
];

const PRICE_RANGES = [
  { value: "all", label: "Any Price" },
  { value: "under-500k", label: "Under $500K" },
  { value: "under-750k", label: "Under $750K" },
  { value: "under-1m", label: "Under $1M" },
  { value: "under-1.5m", label: "Under $1.5M" },
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
  city: string;
  neighborhood: string | null;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  photos: any;
  days_on_market: number | null;
  mls_status: string;
  year_built: number | null;
  list_agent_name: string | null;
  list_office_name: string | null;
};

export default function ResaleBedroomPage() {
  const { citySlug, bedroomCount } = useParams<{ citySlug: string; bedroomCount: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const cityConfig = citySlug ? CITY_CONFIG[citySlug] : null;
  const bedroomConfig = bedroomCount ? BEDROOM_CONFIG[bedroomCount] : null;

  // Get filters from URL
  const propertyType = searchParams.get("type") || "all";
  const priceRange = searchParams.get("price") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value === "newest") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch listings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["resale-bedroom", citySlug, bedroomCount, propertyType, priceRange, sortBy, currentPage],
    queryFn: async () => {
      if (!cityConfig || !bedroomConfig) return { listings: [], totalCount: 0 };

      let query = supabase
        .from("mls_listings")
        .select("*", { count: "exact" })
        .eq("mls_status", "Active")
        .ilike("city", `%${cityConfig.dbName}%`)
        .gte("year_built", 2024);

      // Handle 4+ bedroom case
      if (bedroomConfig.beds === 4) {
        query = query.gte("bedrooms_total", 4);
      } else {
        query = query.eq("bedrooms_total", bedroomConfig.beds);
      }

      // Apply property type filter
      if (propertyType !== "all") {
        const typeMap: Record<string, string[]> = {
          condo: ["Apartment", "Condo"],
          townhouse: ["Townhouse", "Row/Townhouse"],
          house: ["Single Family", "Detached", "House"],
        };
        query = query.in("property_sub_type", typeMap[propertyType] || [propertyType]);
      }

      // Apply price filter
      if (priceRange !== "all") {
        const priceMap: Record<string, number> = {
          "under-500k": 500000,
          "under-750k": 750000,
          "under-1m": 1000000,
          "under-1.5m": 1500000,
        };
        if (priceMap[priceRange]) {
          query = query.lte("listing_price", priceMap[priceRange]);
        }
      }

      // Apply sorting
      if (sortBy === "price-asc") {
        query = query.order("listing_price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("listing_price", { ascending: false });
      } else {
        query = query.order("list_date", { ascending: false });
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { listings: data as MLSListing[], totalCount: count || 0 };
    },
    enabled: !!cityConfig && !!bedroomConfig,
  });

  const listings = data?.listings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Pull to refresh handler
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["resale-bedroom"] });
    await refetch();
  };

  if (!cityConfig || !bedroomConfig) {
    return <NotFound />;
  }

  // SEO content with high-intent keywords for "new homes", "brand new"
  const pageTitle = `${bedroomConfig.label.toUpperCase()} NEW HOMES in ${cityConfig.name} | Brand New Construction 2024-2026`;
  const pageDescription = `Find ${totalCount}+ brand new ${bedroomConfig.label.toLowerCase()} homes for sale in ${cityConfig.name}, BC. ${bedroomConfig.description} New construction condos, townhomes & houses built 2024-2026.`;
  const canonicalUrl = `https://presaleproperties.com/resale/${citySlug}/${bedroomCount}`;
  const keywords = `${bedroomConfig.label.toLowerCase()} new homes ${cityConfig.name}, brand new ${bedroomConfig.label.toLowerCase()} home, ${bedroomConfig.label.toLowerCase()} new condo ${cityConfig.name}, ${bedroomConfig.label.toLowerCase()} new townhome, new construction ${bedroomConfig.label.toLowerCase()} ${cityConfig.name}`;

  // Structured data with listings
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${bedroomConfig.label} Brand New Homes in ${cityConfig.name}`,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
    "itemListElement": listings?.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": `New ${bedroomConfig.label} Home - ${getAddress(listing)}`,
        "url": `https://presaleproperties.com/properties/${listing.listing_key}`
      }
    })) || []
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "New Homes for Sale", "item": "https://presaleproperties.com/properties" },
      { "@type": "ListItem", "position": 3, "name": `${cityConfig.name} New Homes`, "item": `https://presaleproperties.com/properties/${citySlug}` },
      { "@type": "ListItem", "position": 4, "name": `${bedroomConfig.label} Homes` }
    ]
  };
  
  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How many ${bedroomConfig.label.toLowerCase()} new homes are for sale in ${cityConfig.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `There are currently ${totalCount}+ brand new ${bedroomConfig.label.toLowerCase()} homes for sale in ${cityConfig.name}. All are new construction built 2024-2026.`
        }
      }
    ]
  };

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  const activeFilterCount = [propertyType, priceRange].filter(f => f !== "all").length;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <ConversionHeader />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="min-h-screen bg-background pt-20">
          <div className="container px-4 py-6 md:py-10">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/properties">Move-In Ready</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/properties/${citySlug}`}>{cityConfig.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{bedroomConfig.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bed className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                  {bedroomConfig.label} New Homes in {cityConfig.name}
                </h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {bedroomConfig.description} Showing {totalCount} new construction homes built 2025 or later.
              </p>
            </div>

            {/* Bedroom Quick Switch */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {Object.entries(BEDROOM_CONFIG).map(([slug, config]) => (
                <Link
                  key={slug}
                  to={`/resale/${citySlug}/${slug}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    bedroomCount === slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  <Bed className="h-4 w-4" />
                  {config.label}
                </Link>
              ))}
            </div>

            {/* Filters & Results */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Mobile Filter Button */}
              <div className="lg:hidden flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {totalCount} homes found
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <SheetHeader>
                      <SheetTitle>Filter Results</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Property Type</label>
                        <Select value={propertyType} onValueChange={(v) => updateFilter("type", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Price Range</label>
                        <Select value={priceRange} onValueChange={(v) => updateFilter("price", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRICE_RANGES.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SORT_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 shrink-0 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <Select value={propertyType} onValueChange={(v) => updateFilter("type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={(v) => updateFilter("price", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Internal Links for SEO */}
                <div className="pt-6 border-t">
                  <h3 className="text-sm font-medium mb-3">Explore {cityConfig.name}</h3>
                  <div className="space-y-2 text-sm">
                    <Link to={`/resale/${citySlug}/condos`} className="block text-muted-foreground hover:text-primary">
                      New Condos
                    </Link>
                    <Link to={`/resale/${citySlug}/townhouses`} className="block text-muted-foreground hover:text-primary">
                      New Townhouses
                    </Link>
                    <Link to={`/resale/${citySlug}/under-750k`} className="block text-muted-foreground hover:text-primary">
                      Under $750K
                    </Link>
                    <Link to={`/${citySlug}-presale-condos`} className="block text-muted-foreground hover:text-primary">
                      Presale Condos
                    </Link>
                  </div>
                </div>
              </aside>

              {/* Results Grid */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                    ))}
                  </div>
                ) : listings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                          listAgentName={listing.list_agent_name}
                          listOfficeName={listing.list_office_name}
                        />
                      ))}
                    </div>

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
                        <span className="text-sm text-muted-foreground px-4">
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
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Bed className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Homes Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or explore other bedroom counts.
                    </p>
                    <Button asChild>
                      <Link to={`/resale/${citySlug}`}>View All {cityConfig.name} Homes</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Internal Links Section */}
            <section className="mt-16 pt-8 border-t">
              <h2 className="text-xl font-semibold mb-6">Explore More in {cityConfig.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <h3 className="font-medium mb-2">By Bedrooms</h3>
                  <div className="space-y-1">
                    {Object.entries(BEDROOM_CONFIG).map(([slug, config]) => (
                      <Link
                        key={slug}
                        to={`/resale/${citySlug}/${slug}`}
                        className={`block ${bedroomCount === slug ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
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
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">By Price Range</h3>
                  <div className="space-y-1">
                    <Link to={`/resale/${citySlug}/under-500k`} className="block text-muted-foreground hover:text-primary">Under $500K</Link>
                    <Link to={`/resale/${citySlug}/under-750k`} className="block text-muted-foreground hover:text-primary">Under $750K</Link>
                    <Link to={`/resale/${citySlug}/under-1m`} className="block text-muted-foreground hover:text-primary">Under $1M</Link>
                    <Link to={`/resale/${citySlug}/luxury`} className="block text-muted-foreground hover:text-primary">Luxury $2M+</Link>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Other Cities</h3>
                  <div className="space-y-1">
                    {Object.entries(CITY_CONFIG)
                      .filter(([slug]) => slug !== citySlug)
                      .slice(0, 5)
                      .map(([slug, config]) => (
                        <Link
                          key={slug}
                          to={`/resale/${slug}/${bedroomCount}`}
                          className="block text-muted-foreground hover:text-primary"
                        >
                          {config.name}
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </PullToRefresh>

      <Footer />
    </>
  );
}
