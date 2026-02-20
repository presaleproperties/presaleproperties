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
    <section className="py-10 sm:py-14 bg-muted/40 border-b border-border/50">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Presale */}
          <div>
            <h2 className="text-base font-bold text-foreground uppercase tracking-wider mb-4">
              Presale Projects
            </h2>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {PRESALE_TYPES.map(({ label, slug, icon: Icon }) => (
                <Link
                  key={slug}
                  to={`/presale-projects/vancouver/${slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/30 shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESALE_CITIES.map((city) => {
                const citySlug = city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={city}
                    to={`/${citySlug}-presale-condos`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                    {city}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resale / Move-In Ready */}
          <div>
            <h2 className="text-base font-bold text-foreground uppercase tracking-wider mb-4">
              Move-In Ready
            </h2>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {RESALE_TYPES.map(({ label, citySlug, icon: Icon }) => (
                <Link
                  key={citySlug}
                  to={`/properties/vancouver/${citySlug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {RESALE_CITIES.map((city) => (
                <Link
                  key={city}
                  to={getCityPropertiesUrl(city)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
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
