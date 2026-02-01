import { Check, ShieldCheck, FileText, BadgeDollarSign, Handshake, HeartHandshake } from "lucide-react";

const differentiators = [
  {
    icon: BadgeDollarSign,
    title: "Negotiate Credits & Incentives",
    description: "We secure closing credits, free upgrades, and developer incentives that add real value.",
  },
  {
    icon: FileText,
    title: "Contract Review & Protection",
    description: "We review every disclosure statement and contract clause to protect your interests.",
  },
  {
    icon: ShieldCheck,
    title: "Deposit Structure Optimization",
    description: "We negotiate flexible deposit schedules that work with your financial timeline.",
  },
  {
    icon: Handshake,
    title: "Assignment Clause Support",
    description: "We ensure assignment rights are included for maximum flexibility down the road.",
  },
  {
    icon: HeartHandshake,
    title: "Post-Sale Support",
    description: "From completion to move-in, we're with you through inspections, deficiencies, and beyond.",
  },
  {
    icon: Check,
    title: "100% Free to Buyers",
    description: "Developer commissions mean our expert representation costs you nothing.",
  },
];

export function WhatWeDoDifferently() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Do Differently
            </h2>
            <div className="w-20 h-1 bg-primary mb-6 rounded-full" />
            
            <div className="bg-muted/50 rounded-xl p-5 sm:p-6 mb-6 sm:mb-8 border-l-4 border-primary">
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">
                Most agents are generalists.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                We're specialists. Presale Properties is dedicated to new construction — 
                which means we know the developers, the contracts, the deposit structures, and the 
                negotiation tactics that make a real difference.
              </p>
            </div>
            
            <div className="bg-primary/5 rounded-xl p-5 sm:p-6 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                True Buyer Representation — At No Cost
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Unlike walking into a sales centre alone, working with us means having an advocate 
                who negotiates on your behalf. Developer commissions cover our fees, so our expert 
                guidance is <span className="font-semibold text-foreground">completely free</span> for buyers.
              </p>
            </div>
          </div>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="bg-card rounded-xl p-4 sm:p-5 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-1">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
