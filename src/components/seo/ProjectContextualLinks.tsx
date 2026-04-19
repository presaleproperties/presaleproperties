import { Link } from "react-router-dom";
import { ArrowRight, Building2, MapPin, BookOpen, TrendingUp, Compass } from "lucide-react";
import { slugify } from "@/lib/seoUrls";

interface ProjectContextualLinksProps {
  projectName: string;
  neighborhood: string;
  city: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  startingPrice?: number | null;
}

export function ProjectContextualLinks({
  projectName,
  neighborhood,
  city,
  projectType,
  startingPrice,
}: ProjectContextualLinksProps) {
  const citySlug = slugify(city);
  const neighborhoodSlug = slugify(neighborhood);
  
  const projectTypeLabel = projectType === "condo" ? "condos" : 
                           projectType === "townhome" ? "townhomes" : 
                           "properties";

  const projectTypeLabelSingular = projectType === "condo" ? "Condo" : 
                                   projectType === "townhome" ? "Townhome" : 
                                   "Property";

  // Determine price tier for investment links
  const priceUnder500k = startingPrice && startingPrice < 500000;
  const priceUnder700k = startingPrice && startingPrice < 700000;

  return (
    <section className="bg-muted/30 border-t border-border py-8 md:py-10" aria-label="Related links">
      <div className="container px-4">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Explore More Options
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Area Navigation */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {neighborhood} Area
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link 
                  to={`/${citySlug}-${neighborhoodSlug}-presale`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  See all {neighborhood} presales
                </Link>
              </li>
              <li>
                <Link 
                  to={`/${citySlug}-presale-${projectTypeLabel}`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Compare {projectTypeLabel} in {city}
                </Link>
              </li>
              <li>
                <Link 
                  to={`/presale-projects/${city.toLowerCase().replace(/\s+/g, "-")}/condos`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  All {city} presale projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Similar Properties */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Similar Properties
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link 
                  to={`/${citySlug}-presale-condos`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Presale condos in {city}
                </Link>
              </li>
              <li>
                <Link 
                  to={`/${citySlug}-presale-townhomes`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Presale townhomes in {city}
                </Link>
              </li>
              {priceUnder700k && (
                <li>
                  <Link 
                    to={`/presale-${projectTypeLabel}-under-700k`}
                    className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    Presales under $700K
                  </Link>
                </li>
              )}
              {priceUnder500k && (
                <li>
                  <Link 
                    to={`/presale-${projectTypeLabel}-under-500k`}
                    className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    Presales under $500K
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Investment Resources */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Investment Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link 
                  to={`/calculator?price=${startingPrice || 500000}&city=${encodeURIComponent(city)}`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Calculate {projectName} ROI
                </Link>
              </li>
              <li>
                <Link 
                  to="/mortgage-calculator"
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Mortgage calculator
                </Link>
              </li>
              <li>
                <Link 
                  to={`/investment-presale-properties`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Investment presale properties
                </Link>
              </li>
            </ul>
          </div>

          {/* Buyer Guides */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Buyer Guides
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link 
                  to={`/blog/${citySlug}-presales-2026`}
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {city} presale investment guide
                </Link>
              </li>
              <li>
                <Link 
                  to="/presale-guide"
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Understanding presale deposits
                </Link>
              </li>
              <li>
                <Link 
                  to="/buyers-guide"
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  First-time buyer guide
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog"
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Market insights & news
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
