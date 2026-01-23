import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// BC cities with MLS new construction inventory
const CITIES = [
  "Vancouver",
  "Surrey", 
  "Burnaby",
  "Richmond",
  "Langley",
  "Coquitlam",
  "Delta",
  "Abbotsford",
  "New Westminster",
  "Port Coquitlam",
  "Port Moody",
  "Maple Ridge",
  "White Rock",
] as const;

// Top neighborhoods per city for SEO linking
const TOP_NEIGHBORHOODS: Record<string, string[]> = {
  Vancouver: ["Downtown", "Yaletown", "Kitsilano", "Mount Pleasant", "Fairview"],
  Surrey: ["City Centre", "Fleetwood", "Guildford", "South Surrey", "Clayton"],
  Burnaby: ["Metrotown", "Brentwood", "Highgate", "Edmonds", "Deer Lake"],
  Richmond: ["City Centre", "Steveston", "Brighouse", "West Cambie", "Hamilton"],
  Langley: ["Willoughby", "Walnut Grove", "Murrayville", "Langley City", "Yorkson"],
  Coquitlam: ["Burke Mountain", "Burquitlam", "Westwood Plateau", "Austin Heights"],
  Delta: ["Ladner", "Tsawwassen", "North Delta", "Sunshine Hills"],
  Abbotsford: ["Downtown", "Clearbrook", "Mill Lake", "Auguston"],
  "New Westminster": ["Downtown", "Sapperton", "Queensborough", "Uptown"],
  "Port Coquitlam": ["Citadel Heights", "Downtown", "Oxford Heights"],
  "Port Moody": ["Suter Brook", "Heritage Woods", "Moody Centre", "Klahanie"],
  "Maple Ridge": ["Downtown", "Albion", "Cottonwood", "Silver Valley"],
  "White Rock": ["East Beach", "West Beach", "Town Centre"],
};

// Property types with SEO-friendly naming
const PROPERTY_TYPES = [
  { slug: "condos", label: "Condos", filter: "Apartment/Condo" },
  { slug: "townhomes", label: "Townhomes", filter: "Townhouse" },
  { slug: "homes", label: "Homes", filter: "Single Family" },
] as const;

// Bedroom counts
const BEDROOMS = [1, 2, 3, 4] as const;

interface PopularSearchesGridProps {
  defaultCity?: string;
  showExpanded?: boolean;
  compact?: boolean;
}

export function PopularSearchesGrid({ 
  defaultCity = "Vancouver", 
  showExpanded = false,
  compact = false 
}: PopularSearchesGridProps) {
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [expanded, setExpanded] = useState(showExpanded);

  const citySlug = selectedCity.toLowerCase().replace(/\s+/g, "-");
  const neighborhoods = TOP_NEIGHBORHOODS[selectedCity] || [];

  // Generate URL for property type page
  const getPropertyTypeUrl = (type: string, city: string) => {
    const slug = city.toLowerCase().replace(/\s+/g, "-");
    return `/resale/${slug}/${type}`;
  };

  // Generate URL for bedroom page
  const getBedroomUrl = (bedrooms: number, city: string) => {
    const slug = city.toLowerCase().replace(/\s+/g, "-");
    return `/resale/${slug}/${bedrooms}-bedroom`;
  };

  // Generate URL for neighborhood page
  const getNeighborhoodUrl = (neighborhood: string, city: string, type: string) => {
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    const neighborhoodSlug = neighborhood.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");
    return `/resale/${citySlug}/${neighborhoodSlug}/${type}`;
  };

  // Generate URL for city resale page
  const getCityUrl = (city: string) => {
    const slug = city.toLowerCase().replace(/\s+/g, "-");
    return `/resale/${slug}`;
  };

  if (compact) {
    return (
      <section className="py-8 border-t">
        <div className="container">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Popular New Construction Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.slice(0, 8).map((city) => (
              <Link
                key={city}
                to={getCityUrl(city)}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm text-foreground transition-colors"
              >
                New Homes in {city}
              </Link>
            ))}
            <Link
              to="/resale/popular-searches"
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-sm text-primary font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30 border-t">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
          Popular New Construction Searches
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Find brand new homes built in 2024 or later across Metro Vancouver & Fraser Valley
        </p>

        {/* City Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCity === city
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted border border-border text-foreground"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Link Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* New Condos Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              New Condos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to={getPropertyTypeUrl("condos", selectedCity)}
                  className="text-primary hover:underline"
                >
                  New Condos in {selectedCity}
                </Link>
              </li>
              {neighborhoods.slice(0, expanded ? 5 : 3).map((neighborhood) => (
                <li key={neighborhood}>
                  <Link
                    to={getNeighborhoodUrl(neighborhood, selectedCity, "condos")}
                    className="text-primary hover:underline"
                  >
                    New Condos in {neighborhood}
                  </Link>
                </li>
              ))}
              {expanded && (
                <>
                  <li className="pt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    By Bedroom
                  </li>
                  {BEDROOMS.map((bed) => (
                    <li key={bed}>
                      <Link
                        to={`${getPropertyTypeUrl("condos", selectedCity)}?bedrooms=${bed}`}
                        className="text-primary hover:underline"
                      >
                        {bed} Bedroom Condos in {selectedCity}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          {/* New Townhomes Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              New Townhomes
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to={getPropertyTypeUrl("townhomes", selectedCity)}
                  className="text-primary hover:underline"
                >
                  New Townhomes in {selectedCity}
                </Link>
              </li>
              {neighborhoods.slice(0, expanded ? 5 : 3).map((neighborhood) => (
                <li key={neighborhood}>
                  <Link
                    to={getNeighborhoodUrl(neighborhood, selectedCity, "townhomes")}
                    className="text-primary hover:underline"
                  >
                    New Townhomes in {neighborhood}
                  </Link>
                </li>
              ))}
              {expanded && (
                <>
                  <li className="pt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    By Bedroom
                  </li>
                  {BEDROOMS.slice(1).map((bed) => (
                    <li key={bed}>
                      <Link
                        to={`${getPropertyTypeUrl("townhomes", selectedCity)}?bedrooms=${bed}`}
                        className="text-primary hover:underline"
                      >
                        {bed} Bedroom Townhomes in {selectedCity}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          {/* New Homes Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              New Homes
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to={getPropertyTypeUrl("homes", selectedCity)}
                  className="text-primary hover:underline"
                >
                  New Homes in {selectedCity}
                </Link>
              </li>
              {neighborhoods.slice(0, expanded ? 5 : 3).map((neighborhood) => (
                <li key={neighborhood}>
                  <Link
                    to={getNeighborhoodUrl(neighborhood, selectedCity, "homes")}
                    className="text-primary hover:underline"
                  >
                    New Homes in {neighborhood}
                  </Link>
                </li>
              ))}
              {expanded && (
                <>
                  <li className="pt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Other Searches
                  </li>
                  <li>
                    <Link
                      to={`/resale/${citySlug}?priceMax=800000`}
                      className="text-primary hover:underline"
                    >
                      Affordable New Homes in {selectedCity}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/resale/${citySlug}?priceMin=1500000`}
                      className="text-primary hover:underline"
                    >
                      Luxury New Homes in {selectedCity}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={getCityUrl(selectedCity)}
                      className="text-primary hover:underline"
                    >
                      All New Construction in {selectedCity}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                View Less <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                View More <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* All Cities Quick Links */}
        {expanded && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 text-center">
              Browse All Cities
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  to={getCityUrl(city)}
                  className="px-4 py-2 bg-background hover:bg-muted rounded-lg border border-border text-sm font-medium text-foreground transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
