import { CityProjectsCarousel } from "./CityProjectsCarousel";
import { FeaturedProjectPromo } from "./FeaturedProjectPromo";
import { SpotlightProjectPromo } from "./SpotlightProjectPromo";
import { TrendingProjectPromo } from "./TrendingProjectPromo";
import { SecondaryProjectPromo } from "./SecondaryProjectPromo";
import { RisingStarPromo } from "./RisingStarPromo";
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
 * Use this map to pin a featured project as a teaser before its city section.
 */
const PRE_CITY_PROMOS: Record<string, { slug: string; badgeLabel?: string }> = {
  Coquitlam: { slug: "ironwood", badgeLabel: "Coquitlam Spotlight" },
  Vancouver: { slug: "baden-park", badgeLabel: "Vancouver Spotlight" },
};

/**
 * Auto-trending promos (rank 1-4 from useTrendingProjects) interleaved
 * between city carousels for even rhythm. Each city gets at most one promo
 * (either a hand-picked one OR an auto-trending one) to keep spacing clean.
 *
 * Layout cadence: promo → city → city → promo → city → city → promo → city.
 */
const AUTO_PROMOS_BY_CITY: Record<string, "spotlight" | "trending" | "secondary" | "risingStar"> = {
  Langley: "trending",   // cinematic full-bleed (rank #2)
  Surrey: "spotlight",   // split layout (rank #1) — only if no hand-picked
  Abbotsford: "secondary", // mirrored split (rank #3)
};

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

        <div className="space-y-12 md:space-y-16">
          {/* Lead-in: hero spotlight (rank #1) before the first city */}
          <ScrollReveal animation="fade-up" delay={100}>
            <SpotlightProjectPromo />
          </ScrollReveal>

          {FEATURED_CITIES.map((cityConfig) => {
            const handPicked = PRE_CITY_PROMOS[cityConfig.city];
            const autoPromo = !handPicked ? AUTO_PROMOS_BY_CITY[cityConfig.city] : undefined;

            return (
              <div key={cityConfig.city} className="space-y-12 md:space-y-16">
                {handPicked && (
                  <ScrollReveal animation="fade-up" delay={100}>
                    <FeaturedProjectPromo slug={handPicked.slug} badgeLabel={handPicked.badgeLabel} />
                  </ScrollReveal>
                )}
                {autoPromo === "trending" && (
                  <ScrollReveal animation="fade-up" delay={100}>
                    <TrendingProjectPromo />
                  </ScrollReveal>
                )}
                {autoPromo === "secondary" && (
                  <ScrollReveal animation="fade-up" delay={100}>
                    <SecondaryProjectPromo />
                  </ScrollReveal>
                )}
                <CityProjectsCarousel
                  city={cityConfig.city}
                  title={cityConfig.title}
                  subtitle={cityConfig.subtitle}
                />
              </div>
            );
          })}

          {/* Closing: rising star (rank #4) — compact ribbon to wrap the city block */}
          <ScrollReveal animation="fade-up" delay={100}>
            <RisingStarPromo />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
