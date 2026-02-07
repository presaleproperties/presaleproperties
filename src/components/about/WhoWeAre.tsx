import { Building2, Globe, Users, MapPin } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "New Construction Focus",
    description: "80%+ of our business is presale and move-in ready new homes.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    description: "Serving Metro Vancouver and Fraser Valley communities.",
  },
  {
    icon: Globe,
    title: "Multilingual Service",
    description: "English, Hindi, Punjabi, Urdu, Arabic, Korean, and more.",
  },
  {
    icon: Users,
    title: "First-Gen Expertise",
    description: "Deep understanding of newcomer and first-generation buyers.",
  },
];

export function WhoWeAre() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Who We Are
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-3 sm:mb-4">
            Presale Properties Group is a team of licensed REALTORS® focused on new condos, townhomes, duplexes, and single-family homes across Metro Vancouver and the Fraser Valley.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            Over 80% of our business is presale and move-in-ready new construction. Our multilingual team serves clients with a deep understanding of first-generation and newcomer buyers.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">{item.title}</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
