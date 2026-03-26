import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { RelatedContent } from "@/components/home/RelatedContent";
import { InteractiveMortgageCalculator } from "@/components/calculators/InteractiveMortgageCalculator";
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
  Phone,
  Search,
  Scale,
  Home,
  Landmark,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Research the Market",
    description:
      "Start by exploring different neighborhoods, price points, and upcoming developments. Consider your lifestyle needs (proximity to transit, schools, amenities), budget constraints, and investment goals.",
    icon: Search,
    tips: [
      "Compare prices across different neighborhoods",
      "Look for areas with planned transit or amenity upgrades",
      "Consider both current and future rental demand",
    ],
  },
  {
    number: "02",
    title: "Evaluate the Developer",
    description:
      "A developer's reputation is crucial. Research their track record — have previous projects been delivered on time? Are residents satisfied? Check for any legal disputes or financial troubles.",
    icon: Building2,
    tips: [
      "Visit completed projects by the same developer",
      "Read reviews from current homeowners",
      "Check if the developer has faced construction delays",
    ],
  },
  {
    number: "03",
    title: "Review the Disclosure Statement",
    description:
      "BC law requires developers to provide a detailed disclosure statement before you sign. This includes completion dates, strata bylaws, deposit structure, parking allocations, and more.",
    icon: FileText,
    tips: [
      "Pay attention to the estimated completion date range",
      "Review strata rules for pets, rentals, and renovations",
      "Check what's included (parking, storage, upgrades)",
    ],
  },
  {
    number: "04",
    title: "Secure Your Financing",
    description:
      "Get pre-approved for a mortgage, but understand that presale financing is different. Deposits are typically 5–15% paid in installments. Since completion may be 1–5 years away, plan for rate changes.",
    icon: Landmark,
    tips: [
      "Work with a mortgage broker experienced in presales",
      "Plan for deposits: typically 5% at signing, then staged over 12–18 months",
      "Consider rate lock options for longer construction timelines",
    ],
  },
  {
    number: "05",
    title: "Understand BC Regulations",
    description:
      "Know your rights under BC law. You have a 7-day rescission (cooling-off) period after signing to cancel without penalty. REDMA protects buyers by requiring full disclosure from developers.",
    icon: Scale,
    tips: [
      "Use the 7-day rescission period to review with a lawyer",
      "Deposits must be held in trust until completion",
      "Developers must disclose any material changes",
    ],
  },
  {
    number: "06",
    title: "Work with Professionals",
    description:
      "Assemble your team: a real estate agent specializing in presales can negotiate better terms and get you early access. A lawyer protects your interests. A mortgage broker finds the best financing.",
    icon: Users,
    tips: [
      "Choose an agent with developer relationships for priority access",
      "Have your lawyer review the contract before rescission ends",
      "Get referrals from friends who've bought presales",
    ],
  },
  {
    number: "07",
    title: "Sign the Contract",
    description:
      "Once confident, sign the purchase agreement and submit your initial deposit. The contract outlines purchase price, deposit schedule, completion timeline, included features, and your rights.",
    icon: CheckCircle,
    tips: [
      "Ensure all verbal promises are in writing",
      "Understand the assignment clause if you may need to sell",
      "Keep copies of all documents and correspondence",
    ],
  },
  {
    number: "08",
    title: "Wait & Prepare for Completion",
    description:
      "During construction (1–5 years), stay informed about project updates. As completion approaches, finalize your mortgage, arrange home insurance, and prepare for your deficiency walkthrough.",
    icon: Clock,
    tips: [
      "Attend homeowner previews or walkthroughs offered",
      "Start your mortgage application 90–120 days before completion",
      "Budget for closing costs and immediate move-in expenses",
    ],
  },
];

