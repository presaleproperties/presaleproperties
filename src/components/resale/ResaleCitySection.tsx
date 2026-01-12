import { ResaleCityCarousel } from "./ResaleCityCarousel";

const FEATURED_CITIES = [
  { city: "Vancouver", title: "Vancouver Listings", subtitle: "Downtown, East Van & Westside" },
  { city: "Burnaby", title: "Burnaby Listings", subtitle: "Metrotown, Brentwood & Lougheed" },
  { city: "Surrey", title: "Surrey Listings", subtitle: "South Surrey, Guildford & Fleetwood" },
  { city: "Coquitlam", title: "Coquitlam Listings", subtitle: "Tri-Cities Area" },
  { city: "Langley", title: "Langley Listings", subtitle: "Township & City of Langley" },
  { city: "Richmond", title: "Richmond Listings", subtitle: "City Centre & Steveston" },
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
            Explore Listings by Location
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            Discover condos and townhomes for sale in Metro Vancouver's top communities
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
