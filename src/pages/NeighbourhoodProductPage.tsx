import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import NotFound from "./NotFound";
import { Helmet } from "@/components/seo/Helmet";
import { ChevronRight, Home, MapPin, Building2, Shield, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";

// Neighbourhood SEO configurations
const NEIGHBOURHOOD_CONFIG: Record<string, {
  city: string;
  displayName: string;
  description: string;
  highlights: string[];
  faqs: { question: string; answer: string }[];
}> = {
  // Vancouver Neighbourhoods
  "fairview": {
    city: "Vancouver",
    displayName: "Fairview",
    description: "Fairview is a vibrant Vancouver neighbourhood known for City Hall, Broadway tech corridor, and excellent transit. Home to trendy shops along South Granville and Cambie Village.",
    highlights: ["Broadway SkyTrain Station", "City Hall area", "South Granville shopping", "VGH proximity"],
    faqs: [
      { question: "Why buy presale in Fairview Vancouver?", answer: "Fairview offers excellent transit with the new Broadway Subway, proximity to VGH and downtown, and a vibrant urban lifestyle. Presales here offer strong appreciation potential." },
      { question: "What are typical presale prices in Fairview?", answer: "Fairview presale condos typically range from $700K for 1-bed to $1.5M+ for 3-bed units, reflecting the premium location." }
    ]
  },
  "mount-pleasant": {
    city: "Vancouver",
    displayName: "Mount Pleasant",
    description: "Mount Pleasant is Vancouver's creative hub with craft breweries, trendy restaurants, and Main Street boutiques. A hotspot for young professionals and tech workers.",
    highlights: ["Main Street shopping", "Brewery District", "Tech company offices", "Creative community"],
    faqs: [
      { question: "Is Mount Pleasant good for presale investment?", answer: "Mount Pleasant has strong rental demand from young professionals and tech workers. The area's walkability and lifestyle appeal drive consistent appreciation." },
      { question: "What's the vibe in Mount Pleasant?", answer: "Mount Pleasant offers an urban, creative atmosphere with local shops, farm-to-table restaurants, and a strong community feel." }
    ]
  },
  "kitsilano": {
    city: "Vancouver",
    displayName: "Kitsilano",
    description: "Kitsilano is Vancouver's iconic beach neighbourhood with stunning views, active lifestyle, and village feel. Popular with families and professionals seeking work-life balance.",
    highlights: ["Kitsilano Beach", "West 4th Avenue shops", "Yoga studios", "Ocean views"],
    faqs: [
      { question: "Are presale condos available in Kitsilano?", answer: "Presale inventory in Kitsilano is limited due to established zoning. When available, projects command premium prices for the lifestyle and location." },
      { question: "What makes Kitsilano special?", answer: "Kitsilano offers beach lifestyle, mountain views, excellent restaurants, and a village atmosphere minutes from downtown Vancouver." }
    ]
  },
  // Surrey Neighbourhoods
  "guildford": {
    city: "Surrey",
    displayName: "Guildford",
    description: "Guildford is Surrey's established suburban centre with excellent schools, Guildford Town Centre mall, and family-friendly amenities. A top choice for growing families.",
    highlights: ["Guildford Town Centre", "Top-rated schools", "Family-friendly parks", "Central Surrey location"],
    faqs: [
      { question: "Why choose Guildford for presale purchase?", answer: "Guildford offers excellent schools, shopping convenience, and more affordable presale prices than Vancouver while maintaining suburban appeal." },
      { question: "What's the future development outlook for Guildford?", answer: "Guildford is seeing increased density with new condo and townhome projects. The area benefits from improved transit connections and commercial development." }
    ]
  },
  "cloverdale": {
    city: "Surrey",
    displayName: "Cloverdale",
    description: "Cloverdale is Surrey's charming heritage neighbourhood with small-town feel, the famous Cloverdale Rodeo, and excellent family living. Popular for townhomes and rowhomes.",
    highlights: ["Heritage downtown", "Cloverdale Rodeo", "Equestrian community", "Family-oriented"],
    faqs: [
      { question: "Is Cloverdale good for townhome buyers?", answer: "Cloverdale is excellent for townhome buyers seeking space, yards, and community feel at more affordable prices than closer-in locations." },
      { question: "What amenities does Cloverdale offer?", answer: "Cloverdale features a charming downtown, farmers market, excellent parks, and access to agricultural areas while remaining connected to Surrey's urban core." }
    ]
  },
  "city-centre": {
    city: "Surrey",
    displayName: "City Centre",
    description: "Surrey City Centre is the rapidly developing downtown core with SkyTrain access, SFU campus, and modern high-rises. The future heart of Surrey's urban living.",
    highlights: ["Surrey Central SkyTrain", "SFU Surrey campus", "City Hall", "Modern high-rises"],
    faqs: [
      { question: "Why invest in Surrey City Centre presales?", answer: "Surrey City Centre is BC's fastest-growing urban centre with massive infrastructure investment, SkyTrain access, and strong appreciation potential." },
      { question: "What's planned for Surrey City Centre?", answer: "Upcoming developments include SkyTrain extension, new office towers, cultural amenities, and continued densification around the central hub." }
    ]
  },
  // Burnaby Neighbourhoods
  "metrotown": {
    city: "Burnaby",
    displayName: "Metrotown",
    description: "Metrotown is Burnaby's urban centre featuring Western Canada's largest mall, SkyTrain hub, and iconic condo towers. A premier location for urban living.",
    highlights: ["Metropolis at Metrotown", "SkyTrain station", "Central Park nearby", "Urban convenience"],
    faqs: [
      { question: "Are Metrotown presales a good investment?", answer: "Metrotown presales offer strong rental income potential due to transit access, shopping convenience, and high demand from students and professionals." },
      { question: "What's the lifestyle like in Metrotown?", answer: "Metrotown offers ultimate urban convenience with world-class shopping, dining, entertainment, and direct SkyTrain access to Vancouver." }
    ]
  },
  "brentwood": {
    city: "Burnaby",
    displayName: "Brentwood",
    description: "Brentwood is Burnaby's emerging urban village with The Amazing Brentwood mall, SkyTrain station, and modern tower developments. A complete live-work-play destination.",
    highlights: ["The Amazing Brentwood", "Millennium Line SkyTrain", "New towers", "Urban village concept"],
    faqs: [
      { question: "Why is Brentwood popular for presales?", answer: "Brentwood offers new construction with modern amenities, direct SkyTrain access, and a walkable urban village environment at slightly lower prices than Metrotown." },
      { question: "What developments are coming to Brentwood?", answer: "Brentwood continues to densify with new residential towers, expanded retail, and improved public spaces as part of the town centre plan." }
    ]
  },
  // Coquitlam Neighbourhoods
  "burquitlam": {
    city: "Coquitlam",
    displayName: "Burquitlam",
    description: "Burquitlam straddles Burnaby and Coquitlam with excellent Evergreen Line access. A transit-oriented neighbourhood with growing condo inventory.",
    highlights: ["Burquitlam Station", "Evergreen Line", "Transit-oriented", "Mountain views"],
    faqs: [
      { question: "Is Burquitlam good for presale buyers?", answer: "Burquitlam offers Evergreen Line access at lower prices than Burnaby, making it excellent value for commuters working in Vancouver or Burnaby." },
      { question: "What's the commute like from Burquitlam?", answer: "Burquitlam Station provides direct SkyTrain access. Downtown Vancouver is approximately 35 minutes, and Metrotown is about 15 minutes." }
    ]
  },
  "burke-mountain": {
    city: "Coquitlam",
    displayName: "Burke Mountain",
    description: "Burke Mountain is Coquitlam's master-planned community offering mountain living with family amenities. Popular for townhomes with stunning views.",
    highlights: ["Mountain views", "New schools", "Family-oriented", "Master-planned community"],
    faqs: [
      { question: "Why choose Burke Mountain for townhomes?", answer: "Burke Mountain offers new construction townhomes with mountain views, excellent schools, and family amenities at more affordable prices than established areas." },
      { question: "What amenities are available on Burke Mountain?", answer: "Burke Mountain features new schools, community centres, parks, trails, and commercial areas developed as part of the master plan." }
    ]
  },
  // Richmond Neighbourhoods
  "brighouse": {
    city: "Richmond",
    displayName: "Brighouse",
    description: "Brighouse is Richmond's city centre around Richmond Centre mall and Canada Line stations. A vibrant urban hub with excellent Asian dining and shopping.",
    highlights: ["Richmond Centre", "Canada Line", "Diverse dining", "Urban convenience"],
    faqs: [
      { question: "Is Brighouse good for presale investment?", answer: "Brighouse offers strong rental demand from airport workers and professionals. Canada Line access and amenities make it highly desirable." },
      { question: "What's unique about Brighouse?", answer: "Brighouse combines urban convenience with Richmond's excellent Asian restaurants, night markets, and easy access to YVR airport." }
    ]
  },
  "steveston": {
    city: "Richmond",
    displayName: "Steveston",
    description: "Steveston is Richmond's charming fishing village with waterfront dining, heritage character, and Gulf Island ferry access. A unique lifestyle destination.",
    highlights: ["Fishing village charm", "Waterfront boardwalk", "Finn Slough", "BC Ferries access"],
    faqs: [
      { question: "Are presale homes available in Steveston?", answer: "Steveston has limited presale inventory due to heritage preservation. When available, townhomes and condos command premium prices for the lifestyle." },
      { question: "What makes Steveston special?", answer: "Steveston offers a unique village lifestyle with fresh seafood, waterfront walks, and community events in a heritage fishing town setting." }
    ]
  },
  // Langley Neighbourhoods
  "willoughby": {
    city: "Langley",
    displayName: "Willoughby",
    description: "Willoughby is Langley's fastest-growing area with master-planned communities, new schools, and family amenities. The go-to destination for young families.",
    highlights: ["Master-planned community", "New schools", "Yorkson Creek", "Family-friendly"],
    faqs: [
      { question: "Why is Willoughby popular for presales?", answer: "Willoughby offers new construction at relatively affordable prices with excellent schools and family amenities. Strong value for first-time buyers." },
      { question: "What's the commute from Willoughby?", answer: "Willoughby has good highway access for commuters. The future SkyTrain extension will significantly improve transit connectivity." }
    ]
  },
  "murrayville": {
    city: "Langley",
    displayName: "Murrayville",
    description: "Murrayville is Langley City's charming downtown area with boutique shops, local restaurants, and established residential streets. A walkable neighbourhood core.",
    highlights: ["Downtown Langley", "Local shops", "Walkable core", "Established character"],
    faqs: [
      { question: "What makes Murrayville attractive for buyers?", answer: "Murrayville offers established neighbourhood character with walkable amenities, local shops, and lower-rise boutique developments." },
      { question: "Are condos available in Murrayville?", answer: "Murrayville has boutique condo developments that offer urban living in a small-town atmosphere at accessible price points." }
    ]
  },
  "walnut-grove": {
    city: "Langley",
    displayName: "Walnut Grove",
    description: "Walnut Grove is Langley's established family neighbourhood with excellent schools, community amenities, and a village-like atmosphere.",
    highlights: ["Top schools", "Community centre", "Village atmosphere", "Established area"],
    faqs: [
      { question: "Is Walnut Grove good for families?", answer: "Walnut Grove consistently ranks among the best family neighbourhoods with excellent schools, parks, and community programs." },
      { question: "What housing is available in Walnut Grove?", answer: "Walnut Grove offers primarily single-family homes and townhomes. Newer developments add condo options to the established neighbourhood." }
    ]
  },
};

// Parse the URL slug to extract city, neighbourhood, and listing type
function parseNeighbourhoodSlug(slug: string): { city: string; neighbourhood: string; listingType: "presale" | "resale" } | null {
  // Pattern: city-neighbourhood-presale or city-neighbourhood-resale
  const presaleMatch = slug.match(/^([a-z]+)-([a-z-]+)-presale$/);
  const resaleMatch = slug.match(/^([a-z]+)-([a-z-]+)-resale$/);
  
  if (presaleMatch) {
    return { city: presaleMatch[1], neighbourhood: presaleMatch[2], listingType: "presale" };
  }
  if (resaleMatch) {
    return { city: resaleMatch[1], neighbourhood: resaleMatch[2], listingType: "resale" };
  }
  return null;
}

// City name mapping
const CITY_MAP: Record<string, string> = {
  vancouver: "Vancouver",
  surrey: "Surrey",
  burnaby: "Burnaby",
  coquitlam: "Coquitlam",
  richmond: "Richmond",
  langley: "Langley",
  delta: "Delta",
  abbotsford: "Abbotsford",
};

export default function NeighbourhoodProductPage() {
  // Support both direct route and delegation from CityProductPage
  const params = useParams<{ neighbourhoodSlug?: string; cityProductSlug?: string }>();
  const neighbourhoodSlug = params.neighbourhoodSlug || params.cityProductSlug;
  
  const parsed = useMemo(() => {
    if (!neighbourhoodSlug) return null;
    return parseNeighbourhoodSlug(neighbourhoodSlug);
  }, [neighbourhoodSlug]);

  const cityName = parsed ? CITY_MAP[parsed.city] : null;
  const neighbourhoodConfig = useMemo(() => {
    if (!parsed) return null;
    const existing = NEIGHBOURHOOD_CONFIG[parsed.neighbourhood];
    if (existing) return existing;
    // Generate a fallback config for neighbourhoods not explicitly configured
    if (!cityName) return null;
    const displayName = parsed.neighbourhood
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      city: cityName,
      displayName,
      description: `Explore presale and move-in ready homes in ${displayName}, ${cityName}. Browse the latest developments, pricing, and floorplans.`,
      highlights: [] as string[],
      faqs: [
        { question: `What presale projects are available in ${displayName}?`, answer: `Browse the latest presale condos and townhomes in ${displayName}, ${cityName} with VIP pricing and floorplans.` },
      ],
    };
  }, [parsed, cityName]);
  const isPresale = parsed?.listingType === "presale";

  // Fetch presale projects for this neighbourhood
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery({
    queryKey: ["neighbourhood-presales", cityName, neighbourhoodConfig?.displayName],
    queryFn: async () => {
      if (!cityName || !neighbourhoodConfig) return [];
      
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("is_published", true)
        .eq("city", cityName)
        .ilike("neighborhood", `%${neighbourhoodConfig.displayName}%`)
        .order("view_count", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isPresale && !!cityName && !!neighbourhoodConfig,
  });

  // Fetch resale listings for this neighbourhood
  const { data: resaleListings, isLoading: resaleLoading } = useQuery({
    queryKey: ["neighbourhood-resales", cityName, neighbourhoodConfig?.displayName],
    queryFn: async () => {
      if (!cityName || !neighbourhoodConfig) return [];
      
      const { data, error } = await supabase
        .from("mls_listings_safe")
        .select("id, listing_key, listing_price, property_type, property_sub_type, city, neighborhood, unparsed_address, bedrooms_total, bathrooms_total, living_area, photos, days_on_market")
        .eq("mls_status", "Active")
        .eq("city", cityName)
        .ilike("neighborhood", `%${neighbourhoodConfig.displayName}%`)
        .gte("year_built", 2024)
        .order("list_date", { ascending: false })
        .limit(24);

      if (error) throw error;
      return data || [];
    },
    enabled: !isPresale && !!cityName && !!neighbourhoodConfig,
  });

  // Return 404 if invalid slug
  if (!parsed || !cityName || !neighbourhoodConfig) {
    return <NotFound />;
  }

  const isLoading = isPresale ? presaleLoading : resaleLoading;
  const listings = isPresale ? presaleProjects : resaleListings;

  // SEO content
  const pageTitle = isPresale
    ? `${neighbourhoodConfig.displayName} Presale Condos & Townhomes | ${cityName} BC | PresaleProperties`
    : `${neighbourhoodConfig.displayName} Homes for Sale | ${cityName} MLS Listings | PresaleProperties`;

  const pageDescription = isPresale
    ? `Browse presale condos & townhomes in ${neighbourhoodConfig.displayName}, ${cityName}. ${neighbourhoodConfig.description} VIP pricing, floorplans & deposit info.`
    : `Find homes for sale in ${neighbourhoodConfig.displayName}, ${cityName}. ${neighbourhoodConfig.description} View active MLS listings with prices & photos.`;

  const canonicalUrl = `https://presaleproperties.com/${neighbourhoodSlug}`;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": pageTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": listings?.length || 0,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": isPresale ? "Presale Projects" : "For Sale", "item": isPresale ? "https://presaleproperties.com/presale-projects" : "https://presaleproperties.com/properties" },
      { "@type": "ListItem", "position": 3, "name": cityName, "item": isPresale ? `https://presaleproperties.com/${parsed.city}-presale-condos` : `https://presaleproperties.com/properties/${parsed.city}` },
      { "@type": "ListItem", "position": 4, "name": neighbourhoodConfig.displayName }
    ]
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getFirstPhoto = (listing: any) => {
    if (!listing.photos) return null;
    if (Array.isArray(listing.photos) && listing.photos.length > 0) {
      const photo = listing.photos[0];
      return photo?.MediaURL || photo?.url || (typeof photo === 'string' ? photo : null);
    }
    return null;
  };

  return (
    <>
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
        {/* FAQPage JSON-LD — mirrors the visible FAQ accordion below for rich-result eligibility */}
        {neighbourhoodConfig.faqs && neighbourhoodConfig.faqs.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: neighbourhoodConfig.faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            })}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        <ConversionHeader />

        <main className="container py-6 md:py-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6 overflow-x-auto">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link 
              to={isPresale ? "/presale-projects" : "/properties"} 
              className="hover:text-foreground transition-colors shrink-0"
            >
              {isPresale ? "Presale Projects" : "For Sale"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link 
              to={isPresale ? `/presale-projects?city=${cityName}` : `/properties/${parsed.city}`}
              className="hover:text-foreground transition-colors shrink-0"
            >
              {cityName}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium shrink-0">{neighbourhoodConfig.displayName}</span>
          </nav>

          {/* Hero Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {cityName}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {isPresale ? "Presale" : "Resale"}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              {isPresale 
                ? `Presale Condos & Townhomes in ${neighbourhoodConfig.displayName}`
                : `Homes for Sale in ${neighbourhoodConfig.displayName}, ${cityName}`
              }
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-3xl mb-4">
              {neighbourhoodConfig.description}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{listings?.length || 0}</span>
              {" "}{isPresale ? "presale projects" : "active listings"} in {neighbourhoodConfig.displayName}
            </p>
          </section>

          {/* Neighbourhood Highlights */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Why {neighbourhoodConfig.displayName}?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {neighbourhoodConfig.highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{highlight}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Listings Grid */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {isPresale ? "Available Presale Projects" : "Active Listings"}
              </h2>
              <Link to={isPresale ? `/presale-projects?city=${cityName}` : `/resale?city=${cityName}`}>
                <Button variant="outline" size="sm">
                  View All in {cityName}
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border">
                    <Skeleton className="aspect-[16/11] w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {isPresale ? (
                  // Presale projects
                  (listings as any[]).map((project, index) => (
                    <ScrollReveal key={project.id} delay={index * 0.05}>
                      <PresaleProjectCard
                        id={project.id}
                        slug={project.slug}
                        name={project.name}
                        city={project.city}
                        neighborhood={project.neighborhood}
                        projectType={project.project_type}
                        status={project.status}
                        completionYear={project.completion_year}
                        startingPrice={project.starting_price}
                        featuredImage={project.featured_image}
                        galleryImages={project.gallery_images}
                        lastVerifiedDate={project.last_verified_date}
                      />
                    </ScrollReveal>
                  ))
                ) : (
                  // Resale listings
                  (listings as any[]).map((listing, index) => (
                    <ScrollReveal key={listing.id} delay={index * 0.05}>
                      <Link to={`/properties/${listing.listing_key}`} className="block group">
                        <div className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                          <div className="relative aspect-[4/3] bg-muted">
                            {getFirstPhoto(listing) ? (
                              <img
                                src={getFirstPhoto(listing)}
                                alt={listing.unparsed_address || listing.neighborhood}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            )}
                            <Badge className="absolute top-3 left-3 bg-green-500">Active</Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg text-foreground mb-1">
                              {formatPrice(listing.listing_price)}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {listing.unparsed_address || listing.neighborhood}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {listing.bedrooms_total && <span>{listing.bedrooms_total} bed</span>}
                              {listing.bathrooms_total && <span>{listing.bathrooms_total} bath</span>}
                              {listing.living_area && <span>{listing.living_area.toLocaleString()} sqft</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </ScrollReveal>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {isPresale ? "presale projects" : "listings"} found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Check back soon for new {isPresale ? "developments" : "listings"} in {neighbourhoodConfig.displayName}.
                </p>
                <Link to={isPresale ? `/presale-projects?city=${cityName}` : `/resale?city=${cityName}`}>
                  <Button>Browse All {cityName} {isPresale ? "Projects" : "Listings"}</Button>
                </Link>
              </div>
            )}
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Frequently Asked Questions About {neighbourhoodConfig.displayName}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {neighbourhoodConfig.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Related Neighbourhoods CTA */}
          <section className="bg-muted/30 rounded-xl p-6 md:p-8 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Explore More {cityName} Neighbourhoods
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NEIGHBOURHOOD_CONFIG)
                .filter(([_, config]) => config.city === cityName)
                .filter(([key]) => key !== parsed.neighbourhood)
                .slice(0, 6)
                .map(([key, config]) => (
                  <Link 
                    key={key} 
                    to={`/${parsed.city}-${key}-${parsed.listingType}`}
                  >
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-muted transition-colors px-3 py-1.5"
                    >
                      {config.displayName}
                    </Badge>
                  </Link>
                ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
