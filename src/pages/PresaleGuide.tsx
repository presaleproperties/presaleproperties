import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { RelatedContent } from "@/components/home/RelatedContent";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Building2,
  Users,
  Calculator,
  Phone,
  Search,
  Scale,
  Home,
  Landmark,
  BadgeCheck,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function PresaleGuide() {
  const steps = [
    {
      number: "01",
      title: "Research the Market",
      description: "Start by exploring different neighborhoods, price points, and upcoming developments. Consider your lifestyle needs (proximity to transit, schools, amenities), budget constraints, and investment goals. Research which areas are seeing growth and infrastructure improvements.",
      icon: Search,
      tips: [
        "Compare prices across different neighborhoods",
        "Look for areas with planned transit or amenity upgrades",
        "Consider both current and future rental demand"
      ]
    },
    {
      number: "02",
      title: "Evaluate the Developer",
      description: "A developer's reputation is crucial. Research their track record — have previous projects been delivered on time? Are residents satisfied? Check for any legal disputes or financial troubles. A reputable developer reduces your risk significantly.",
      icon: Building2,
      tips: [
        "Visit completed projects by the same developer",
        "Read reviews from current homeowners",
        "Check if the developer has faced construction delays"
      ]
    },
    {
      number: "03",
      title: "Review the Disclosure Statement",
      description: "BC law requires developers to provide a detailed disclosure statement before you sign. This includes completion dates, strata bylaws, deposit structure, parking allocations, and more. Have a real estate lawyer review this document carefully.",
      icon: FileText,
      tips: [
        "Pay attention to the estimated completion date range",
        "Review strata rules for pets, rentals, and renovations",
        "Check what's included (parking, storage, upgrades)"
      ]
    },
    {
      number: "04",
      title: "Secure Your Financing",
      description: "Get pre-approved for a mortgage, but understand that presale financing is different. Deposits are typically 15-20% paid in installments. Since completion may be 1-5 years away, ensure your pre-approval strategy accounts for potential rate changes.",
      icon: Landmark,
      tips: [
        "Work with a mortgage broker experienced in presales",
        "Plan for deposits: typically 5% at signing, then staged payments",
        "Consider rate lock options for longer construction timelines"
      ]
    },
    {
      number: "05",
      title: "Understand BC Regulations",
      description: "Know your rights under BC law. You have a 7-day rescission (cooling-off) period after signing to cancel without penalty. The Real Estate Development Marketing Act (REDMA) protects buyers by requiring full disclosure from developers.",
      icon: Scale,
      tips: [
        "Use the 7-day rescission period to review documents with a lawyer",
        "Deposits must be held in trust until completion",
        "Developers must disclose any material changes to the project"
      ]
    },
    {
      number: "06",
      title: "Work with Professionals",
      description: "Assemble your team: a real estate agent specializing in presales can negotiate better terms and get you early access. A real estate lawyer protects your interests. A mortgage broker finds the best financing for your situation.",
      icon: Users,
      tips: [
        "Choose an agent with developer relationships for priority access",
        "Have your lawyer review the contract before the rescission period ends",
        "Get referrals from friends or family who've bought presales"
      ]
    },
    {
      number: "07",
      title: "Sign the Contract",
      description: "Once you're confident, sign the purchase agreement and submit your initial deposit. The contract outlines everything: purchase price, deposit schedule, completion timeline, included features, and your rights and obligations.",
      icon: CheckCircle,
      tips: [
        "Ensure all verbal promises are in writing",
        "Understand the assignment clause if you may need to sell before completion",
        "Keep copies of all documents and correspondence"
      ]
    },
    {
      number: "08",
      title: "Wait & Prepare for Completion",
      description: "During construction (1-5 years), stay informed about project updates. As completion approaches, finalize your mortgage, arrange home insurance, and prepare for the deficiency walkthrough where you'll inspect your new home.",
      icon: Clock,
      tips: [
        "Attend any homeowner previews or walkthroughs offered",
        "Start your mortgage application 90-120 days before completion",
        "Budget for closing costs and immediate move-in expenses"
      ]
    },
  ];

  const costs = [
    {
      name: "Deposit (Staged Payments)",
      description: "Typically 5-20% of purchase price, paid in installments during construction. These are held in trust and protect both buyer and developer.",
      typical: "5-20% of price",
    },
    {
      name: "5% GST (New Home)",
      description: "Goods and Services Tax applies to all new homes. Some buyers qualify for a partial GST rebate if using as primary residence.",
      typical: "5% of purchase price",
    },
    {
      name: "Property Transfer Tax",
      description: "1% on first $200K, 2% on $200K-$2M, 3% on amounts over $2M. First-time buyers may qualify for exemption on homes up to $835,000.",
      typical: "Varies by price",
    },
    {
      name: "Legal Fees",
      description: "Your lawyer reviews the contract, handles the title transfer, and ensures all documents are properly executed.",
      typical: "$1,500 - $2,500",
    },
    {
      name: "Strata Fees",
      description: "Monthly fees begin at move-in and cover building maintenance, insurance, and amenities. Budget for this ongoing cost.",
      typical: "$200 - $600/month",
    },
    {
      name: "Home Insurance",
      description: "Required before you can complete the purchase. Covers your unit contents and any improvements you make.",
      typical: "$300 - $800/year",
    },
  ];

  const faqs = [
    {
      question: "What is a presale condo?",
      answer: "A presale condo is a unit you purchase before construction is complete — often before it even begins. You're buying based on floor plans, renderings, and the developer's vision. At completion (typically 1-5 years later), the property transfers to you as a brand-new home."
    },
    {
      question: "Why buy presale instead of resale?",
      answer: "Presales offer brand-new units with modern layouts, the latest finishes, and full warranty coverage. You can often choose your preferred floor and view, and may benefit from price appreciation during construction. However, you can't see the exact finished product and must wait for completion."
    },
    {
      question: "How much deposit do I need for a presale?",
      answer: "Typically 15-20% of the purchase price, paid in stages during construction. A common structure is 5% at signing, 5% in 90-180 days, and 5-10% at later milestones. These deposits are held in a lawyer's trust account until completion."
    },
    {
      question: "What is the 7-day rescission period?",
      answer: "BC law gives you 7 days after signing to cancel a presale purchase for any reason, with only a small rescission fee (typically $500). Use this time to have a lawyer review all documents and ensure you're comfortable with the purchase."
    },
    {
      question: "What is a disclosure statement?",
      answer: "A legal document developers must provide before you sign. It includes project details, completion timeline, strata bylaws, deposit structure, parking/storage allocations, and developer information. It's your most important research document."
    },
    {
      question: "Can the completion date change?",
      answer: "Yes. Construction delays are common due to weather, permits, supply chain issues, or other factors. Developers typically provide a completion date range rather than a specific date. Your contract will outline the process for any delays."
    },
    {
      question: "What is an assignment sale?",
      answer: "Selling your presale contract to another buyer before completion. If your circumstances change, you may be able to 'assign' your purchase rights. However, there may be developer fees, tax implications, and restrictions. Check your contract for assignment clauses."
    },
    {
      question: "Do I get a warranty on a presale?",
      answer: "Yes! New homes in BC come with 2-5-10 warranty coverage from BC Housing: 2 years on materials and labor, 5 years on building envelope, and 10 years on structure. This provides significant protection for your investment."
    },
    {
      question: "What if the developer goes bankrupt?",
      answer: "Your deposits are held in a lawyer's trust account, not by the developer, which provides protection. Additionally, warranty coverage from BC Housing provides some recourse. Working with reputable, established developers reduces this risk."
    },
    {
      question: "Can I make changes to my unit?",
      answer: "Most developers offer a selection of finishes (colors, flooring, countertops) from approved options. Major layout changes are rarely possible. Upgrade packages for appliances, fixtures, or premium finishes are often available for additional cost."
    },
    {
      question: "What happens at completion?",
      answer: "You'll do a deficiency walkthrough to note any issues, finalize your mortgage, pay the remaining balance plus closing costs, and receive your keys. The developer has a set period to address deficiencies after you take possession."
    },
    {
      question: "Are there first-time buyer benefits?",
      answer: "Yes! BC offers Property Transfer Tax exemption for first-time buyers on homes up to $835,000 (partial exemption up to $860,000). First-time buyers can also use RRSP savings tax-free through the Home Buyers' Plan (up to $35,000)."
    },
  ];

  const benefits = [
    {
      title: "Brand New Everything",
      description: "Move into a never-lived-in home with new appliances, modern finishes, and the latest building codes.",
      icon: Sparkles,
    },
    {
      title: "Full Warranty Protection",
      description: "BC's 2-5-10 warranty covers materials (2 years), building envelope (5 years), and structure (10 years).",
      icon: Shield,
    },
    {
      title: "Price Appreciation Potential",
      description: "Lock in today's prices and potentially benefit from market appreciation during the construction period.",
      icon: TrendingUp,
    },
    {
      title: "Customization Options",
      description: "Choose your preferred floor plan, view, and finishes from available options before construction.",
      icon: Home,
    },
  ];

  const firstTimeTips = [
    {
      title: "Start with What You Can Afford",
      description: "A smaller unit in a good location can be a smart first purchase. You'll learn the process and build equity for your next home."
    },
    {
      title: "Prioritize Location",
      description: "Look for areas with planned transit, schools, and amenities. Good location helps both your lifestyle and resale value."
    },
    {
      title: "Maximize Developer Incentives",
      description: "Developers often offer incentives like reduced deposits, free upgrades, or capped assignment fees. Ask what's available."
    },
    {
      title: "Use Government Programs",
      description: "First-time buyer exemptions, RRSP Home Buyers' Plan, and other programs can save you thousands. Research your eligibility."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Complete Guide to Buying a Presale Condo in BC | Step-by-Step Process</title>
        <meta name="description" content="Learn how to buy a presale condo in Metro Vancouver. Step-by-step guide covering deposits, disclosure statements, financing, BC regulations, and expert tips for first-time buyers." />
        <meta name="keywords" content="how to buy presale condo, presale condo guide Vancouver, BC presale process, presale deposit, disclosure statement, first-time buyer presale, Vancouver new condo" />
        <link rel="canonical" href="https://presaleproperties.com/presale-guide" />
      </Helmet>
      
      <FAQSchema faqs={faqs} />

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Presale Guide" }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                Presale Guide
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Your Complete Guide to{" "}
                <span className="text-primary">Buying a Presale Condo</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need to know about purchasing a presale condo or townhome in Metro Vancouver — from initial research to getting your keys.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/presale-projects">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Presale Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Phone className="h-4 w-4 mr-2" />
                    Talk to an Expert
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is a Presale */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                What is a Presale Condo?
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed mb-4">
                  A <strong className="text-foreground">presale condo</strong> (also called "pre-construction" or "off-plan") is a home you purchase before it's built. You're buying based on architectural plans, renderings, and the developer's specifications.
                </p>
                <p className="leading-relaxed mb-4">
                  When you buy presale, you sign a contract agreeing to purchase a specific unit at a set price. You pay deposits during construction, and the final balance (plus closing costs) when the building is complete — typically 1-5 years later.
                </p>
                <p className="leading-relaxed">
                  At completion, you receive a brand-new home with full warranty coverage, modern features, and potentially built-in equity if the market has appreciated during construction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Why Buy Presale?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Presale purchases offer unique advantages for homebuyers and investors.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Step by Step Process */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                The Presale Buying Process: Step by Step
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these 8 steps to confidently purchase your presale home.
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="flex gap-4 md:gap-6 items-start">
                    <div className="shrink-0 w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      {step.tips && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">💡 Pro Tips:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {step.tips.map((tip, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute left-7 top-14 w-0.5 h-8 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Costs Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Understanding the Costs
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Budget for these costs when purchasing a presale condo.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-xl border overflow-hidden">
                {costs.map((cost, i) => (
                  <div 
                    key={i} 
                    className={`p-4 md:p-6 ${i !== costs.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{cost.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{cost.description}</p>
                      </div>
                      <div className="shrink-0">
                        <span className="inline-block px-3 py-1 bg-muted rounded-full text-sm font-medium">
                          {cost.typical}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-foreground">Budget Tip:</strong>
                  <span className="text-muted-foreground"> Plan for 3-5% of purchase price in closing costs (beyond your deposit). First-time buyers should research exemptions — you could save thousands on Property Transfer Tax.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* First-Time Buyer Tips */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Tips for First-Time Buyers
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Buying your first presale? Here's expert advice to get started right.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {firstTimeTips.map((tip, i) => (
                <Card key={i} className="border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator CTA */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto bg-background border rounded-2xl p-6 md:p-10 text-center">
              <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Calculate Your Monthly Payments
              </h2>
              <p className="text-muted-foreground mb-6">
                Use our mortgage calculator on any project page to estimate payments based on different down payment and interest rate scenarios.
              </p>
              <Link to="/presale-projects">
                <Button size="lg">
                  Browse Projects with Calculator
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get answers to common questions about buying presale condos.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`faq-${i}`}
                    className="bg-muted/30 rounded-lg border px-4 md:px-6"
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* City Links */}
        <RelatedContent />

        {/* Final CTA */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Start Your Presale Journey?
              </h2>
              <p className="text-muted-foreground mb-6">
                Browse our curated collection of presale projects across Metro Vancouver, or explore assignment opportunities for faster move-in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/presale-projects">
                  <Button size="lg" className="w-full sm:w-auto">
                    View Presale Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/buyers-guide">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Assignment Buyer's Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}