const costs = [
  {
    name: "Deposit (Staged Payments)",
    description:
      "Typically 5–15% of the purchase price, paid in installments over 12–18 months (up to 20% in a hot market). Held in a lawyer's trust account — fully protected until completion.",
    typical: "5–15% of price",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    name: "Property Transfer Tax",
    description:
      "1% on first $200K, 2% on $200K–$2M, 3% over $2M. First-time buyers may qualify for full exemption on new construction up to $1.1M (2026 BC rules).",
    typical: "Varies",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    name: "GST (New Home)",
    description:
      "GST applies to all new homes. Full rebate (up to $50K) for primary residences priced at or under $1M. Partial rebate up to $1.5M. No rebate for investors.",
    typical: "5% of price",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    name: "Legal Fees",
    description:
      "Your lawyer reviews the contract, handles title transfer, and ensures all documents are properly executed.",
    typical: "$1,500 – $2,500",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    name: "Strata Fees",
    description:
      "Monthly fees begin at move-in, covering building maintenance, insurance, and amenities.",
    typical: "$200 – $600/mo",
    color: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    name: "Home Insurance",
    description:
      "Required before completion. Covers your unit contents and any improvements you make.",
    typical: "$300 – $800/yr",
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
  },
];

const faqs = [
  {
    question: "What is a presale condo?",
    answer:
      "A presale condo is a unit you purchase before construction is complete — often before it even begins. You're buying based on floor plans, renderings, and the developer's vision. At completion (typically 1–5 years later), the property transfers to you as a brand-new home.",
  },
  {
    question: "Why buy presale instead of resale?",
    answer:
      "Presales offer brand-new units with modern layouts, the latest finishes, and full warranty coverage. You can often choose your preferred floor and view, and may benefit from price appreciation during construction. However, you can't see the exact finished product and must wait for completion.",
  },
  {
    question: "How much deposit do I need for a presale?",
    answer:
      "Typically 15–20% of the purchase price, paid in stages during construction. A common structure is 5% at signing, 5% in 90–180 days, and 5–10% at later milestones. These deposits are held in a lawyer's trust account until completion.",
  },
  {
    question: "What is the 7-day rescission period?",
    answer:
      "BC law gives you 7 days after signing to cancel a presale purchase for any reason, with only a small rescission fee (typically $500). Use this time to have a lawyer review all documents and ensure you're comfortable with the purchase.",
  },
  {
    question: "What is a disclosure statement?",
    answer:
      "A legal document developers must provide before you sign. It includes project details, completion timeline, strata bylaws, deposit structure, parking/storage allocations, and developer information. It's your most important research document.",
  },
  {
    question: "Can the completion date change?",
    answer:
      "Yes. Construction delays are common due to weather, permits, supply chain issues, or other factors. Developers typically provide a completion date range rather than a specific date. Your contract will outline the process for any delays.",
  },
  {
    question: "What is an assignment sale?",
    answer:
      "Selling your presale contract to another buyer before completion. If your circumstances change, you may be able to 'assign' your purchase rights. However, there may be developer fees, tax implications, and restrictions. Check your contract for assignment clauses.",
  },
  {
    question: "Do I get a warranty on a presale?",
    answer:
      "Yes! New homes in BC come with 2-5-10 warranty coverage from BC Housing: 2 years on materials and labour, 5 years on building envelope, and 10 years on structure. This provides significant protection for your investment.",
  },
  {
    question: "What if the developer goes bankrupt?",
    answer:
      "Your deposits are held in a lawyer's trust account, not by the developer, which provides protection. Additionally, warranty coverage from BC Housing provides some recourse. Working with reputable, established developers reduces this risk.",
  },
  {
    question: "Are there first-time buyer benefits?",
    answer:
      "Yes! BC offers Property Transfer Tax exemption for first-time buyers on homes up to $835,000 (partial exemption up to $860,000). First-time buyers can also use RRSP savings tax-free through the Home Buyers' Plan (up to $35,000).",
  },
];

