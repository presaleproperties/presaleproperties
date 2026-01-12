import { ResaleCityCarousel } from "./ResaleCityCarousel";

const FEATURED_CITIES = [
  { city: "Vancouver", title: "Vancouver", subtitle: "Downtown, East Van & West Side" },
  { city: "Surrey", title: "Surrey", subtitle: "South Surrey, Guildford & Fleetwood" },
  { city: "Burnaby", title: "Burnaby", subtitle: "Metrotown, Brentwood & Lougheed" },
  { city: "Coquitlam", title: "Coquitlam", subtitle: "Tri-Cities Area" },
  { city: "Langley", title: "Langley", subtitle: "Township & City of Langley" },
  { city: "Richmond", title: "Richmond", subtitle: "City Centre & Steveston" },
  { city: "Delta", title: "Delta", subtitle: "Tsawwassen & Ladner" },
  { city: "Abbotsford", title: "Abbotsford", subtitle: "Fraser Valley" },
];

export function ResaleCitySectionCompact() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
            Explore by Location
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Move-In Ready Homes by City
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            Find new built homes in your preferred neighbourhood
          </p>
        </div>

        <div className="space-y-10 md:space-y-14">
          {FEATURED_CITIES.map((cityConfig) => (
            <ResaleCityCarousel
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
