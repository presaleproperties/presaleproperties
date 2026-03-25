import { Building2, Globe, Users, MapPin } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "We only do new construction",
    description: "80%+ of our business is presale. That depth of focus means you get advice that a generalist agent simply cannot give you.",
  },
  {
    icon: MapPin,
    title: "We know these neighbourhoods",
    description: "Years of transactions across Metro Vancouver and Fraser Valley — we know which projects deliver and which ones to avoid.",
  },
  {
    icon: Globe,
    title: "We speak your language",
    description: "English, Hindi, Punjabi, Urdu, Arabic — and more. You should never have to navigate the biggest purchase of your life in a second language.",
  },
  {
    icon: Users,
    title: "We understand your journey",
    description: "Many of our clients are first-generation buyers. We cut out the jargon, slow down, and make sure you feel confident at every step.",
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
                Why It Matters
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-foreground leading-[1.05] tracking-tight mb-7">
                You deserve a specialist,<br />
                <span className="text-primary">not a generalist.</span>
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  Most real estate agents sell everything — resale, rentals, commercial, the occasional presale. When presale is your only focus, you get a completely different level of expertise.
                </p>
                <p>
                  We know the developer reputations, the contract clauses that matter, and the incentives that never get advertised. That knowledge is yours — at zero cost.
                </p>
              </div>

              <div className="mt-9 pt-9 border-t border-border/50">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-primary">$0</span>
                  <span className="text-sm text-muted-foreground leading-snug max-w-[200px]">
                    cost to you. Our fee is paid by the developer — your interests always come first.
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
