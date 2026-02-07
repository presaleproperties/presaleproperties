import { Search, FileText, BadgeDollarSign, ClipboardCheck, Key, TrendingUp, ArrowRightLeft, BarChart3 } from "lucide-react";

const services = [
  {
    icon: Search,
    title: "Project Selection & Shortlisting",
    description: "We research and compare new developments so you see only the projects that match your budget, lifestyle, and investment goals.",
  },
  {
    icon: FileText,
    title: "Contract Review & Guidance",
    description: "We review every purchase agreement, disclosure statement, and addendum — explaining what matters in plain language.",
  },
  {
    icon: BadgeDollarSign,
    title: "Incentive Negotiation",
    description: "We negotiate deposit structures, closing cost credits, upgrade packages, and developer incentives on your behalf.",
  },
  {
    icon: ClipboardCheck,
    title: "Completion & Walkthrough",
    description: "We attend your PDI (pre-delivery inspection), document deficiencies, and ensure everything is resolved before you take possession.",
  },
  {
    icon: Key,
    title: "Move-In Coordination",
    description: "From mortgage finalization to key pickup, we coordinate all final steps so your closing day runs smoothly.",
  },
  {
    icon: ArrowRightLeft,
    title: "Assignment Sales",
    description: "Need to sell before completion? We handle the assignment process — pricing, marketing, and negotiation — to maximise your return.",
  },
  {
    icon: TrendingUp,
    title: "Investment Planning",
    description: "We help investors build portfolios around completion timelines, rental demand, and cash flow projections.",
  },
  {
    icon: BarChart3,
    title: "Market Insights & Data",
    description: "Access to pricing trends, rental yields, and neighbourhood analytics to help you make informed, data-driven decisions.",
  },
];

export function OurServices() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
            How We Help
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            From First Call to Key Pickup
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            From your first consultation to key pickup and beyond — all at no cost to you.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {services.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-1.5 text-xs sm:text-sm md:text-base leading-tight">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <BadgeDollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              All services are free — the developer pays our fee
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
