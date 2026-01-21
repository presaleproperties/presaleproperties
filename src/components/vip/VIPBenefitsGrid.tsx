import { Check } from "lucide-react";

const memberBenefits = [
  "Off-market and pre-launch inventory access",
  "VIP pricing before public launch",
  "Disclosure statement review and risk analysis",
  "Developer track record vetting",
  "Fair market value comparisons",
  "Construction phase monitoring and updates",
  "Deficiency walkthrough support",
  "Assignment assistance if circumstances change",
  "Monthly market intelligence reports",
  "Direct access to our presale specialists",
];

const purchaseBenefits = [
  "$1,500 closing credit (legal fees, tenant placement, or cash)",
  "Multi-unit negotiation for additional incentives",
  "Mortgage strategy and broker connections",
  "Tax optimization guidance (GST rebates, PTT exemptions)",
  "Ongoing portfolio strategy support",
];

export const VIPBenefitsGrid = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Membership Benefits
          </h2>
          <p className="text-muted-foreground">
            Everything you need to make informed decisions and build wealth through real estate
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* As a VIP Member */}
          <div className="bg-card border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-6">As a VIP Member</h3>
            <ul className="space-y-4">
              {memberBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* When You Purchase */}
          <div className="bg-card border-2 border-primary rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-foreground">When You Purchase</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Bonus</span>
            </div>
            <ul className="space-y-4">
              {purchaseBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                There's no cost to join VIP. We earn commission from developers when you purchase—you pay nothing extra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
