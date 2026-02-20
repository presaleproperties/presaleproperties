import { Link } from "react-router-dom";
import { Building2, Home, Castle, MapPin } from "lucide-react";
import { getCityPropertiesUrl } from "@/lib/propertiesUrls";

const PRESALE_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "Abbotsford",
];

const RESALE_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "New Westminster",
];

const PRESALE_TYPES = [
  { label: "Condos", slug: "condos", icon: Building2 },
  { label: "Townhomes", slug: "townhomes", icon: Home },
  { label: "Homes", slug: "homes", icon: Castle },
];

const RESALE_TYPES = [
  { label: "Condos", citySlug: "condos", icon: Building2 },
  { label: "Townhomes", citySlug: "townhouses", icon: Home },
  { label: "Houses", citySlug: "houses", icon: Castle },
];

export function QuickSearchLinks() {
  return (
    <section className="py-8 sm:py-10 bg-muted/40 border-b border-border/50">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Presale */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Presale Projects
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESALE_TYPES.map(({ label, slug, icon: Icon }) => (
                <Link
                  key={slug}
                  to={`/presale-projects/vancouver/${slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESALE_CITIES.map((city) => {
                const citySlug = city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={city}
                    to={`/${citySlug}-presale-condos`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {city}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resale / Move-In Ready */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Move-In Ready
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {RESALE_TYPES.map(({ label, citySlug, icon: Icon }) => (
                <Link
                  key={citySlug}
                  to={`/properties/vancouver/${citySlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RESALE_CITIES.map((city) => (
                <Link
                  key={city}
                  to={getCityPropertiesUrl(city)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
