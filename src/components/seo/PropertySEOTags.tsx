import { Link } from "react-router-dom";
import { ExternalLink, Shield, MapPin, Tag } from "lucide-react";
import { slugify } from "@/lib/seoUrls";

interface PropertySEOTagsProps {
  // Location
  city: string;
  neighborhood?: string | null;
  
  // Property details
  propertyType: string; // condo, townhome, etc.
  bedrooms?: number | null;
  yearBuilt?: number | null;
  developerName?: string | null;
  projectName?: string | null;
  
  // Features for tag generation
  features?: string[];
  
  // Is this a new construction? (for warranty section)
  isNewConstruction?: boolean;
  
  className?: string;
}

// Internal blog posts for buyer protection information

// Supported cities for /properties/{city} routes (have dedicated city pages)
const SUPPORTED_PROPERTY_CITY_PAGES = [
  "vancouver", "surrey", "coquitlam", "burnaby", "delta", 
  "langley", "abbotsford", "chilliwack", "richmond", 
  "new-westminster", "port-coquitlam", "port-moody", "white-rock"
];

// Supported cities for presale pages (/{city}-presale-condos)
const SUPPORTED_PRESALE_CITIES = [
  "surrey", "langley", "coquitlam", "burnaby", "vancouver", 
  "richmond", "delta", "abbotsford", "port-moody", "new-westminster"
];


// Neighborhoods with dedicated landing pages
const NEIGHBORHOOD_LANDING_PAGES: Record<string, string> = {
  "south-surrey": "/south-surrey-presale",
  "willoughby": "/langley-willoughby-presale",
  "surrey-central": "/surrey-city-centre-presale",
  "burquitlam": "/coquitlam-burquitlam-presale",
  "metrotown": "/burnaby-metrotown-presale",
  "brentwood": "/burnaby-brentwood-presale",
  "cloverdale": "/surrey-cloverdale-presale",
  "mount-pleasant": "/vancouver-mount-pleasant-presale",
  "brighouse": "/richmond-brighouse-presale",
  "lonsdale": "/north-vancouver-lonsdale-presale",
  "downtown": "/new-westminster-downtown-presale",
  "town-centre": "/maple-ridge-town-centre-presale",
};

// Generate SEO-friendly tags based on property characteristics
function generatePropertyTags(props: PropertySEOTagsProps): { label: string; url: string }[] {
  const { city, neighborhood, propertyType, bedrooms, yearBuilt, developerName, projectName, features } = props;
  const tags: { label: string; url: string }[] = [];
  
  const citySlug = slugify(city);
  const neighborhoodSlug = neighborhood ? slugify(neighborhood) : null;
  
  // Check if city has supported routes
  const hasCityPropertyPage = SUPPORTED_PROPERTY_CITY_PAGES.includes(citySlug);
  const hasCityPresaleRoute = SUPPORTED_PRESALE_CITIES.includes(citySlug);
  
  // Property type tags - map to valid route slugs
  // These routes are dynamic (/properties/:citySlug/:type) so work for any city
  const typeToRouteSlug: Record<string, string> = {
    condo: "condos",
    apartment: "condos",
    "Apartment/Condo": "condos",
    townhome: "townhouses",
    townhouse: "townhouses",
    "Residential Attached": "townhouses",
    "Row/Townhouse": "townhouses",
    "Residential Detached": "houses",
    house: "houses",
    "Single Family": "houses",
    duplex: "duplexes",
  };
  
  const typeLabels: Record<string, string> = {
    condo: "condos",
    townhome: "townhomes",
    townhouse: "townhomes",
    "Residential Attached": "townhomes",
    "Residential Detached": "homes",
    duplex: "duplexes",
    mixed: "homes",
  };
  
  const routeSlug = typeToRouteSlug[propertyType];
  const typeLabel = typeLabels[propertyType] || "homes";
  
  // Bedroom-based tags - link to map search for more reliable results
  if (bedrooms && bedrooms >= 1 && bedrooms <= 4) {
    tags.push({
      label: `${bedrooms} bedroom homes ${city}`,
      url: `/map-search?city=${encodeURIComponent(city)}&beds=${bedrooms}`,
    });
  }
  
  // Property type tag - use map search for reliable cross-city support
  if (routeSlug) {
    tags.push({
      label: `${typeLabel} in ${city}`,
      url: `/map-search?city=${encodeURIComponent(city)}&type=${routeSlug}`,
    });
  }
  
  // City presale listings - use presale project page format
  if (hasCityPresaleRoute) {
    const presaleTypeSlug = propertyType.toLowerCase().includes("townhome") || propertyType.toLowerCase().includes("townhouse") 
      ? "townhomes" 
      : "condos";
    tags.push({
      label: `${city} presale ${presaleTypeSlug}`,
      url: `/${citySlug}-presale-${presaleTypeSlug}`,
    });
  }
  
  // Neighborhood-specific tags - only if we have a dedicated landing page
  if (neighborhood && neighborhoodSlug) {
    const neighborhoodUrl = NEIGHBORHOOD_LANDING_PAGES[neighborhoodSlug];
    if (neighborhoodUrl) {
      tags.push({
        label: `${neighborhood} presales`,
        url: neighborhoodUrl,
      });
    }
  }
  
  // Developer tag - link to developers page with search
  if (developerName) {
    tags.push({
      label: `${developerName} projects`,
      url: `/presale-projects?developer=${encodeURIComponent(developerName)}`,
    });
  }
  
  // Project search tag - link to presale projects with search
  if (projectName) {
    tags.push({
      label: `similar to ${projectName}`,
      url: `/presale-projects?city=${encodeURIComponent(city)}`,
    });
  }
  
  // City real estate - link to properties page if supported, else map search
  if (hasCityPropertyPage) {
    tags.push({
      label: `${city} real estate`,
      url: `/properties/${citySlug}`,
    });
  } else {
    tags.push({
      label: `${city} real estate`,
      url: `/map-search?city=${encodeURIComponent(city)}`,
    });
  }
  
  // Map search tag - always valid
  tags.push({
    label: `${city} on map`,
    url: `/map-search?city=${encodeURIComponent(city)}`,
  });
  
  // New construction tag - link to presale projects
  if (yearBuilt && yearBuilt >= 2024) {
    tags.push({
      label: `new construction ${city}`,
      url: `/presale-projects?city=${encodeURIComponent(city)}`,
    });
  }
  
  // Feature-based tags - link to map search with search term
  if (features && features.length > 0) {
    const featureKeywords = ["luxury", "boutique", "waterfront", "mountain view", "modern", "contemporary"];
    features.forEach(feature => {
      const lowerFeature = feature.toLowerCase();
      featureKeywords.forEach(keyword => {
        if (lowerFeature.includes(keyword)) {
          tags.push({
            label: `${keyword} ${typeLabel} ${city}`,
            url: `/map-search?city=${encodeURIComponent(city)}&q=${encodeURIComponent(keyword)}`,
          });
        }
      });
    });
  }
  
  // Remove duplicates and limit to 10 tags
  const uniqueTags = tags.filter((tag, index, self) =>
    index === self.findIndex(t => t.label.toLowerCase() === tag.label.toLowerCase())
  ).slice(0, 10);
  
  return uniqueTags;
}

