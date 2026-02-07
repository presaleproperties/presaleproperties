import { Home, TrendingUp, Globe, Building2 } from "lucide-react";

const audiences = [
  {
    icon: Home,
    title: "First-Time Buyers",
    description: "Navigating your first purchase can be overwhelming. We simplify contracts, deposits, and timelines so you buy with confidence.",
  },
  {
    icon: TrendingUp,
    title: "Investors",
    description: "Building a portfolio through presales requires strategy. We help you pick projects with strong rental demand and favourable terms.",
  },
  {
    icon: Globe,
    title: "Newcomers to Canada",
    description: "Our multilingual team (English, Hindi, Punjabi, Urdu, Arabic, Korean) makes your first Canadian home purchase feel like home.",
  },
  {
    icon: Building2,
    title: "Move-Up Buyers",
    description: "Ready for more space? We find the right new construction townhome, duplex, or single-family home in your preferred neighbourhood.",
  },
];

export function WhoItsFor() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
            Your Situation
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            We Work With Buyers Like You
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            Whether it's your first home or your fifth investment, we specialize in the challenges unique to new construction buyers.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {audiences.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
