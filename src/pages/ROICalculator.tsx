import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ROIWizard } from "@/components/roi/ROIWizard";
import { CompareAnalyses } from "@/components/roi/CompareAnalyses";
import { useROICalculator } from "@/hooks/useROICalculator";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";
import { 
  Calculator, 
  TrendingUp, 
  PiggyBank, 
  BarChart3, 
  Shield,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const ROI_FAQS = [
  {
    question: "How accurate is this presale ROI calculator?",
    answer: "Our calculator uses industry-standard formulas for mortgage amortization, property transfer tax, and GST calculations specific to BC. While results are estimates based on your inputs, the underlying math reflects real-world scenarios for Vancouver and Fraser Valley presale investments."
  },
  {
    question: "What is a good ROI on a presale condo in Vancouver?",
    answer: "A good 5-year total return on a Vancouver presale typically ranges from 30-60%, combining appreciation, rental income, and mortgage principal paydown. However, returns vary significantly based on location, market conditions, and your financing structure."
  },
  {
    question: "Should I buy a presale as an investment property?",
    answer: "Presales can be attractive investments due to lower initial capital requirements (deposits only during construction) and potential appreciation before completion. However, they carry risks including construction delays, market changes, and financing challenges at completion."
  },
  {
    question: "How much deposit do I need for a presale in BC?",
    answer: "Most BC presales require 10-20% deposits, typically structured as 5% at signing and another 5-15% over 6-12 months. The full down payment is required at completion, which could be 2-4 years from purchase."
  },
  {
    question: "What closing costs should I expect on a presale?",
    answer: "Presale closing costs in BC include 5% GST on new construction (with potential rebates), Property Transfer Tax (1-3% depending on price), legal fees ($1,500-2,500), and mortgage arrangement fees. Budget approximately 7-10% of purchase price for all closing costs."
  },
];

export default function ROICalculator() {
  const {
    inputs,
    results,
    activeScenario,
    updateInputs,
    applyScenario,
    resetInputs,
  } = useROICalculator();

  const {
    savedAnalyses,
    saveAnalysis,
    deleteAnalysis,
    canSave,
    canCompare,
    compareMode,
    setCompareMode,
    maxSaved,
  } = useSavedAnalyses();

  useEffect(() => {
    trackEvent("roi_calc_started");
  }, []);

  const trackEvent = (event: string) => {
    if (window.gtag) {
      window.gtag("event", event, {
        event_category: "roi_calculator",
      });
    }
    if (window.fbq) {
      window.fbq("trackCustom", event);
    }
  };

  // Schema.org structured data for the calculator
  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Presale ROI Calculator",
    "description": "Free investment calculator for presale condos and townhomes in Vancouver and Fraser Valley. Calculate 5-year returns, cashflow projections, and compare scenarios.",
    "url": "https://presaleproperties.com/roi-calculator",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PresaleProperties.com"
    },
    "featureList": [
      "5-year investment proforma",
      "Mortgage amortization schedule",
      "Cashflow projections",
      "Scenario analysis (Conservative, Base, Aggressive)",
      "BC Property Transfer Tax calculator",
      "GST calculator for new construction"
    ]
  };

  if (compareMode && savedAnalyses.length >= 2) {
    return (
      <>
        <Helmet>
          <title>Compare Properties | ROI Calculator | PresaleProperties.com</title>
          <meta name="description" content="Compare ROI analyses for multiple presale properties side by side." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <Header />
        <main className="min-h-screen bg-background py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <CompareAnalyses
                analyses={savedAnalyses}
                onBack={() => setCompareMode(false)}
                onDelete={deleteAnalysis}
              />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Presale ROI Calculator Vancouver | Free 5-Year Investment Proforma</title>
        <meta 
          name="description" 
          content="Free presale ROI calculator for Vancouver & Fraser Valley. Calculate 5-year returns, cashflow projections, mortgage amortization, and compare investment scenarios on condos and townhomes." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://presaleproperties.com/roi-calculator" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Presale ROI Calculator | Free 5-Year Investment Analysis" />
        <meta property="og:description" content="Calculate your potential returns on presale condos and townhomes in Metro Vancouver. Free investment proforma with cashflow projections." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/roi-calculator" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Presale ROI Calculator | Free Investment Analysis" />
        <meta name="twitter:description" content="Calculate 5-year returns on Vancouver presales. Free cashflow and equity projections." />
        
        {/* Additional SEO */}
        <meta name="keywords" content="presale ROI calculator, vancouver condo investment, presale investment calculator, BC real estate ROI, condo cashflow calculator, presale proforma" />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(calculatorSchema)}
        </script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section - Premium Design */}
        <section className="relative overflow-hidden bg-foreground text-white py-16 md:py-20">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-foreground to-black" />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Glowing orbs */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          
          <div className="container px-4 relative z-10">
            {/* Breadcrumbs */}
            <div className="max-w-3xl mx-auto mb-8">
              <Breadcrumbs 
                items={[
                  { label: "Home", href: "/" },
                  { label: "ROI Calculator" }
                ]} 
                className="text-white/50"
              />
            </div>

            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-medium mb-6 border border-white/10 shadow-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Free Investment Analysis Tool
              </div>
              
              {/* Main heading with gradient */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Presale
                </span>{" "}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  ROI
                </span>{" "}
                <span className="bg-gradient-to-r from-white/80 via-white to-white bg-clip-text text-transparent">
                  Calculator
                </span>
              </h1>
              
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Model your 5-year investment returns on presale condos and townhomes 
                in <span className="text-white/80 font-medium">Vancouver</span> & <span className="text-white/80 font-medium">Fraser Valley</span>
              </p>

              {/* Trust indicators - pill style */}
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/70">100% Free</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/70">No Sign-up</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/70">BC-Specific</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Features Strip */}
        <section className="border-b bg-muted/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center gap-1.5 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">5-Year Proforma</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Amortization Schedule</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Cashflow Projections</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Scenario Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <ROIWizard
                inputs={inputs}
                results={results}
                activeScenario={activeScenario}
                updateInputs={updateInputs}
                applyScenario={applyScenario}
                resetInputs={resetInputs}
                onTrackEvent={trackEvent}
                savedAnalyses={savedAnalyses}
                canSave={canSave}
                canCompare={canCompare}
                maxSaved={maxSaved}
                onSaveAnalysis={saveAnalysis}
                onDeleteAnalysis={deleteAnalysis}
                onCompare={() => setCompareMode(true)}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section - Enhanced */}
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  How This Calculator Works
                </h2>
                <p className="text-muted-foreground">
                  Built specifically for Metro Vancouver presale investments
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Realistic BC Defaults</h3>
                  <p className="text-sm text-muted-foreground">
                    Pre-loaded with typical Metro Vancouver values including PTT rates, 
                    GST on new construction, and current mortgage rates.
                  </p>
                </div>
                
                <div className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Scenario Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Toggle between Conservative, Base, and Aggressive scenarios to stress-test 
                    your investment under different market conditions.
                  </p>
                </div>
                
                <div className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Complete 5-Year View</h3>
                  <p className="text-sm text-muted-foreground">
                    Year-by-year projections including cashflow, expenses, mortgage paydown, 
                    equity growth, and full amortization schedule.
                  </p>
                </div>
                
                <div className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <PiggyBank className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Return Breakdown</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand exactly where your returns come from: property appreciation, 
                    rental income, and mortgage principal paydown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section for SEO */}
        <section className="py-10 md:py-14">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Common questions about presale investments in BC
                </p>
              </div>

              <div className="space-y-4">
                {ROI_FAQS.map((faq, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-5 border">
                    <h3 className="font-semibold mb-2 flex items-start gap-2">
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground pl-7">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* FAQ Schema */}
              <FAQSchema faqs={ROI_FAQS} />
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-6 border-t bg-muted/20">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> This calculator provides estimates only and is not 
              financial, legal, or tax advice. Market conditions, interest rates, and rental 
              demand can change significantly. Always consult with licensed professionals 
              before making investment decisions.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
