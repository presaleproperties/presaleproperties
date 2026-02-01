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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Do Differently
            </h2>
            <div className="w-20 h-1 bg-primary mb-6 rounded-full" />
            
            <div className="bg-muted/50 rounded-xl p-6 mb-8 border-l-4 border-primary">
              <p className="text-lg font-medium text-foreground mb-2">
                Most agents are generalists.
              </p>
              <p className="text-muted-foreground">
                We're specialists. Presale Properties is dedicated entirely to new construction — 
                which means we know the developers, the contracts, the deposit structures, and the 
                negotiation tactics that make a real difference.
              </p>
            </div>
            
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">
                True Buyer Representation — At No Cost
              </h3>
              <p className="text-sm text-muted-foreground">
                Unlike walking into a sales centre alone, working with us means having an advocate 
                who negotiates on your behalf. And because developer commissions cover our fees, 
                our expert guidance is <span className="font-semibold text-foreground">completely free</span> for buyers.
              </p>
            </div>
          </div>
          
          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="bg-card rounded-xl p-5 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