const benefits = [
  {
    title: "Brand New Everything",
    description:
      "Move into a never-lived-in home with new appliances, modern finishes, and the latest building codes.",
    icon: Sparkles,
  },
  {
    title: "Full Warranty Protection",
    description:
      "BC's 2-5-10 warranty covers materials, building envelope, and structure.",
    icon: Shield,
  },
  {
    title: "Price Appreciation",
    description:
      "Lock in today's prices and potentially benefit from market growth during construction.",
    icon: TrendingUp,
  },
  {
    title: "Customization Options",
    description:
      "Choose your preferred floor plan, view, and finishes before construction is complete.",
    icon: Home,
  },
];

const firstTimeTips = [
  {
    title: "Start with What You Can Afford",
    description:
      "A smaller unit in a great location beats an overextended purchase. Build equity and trade up.",
  },
  {
    title: "Prioritize Location",
    description:
      "Planned transit, schools, and amenities drive both lifestyle quality and resale value.",
  },
  {
    title: "Maximize Developer Incentives",
    description:
      "Developers often offer reduced deposits, free upgrades, or capped assignment fees. Always ask.",
  },
  {
    title: "Use Government Programs",
    description:
      "First-time buyer PTT exemptions, RRSP Home Buyers' Plan, and other programs can save you thousands.",
  },
];

