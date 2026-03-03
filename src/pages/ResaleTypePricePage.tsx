import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, ChevronLeft, Home, Building2, DollarSign, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Combined type + price page configurations
const PAGE_CONFIG: Record<string, {
  propertyType: string;
  propertyTypePlural: string;
  dbFilters: string[];
  maxPrice: number;
  priceLabel: string;
  cityFilter?: string;
  description: string;
  seoTitle: string;
}> = {
  // General pages
  "condos-under-500k": {
    propertyType: "Condo",
    propertyTypePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"],
    maxPrice: 500000,
    priceLabel: "Under $500K",
    description: "Affordable move-in ready condos perfect for first-time buyers and investors",
    seoTitle: "Move-In Ready Condos Under $500K",
  },
  "townhomes-under-800k": {
    propertyType: "Townhome",
    propertyTypePlural: "Townhomes",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"],
    maxPrice: 800000,
    priceLabel: "Under $800K",
    description: "Spacious move-in ready townhomes with great value for growing families",
    seoTitle: "Move-In Ready Townhomes Under $800K",
  },
  // City-specific condo pages
  "condos-under-500k-surrey": {
    propertyType: "Condo", propertyTypePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"],
    maxPrice: 500000, priceLabel: "Under $500K", cityFilter: "Surrey",
    description: "New construction condos under $500K in Surrey — ideal for first-time buyers near SkyTrain",
    seoTitle: "Move-In Ready Condos Under $500K in Surrey",
  },
  "condos-under-500k-langley": {
    propertyType: "Condo", propertyTypePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"],
    maxPrice: 500000, priceLabel: "Under $500K", cityFilter: "Langley",
    description: "Affordable new condos under $500K in Langley — great value in the Fraser Valley",
    seoTitle: "Move-In Ready Condos Under $500K in Langley",
  },
  "condos-under-500k-coquitlam": {
    propertyType: "Condo", propertyTypePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"],
    maxPrice: 500000, priceLabel: "Under $500K", cityFilter: "Coquitlam",
    description: "New condos under $500K in Coquitlam — mountain views and Evergreen Line access",
    seoTitle: "Move-In Ready Condos Under $500K in Coquitlam",
  },
  "condos-under-500k-burnaby": {
    propertyType: "Condo", propertyTypePlural: "Condos",
    dbFilters: ["Apartment", "Apartment/Condo", "Condo"],
    maxPrice: 500000, priceLabel: "Under $500K", cityFilter: "Burnaby",
    description: "Brand new condos under $500K in Burnaby — close to Metrotown and rapid transit",
    seoTitle: "Move-In Ready Condos Under $500K in Burnaby",
  },
  // City-specific townhome pages
  "townhomes-under-800k-surrey": {
    propertyType: "Townhome", propertyTypePlural: "Townhomes",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"],
    maxPrice: 800000, priceLabel: "Under $800K", cityFilter: "Surrey",
    description: "New townhomes under $800K in Surrey — spacious family living with easy commuting",
    seoTitle: "Move-In Ready Townhomes Under $800K in Surrey",
  },
  "townhomes-under-800k-langley": {
    propertyType: "Townhome", propertyTypePlural: "Townhomes",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"],
    maxPrice: 800000, priceLabel: "Under $800K", cityFilter: "Langley",
    description: "Affordable new townhomes under $800K in Langley — family-friendly Fraser Valley living",
    seoTitle: "Move-In Ready Townhomes Under $800K in Langley",
  },
  "townhomes-under-800k-coquitlam": {
    propertyType: "Townhome", propertyTypePlural: "Townhomes",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"],
    maxPrice: 800000, priceLabel: "Under $800K", cityFilter: "Coquitlam",
    description: "New townhomes under $800K in Coquitlam — nestled between mountains and city amenities",
    seoTitle: "Move-In Ready Townhomes Under $800K in Coquitlam",
  },
  "townhomes-under-800k-burnaby": {
    propertyType: "Townhome", propertyTypePlural: "Townhomes",
    dbFilters: ["Townhouse", "Row/Townhouse", "Townhome"],
    maxPrice: 800000, priceLabel: "Under $800K", cityFilter: "Burnaby",
    description: "Brand new townhomes under $800K in Burnaby — urban convenience with extra space",
    seoTitle: "Move-In Ready Townhomes Under $800K in Burnaby",
  },
};

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

