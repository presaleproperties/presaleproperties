import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ROIWizard } from "@/components/roi/ROIWizard";
import { useROICalculator } from "@/hooks/useROICalculator";
import { Calculator } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export default function ROICalculator() {
  const {
    inputs,
    results,
    activeScenario,
    updateInputs,
    applyScenario,
    resetInputs,
  } = useROICalculator();

  useEffect(() => {
    // Track page view
    trackEvent("roi_calc_started");
  }, []);

  const trackEvent = (event: string) => {
    // GA4
    if (window.gtag) {
      window.gtag("event", event, {
        event_category: "roi_calculator",
      });
    }
    // Meta Pixel
    if (window.fbq) {
      window.fbq("trackCustom", event);
    }
  };

  return (
    <>
      <Helmet>
        <title>Presale ROI Calculator | 5-Year Investment Proforma | PresaleProperties.com</title>
        <meta 
          name="description" 
          content="Calculate your potential ROI on presale condos and townhomes in Vancouver & Fraser Valley. 5-year proforma with cashflow projections, equity growth, and scenario analysis." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://presaleproperties.com/roi-calculator" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Calculator className="h-4 w-4" />
                Investment Analysis Tool
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                Presale ROI Calculator
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Model your 5-year investment returns on presale condos and townhomes 
                in Vancouver & Fraser Valley. Understand cashflow, equity growth, and total returns.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-6 md:py-10">
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
              />
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-xl font-semibold text-center">How This Calculator Works</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-background rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Realistic Defaults</h3>
                  <p className="text-sm text-muted-foreground">
                    We've pre-loaded typical values for Metro Vancouver presales, but you can 
                    adjust every input to match your specific property and expectations.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Scenario Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Toggle between Conservative, Base, and Aggressive scenarios to see how 
                    different market conditions affect your returns.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Complete 5-Year View</h3>
                  <p className="text-sm text-muted-foreground">
                    See year-by-year projections including cashflow, expenses, mortgage paydown, 
                    and equity growth in a detailed proforma table.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Return Breakdown</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand exactly where your returns come from: appreciation, 
                    rental cashflow, and mortgage principal paydown.
                  </p>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                <strong>Important:</strong> This calculator provides estimates only and is not 
                financial, legal, or tax advice. Market conditions, interest rates, and rental 
                demand can change significantly. Always consult with licensed professionals 
                before making investment decisions.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