export default function PresaleGuide() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Complete Guide to Buying New Construction Vancouver 2026</title>
        <meta
          name="description"
          content="Everything you need to know about buying presale & new construction in Vancouver. Deposits, warranties, rebates, process, investment tips. Free guide."
        />
        <link rel="canonical" href="https://presaleproperties.com/presale-guide" />
      </Helmet>

      <FAQSchema faqs={faqs} />
      <ConversionHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Presale Guide" }]} />
          </div>
        </div>

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b bg-card">
          {/* Background texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-primary/3 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative container px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
                  <BookOpenIcon />
                  Free Guide
                </span>
                <span className="text-muted-foreground/60 text-sm">Updated 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] mb-5 tracking-tight">
                The Complete Presale
                <br />
                <span className="text-primary">Buyer's Guide</span>
              </h1>
              <p className="text-xl font-medium text-primary mb-3">
                Your definitive roadmap to buying a presale condo in Metro Vancouver — from first research to collecting your keys.
              </p>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Presales can be one of the smartest real estate moves in BC — or a costly mistake if you don't know the process. This guide covers every step, every cost, and every regulation you need to know.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/presale-projects">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Browse Presale Projects
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    <Phone className="h-4 w-4" />
                    Talk to an Expert
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
              {[
                { label: "Avg. Deposit", value: "15–20%" },
                { label: "BC Warranty", value: "2-5-10" },
                { label: "Cooling-Off Period", value: "7 Days" },
                { label: "GST on New Homes", value: "5%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border/70 rounded-xl px-4 py-3 shadow-sm"
                >
                  <p className="text-xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What is a Presale ──────────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>The Basics</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                What is a Presale Condo?
              </h2>
              <p className="text-lg font-medium text-primary mb-4 leading-relaxed">
                A presale condo (also called "pre-construction" or "off-plan") is a home you purchase before it's built — based entirely on architectural plans, renderings, and a developer's specifications.
              </p>
              <div className="space-y-3 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  When you buy presale, you sign a contract agreeing to purchase a specific unit at a fixed price. You pay deposits during construction, and the final balance (plus closing costs) when the building is complete — typically 1–5 years later.
                </p>
                <p>
                  At completion, you receive a brand-new home with full warranty coverage, modern features, and potentially built-in equity if the market has appreciated during construction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ──────────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30 border-y">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="mb-10">
                <SectionLabel>Why Presale?</SectionLabel>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  The Advantages of Buying Before Construction
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {benefits.map((b, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl border border-border/70 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-[15px]">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Step by Step Process ──────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>The Process</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Step-by-Step: How to Buy a Presale
              </h2>
              <p className="text-muted-foreground mb-10">
                Follow these 8 steps to confidently purchase your presale home.
              </p>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-6 bottom-6 w-px bg-border hidden sm:block" />

                <div className="space-y-10">
                  {steps.map((step, i) => (
                    <div key={i} className="relative flex gap-5 sm:gap-7">
                      {/* Step bubble */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm z-10 relative">
                          {step.number}
                        </div>
                      </div>

                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <step.icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-[17px] font-semibold text-foreground">{step.title}</h3>
                        </div>
                        <p className="text-[14.5px] text-muted-foreground leading-relaxed mb-3">
                          {step.description}
                        </p>
                        {step.tips && (
                          <div className="bg-muted/50 border border-border/60 rounded-xl p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                              Pro Tips
                            </p>
                            <ul className="space-y-1.5">
                              {step.tips.map((tip, j) => (
                                <li key={j} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Costs ─────────────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30 border-y">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>Budgeting</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Understanding the Full Cost
              </h2>
              <p className="text-muted-foreground mb-8">
                Budget for these costs when purchasing a presale condo in BC.
              </p>

              <div className="space-y-3">
                {costs.map((cost, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 shadow-sm"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-[15px]">{cost.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {cost.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-block px-3 py-1.5 rounded-lg border text-xs font-semibold ${cost.color}`}>
                        {cost.typical}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/80 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Budget Tip:</strong> Always plan for an additional 3–5% of purchase price in closing costs beyond your deposit. First-time buyers should research exemptions — you could save thousands on Property Transfer Tax.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── First-Time Buyer Tips ─────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>First-Time Buyers</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Advice for First-Time Presale Buyers
              </h2>
              <p className="text-muted-foreground mb-8">
                Buying your first presale? Here's expert advice to start right.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {firstTimeTips.map((tip, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm flex items-start gap-4"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1.5 text-[15px]">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Mortgage Calculator ───────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30 border-y">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>Calculator</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Estimate Your Monthly Payments
              </h2>
              <p className="text-muted-foreground mb-8">
                Use our mortgage calculator to plan your budget before you buy.
              </p>
            </div>
            <InteractiveMortgageCalculator defaultPrice={750000} />
          </div>
        </section>

        {/* ── FAQs ──────────────────────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mb-8">
                Answers to the most common questions about buying presale condos in BC.
              </p>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-card border border-border/60 rounded-xl px-5 shadow-sm data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline text-[15px]">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[14px] text-muted-foreground pb-4 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── City Links ────────────────────────────────────── */}
        <section className="py-14 md:py-18 bg-muted/30 border-t">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>Browse by City</SectionLabel>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Find Presale Condos in Your City
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                VIP access, floor plans & pricing across Metro Vancouver and the Fraser Valley.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  { label: "Presale Condos Surrey", href: "/presale-condos/surrey" },
                  { label: "Presale Condos Langley", href: "/presale-condos/langley" },
                  { label: "Presale Condos Coquitlam", href: "/presale-condos/coquitlam" },
                  { label: "Presale Condos Burnaby", href: "/presale-condos/burnaby" },
                  { label: "Presale Condos Abbotsford", href: "/presale-condos/abbotsford" },
                  { label: "Presale Condos Vancouver", href: "/presale-condos/vancouver" },
                ].map((city) => (
                  <Link
                    key={city.href}
                    to={city.href}
                    className="group flex items-center justify-between px-4 py-3 bg-card border border-border/60 rounded-xl hover:border-primary/50 hover:shadow-sm transition-all text-sm font-medium text-foreground"
                  >
                    {city.label}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <RelatedContent />

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section className="py-16 md:py-20 border-t">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Ready to Start Your Presale Journey?
              </h2>
              <p className="text-muted-foreground mb-7 text-[15px]">
                Browse our curated collection of presale projects across Metro Vancouver, or explore assignment opportunities for a faster move-in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/presale-projects">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    View Presale Projects
                    <ArrowRight className="h-4 w-4" />
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

// ── Small shared components ────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
      {children}
    </p>
  );
}

function BookOpenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