export default function ResaleTypePricePage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract slug from path: /properties/condos-under-500k -> condos-under-500k
  const slug = location.pathname.split("/properties/")[1]?.split("?")[0] || "";
  const config = PAGE_CONFIG[slug.toLowerCase()] || null;

  // If config has a locked city, use that; otherwise allow user to pick
  const lockedCity = config?.cityFilter || null;

  const filters = {
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "price-asc",
    city: lockedCity || searchParams.get("city") || "any",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["resale-type-price", slug, filters, currentPage],
    queryFn: async () => {
      if (!config) return { listings: [], totalCount: 0 };

      const typeFilters = config.dbFilters
        .map(t => `property_type.ilike.%${t}%,property_sub_type.ilike.%${t}%`)
        .join(",");

      // Count query
      let countQuery = supabase
        .from("mls_listings_safe")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .gte("year_built", 2024)
        .lte("listing_price", config.maxPrice)
        .or(typeFilters);

      if (filters.city !== "any") {
        countQuery = countQuery.ilike("city", filters.city);
      }
      if (filters.beds !== "any") {
        countQuery = countQuery.gte("bedrooms_total", parseInt(filters.beds));
      }

      const { count } = await countQuery;

      // Data query
      let query = supabase
        .from("mls_listings_safe")
        .select("id, listing_key, listing_price, mls_status, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, list_date, year_built, list_office_name")
        .eq("mls_status", "Active")
        .gte("year_built", 2024)
        .lte("listing_price", config.maxPrice)
        .or(typeFilters);

      if (filters.city !== "any") {
        query = query.ilike("city", filters.city);
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
    enabled: !!config,
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
    await queryClient.invalidateQueries({ queryKey: ["resale-type-price", slug] });
  }, [queryClient, slug]);

  const getAddress = (listing: MLSListing) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    if (listing.street_number && listing.street_name) {
      return `${listing.street_number} ${listing.street_name}`;
    }
    return listing.city;
  };

  if (!config) {
    return <NotFound />;
  }

  const cityLabel = lockedCity ? ` in ${lockedCity}` : "";
  const pageTitle = `${config.seoTitle} | New Construction ${config.propertyTypePlural}${cityLabel ? cityLabel : " BC"} | PresaleProperties`;
  const pageDescription = `Browse ${totalCount}+ ${config.seoTitle.toLowerCase()}${lockedCity ? ` in ${lockedCity}` : " across Metro Vancouver & Fraser Valley"}. ${config.description}. Brand new construction 2024-2026.`;
  const canonicalUrl = `https://presaleproperties.com/properties/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.seoTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
  };

  const faqSchema = lockedCity ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How much do new ${config.propertyTypePlural.toLowerCase()} cost in ${lockedCity}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `New construction ${config.propertyTypePlural.toLowerCase()} in ${lockedCity} are available starting ${config.priceLabel.toLowerCase()}. Browse ${totalCount}+ listings on PresaleProperties.com.`
        }
      },
      {
        "@type": "Question",
        "name": `Are there move-in ready ${config.propertyTypePlural.toLowerCase()} in ${lockedCity}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes — we list brand new 2024-2026 ${config.propertyTypePlural.toLowerCase()} in ${lockedCity} that are move-in ready or completing soon. ${config.description}.`
        }
      },
    ]
  } : null;

  const breadcrumbItems = [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
    { "@type": "ListItem", "position": 2, "name": "Move-In Ready", "item": "https://presaleproperties.com/properties" },
  ];
  if (lockedCity) {
    const baseSlug = config.maxPrice === 500000 ? "condos-under-500k" : "townhomes-under-800k";
    breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": `${config.propertyTypePlural} ${config.priceLabel}`, "item": `https://presaleproperties.com/properties/${baseSlug}` });
    breadcrumbItems.push({ "@type": "ListItem", "position": 4, "name": lockedCity, "item": canonicalUrl });
  } else {
    breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": config.seoTitle, "item": canonicalUrl });
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems,
  };

  const CITY_OPTIONS = [
    { value: "any", label: "All Cities" },
    { value: "Vancouver", label: "Vancouver" },
    { value: "Surrey", label: "Surrey" },
    { value: "Burnaby", label: "Burnaby" },
    { value: "Langley", label: "Langley" },
    { value: "Coquitlam", label: "Coquitlam" },
    { value: "Richmond", label: "Richmond" },
    { value: "New Westminster", label: "New Westminster" },
    { value: "Abbotsford", label: "Abbotsford" },
    { value: "Delta", label: "Delta" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0"><Home className="h-3.5 w-3.5" /></Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/properties" className="hover:text-foreground transition-colors shrink-0">Move-In Ready</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{config.seoTitle}</span>
        </nav>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {config.seoTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} brand new {config.propertyTypePlural.toLowerCase()} • {config.description}
          </p>
        </div>

        {/* Unified sticky filter bar */}
        <div className="sticky top-[56px] z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-6">
          {/* Type switcher */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
            {(["condos-under-500k", "townhomes-under-800k"] as const).map((baseSlug) => {
              const baseConfig = PAGE_CONFIG[baseSlug];
              const isActive = slug === baseSlug || slug.startsWith(baseSlug.replace("under-", "under-").split("-").slice(0, -1).join("-") ? baseSlug : baseSlug);
              const isTypeMatch = config.propertyType === baseConfig.propertyType && config.maxPrice === baseConfig.maxPrice;
              return (
                <Link key={baseSlug} to={`/properties/${baseSlug}`}>
                  <button
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                      isTypeMatch
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {baseConfig.propertyTypePlural} {baseConfig.priceLabel}
                  </button>
                </Link>
              );
            })}
            <Badge variant="outline" className="text-xs px-2 py-1 ml-1 shrink-0">
              ✓ 2024+ Built
            </Badge>
          </div>

          {/* City quick-links */}
          <div className="flex items-center gap-1 mb-2.5 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] text-muted-foreground mr-1 shrink-0 uppercase tracking-wider">City:</span>
            {(() => {
              const baseSlug = config.maxPrice === 500000 ? "condos-under-500k" : "townhomes-under-800k";
              const cities = [
                { label: "All", slug: baseSlug },
                { label: "Surrey", slug: `${baseSlug}-surrey` },
                { label: "Langley", slug: `${baseSlug}-langley` },
                { label: "Coquitlam", slug: `${baseSlug}-coquitlam` },
                { label: "Burnaby", slug: `${baseSlug}-burnaby` },
              ];
              return cities.map((c) => (
                <Link key={c.slug} to={`/properties/${c.slug}`}>
                  <button
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                      slug === c.slug
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                    }`}
                  >
                    {c.label}
                  </button>
                </Link>
              ));
            })()}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {!lockedCity && (
              <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                <SelectTrigger className="h-8 w-[130px] text-xs border-border/60"><SelectValue placeholder="All Cities" /></SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
              <SelectTrigger className="h-8 w-[110px] text-xs border-border/60"><SelectValue placeholder="Any Beds" /></SelectTrigger>
              <SelectContent>
                {BEDS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(!lockedCity && filters.city !== "any" || filters.beds !== "any") && (
              <button
                onClick={() => {
                  const newParams = new URLSearchParams();
                  if (filters.sort !== "price-asc") newParams.set("sort", filters.sort);
                  setSearchParams(newParams);
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Clear
              </button>
            )}

            <div className="ml-auto shrink-0">
              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="h-8 w-[145px] text-xs border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No listings found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back soon for new inventory.
              </p>
              <Link to="/properties">
                <Button variant="outline">Browse All Properties</Button>
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
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Related Presale Projects */}
        <div className="mt-12">
          <RelatedPresaleProjects city={lockedCity || "Vancouver"} />
        </div>

        {/* SEO content block for AI discovery */}
        <section className="mt-12 prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            {config.seoTitle}
          </h2>
          <p>
            {config.description}. These are brand new constructions built between 2024 and 2026, 
            offering modern layouts, energy-efficient features, and full builder warranties.
            {lockedCity && ` ${lockedCity} continues to be one of the most sought-after cities in Metro Vancouver for new home buyers, 
            with excellent transit connections, growing amenities, and strong long-term appreciation potential.`}
          </p>
          <p>
            Whether you're a first-time buyer, investor, or growing family looking to upsize, 
            {lockedCity ? ` ${lockedCity}'s` : " BC's"} new {config.propertyTypePlural.toLowerCase()} {config.priceLabel.toLowerCase()} represent 
            some of the best value in the Lower Mainland real estate market.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
