import { ResaleNewestCarousel } from "./ResaleNewestCarousel";
import { ResalePropertyTypeCarousel } from "./ResalePropertyTypeCarousel";
import { ResaleCityCarousel } from "./ResaleCityCarousel";

const FEATURED_CITIES = [
  { city: "Coquitlam", title: "Coquitlam", subtitle: "Tri-Cities Area" },
  { city: "Langley", title: "Langley", subtitle: "Township & City of Langley" },
  { city: "Burnaby", title: "Burnaby", subtitle: "Metrotown, Brentwood & Lougheed" },
  { city: "Surrey", title: "Surrey", subtitle: "South Surrey, Guildford & Fleetwood" },
  { city: "Richmond", title: "Richmond", subtitle: "City Centre & Steveston" },
  { city: "Vancouver", title: "Vancouver", subtitle: "Downtown, East Van & West Side" },
];

export function ResaleCitySection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
            Ready to Move In
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            2025+ New Construction Homes
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            Brand new homes built in 2025 or later across Metro Vancouver
          </p>
        </div>

        <div className="space-y-10 md:space-y-14">
          {/* Newest Listings Carousel */}
          <ResaleNewestCarousel />

          {/* Property Type Carousels */}
          <ResalePropertyTypeCarousel
            propertyType="condo"
            title="Condos"
            subtitle="New construction apartments & condominiums"
          />

          <ResalePropertyTypeCarousel
            propertyType="townhouse"
            title="Townhomes"
            subtitle="Brand new townhouses & row homes"
          />

          <ResalePropertyTypeCarousel
            propertyType="house"
            title="Single Family Homes"
            subtitle="Detached new construction houses"
          />

          {/* Divider before city section */}
          <div className="pt-6 border-t border-border/50">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Browse by City</h3>
              <p className="text-sm text-muted-foreground">Find new homes in your preferred location</p>
            </div>
          </div>

          {/* City Carousels */}
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
