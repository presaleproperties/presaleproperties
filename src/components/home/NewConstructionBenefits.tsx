import { useState } from "react";
import { 
  Home, 
  TrendingUp, 
  Shield, 
  Palette, 
  Clock, 
  Building2,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: TrendingUp,
    title: "Build Equity Early",
    description: "Lock in today's price and watch your investment grow. Pre-construction homes often appreciate in value before you even move in."
  },
  {
    icon: Clock,
    title: "Flexible Payment Structure",
    description: "Only pay a small deposit upfront (~5-20%), with remaining payments staggered over time. More time to prepare for your mortgage."
  },
  {
    icon: Palette,
    title: "Customize Your Home",
    description: "Choose your finishes, colors, and upgrades. Make your new home truly yours from the very beginning."
  },
  {
    icon: Shield,
    title: "New Home Warranty",
    description: "Protected by comprehensive warranties covering defects and structural issues for years after purchase."
  },
  {
    icon: Home,
    title: "Modern Design & Efficiency",
    description: "Built to the latest building codes with energy-efficient features, modern layouts, and smart home technology."
  },
  {
    icon: Building2,
    title: "Prime Locations",
    description: "New developments are strategically located near transit, schools, and amenities in growing neighbourhoods."
  }
];

// FAQ content - structured data is handled by parent page (Index.tsx) to avoid duplicates
const faqs = [
  {
    question: "What are presale homes?",
    answer: "Presale homes are properties that are sold before construction is complete. Buyers purchase based on floor plans and renderings, typically at lower prices than completed homes. This allows you to secure a home in a desirable location and often customize finishes to your preferences."
  },
  {
    question: "Who should consider buying presale?",
    answer: "Presale homes are ideal for first-time buyers looking to enter the market, investors seeking appreciation potential, and anyone who wants a brand-new home with modern features. They're especially suited for buyers who have flexibility with their move-in timeline."
  },
  {
    question: "What is the deposit structure?",
    answer: "Typically, presale deposits range from 5-20% of the purchase price, paid in installments over several months. For example, 5% at signing, 5% in 90 days, and 5% in 180 days. This makes it easier to save compared to a traditional home purchase requiring a full down payment upfront."
  },
  {
    question: "When do I need a mortgage?",
    answer: "You won't need to secure your mortgage until the home is ready for occupancy, which could be 1-3 years after your initial deposit. This gives you time to improve your credit, save more, or wait for favorable interest rates."
  },
  {
    question: "What warranties come with a new home?",
    answer: "New homes in BC are covered by comprehensive warranties including 2 years for materials and labour, 5 years for the building envelope, and 10 years for structural defects. This provides peace of mind and protection for your investment."
  },
  {
    question: "Can I sell my presale contract before completion?",
    answer: "Yes, this is called an 'assignment sale.' You can sell your contract to another buyer before the home is completed, potentially profiting from any appreciation during the construction period. Some restrictions may apply depending on the developer."
  }
];

export function NewConstructionBenefits() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  const visibleBenefits = showAllBenefits ? benefits : benefits.slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mb-16 md:mb-24">
          <div className="text-center mb-10 md:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
              Why Buy Presale
            </span>
             <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground mb-4">
              Benefits of Buying New Construction
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover why thousands of buyers choose presale homes as their path to homeownership in Metro Vancouver.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-background rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Show More Button - Mobile Only */}
          {!showAllBenefits && benefits.length > 3 && (
            <div className="text-center mt-6 md:hidden">
              <button
                onClick={() => setShowAllBenefits(true)}
                className="text-primary font-medium text-sm flex items-center gap-1 mx-auto hover:underline"
              >
                Show all benefits
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground mb-4">
              FAQs About Presale Homes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about buying a presale or new construction home.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-background rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={cn(
                      "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      expandedFaq === index && "rotate-180"
                    )} 
                  />
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    expandedFaq === index ? "max-h-96" : "max-h-0"
                  )}
                >
                  <p className="px-5 pb-4 md:px-6 md:pb-5 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
