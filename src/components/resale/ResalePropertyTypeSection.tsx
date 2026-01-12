import { ResalePropertyTypeCarousel } from "./ResalePropertyTypeCarousel";

export function ResalePropertyTypeSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by Type
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Find Your Move-In Ready Home
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
            New built condos, townhomes, and single family homes ready to move in
          </p>
        </div>

        <div className="space-y-10 md:space-y-14">
          <ResalePropertyTypeCarousel
            propertyType="condo"
            title="New Condos"
            subtitle="Brand new apartments & condominiums"
          />

          <ResalePropertyTypeCarousel
            propertyType="townhouse"
            title="New Townhomes"
            subtitle="Townhouses, duplexes & row homes"
          />

          <ResalePropertyTypeCarousel
            propertyType="house"
            title="New Single Family Homes"
            subtitle="Detached new construction houses"
          />
        </div>
      </div>
    </section>
  );
}
