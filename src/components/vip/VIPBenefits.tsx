import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Target, DollarSign, Search, HardHat, TrendingUp, Bell } from "lucide-react";

const benefits = [
  {
    id: "inventory",
    icon: Target,
    title: "EXCLUSIVE INVENTORY ACCESS",
    subtitle: "What most buyers never see:",
    items: [
      { title: "Off-Market Units", desc: "First access to inventory reserved exclusively for our VIP network—never advertised publicly" },
      { title: "Pre-Launch Allocation", desc: "See new projects 7-14 days before public release (best selection, lowest pricing)" },
      { title: "VIP Pricing", desc: "Early-bird pricing that's $10,000-$25,000 below public launch rates" },
      { title: "Corner Units & Penthouses", desc: "First refusal on premium units that sell out instantly" },
      { title: "Sold-Out Projects", desc: "Access to units that become available through cancellations or assignments" },
    ],
    callout: "Why this matters: In the past year, 62% of our VIP Elite clients purchased units that never made it to public launch. They got better units, better floors, better pricing—simply because they had access first.",
  },
  {
    id: "credit",
    icon: DollarSign,
    title: "YOUR $1,500 CLOSING CREDIT",
    subtitle: "Choose ONE:",
    items: [
      { title: "Complimentary Legal Fees (up to $1,500)", desc: "" },
      { title: "Complimentary Tenant Placement (for investors)", desc: "" },
      { title: "$1,500 Cash Rebate", desc: "" },
    ],
    callout: "Applied at closing. No strings attached.",
  },
  {
    id: "protection",
    icon: Search,
    title: "PRE-PURCHASE PROTECTION",
    subtitle: "We do the homework so you don't have to:",
    items: [
      { title: "Disclosure Statement Review", desc: "We read all 200+ pages and flag risky clauses (variation rights, assignment restrictions, delay clauses)" },
      { title: "Developer Vetting", desc: "Track record analysis, financial health check, completion history review" },
      { title: "Fair Market Value Analysis", desc: "Compare pricing across 20+ projects to ensure you're not overpaying" },
      { title: "Assignment Clause Review", desc: "Understand your exit options if life circumstances change" },
      { title: "Mortgage Strategy", desc: "Connect with presale-specialist brokers, stress test calculations, down payment planning" },
    ],
    callout: "Why this matters: One client was about to sign on a project priced 18% above fair market value. Our FMV analysis caught it. We walked away and found a better deal. Savings: $65,000.",
  },
  {
    id: "monitoring",
    icon: HardHat,
    title: "CONSTRUCTION PHASE MONITORING",
    subtitle: "We stay with you for 2-4 years:",
    items: [
      { title: "Monthly Site Visit Updates", desc: "Photos, videos, progress tracking" },
      { title: "Amendment Reviews", desc: "We review every change to the disclosure statement and alert you to material changes" },
      { title: "Early Warning System", desc: "If a project is falling behind schedule or showing red flags, you'll know immediately" },
      { title: "Deficiency Walkthrough", desc: "We attend with you before closing to catch issues and hold the developer accountable" },
    ],
    callout: "Why this matters: During one client's deficiency walkthrough, we caught 14 issues (missing appliances, chipped counters, faulty HVAC, unfinished trim). All fixed before closing. Value: $8,000+ in repairs they didn't have to pay for.",
  },
  {
    id: "portfolio",
    icon: TrendingUp,
    title: "ONGOING PORTFOLIO STRATEGY",
    subtitle: "Building wealth, not just buying units:",
    items: [
      { title: "Multi-Unit Acquisition Planning", desc: "How to scale from 1 unit → 5-10 units strategically" },
      { title: "Hold vs. Flip Analysis", desc: "When to sell for profit, when to hold for cash flow" },
      { title: "Assignment Assistance", desc: "If life changes and you need to exit, we help you find qualified assignees and negotiate with developers" },
      { title: "Tax Optimization", desc: "GST rebate applications, PTT exemptions, capital gains planning" },
      { title: "Equity Extraction Strategies", desc: "How to pull equity out of completed units to fund your next purchase" },
    ],
    callout: "Why this matters: One investor started with 1 presale unit in 2020. Today he owns 6 units across 4 projects, with $420K in combined equity. We helped him structure every deal, negotiate bulk incentives, and time his purchases during market dips.",
  },
  {
    id: "perks",
    icon: Bell,
    title: "VIP ELITE PERKS",
    subtitle: "",
    items: [
      { title: "Direct Access to Uzair", desc: "Text, call, email—priority response within 24 hours" },
      { title: "Multi-Unit Incentives", desc: "Buying 2+ units? We negotiate additional perks (parking, locker, upgrades, extended deposit schedules)" },
      { title: "Monthly Market Intelligence", desc: "Presale trends, new launches, pricing analysis, developer updates" },
      { title: "Exclusive Events", desc: "Private VIP showings, developer meet & greets, presale education workshops" },
    ],
    callout: "",
  },
];

export const VIPBenefits = () => {
  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28 px-4 bg-background">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Your VIP Elite Membership Includes
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to buy smart, protect your investment, and build wealth
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="multiple" defaultValue={["inventory", "credit"]} className="space-y-4">
          {benefits.map((benefit) => (
            <AccordionItem
              key={benefit.id}
              value={benefit.id}
              className="border rounded-xl px-6 bg-card shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-foreground">{benefit.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                {benefit.subtitle && (
                  <p className="text-muted-foreground mb-4 ml-16">{benefit.subtitle}</p>
                )}
                <ul className="space-y-4 ml-16 mb-6">
                  {benefit.items.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">{item.title}</span>
                        {item.desc && <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
                {benefit.callout && (
                  <div className="ml-16 bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-sm text-muted-foreground italic">{benefit.callout}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-2">VIP Elite Membership Cost: <span className="font-bold text-foreground">$0</span></p>
          <p className="text-sm text-muted-foreground mb-8">(We earn commission from the developer when you purchase—you pay nothing extra)</p>
          <Button onClick={scrollToForm} size="lg" className="bg-primary text-primary-foreground font-semibold">
            Claim Your $1,500 Credit + VIP Elite Benefits →
          </Button>
        </div>
      </div>
    </section>
  );
};
