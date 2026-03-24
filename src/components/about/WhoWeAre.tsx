import { Building2, Globe, Users, MapPin } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "New Construction Only",
    description: "80%+ of our business is presale and move-in ready new homes. It's all we do — and we're exceptional at it.",
  },
  {
    icon: MapPin,
    title: "Deep Local Roots",
    description: "Metro Vancouver and Fraser Valley expertise, built neighbourhood by neighbourhood over years.",
  },
  {
    icon: Globe,
    title: "Multilingual Team",
    description: "English, Hindi, Punjabi, Urdu, Arabic — and more. You should be understood in your language.",
  },
  {
    icon: Users,
    title: "First-Gen Expertise",
    description: "We deeply understand newcomer and first-generation buyer needs — no judgment, no jargon.",
  },
];

export function WhoWeAre() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.25fr] gap-14 lg:gap-20 items-start">

            {/* Left — text */}
            <div className="lg:sticky lg:top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-5">
                Who We Are
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-foreground leading-[1.05] tracking-tight mb-7">
                Specialists in BC's<br />
                <span className="text-primary">New Construction Market</span>
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  Presale Properties Group is a team of licensed REALTORS® dedicated exclusively to new condos, townhomes, duplexes, and single-family homes across Metro Vancouver and the Fraser Valley.
                </p>
                <p>
                  Our multilingual team brings a deep understanding of first-generation and newcomer buyers. We're with you from your first showing all the way to key pickup.
                </p>
              </div>

              {/* Divider accent */}
              <div className="mt-9 pt-9 border-t border-border/50">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-primary">80%</span>
                  <span className="text-sm text-muted-foreground leading-snug max-w-[200px]">
                    of our business is new construction — by choice, not chance.
                  </span>
                </div>
              </div>
            </div>

            {/* Right — cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((item, i) => (
                <div
                  key={item.title}
                  className={`rounded-2xl p-5 sm:p-6 border border-border bg-card hover:border-primary/35 hover:shadow-lg transition-all duration-300 ${
                    i % 2 === 1 ? "sm:mt-7" : ""
                  }`}
                >
                  <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-5">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-[14px] mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