export function PropertySEOTags({
  city,
  neighborhood,
  propertyType,
  bedrooms,
  yearBuilt,
  developerName,
  projectName,
  features,
  isNewConstruction = true,
  className,
}: PropertySEOTagsProps) {
  const tags = generatePropertyTags({
    city,
    neighborhood,
    propertyType,
    bedrooms,
    yearBuilt,
    developerName,
    projectName,
    features,
  });

  const citySlug = slugify(city);
  const neighborhoodSlug = neighborhood ? slugify(neighborhood) : null;
  
  // Determine valid URLs for location links
  const hasCityPresaleRoute = SUPPORTED_PRESALE_CITIES.includes(citySlug);
  const hasCityPropertyRoute = SUPPORTED_PROPERTY_CITY_PAGES.includes(citySlug);
  
  // Get neighborhood URL - use dedicated landing page if available, otherwise map search
  const getNeighborhoodUrl = (): string => {
    if (neighborhoodSlug && NEIGHBORHOOD_LANDING_PAGES[neighborhoodSlug]) {
      return NEIGHBORHOOD_LANDING_PAGES[neighborhoodSlug];
    }
    // Fallback to map search with neighborhood filter
    return `/map-search?city=${encodeURIComponent(city)}${neighborhood ? `&neighborhood=${encodeURIComponent(neighborhood)}` : ''}`;
  };
  
  // Get city URL - use presale page if available, otherwise properties or map search
  const getCityUrl = (): string => {
    if (hasCityPresaleRoute) {
      return `/${citySlug}-presale-condos`;
    }
    if (hasCityPropertyRoute) {
      return `/properties/${citySlug}`;
    }
    return `/map-search?city=${encodeURIComponent(city)}`;
  };

  return (
    <section className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* In This Location */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              In This Location
            </h3>
          </div>
          <div className="border-t border-primary/30 pt-3">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {neighborhood && (
                <Link
                  to={getNeighborhoodUrl()}
                  className="text-primary hover:underline text-sm md:text-base font-medium"
                >
                  {neighborhood}
                </Link>
              )}
              {neighborhood && <span className="text-muted-foreground">,</span>}
              <Link
                to={getCityUrl()}
                className="text-primary hover:underline text-sm md:text-base font-medium"
              >
                {city}
              </Link>
            </div>
          </div>
        </div>

        {/* Warranty Section - Only for new construction */}
        {isNewConstruction && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                Warranty
              </h3>
            </div>
            <div className="border-t border-primary/30 pt-3 space-y-2">
              <p className="text-sm text-muted-foreground">
                New homes in BC are covered by warranty...{" "}
                <Link
                  to="/blog/2-5-10-warranty-new-home-bc"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                7 Day Rescission Period BC...{" "}
                <Link
                  to="/blog/7-day-rescission-period-bc-presale"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Deposit Protection...{" "}
                <Link
                  to="/blog/presale-deposit-protection-bc"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* With These Tags */}
      {tags.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              With These Tags
            </h3>
          </div>
          <div className="border-t border-primary/30 pt-3">
            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
              {tags.map((tag, index) => (
                <span key={index}>
                  <Link
                    to={tag.url}
                    className="text-primary hover:underline text-sm md:text-base"
                  >
                    {tag.label}
                  </Link>
                  {index < tags.length - 1 && (
                    <span className="text-muted-foreground">, </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
