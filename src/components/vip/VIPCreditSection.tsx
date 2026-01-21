import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Home, Banknote, Check, Star } from "lucide-react";

const creditOptions = [
  {
    icon: FileText,
    title: "Option 1: Complimentary Legal Fees",
    badge: "Most Popular for First-Time Buyers",
    items: [
      "Contract review",
      "Title transfer",
      "Closing documents",
      "Legal disbursements",
    ],
    footer: "You pay: $0",
  },
  {
    icon: Home,
    title: "Option 2: Complimentary Tenant Placement",
    badge: "Most Popular for Investors",
    items: [
      "Tenant screening & credit check",
      "Lease agreement",
      "Move-in coordination",
      "First month managed",
    ],
    footer: "You pay: $0",
    subtext: "(Optional: Continue with property management after—your choice)",
  },
  {
    icon: Banknote,
    title: "Option 3: Cash Rebate",
    badge: null,
    items: [
      "Use for furniture",
      "Use for upgrades",
      "Use for renovations",
      "Pocket it",
    ],
    footer: "Your choice. Your money.",
  },
];

export const VIPCreditSection = () => {
  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28 px-4 bg-background">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How Your $1,500 Credit Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            When you purchase a presale through Presale Properties, you receive a $1,500 credit at closing—guaranteed.
          </p>
          <p className="text-xl font-semibold text-foreground">Choose how you want to use it:</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {creditOptions.map((option, index) => (
            <Card key={option.title} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
              {option.badge && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-semibold py-2 text-center flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  {option.badge}
                </div>
              )}
              <CardHeader className={option.badge ? "pt-12" : ""}>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <option.icon className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {option.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-5 h-5 text-success flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-bold text-foreground text-lg">{option.footer}</p>
                {option.subtext && (
                  <p className="text-xs text-muted-foreground mt-2">{option.subtext}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-muted/50 rounded-2xl p-8 md:p-12 mb-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">"When do you get it?"</h3>
              <p className="text-muted-foreground">
                Your $1,500 credit is applied at closing when you take possession of your presale unit. No strings attached. No hidden fees. Just $1,500 back in your pocket.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">"Who qualifies?"</h3>
              <p className="text-muted-foreground">
                Every buyer who purchases a presale through Presale Properties as a VIP Elite member.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button onClick={scrollToForm} size="lg" className="bg-primary text-primary-foreground font-semibold">
            Claim Your $1,500 Credit →
          </Button>
        </div>
      </div>
    </section>
  );
};
