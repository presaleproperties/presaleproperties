import { Building2, Globe, Users, MapPin } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "New Construction Focus",
    description: "80%+ of our business is presale and move-in ready new homes — it's all we do.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    description: "Deep roots in Metro Vancouver and Fraser Valley communities.",
  },
  {
    icon: Globe,
    title: "Multilingual Service",
    description: "English, Hindi, Punjabi, Urdu, Arabic, Korean — and more.",
  },
  {
    icon: Users,
    title: "First-Gen Expertise",
    description: "Deep understanding of newcomer and first-generation buyers' needs.",
  },
];

export function WhoWeAre() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-center">

            {/* Left — text */}
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Who We Are</span>
              <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-foreground leading-tight tracking-tight mb-6">
                Specialists in BC's<br />
                <span className="text-primary">New Construction Market</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Presale Properties Group is a team of licensed REALTORS® dedicated exclusively to new condos, townhomes, duplexes, and single-family homes across Metro Vancouver and the Fraser Valley.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Over 80% of our business is presale and move-in ready new construction. Our multilingual team brings a deep understanding of first-generation and newcomer buyers, and we're with you from first showing to key pickup.
              </p>
            </div>

            {/* Right — highlight cards */}
            <div className="grid grid-cols-2 gap-4">
              {highlights.map((item, i) => (
                <div
                  key={item.title}
                  className={`rounded-2xl p-6 border transition-all duration-300 hover:border-primary/30 hover:shadow-md ${
                    i % 2 === 1 ? "mt-6" : ""
                  } bg-card`}
                >
                  <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-2 leading-snug">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
