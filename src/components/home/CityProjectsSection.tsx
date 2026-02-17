import { CityProjectsCarousel } from "./CityProjectsCarousel";

const FEATURED_CITIES = [
  { city: "Langley", title: "Langley Projects", subtitle: "Township & City of Langley" },
  { city: "Surrey", title: "Surrey Projects", subtitle: "South of the Fraser" },
  { city: "Coquitlam", title: "Coquitlam Projects", subtitle: "Tri-Cities Area" },
  { city: "Delta", title: "Delta Projects", subtitle: "Ladner, Tsawwassen & North Delta" },
  { city: "Abbotsford", title: "Abbotsford Projects", subtitle: "Fraser Valley" },
  { city: "Vancouver", title: "Vancouver Projects", subtitle: "Downtown & East Vancouver" },
];

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

        <div className="space-y-10 md:space-y-14">
          {FEATURED_CITIES.map((cityConfig) => (
            <CityProjectsCarousel
              key={cityConfig.city}
              city={cityConfig.city}
              title={cityConfig.title}
              subtitle={cityConfig.subtitle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
