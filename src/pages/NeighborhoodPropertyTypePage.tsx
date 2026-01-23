import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Warehouse, MapPin } from "lucide-react";
import { PopularSearchesGrid } from "@/components/seo/PopularSearchesGrid";

// Property type configuration
const PROPERTY_TYPE_CONFIG: Record<string, { 
  label: string; 
  plural: string;
  filter: string[];
  icon: typeof Building2;
  description: string;
}> = {
  condos: {
    label: "Condo",
    plural: "Condos",
    filter: ["Apartment/Condo", "Apartment", "Condo"],
    icon: Building2,
    description: "modern apartments and condominiums with amenities",
  },
  townhomes: {
    label: "Townhome",
    plural: "Townhomes", 
    filter: ["Townhouse", "Row/Townhouse", "Townhome"],
    icon: Warehouse,
    description: "multi-level townhomes with private entrances",
  },
  homes: {
    label: "Home",
    plural: "Homes",
    filter: ["Single Family", "Detached", "House"],
    icon: Home,
    description: "single-family detached homes with yards",
  },
};

// Format city name from slug
const formatCityName = (slug: string) => {
  return slug.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

// Format neighborhood name from slug
const formatNeighborhoodName = (slug: string) => {
  return slug.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

export default function NeighborhoodPropertyTypePage() {
  const { citySlug, neighborhoodSlug, propertyType } = useParams<{ 
    citySlug: string; 
    neighborhoodSlug: string;
    propertyType: string;
  }>();

  const city = formatCityName(citySlug || "");
  const neighborhood = formatNeighborhoodName(neighborhoodSlug || "");
  const typeConfig = PROPERTY_TYPE_CONFIG[propertyType || "condos"] || PROPERTY_TYPE_CONFIG.condos;

  // Fetch listings
  const { data: listings, isLoading } = useQuery({
    queryKey: ["neighborhood-listings", citySlug, neighborhoodSlug, propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("*")
        .eq("mls_status", "Active")
        .ilike("city", city)
        .or(
          `neighborhood.ilike.%${neighborhood}%,subdivision_name.ilike.%${neighborhood}%,unparsed_address.ilike.%${neighborhood}%`
        )
        .in("property_type", typeConfig.filter)
        .gte("year_built", 2024)
        .order("listing_price", { ascending: true })
        .limit(24);

      if (error) throw error;
      return data || [];
    },
    enabled: !!citySlug && !!neighborhoodSlug && !!propertyType,
  });

  // Page metadata
  const pageTitle = `New ${typeConfig.plural} in ${neighborhood}, ${city} | 2024-2026 Built`;
  const pageDescription = `Browse ${listings?.length || 0}+ brand new ${typeConfig.plural.toLowerCase()} for sale in ${neighborhood}, ${city}. All ${typeConfig.description} built 2024 or later. View prices, photos & floor plans.`;
  const canonicalUrl = `https://presaleproperties.lovable.app/resale/${citySlug}/${neighborhoodSlug}/${propertyType}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "New Construction", href: "/resale" },
    { label: city, href: `/resale/${citySlug}` },
    { label: `New ${typeConfig.plural}`, href: `/resale/${citySlug}/${propertyType}` },
    { label: neighborhood },
  ];

  const Icon = typeConfig.icon;

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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `New ${typeConfig.plural} in ${neighborhood}, ${city}`,
            "description": pageDescription,
            "url": canonicalUrl,
            "numberOfItems": listings?.length || 0,
            "itemListElement": listings?.slice(0, 10).map((listing, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "RealEstateListing",
                "name": listing.unparsed_address || `${listing.street_number} ${listing.street_name}`,
                "url": `https://presaleproperties.lovable.app/resale/${listing.listing_key}`,
                "price": listing.listing_price,
                "priceCurrency": "CAD",
              }
            })) || []
          })}
        </script>
      </Helmet>

      <ConversionHeader />

      <main className="container py-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              New {typeConfig.plural} in {neighborhood}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span>{neighborhood}, {city}, BC</span>
            <span className="mx-2">•</span>
            <span>{listings?.length || 0} listings available</span>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Explore brand new {typeConfig.plural.toLowerCase()} built in 2024 or later in {neighborhood}, {city}. 
            All properties feature {typeConfig.description}. Move-in ready with builder warranties.
          </p>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ResaleListingCard 
                key={listing.id}
                id={listing.id}
                listingKey={listing.listing_key}
                price={listing.listing_price}
                address={listing.unparsed_address || `${listing.street_number || ''} ${listing.street_name || ''}`.trim()}
                city={listing.city}
                neighborhood={listing.neighborhood}
                propertyType={listing.property_type}
                propertySubType={listing.property_sub_type}
                beds={listing.bedrooms_total}
                baths={listing.bathrooms_total}
                sqft={listing.living_area}
                photos={listing.photos as any[]}
                daysOnMarket={listing.days_on_market}
                listDate={listing.list_date}
                status={listing.mls_status}
                listAgentName={listing.list_agent_name}
                listOfficeName={listing.list_office_name}
                virtualTourUrl={listing.virtual_tour_url}
                yearBuilt={listing.year_built}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Listings Found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              There are currently no new {typeConfig.plural.toLowerCase()} available in {neighborhood}. 
              Try expanding your search to all of {city}.
            </p>
            <Link
              to={`/resale/${citySlug}/${propertyType}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              View All {typeConfig.plural} in {city}
            </Link>
          </div>
        )}

        {/* Related Neighborhoods */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            More New {typeConfig.plural} in {city}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/resale/${citySlug}/${propertyType}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              All {city}
            </Link>
            {["Downtown", "City Centre", "Uptown", "West End", "East Side"].map((area) => (
              <Link
                key={area}
                to={`/resale/${citySlug}/${area.toLowerCase().replace(/\s+/g, "-")}/${propertyType}`}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Popular Searches Footer */}
      <PopularSearchesGrid defaultCity={city} compact />

      <Footer />
    </div>
  );
}
