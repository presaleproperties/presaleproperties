import { Eye, Clock, TrendingDown, Shield } from "lucide-react";

const values = [
  {
    icon: Eye,
    title: "Exclusive Inventory",
    description: "Access off-market units and pre-launch allocations before public release",
  },
  {
    icon: Clock,
    title: "Early Access",
    description: "See new projects 7-14 days before they're available to the general public",
  },
  {
    icon: TrendingDown,
    title: "VIP Pricing",
    description: "Secure early-bird pricing that's typically $10K-$25K below public launch rates",
  },
  {
    icon: Shield,
    title: "Expert Guidance",
    description: "Full support from contract signing through to completion and possession",
  },
];

export const VIPValueProposition = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Why Buyers & Investors Join VIP
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            In today's market, the best presale units are often allocated to trusted partners before public launch. 
            VIP members don't compete with the crowd—they get first choice.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="bg-card border rounded-xl p-6 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <value.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
