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
  Phone
} from "lucide-react";

export default function BuyersGuide() {
  const steps = [
    {
      number: "01",
      title: "Browse & Discover",
      description: "Search our marketplace for assignment listings that match your budget, preferred neighborhood, and desired unit type.",
      icon: Building2,
    },
    {
      number: "02",
      title: "Connect with Agent",
      description: "Submit an inquiry to the agent. They'll provide full details, floor plans, and answer your questions.",
      icon: Users,
    },
    {
      number: "03",
      title: "Review Documents",
      description: "Your agent will share the original purchase contract, disclosure statement, and assignment agreement for review.",
      icon: FileText,
    },
    {
      number: "04",
      title: "Get Developer Approval",
      description: "Most developers require approval for assignments. Your agent handles this process with the developer.",
      icon: Shield,
    },
    {
      number: "05",
      title: "Complete the Purchase",
      description: "Sign the assignment agreement, pay the deposit to the original buyer, and prepare for completion.",
      icon: CheckCircle,
    },
  ];

  const costs = [
    {
      name: "Assignment Price",
      description: "The total price you pay for the assignment, including any premium over the original purchase price.",
      typical: "Varies by market",
    },
    {
      name: "Assignment Fee",
      description: "Fee charged by the original buyer for assigning their contract. This is negotiable.",
      typical: "$5,000 - $50,000+",
    },
    {
      name: "Developer Assignment Fee",
      description: "Some developers charge a fee to process and approve the assignment.",
      typical: "$500 - $5,000",
    },
    {
      name: "Legal Fees",
      description: "Hire a real estate lawyer to review all documents and protect your interests.",
      typical: "$1,500 - $3,000",
    },
    {
      name: "Deposit to Original Buyer",
      description: "You reimburse the original buyer for deposits they've already paid to the developer.",
      typical: "Usually 15-20% of original price",
    },
    {
      name: "Remaining Balance at Completion",
      description: "The remaining amount owed to the developer, paid at building completion.",
      typical: "Balance of purchase price",
    },
  ];

  const faqs = [
    {
      question: "What exactly is a presale assignment?",
      answer: "A presale assignment is when the original buyer of a presale condo or townhome sells their purchase contract to a new buyer before the building is completed. You're essentially buying their right to purchase the property from the developer at the originally agreed price."
    },
    {
      question: "Why would someone sell their assignment?",
      answer: "Common reasons include: change in financial circumstances, relocation, change in family size, inability to qualify for mortgage at completion, or simply wanting to take profit if the market has appreciated since their original purchase."
    },
    {
      question: "Is buying an assignment legal in BC?",
      answer: "Yes, assignments are completely legal in British Columbia. However, they must be disclosed on the Property Transfer Tax form and are subject to specific tax rules. Always work with a knowledgeable real estate lawyer."
    },
    {
      question: "What are the risks of buying an assignment?",
      answer: "Key risks include: developer may not approve the assignment, construction delays, potential changes to final unit specifications, market value may decrease before completion, and you may need to qualify for a mortgage at higher interest rates."
    },
    {
      question: "Do I need developer approval?",
      answer: "Most developers require written approval before an assignment can proceed. Some have restrictions on when assignments are allowed (often only after a certain percentage of units are sold). Your agent will verify this upfront."
    },
    {
      question: "What deposits do I need to pay?",
      answer: "Typically you'll reimburse the original buyer for deposits they've already paid (usually 15-20% of original price) plus any assignment fee premium. The remaining balance is paid to the developer at completion, just like a regular presale purchase."
    },
    {
      question: "Can I view the actual unit before buying?",
      answer: "Usually no, since the building is still under construction. You'll rely on floor plans, renderings, and the display suite (if available). Some nearly-complete buildings may allow hard hat tours."
    },
    {
      question: "How is this different from buying resale?",
      answer: "With an assignment you're buying a contract, not a completed property. You'll get a brand new unit at completion, often with the latest finishes and appliances. However, you can't see the exact unit beforehand and must wait for construction to finish."
    },
    {
      question: "What happens to the original buyer's warranties?",
      answer: "2-5-10 home warranty coverage from BC Housing transfers to you as the new owner. You receive full warranty protection starting from the date of completion."
    },
    {
      question: "Are there tax implications?",
      answer: "Yes. Assignment profits may be taxed as income rather than capital gains. GST/HST applies if the property is new. Property Transfer Tax is calculated on the final sale price. Consult a tax professional for your specific situation."
    },
  ];

  const benefits = [
    {
      title: "Lock In Today's Pricing",
      description: "Purchase at prices negotiated months or years ago, potentially below current market value.",
      icon: DollarSign,
    },
    {
      title: "Brand New Home",
      description: "Move into a never-lived-in unit with new appliances, modern finishes, and full warranty coverage.",
      icon: Building2,
    },
    {
      title: "Shorter Wait Time",
      description: "Skip the 3-5 year presale wait. Many assignments are for buildings completing within 1-2 years.",
      icon: Clock,
    },
    {
      title: "Full Warranty Protection",
      description: "Receive the same 2-5-10 warranty coverage as original buyers from BC Housing.",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Buyer's Guide to Presale Assignments | How to Buy an Assignment in Vancouver</title>
        <meta name="description" content="Learn everything about buying presale condo assignments in Metro Vancouver. Step-by-step guide, typical costs, FAQs, and expert tips for first-time assignment buyers." />
        <meta name="keywords" content="how to buy assignment, presale assignment guide, Vancouver condo assignment, assignment buying process, presale assignment costs, BC assignment rules" />
        <link rel="canonical" href="https://presaleproperties.com/buyers-guide" />
      </Helmet>
      
      <FAQSchema faqs={faqs} />

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Buyer's Guide" }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                Buyer's Guide
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Your Complete Guide to{" "}
                <span className="text-primary">Presale Assignments</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need to know about buying a presale condo or townhome assignment in Metro Vancouver — from understanding the process to closing the deal.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/assignments">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Assignments
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

        {/* What is an Assignment */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                What is a Presale Assignment?
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed mb-4">
                  A <strong className="text-foreground">presale assignment</strong> occurs when the original purchaser of a presale property sells their purchase contract to a new buyer before the building is completed.
                </p>
                <p className="leading-relaxed mb-4">
                  When you buy an assignment, you're not buying the property itself (since it's not built yet). Instead, you're buying the <em>right and obligation</em> to complete the purchase from the developer at the originally negotiated terms.
                </p>
                <p className="leading-relaxed">
                  At completion, the property transfers directly from the developer to you, the assignee. You step into the shoes of the original buyer and receive all the same benefits — including warranty coverage, new home features, and the locked-in purchase price.
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
                Why Buy an Assignment?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Assignments offer unique advantages for homebuyers and investors alike.
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
                The Assignment Buying Process
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Here's what to expect when purchasing a presale assignment.
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 md:gap-6 items-start">
                  <div className="shrink-0 w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
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
                Know what to budget for when buying an assignment.
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
                  <strong className="text-foreground">Important:</strong>
                  <span className="text-muted-foreground"> Always budget an additional 3-5% for closing costs including legal fees, property transfer tax, and adjustments. Consult with a mortgage broker early to ensure you can qualify.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator CTA */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto bg-primary/5 rounded-2xl p-6 md:p-10 text-center">
              <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Calculate Your Monthly Payments
              </h2>
              <p className="text-muted-foreground mb-6">
                Use our mortgage calculator on any assignment page to estimate your monthly payments based on different down payment scenarios.
              </p>
              <Link to="/assignments">
                <Button size="lg">
                  Browse Assignments with Calculator
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get answers to the most common questions about buying assignments.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`faq-${i}`}
                    className="bg-background rounded-lg border px-4 md:px-6"
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

        {/* Internal Links Section - SEO with exact match anchor text */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Browse Presale Condos by City
              </h2>
              <p className="text-muted-foreground mb-6">
                Find new condo developments and presale townhomes across Metro Vancouver and the Fraser Valley with VIP access presale registration, floorplans & pricing, and presale pricing sheets.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Link to="/presale-condos/surrey" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Presale Condos Surrey</span>
                </Link>
                <Link to="/presale-condos/langley" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Presale Condos Langley</span>
                </Link>
                <Link to="/presale-condos/coquitlam" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Presale Condos Coquitlam</span>
                </Link>
                <Link to="/presale-condos/burnaby" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Presale Condos Burnaby</span>
                </Link>
                <Link to="/presale-condos/abbotsford" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Abbotsford Presale Condos</span>
                </Link>
                <Link to="/presale-condos/vancouver" className="p-3 rounded-lg border bg-card hover:border-primary transition-colors">
                  <span className="font-medium">Presale Condos Vancouver</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Find Your Assignment?
              </h2>
              <p className="text-muted-foreground mb-8">
                Browse our curated selection of presale assignments across Metro Vancouver. Each assignment is from a verified real estate agent.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/assignments">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Assignments
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

        {/* Related Content for Internal Linking */}
        <RelatedContent />
      </main>

      <Footer />
    </div>
  );
}
