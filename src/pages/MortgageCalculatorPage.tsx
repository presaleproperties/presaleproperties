import { useEffect } from "react";
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
import { Calculator, Building2, Phone, ArrowRight } from "lucide-react";

// FAQ data for schema and accordion
const faqs = [
  {
    question: "What down payment do I need in BC?",
    answer: "In BC, you need a minimum 5% down payment for homes up to $500,000. For homes between $500,000–$1.5M, it's 5% on the first $500K plus 10% on the remainder. For homes over $1.5M, you need a minimum 20% down payment. Most presale condos require a deposit structure (typically 5-20%) paid during construction, with the full down payment due at completion."
  },
  {
    question: "What's the difference between deposit vs down payment for presales?",
    answer: "A deposit is paid to the developer during the presale phase (usually 5-20% spread over milestones), while the down payment is the total amount you put toward your home at closing. Your deposit counts toward your down payment. For example, if you paid 15% in deposits and want to put 20% down at closing, you only need an additional 5%."
  },
  {
    question: "How do strata fees affect affordability?",
    answer: "Lenders include strata fees (typically $200-$500/month for condos) when calculating your debt ratios. Higher strata fees reduce how much mortgage you can qualify for. When using this calculator, factor in strata fees alongside your mortgage payment to understand true monthly housing costs for presale condos and townhomes."
  },
  {
    question: "Fixed vs variable — what changes the payment?",
    answer: "Fixed-rate mortgages lock in your interest rate for the term (usually 5 years), providing predictable payments. Variable rates fluctuate with the Bank of Canada's prime rate, meaning your payment or amortization may change. In a rising rate environment, variable rates can increase significantly; in a falling rate environment, you could save money."
  }
];

// Track events helper
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }
    if ((window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, params);
    }
  }
  console.log('Track:', eventName, params);
};

export default function MortgageCalculatorPage() {
  // Track page view and load widget
  useEffect(() => {
    trackEvent('page_view_mortgage_calculator', {
      page_title: 'Mortgage Payment Calculator BC',
      page_location: window.location.href
    });

    // Load Ratehub widget script
    const script = document.createElement('script');
    script.src = 'https://www.ratehub.ca/assets/js/widget-loader.js';
    script.async = true;
    script.onload = () => {
      trackEvent('widget_loaded', { widget_type: 'ratehub_mortgage_calculator' });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://www.ratehub.ca/assets/js/widget-loader.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleBrowseBudget = () => {
    trackEvent('click_browse_budget', {
      source: 'mortgage_calculator_page'
    });
  };

  const handleAffordabilityCall = () => {
    trackEvent('click_affordability_call', {
      source: 'mortgage_calculator_page'
    });
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Mortgage Calculator", href: "/mortgage-calculator" }
  ];

  return (
    <>
      <Helmet>
        <title>Mortgage Payment Calculator BC | Presale Properties</title>
        <meta 
          name="description" 
          content="Calculate your monthly mortgage payments for presale condos and townhomes in British Columbia. Estimate down payment, CMHC insurance, and total costs." 
        />
        <meta name="keywords" content="mortgage calculator, BC mortgage, presale condo payment, down payment calculator, CMHC insurance" />
        <link rel="canonical" href="https://presaleproperties.com/mortgage-calculator" />
      </Helmet>
      <FAQSchema faqs={faqs} />
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <Calculator className="h-5 w-5" />
              <span className="font-semibold text-sm">Mortgage Calculator</span>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
            {/* Breadcrumbs */}
            <div className="mb-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>

            {/* Page Header */}
            <header className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Mortgage Payment Calculator (BC)
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Estimate monthly payments for presale condos & townhomes in BC.
              </p>
            </header>

            {/* Ratehub Widget Container */}
            <section className="mb-10">
              <Card className="overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div 
                    className="widget" 
                    data-widget="calc-payment" 
                    data-province="BC" 
                    data-lang="en"
                  />
                  {/* Attribution - required by Ratehub */}
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Calculator powered by{" "}
                    <a 
                      href="https://www.ratehub.ca" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      Ratehub.ca
                    </a>
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Conversion CTAs */}
            <section className="mb-10">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2 text-center">
                    Want help aligning this payment to real presale options?
                  </h2>
                  <p className="text-muted-foreground text-sm text-center mb-6">
                    Our team can match your budget to available presale condos and townhomes.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full sm:w-auto min-h-[48px]"
                      onClick={handleBrowseBudget}
                    >
                      <Link to="/projects">
                        <Building2 className="h-4 w-4 mr-2" />
                        Browse presales in your budget
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto min-h-[48px]"
                      onClick={handleAffordabilityCall}
                    >
                      <a href="https://wa.me/16045551234?text=I'd%20like%20to%20book%20a%2010-min%20affordability%20call" target="_blank" rel="noopener noreferrer">
                        <Phone className="h-4 w-4 mr-2" />
                        Book a 10-min affordability call
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* FAQ Section */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6 text-center">
                Frequently Asked Questions
              </h2>
              
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="bg-card border border-border rounded-lg px-4 data-[state=open]:bg-accent/30"
                  >
                    <AccordionTrigger className="text-left text-sm md:text-base font-medium py-4 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Related Links */}
            <section className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Looking for more resources?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/buyers-guide">Buyer's Guide</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/presale-guide">Presale Guide</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/projects">All Projects</Link>
                </Button>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
