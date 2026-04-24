import { Helmet } from "@/components/seo/Helmet";
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
  ChevronRight,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    title: "Browse & Discover",
    description:
      "Search our marketplace for assignment listings that match your budget, preferred neighbourhood, and desired unit type. Filter by city, beds, and price range.",
    icon: Building2,
  },
  {
    number: "02",
    title: "Connect with an Agent",
    description:
      "Submit an inquiry to the listing agent. They'll provide full details, floor plans, deposit history, and answer all your questions before you proceed.",
    icon: Users,
  },
  {
    number: "03",
    title: "Review All Documents",
    description:
      "Your agent will share the original purchase contract, developer disclosure statement, and assignment agreement. Have a lawyer review before signing anything.",
    icon: FileText,
  },
  {
    number: "04",
    title: "Get Developer Approval",
    description:
      "Most developers require written approval before an assignment can proceed. Your agent handles this process — confirm upfront whether the developer permits assignments.",
    icon: Shield,
  },
  {
    number: "05",
    title: "Complete the Purchase",
    description:
      "Sign the assignment agreement, reimburse the original buyer's deposits, and prepare for completion when the developer transfers title directly to you.",
    icon: CheckCircle,
  },
];

const costs = [
  {
    name: "Assignment Price",
    description:
      "The total price you pay for the assignment, including any premium over the original purchase price.",
    typical: "Market rate",
    color: "bg-info-soft text-info-strong border-info/30",
  },
  {
    name: "Assignment Fee (to Seller)",
    description:
      "Fee charged by the original buyer for assigning their contract. This is negotiable between parties.",
    typical: "$5,000 – $50,000+",
    color: "bg-primary/10 text-primary-deep border-primary/30",
  },
  {
    name: "Developer Assignment Fee",
    description:
      "Some developers charge a processing and approval fee. Confirm this before making an offer.",
    typical: "$500 – $5,000",
    color: "bg-warning-soft text-warning-strong border-warning/30",
  },
  {
    name: "Legal Fees",
    description:
      "Your real estate lawyer reviews all documents and protects your interests throughout the process.",
    typical: "$1,500 – $3,000",
    color: "bg-success-soft text-success-strong border-success/30",
  },
  {
    name: "Deposit Reimbursement",
    description:
      "You reimburse the original buyer for deposits they've already paid to the developer — typically held in trust.",
    typical: "15–20% of original price",
    color: "bg-danger-soft text-danger-strong border-danger/30",
  },
  {
    name: "Remaining Balance at Completion",
    description:
      "The remaining amount owed to the developer, financed by your mortgage and paid at building completion.",
    typical: "Balance of purchase price",
    color: "bg-info-soft text-info-strong border-info/30",
  },
];

const faqs = [
  {
    question: "What exactly is a presale assignment?",
    answer:
      "A presale assignment is when the original buyer of a presale condo sells their purchase contract to a new buyer before the building is completed. You're essentially buying their right to purchase the property from the developer at the originally agreed price.",
  },
  {
    question: "Why would someone sell their assignment?",
    answer:
      "Common reasons include: change in financial circumstances, relocation, change in family size, inability to qualify for a mortgage at completion, or simply wanting to take profit if the market has appreciated since their original purchase.",
  },
  {
    question: "Is buying an assignment legal in BC?",
    answer:
      "Yes, assignments are completely legal in British Columbia. However, they must be disclosed on the Property Transfer Tax form and are subject to specific tax rules. Always work with a knowledgeable real estate lawyer.",
  },
  {
    question: "What are the risks of buying an assignment?",
    answer:
      "Key risks include: developer may not approve the assignment, construction delays, potential changes to final unit specifications, market value may decrease before completion, and you may need to qualify for a mortgage at higher interest rates.",
  },
  {
    question: "Do I need developer approval?",
    answer:
      "Most developers require written approval before an assignment can proceed. Some have restrictions on when assignments are allowed (often only after a certain percentage of units are sold). Your agent will verify this upfront.",
  },
  {
    question: "What deposits do I need to pay?",
    answer:
      "Typically you'll reimburse the original buyer for deposits they've already paid (usually 15–20% of original price) plus any assignment fee premium. The remaining balance is paid to the developer at completion, just like a regular presale purchase.",
  },
  {
    question: "Can I view the actual unit before buying?",
    answer:
      "Usually no, since the building is still under construction. You'll rely on floor plans, renderings, and the display suite (if available). Some nearly-complete buildings may allow hard hat tours.",
  },
  {
    question: "How is this different from buying resale?",
    answer:
      "With an assignment you're buying a contract, not a completed property. You'll get a brand new unit at completion with the latest finishes. However, you can't see the exact unit beforehand and must wait for construction to finish.",
  },
  {
    question: "What happens to the original buyer's warranties?",
    answer:
      "2-5-10 home warranty coverage from BC Housing transfers to you as the new owner. You receive full warranty protection starting from the date of completion.",
  },
  {
    question: "Are there tax implications?",
    answer:
      "Yes. Assignment profits may be taxed as income rather than capital gains. GST/HST applies if the property is new. Property Transfer Tax is calculated on the final sale price. Consult a tax professional for your specific situation.",
  },
];

