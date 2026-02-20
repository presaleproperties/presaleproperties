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
  description: string;
  seoTitle: string;
}> = {
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

  const filters = {
    beds: searchParams.get("beds") || "any",
    sort: searchParams.get("sort") || "price-asc",
    city: searchParams.get("city") || "any",
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
        .from("mls_listings")
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
        .from("mls_listings")
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

  const pageTitle = `${config.seoTitle} | New Construction ${config.propertyTypePlural} BC | PresaleProperties`;
  const pageDescription = `Browse ${totalCount}+ ${config.seoTitle.toLowerCase()} across Metro Vancouver & Fraser Valley. ${config.description}. Brand new construction 2024-2026.`;
  const canonicalUrl = `https://presaleproperties.com/properties/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.seoTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "Move-In Ready", "item": "https://presaleproperties.com/properties" },
      { "@type": "ListItem", "position": 3, "name": config.seoTitle },
    ],
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {config.seoTitle}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {totalCount} brand new {config.propertyTypePlural.toLowerCase()} {config.priceLabel.toLowerCase()} • {config.description}
          </p>
        </div>

        {/* Preset filter badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            {config.propertyTypePlural}
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            {config.priceLabel}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            ✓ 2024+ New Construction
          </Badge>
        </div>

        {/* Quick switch between the two pages */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PAGE_CONFIG).map(([pageSlug, pageConfig]) => (
            <Link key={pageSlug} to={`/properties/${pageSlug}`}>
              <Button
                variant={slug === pageSlug ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {pageConfig.seoTitle}
              </Button>
            </Link>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent>
              {CITY_OPTIONS.map((opt) => (
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
          <RelatedPresaleProjects city="Vancouver" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
