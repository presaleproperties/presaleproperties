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
            Brand new homes, never lived in – ready to move in today
          </p>
        </div>

        <div className="space-y-10 md:space-y-14">
          <ResalePropertyTypeCarousel
            propertyType="condo"
            title="Move-In Ready Condos"
            subtitle="Brand new, never lived in"
          />

          <ResalePropertyTypeCarousel
            propertyType="townhouse"
            title="Move-In Ready Townhomes"
            subtitle="Brand new homes ready for move-in"
          />

          <ResalePropertyTypeCarousel
            propertyType="house"
            title="Move-In Ready Single Family Homes"
            subtitle="Brand new, never lived in"
          />
        </div>
      </div>
    </section>
  );
}
