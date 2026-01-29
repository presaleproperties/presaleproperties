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

// BC Home Warranty links
const WARRANTY_LINKS = {
  bcHousing: "https://www.bchousing.org/licensing-consumer-services/new-home-warranty/warranty-coverage",
  rescission: "https://www.bchousing.org/licensing-consumer-services/new-home-warranty/buying-new-home/rescission-period",
  depositProtection: "https://www.bchousing.org/licensing-consumer-services/new-home-warranty/buying-new-home/deposit-protection",
};

// Generate SEO-friendly tags based on property characteristics
function generatePropertyTags(props: PropertySEOTagsProps): { label: string; url: string }[] {
  const { city, neighborhood, propertyType, bedrooms, yearBuilt, developerName, projectName, features } = props;
  const tags: { label: string; url: string }[] = [];
  
  const citySlug = slugify(city);
  const neighborhoodSlug = neighborhood ? slugify(neighborhood) : null;
  
  // Bedroom-based tags
  if (bedrooms && bedrooms >= 1 && bedrooms <= 5) {
    tags.push({
      label: `${bedrooms} bedroom homes ${city}`,
      url: `/properties/${citySlug}/${bedrooms}-bedroom`,
    });
  }
  
  // Property type tags
  const typeLabels: Record<string, string> = {
    condo: "condos",
    townhome: "townhomes",
    townhouse: "townhomes",
    "Residential Attached": "townhomes",
    "Residential Detached": "detached homes",
    duplex: "duplexes",
    mixed: "homes",
  };
  
  const typeLabel = typeLabels[propertyType] || "homes";
  
  tags.push({
    label: `${typeLabel} ${city}`,
    url: `/properties/${citySlug}/${slugify(typeLabel)}`,
  });
  
  // New construction tag if applicable
  if (yearBuilt && yearBuilt >= 2024) {
    tags.push({
      label: `new construction ${city}`,
      url: `/properties/${citySlug}?yearBuilt=2024`,
    });
  }
  
  // Neighborhood-specific tags
  if (neighborhood && neighborhoodSlug) {
    tags.push({
      label: `${neighborhood} ${typeLabel}`,
      url: `/${citySlug}-${neighborhoodSlug}-presale`,
    });
    
    tags.push({
      label: `${neighborhood} homes`,
      url: `/${citySlug}-${neighborhoodSlug}-presale`,
    });
  }
  
  // Developer tag if available
  if (developerName) {
    tags.push({
      label: `${developerName} ${city}`,
      url: `/developers/${slugify(developerName)}`,
    });
  }
  
  // Project name tag if available
  if (projectName) {
    tags.push({
      label: `${projectName} ${city}`,
      url: `/presale-projects?q=${encodeURIComponent(projectName)}`,
    });
  }
  
  // City-wide presale tag
  tags.push({
    label: `${city} presale listings`,
    url: `/${citySlug}-presale-condos`,
  });
  
  tags.push({
    label: `${city} real estate`,
    url: `/properties/${citySlug}`,
  });
  
  // Feature-based tags
  if (features && features.length > 0) {
    const featureKeywords = ["luxury", "boutique", "waterfront", "mountain view", "modern", "contemporary"];
    features.forEach(feature => {
      const lowerFeature = feature.toLowerCase();
      featureKeywords.forEach(keyword => {
        if (lowerFeature.includes(keyword)) {
          tags.push({
            label: `${keyword} ${typeLabel} ${city}`,
            url: `/properties/${citySlug}?q=${encodeURIComponent(keyword)}`,
          });
        }
      });
    });
  }
  
  // Remove duplicates and limit to 12 tags
  const uniqueTags = tags.filter((tag, index, self) =>
    index === self.findIndex(t => t.label.toLowerCase() === tag.label.toLowerCase())
  ).slice(0, 12);
  
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
                  to={`/${citySlug}-${neighborhoodSlug}-presale`}
                  className="text-primary hover:underline text-sm md:text-base font-medium"
                >
                  {neighborhood}
                </Link>
              )}
              {neighborhood && <span className="text-muted-foreground">,</span>}
              <Link
                to={`/${citySlug}-presale-condos`}
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
                <a
                  href={WARRANTY_LINKS.bcHousing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                7 Day Rescission Period BC...{" "}
                <a
                  href={WARRANTY_LINKS.rescission}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Deposit Protection...{" "}
                <a
                  href={WARRANTY_LINKS.depositProtection}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </a>
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
