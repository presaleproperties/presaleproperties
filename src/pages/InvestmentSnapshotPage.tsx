import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { ConversionHeader } from '@/components/conversion/ConversionHeader';
import { Footer } from '@/components/layout/Footer';
import { InvestmentSnapshot } from '@/components/calculators/InvestmentSnapshot';
import { CalculatorLeadCapture } from '@/components/conversion/CalculatorLeadCapture';
import { Calculator, TrendingUp, BarChart3, PiggyBank, Shield, ChevronRight } from 'lucide-react';

const CANONICAL_URL = "https://presaleproperties.com/calculator";

const FEATURES = [
  { icon: TrendingUp,  label: "5-Year Proforma",        desc: "Year-by-year appreciation & equity" },
  { icon: BarChart3,   label: "Amortization",            desc: "Mortgage paydown timeline" },
  { icon: PiggyBank,   label: "Cash Flow",               desc: "Monthly net income projected" },
  { icon: Shield,      label: "BC-Specific Math",        desc: "PTT, GST, CMHC included" },
];

export default function InvestmentSnapshotPage() {
  const [searchParams] = useSearchParams();
  const hasParams = searchParams.toString().length > 0;

  return (
    <>
      <Helmet>
        <title>Investment Cash Flow Calculator | Presale Properties Group</title>
        <meta
          name="description"
          content="Instantly calculate your condo investment cash flow. Simple one-page tool to project monthly income, expenses, and returns for BC real estate."
        />
        <link rel="canonical" href={CANONICAL_URL} />
        {hasParams && <meta name="robots" content="noindex, follow" />}
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-foreground py-14 md:py-20">
          {/* Gold glow */}
          <div className="absolute -top-40 right-0 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Top gold line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="container relative px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/12 border border-primary/25 text-primary text-[11px] font-bold tracking-[0.18em] uppercase mb-6">
                <Calculator className="h-3 w-3" />
                Free Investment Tool
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-[56px] font-extrabold text-background leading-[1.0] tracking-tight mb-5">
                Presale Investment
                <span className="block text-primary mt-1">Calculator</span>
              </h1>

              <p className="text-[15px] text-background/50 max-w-md mx-auto mb-8 leading-relaxed">
                Model cash flow, equity growth, and 5-year returns on BC condos and townhomes — in seconds.
              </p>

              {/* Features pill row */}
              <div className="flex flex-wrap justify-center gap-2">
                {["100% Free", "No Sign-up", "BC Math", "PTT + GST"].map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full bg-background/6 border border-background/10 text-background/50 text-[11px] font-semibold">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ── Feature strip ── */}
        <section className="border-b bg-muted/40">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5 py-4 px-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-[12px] font-bold text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight hidden md:block">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Calculator ── */}
        <section className="py-8 md:py-12">
          <InvestmentSnapshot />
        </section>

        {/* ── Lead Capture ── */}
        <section className="pb-10 px-4">
          <div className="max-w-lg mx-auto">
            <CalculatorLeadCapture
              calculatorData={{
                calculatorType: "roi",
                summary: "Investment Snapshot Calculator - Condo Cash Flow",
              }}
            />
          </div>
        </section>

        {/* ── Want more depth CTA ── */}
        <section className="py-10 md:py-14 bg-muted/30 border-t">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary block mb-3">More Tools</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  Need a deeper analysis?
                </h2>
                <p className="text-muted-foreground text-[14px]">Try our full 5-year proforma ROI calculator or mortgage planner.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    to: "/roi-calculator",
                    icon: TrendingUp,
                    title: "Full ROI Proforma",
                    desc: "5-year investment analysis with scenario modelling, amortization schedule, and cashflow projections.",
                    cta: "Open ROI Calculator",
                  },
                  {
                    to: "/mortgage-calculator",
                    icon: Calculator,
                    title: "Mortgage Calculator",
                    desc: "Affordability check, stress test, PTT, and payment breakdowns tailored to presale buyers.",
                    cta: "Open Mortgage Calculator",
                  },
                ].map(({ to, icon: Icon, title, desc, cta }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex flex-col bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6"
                  >
                    <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-4 group-hover:bg-primary/18 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed flex-1">{desc}</p>
                    <div className="flex items-center gap-1 text-primary text-[13px] font-semibold mt-4">
                      {cta}
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <div className="py-4 border-t bg-muted/20 px-4">
          <p className="max-w-2xl mx-auto text-center text-[11px] text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> Estimates only, not financial advice. Consult licensed professionals before investing.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
