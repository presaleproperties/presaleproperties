import { Star, Award, Building2, Users } from "lucide-react";

const stats = [
  { value: "500+", label: "New Homes Sold", icon: Building2 },
  { value: "10+", label: "Years Experience", icon: Award },
  { value: "50+", label: "Developer Relationships", icon: Users },
];

export function ExpertPositioning() {
  return (
    <section id="book-call" className="py-12 md:py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
              Your New Construction Expert
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Not Just Another Realtor
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              PresaleProperties.com specializes exclusively in new construction. We have direct relationships with developers, early access to inventory, and deep expertise in the new home market.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10 md:mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-3">
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Value Props */}
          <div className="bg-muted/30 rounded-2xl p-6 md:p-8 border border-border">
            <h3 className="font-semibold text-foreground text-lg mb-4 text-center">
              What Sets Us Apart
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Developer Access</h4>
                  <p className="text-xs text-muted-foreground">
                    Direct relationships with major developers means early access to new releases.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">New Construction Focus</h4>
                  <p className="text-xs text-muted-foreground">
                    We only do new homes — presales and move-in ready. No generic resales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Market Intelligence</h4>
                  <p className="text-xs text-muted-foreground">
                    Data-driven insights on pricing, incentives, and inventory across BC.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Full-Service Support</h4>
                  <p className="text-xs text-muted-foreground">
                    From search to closing, we guide you through every step of buying new.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
