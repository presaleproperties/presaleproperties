import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Home, Users, Building2, AlertCircle, CheckCircle2, DollarSign, PiggyBank } from "lucide-react";
import { calculatePTT, calculateGST, calculateGSTRebate, calculateCMHCInsurance } from "@/hooks/useROICalculator";
import { FloorPlan } from "./FloorPlanModal";

export interface Projections {
  appreciation?: number[];
}

interface DeckProjectionsSectionProps {
  projections: Projections;
  defaultPrice?: number;
  floorPlans?: FloorPlan[];
}

function formatCAD(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function parsePriceFromString(s?: string): number | null {
  if (!s) return null;
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

const AMORTIZATION_OPTIONS = [25, 30];
const DEFAULT_RATE = 3.8;

function Row({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", green && "text-green-600 dark:text-green-400", bold && "text-foreground")}>{value}</span>
    </div>
  );
}

export function DeckProjectionsSection({ projections, defaultPrice, floorPlans = [] }: DeckProjectionsSectionProps) {
  const [buyerType, setBuyerType] = useState<"ftb" | "investor">("investor");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [amort, setAmort] = useState(30);
  const [includePTT, setIncludePTT] = useState(true);
  const [includeGST, setIncludeGST] = useState(true);

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan ? parsePriceFromString(selectedPlan.price_from) : null;
  const price = Math.min(Math.max(planPrice ?? defaultPrice ?? 799900, 300000), 3000000);
  const appreciation = projections.appreciation?.length ? projections.appreciation : [4, 5, 5.5, 6, 6.5];
  const isFirstTimeBuyer = buyerType === "ftb";

  const mortgageCalc = useMemo(() => {
    const downAmt = Math.round((price * downPct) / 100);
    const principal = price - downAmt;
    const cmhc = calculateCMHCInsurance(principal, downPct);
    const mortgageAmount = principal + cmhc;
    const r = rate / 100 / 12;
    const n = amort * 12;
    const monthly = r === 0 ? mortgageAmount / n : (mortgageAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { downAmt, principal, cmhc, mortgageAmount, monthly };
  }, [price, downPct, rate, amort]);

  const closingCosts = useMemo(() => {
    const gst = includeGST ? calculateGST(price) : 0;
    const gstRebate = isFirstTimeBuyer && includeGST ? calculateGSTRebate(price, gst) : 0;
    const ptt = includePTT ? calculatePTT(price, isFirstTimeBuyer) : 0;
    const legalFees = 2000;
    const cashNeeded = mortgageCalc.downAmt + gst - gstRebate + ptt + legalFees;
    return { gst, gstRebate, ptt, legalFees, cashNeeded };
  }, [price, isFirstTimeBuyer, includePTT, includeGST, mortgageCalc.downAmt]);

  const chartData = appreciation.map((pct, i) => {
    const projValue = price * appreciation.slice(0, i + 1).reduce((acc, p) => acc * (1 + p / 100), 1);
    return { year: `Yr ${i + 1}`, pct, value: Math.round(projValue) };
  });
  const totalAppr5yr = appreciation.reduce((acc, pct) => acc * (1 + pct / 100), 1) - 1;
  const projectedValue5yr = Math.round(price * (1 + totalAppr5yr));
  const equity5yr = projectedValue5yr - price;

  return (
    <section id="projections" className="relative py-16 sm:py-24 bg-muted/10 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">05</div>

        <div className="mb-8 sm:mb-10 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Projections</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Investment Outlook</h2>
          <p className="text-muted-foreground text-sm mt-1">BC 2026 tax rules applied. Toggle your buyer profile for personalized numbers.</p>
        </div>

        {/* Main calculator card */}
        <div className="rounded-3xl border border-border/60 bg-card shadow-[0_8px_48px_-12px_hsl(var(--foreground)/0.08)] overflow-hidden">

          {/* Card Header */}
          <div className="bg-foreground px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-background leading-none">Investment Calculator</h3>
                <p className="text-[11px] text-background/40 mt-0.5">BC 2026 presale rules applied</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-background/40 uppercase tracking-wider">Calculating for</p>
              <p className="text-lg font-bold text-primary">{formatCAD(price)}</p>
            </div>
          </div>

          {/* Buyer type toggle */}
          <div className="px-5 py-3.5 bg-muted/40 border-b border-border/50 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex justify-center gap-2.5 flex-1">
              {(["investor", "ftb"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBuyerType(type)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all",
                    buyerType === type
                      ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.30)]"
                      : "bg-background text-muted-foreground hover:bg-secondary/60 border border-border/60"
                  )}
                >
                  {type === "investor" ? <Building2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  {type === "investor" ? "Investor" : "First-Time Buyer"}
                </button>
              ))}
            </div>

            {floorPlans.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Unit:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedPlanId("")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      !selectedPlanId ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >Default</button>
                  {floorPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        selectedPlanId === plan.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {plan.unit_type}{plan.price_from && <span className="ml-1.5 opacity-70">{plan.price_from}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FTB banner */}
          {isFirstTimeBuyer && (
            <div className="mx-5 mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-800 dark:text-green-300">First-Time Buyer Advantages Applied</p>
                <p className="text-[11px] text-green-700 dark:text-green-400 mt-0.5">
                  {price <= 1100000 ? "Full PTT exemption · " : price <= 1150000 ? "Partial PTT exemption · " : ""}
                  {price <= 1000000 ? "100% GST rebate (new build ≤$1M)" : price < 1500000 ? "Partial GST rebate ($1M–$1.5M)" : "No GST rebate above $1.5M"}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="mortgage" className="w-full">
            <TabsList className="w-full h-auto p-0 bg-muted/30 rounded-none border-b border-border/50 mt-4">
              {[
                { value: "mortgage", icon: DollarSign, label: "Monthly Payment" },
                { value: "forecast", icon: PiggyBank, label: "5-Year Forecast" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 h-11 rounded-none gap-2 text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab 1: Monthly Payment */}
            <TabsContent value="mortgage" className="mt-0">
              <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-6">

                {/* Left: Sliders */}
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Down Payment</span>
                      <span className="text-sm font-bold text-primary">{downPct}% · {formatCAD(mortgageCalc.downAmt)}</span>
                    </div>
                    <Slider min={5} max={50} step={1} value={[downPct]} onValueChange={([v]) => setDownPct(v)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5%</span><span>50%</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Interest Rate</span>
                      <span className="text-sm font-bold text-primary">{rate.toFixed(1)}%</span>
                    </div>
                    <Slider min={2} max={9} step={0.1} value={[rate]} onValueChange={([v]) => setRate(parseFloat(v.toFixed(1)))} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>2%</span><span>9%</span></div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Amortization</p>
                    <div className="flex gap-2">
                      {AMORTIZATION_OPTIONS.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setAmort(yr)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                            amort === yr ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >{yr} yr</button>
                      ))}
                    </div>
                  </div>

                  {/* Hero monthly payment */}
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Est. Monthly Payment</p>
                    <p className="text-4xl font-bold text-primary">{formatCAD(mortgageCalc.monthly)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCAD(mortgageCalc.mortgageAmount)} mortgage · {rate}% · {amort} yr
                      {mortgageCalc.cmhc > 0 && " · CMHC insured"}
                    </p>
                    {mortgageCalc.cmhc > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>CMHC premium {formatCAD(mortgageCalc.cmhc)} added</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Cash at closing */}
                <div>
                  <div className="rounded-2xl border border-border/50 overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Cash Needed at Closing</p>
                      {isFirstTimeBuyer && (
                        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                          FTB Benefits
                        </span>
                      )}
                    </div>
                    <div className="px-4 divide-y divide-border/30">
                      <Row label="Down Payment" value={formatCAD(mortgageCalc.downAmt)} />
                      {includeGST && <Row label="GST (5%)" value={formatCAD(closingCosts.gst)} />}
                      {includeGST && isFirstTimeBuyer && closingCosts.gstRebate > 0 && (
                        <Row label="GST Rebate (FTB)" value={`-${formatCAD(closingCosts.gstRebate)}`} green />
                      )}
                      {includePTT && (
                        <Row
                          label={`PTT${isFirstTimeBuyer && closingCosts.ptt === 0 ? " (Exempt)" : ""}`}
                          value={closingCosts.ptt === 0 ? "$0" : formatCAD(closingCosts.ptt)}
                          green={closingCosts.ptt === 0}
                        />
                      )}
                      <Row label="Legal Fees (est.)" value={formatCAD(closingCosts.legalFees)} />
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-muted/30 font-bold border-t border-border/40">
                      <span className="text-sm text-foreground">Total Cash Needed</span>
                      <span className="text-sm text-primary">{formatCAD(closingCosts.cashNeeded)}</span>
                    </div>
                    <div className="flex gap-4 px-4 py-3 border-t border-border/30 bg-muted/10">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={includeGST} onChange={(e) => setIncludeGST(e.target.checked)} className="accent-primary h-3 w-3" />
                        Include GST
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={includePTT} onChange={(e) => setIncludePTT(e.target.checked)} className="accent-primary h-3 w-3" />
                        Include PTT
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
                    BC 2026 rules. PTT exemption for FTB ≤$1.1M. GST rebate 100% ≤$1M, partial $1M–$1.5M (Bill C-4, Mar 2026). Consult a licensed advisor.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: 5-Year Forecast */}
            <TabsContent value="forecast" className="mt-0">
              <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-6">

                {/* Chart */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Annual Appreciation Rate</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barCategoryGap="35%">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, Math.max(...appreciation) + 2]}
                        />
                        <Tooltip
                          formatter={(v: number, name: string) =>
                            name === "pct" ? [`${v}%`, "Annual Appreciation"] : [formatCAD(v), "Projected Value"]
                          }
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="pct" radius={[6, 6, 0, 0]} name="pct">
                          {chartData.map((_, i) => (
                            <Cell key={i} fill="hsl(var(--primary))" opacity={0.55 + i * 0.09} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">5-Year Summary</p>

                  <div className="rounded-2xl border border-border/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2.5 border-b border-primary/15">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Value Projection</p>
                    </div>
                    <div className="px-4 divide-y divide-border/30">
                      <Row label="Purchase Price" value={formatCAD(price)} />
                      <Row label="Projected Value" value={formatCAD(projectedValue5yr)} bold />
                      <Row label="Equity Gain" value={formatCAD(equity5yr)} green />
                      <Row label="Total Appreciation" value={`~${(totalAppr5yr * 100).toFixed(1)}%`} bold />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Home, label: "Projected Value", value: formatCAD(projectedValue5yr), sub: "in 5 years" },
                      { icon: TrendingUp, label: "Total Appreciation", value: `~${(totalAppr5yr * 100).toFixed(1)}%`, sub: appreciation.map((p) => `${p}%`).join(" · ") },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border/50 hover:border-primary/30 transition-colors p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <stat.icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                        </div>
                        <p className="text-base font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 opacity-70">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
