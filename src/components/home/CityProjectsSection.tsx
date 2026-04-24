import { CityProjectsCarousel } from "./CityProjectsCarousel";
import { FeaturedProjectPromo } from "./FeaturedProjectPromo";

import { TrendingProjectPromo } from "./TrendingProjectPromo";
import { SecondaryProjectPromo } from "./SecondaryProjectPromo";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const FEATURED_CITIES = [
  { city: "Langley", title: "Langley Projects", subtitle: "Township & City of Langley" },
  { city: "Surrey", title: "Surrey Projects", subtitle: "South of the Fraser" },
  { city: "Coquitlam", title: "Coquitlam Projects", subtitle: "Tri-Cities Area" },
  { city: "Delta", title: "Delta Projects", subtitle: "Ladner, Tsawwassen & North Delta" },
  { city: "Abbotsford", title: "Abbotsford Projects", subtitle: "Fraser Valley" },
  { city: "Vancouver", title: "Vancouver Projects", subtitle: "Downtown & East Vancouver" },
];

/**
 * Hand-picked promo slugs to render directly above a city carousel.
 */
const PRE_CITY_PROMOS: Record<string, { slug: string; badgeLabel?: string }> = {
  Surrey: { slug: "the-loop", badgeLabel: "Surrey Spotlight" },
  Coquitlam: { slug: "ironwood", badgeLabel: "Coquitlam Spotlight" },
  Vancouver: { slug: "baden-park", badgeLabel: "Vancouver Spotlight" },
};

/**
 * Auto-trending promos interleaved between city carousels for even rhythm.
 * Each city gets at most one promo (hand-picked OR auto).
 */
const AUTO_PROMOS_BY_CITY: Record<string, "trending" | "secondary"> = {
  Langley: "trending",
  Abbotsford: "secondary",
};

/**
 * Unified city group: a single rounded panel that hosts a promo card on top
 * and the city carousel directly below it. Sharing a surface, padding rhythm,
 * and animation makes the promo feel like a *featured first slot* of the
 * carousel rather than a detached banner sitting above it.
 */
interface CityGroupProps {
  city: string;
  title: string;
  subtitle?: string;
  promoSlug?: string;
  children?: React.ReactNode;
}

function CityGroup({ city, title, subtitle, promoSlug, children }: CityGroupProps) {
  return (
    <ScrollReveal animation="fade-up" delay={100}>
      <div className="rounded-3xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
          {children}
          <CityProjectsCarousel
            city={city}
            title={title}
            subtitle={subtitle}
            excludeSlug={promoSlug}
          />
        </div>
      </div>
    </ScrollReveal>
  );
}

export function CityProjectsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container px-4">
        <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by City
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Explore Projects by Location
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            Discover presale developments in Metro Vancouver's most sought-after communities
          </p>
        </div>

        <div className="space-y-8 md:space-y-12">

          {FEATURED_CITIES.map((cityConfig) => {
            const handPicked = PRE_CITY_PROMOS[cityConfig.city];
            const autoPromo = !handPicked ? AUTO_PROMOS_BY_CITY[cityConfig.city] : undefined;

            return (
              <CityGroup
                key={cityConfig.city}
                city={cityConfig.city}
                title={cityConfig.title}
                subtitle={cityConfig.subtitle}
                promoSlug={handPicked?.slug}
              >
                {handPicked && (
                  <FeaturedProjectPromo
                    slug={handPicked.slug}
                    badgeLabel={handPicked.badgeLabel}
                    inline
                  />
                )}
                {autoPromo === "trending" && <TrendingProjectPromo inline />}
                {autoPromo === "secondary" && <SecondaryProjectPromo inline />}
              </CityGroup>
            );
          })}
        </div>
      </div>
    </section>
  );
}
