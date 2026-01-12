import { ResaleCityCarousel } from "./ResaleCityCarousel";

const FEATURED_CITIES = [
  { city: "Vancouver", title: "Vancouver New Homes", subtitle: "Condos, Townhomes & Single Family" },
  { city: "Burnaby", title: "Burnaby New Homes", subtitle: "Metrotown, Brentwood & Lougheed" },
  { city: "Surrey", title: "Surrey New Homes", subtitle: "South Surrey, Guildford & Fleetwood" },
  { city: "Coquitlam", title: "Coquitlam New Homes", subtitle: "Tri-Cities Area" },
  { city: "Langley", title: "Langley New Homes", subtitle: "Township & City of Langley" },
  { city: "Delta", title: "Delta New Homes", subtitle: "Tsawwassen, Ladner & North Delta" },
  { city: "Abbotsford", title: "Abbotsford New Homes", subtitle: "Fraser Valley Living" },
  { city: "Richmond", title: "Richmond New Homes", subtitle: "City Centre & Steveston" },
];

export function ResaleCitySection() {
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
            New Homes by Location
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            Condos, townhomes & single family homes built 2024 or newer
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