const benefits = [
  {
    title: "Lock In Past Pricing",
    description:
      "Purchase at prices negotiated months or years ago, potentially well below current market value.",
    icon: DollarSign,
  },
  {
    title: "Brand New Home",
    description:
      "Move into a never-lived-in unit with new appliances, modern finishes, and full warranty coverage.",
    icon: Building2,
  },
  {
    title: "Shorter Wait Time",
    description:
      "Skip the 3–5 year presale wait. Many assignments are for buildings completing within 1–2 years.",
    icon: Clock,
  },
  {
    title: "Full Warranty Protection",
    description:
      "Receive the same 2-5-10 warranty coverage as original buyers from BC Housing.",
    icon: Shield,
  },
];

// ── Page ──────────────────────────────────────────────────────────

export default function BuyersGuide() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Buyer's Guide to Presale Assignments | How to Buy an Assignment in Vancouver</title>
        <meta
          name="description"
          content="Learn everything about buying presale condo assignments in Metro Vancouver. Step-by-step guide, typical costs, FAQs, and expert tips for first-time assignment buyers."
        />
        <link rel="canonical" href="https://presaleproperties.com/buyers-guide" />
      </Helmet>

      <FAQSchema faqs={faqs} />
      <ConversionHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Buyer's Guide" }]} />
          </div>
        </div>

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b bg-card">
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
                  <AssignmentIcon />
                  Assignments Guide
                </span>
                <span className="text-muted-foreground/60 text-sm">Updated 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] mb-5 tracking-tight">
                The Complete Guide to
                <br />
                <span className="text-primary">Buying an Assignment</span>
              </h1>
              <p className="text-xl font-medium text-primary mb-3">
                Buy a brand-new home at yesterday's prices — without the full presale waiting period.
              </p>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Assignment sales are one of Metro Vancouver's best-kept real estate strategies. This guide explains exactly how they work, what they cost, and how to buy one safely.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/assignments">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Browse Assignments
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
                { label: "Typical Deposit Reimbursed", value: "15–20%" },
                { label: "BC Warranty (transferred)", value: "2-5-10" },
                { label: "Developer Approval", value: "Required" },
                { label: "Legal Review", value: "Essential" },
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

        {/* ── What is an Assignment ─────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>The Basics</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                What is a Presale Assignment?
              </h2>
              <p className="text-lg font-medium text-primary mb-4 leading-relaxed">
                A presale assignment occurs when the original purchaser of a presale property sells their purchase contract to a new buyer before the building is completed.
              </p>
              <div className="space-y-3 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  When you buy an assignment, you're not buying the property itself — since it's not built yet. Instead, you're buying the <em>right and obligation</em> to complete the purchase from the developer at the originally negotiated terms.
                </p>
                <p>
                  At completion, the property transfers directly from the developer to you, the assignee. You step into the original buyer's shoes and receive all the same benefits — including warranty coverage, new home features, and the locked-in purchase price.
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
                <SectionLabel>Why Assignments?</SectionLabel>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  The Advantages of Buying an Assignment
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
                How to Buy an Assignment: 5 Steps
              </h2>
              <p className="text-muted-foreground mb-10">
                Here's exactly what to expect when purchasing a presale assignment.
              </p>

              <div className="relative">
                <div className="absolute left-5 top-6 bottom-6 w-px bg-border hidden sm:block" />
                <div className="space-y-10">
                  {steps.map((step, i) => (
                    <div key={i} className="relative flex gap-5 sm:gap-7">
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
                        <p className="text-[14.5px] text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
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
                Understanding All the Costs
              </h2>
              <p className="text-muted-foreground mb-8">
                Know exactly what to budget for when buying an assignment in BC.
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

              <div className="mt-6 flex items-start gap-3 p-4 bg-warning-soft border border-warning/30/80 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-warning-strong">
                  <strong>Important:</strong> Always budget an additional 3–5% for closing costs including legal fees, property transfer tax, and adjustments. Consult with a mortgage broker early to ensure you can qualify at completion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mortgage Calculator ───────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>Calculator</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Calculate Your Monthly Payments
              </h2>
              <p className="text-muted-foreground mb-8">
                Estimate monthly payments based on different down payment and interest rate scenarios.
              </p>
            </div>
            <InteractiveMortgageCalculator defaultPrice={650000} />
          </div>
        </section>

        {/* ── FAQs ──────────────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30 border-y">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mb-8">
                Get answers to the most common questions about buying assignments.
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
        <section className="py-14 border-t">
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
                Ready to Find Your Assignment?
              </h2>
              <p className="text-muted-foreground mb-7 text-[15px]">
                Browse our curated selection of verified presale assignments across Metro Vancouver.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/assignments">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Browse Assignments
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/presale-projects">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Presale Projects
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

// ── Shared micro-components ───────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
      {children}
    </p>
  );
}

function AssignmentIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
