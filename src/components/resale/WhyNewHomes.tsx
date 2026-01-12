import { Home, Clock, Shield, Sparkles } from "lucide-react";

const values = [
  {
    icon: Home,
    title: "Immediate Possession",
    description: "Brand-new homes with immediate move-in availability — no waiting for construction."
  },
  {
    icon: Clock,
    title: "No Construction Delays",
    description: "Skip the uncertainty of presale timelines. These homes are built and ready."
  },
  {
    icon: Shield,
    title: "Warranty-Backed",
    description: "Full new home warranty coverage for structural, envelope, and materials."
  },
  {
    icon: Sparkles,
    title: "Expert Guidance",
    description: "Work with a new-construction specialist who understands developer inventory."
  }
];

export function WhyNewHomes() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
              Why This Page Exists
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Not Your Typical Resale Page
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              This isn't a generic MLS dump. Every home here is brand-new construction — built 2025 or later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {values.map((value, index) => (
              <div 
                key={index}
                className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                  {value.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
