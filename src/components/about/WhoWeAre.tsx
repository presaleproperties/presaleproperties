import { Building2, Globe, Users, MapPin } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "New Construction Focus",
    description: "80%+ of our business is presale and move-in ready new homes — condos, townhomes, duplexes, and single-family.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    description: "Deep knowledge of Metro Vancouver and Fraser Valley communities, builders, and market trends.",
  },
  {
    icon: Globe,
    title: "Multilingual Service",
    description: "We serve clients in English, Hindi, Punjabi, Urdu, Arabic, Korean, and more.",
  },
  {
    icon: Users,
    title: "First-Gen Expertise",
    description: "A deep understanding of the unique needs of newcomer and first-generation home buyers.",
  },
];

export function WhoWeAre() {
  return (
    <section className="py-16 sm:py-20 md:py-28 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Who We Are
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-5 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            We're a team of licensed REALTORS® who specialize exclusively in new construction. From first‑time buyers to experienced investors, we make the presale process clear, confident, and cost‑free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group bg-card rounded-xl p-5 sm:p-6 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/15 transition-colors">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5 text-sm sm:text-base">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
