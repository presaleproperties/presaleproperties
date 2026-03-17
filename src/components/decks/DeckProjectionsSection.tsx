import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Home, Users, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <section id="projections" className="relative py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">05</div>

        <div className="mb-10 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Projections</p>
          <h2 className="text-4xl font-bold text-foreground">Investment Outlook</h2>
          <p className="text-muted-foreground text-sm mt-1">BC 2024 tax rules applied. Toggle your buyer profile for personalized numbers.</p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-2xl bg-background border border-border/50">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/40">
            {(["investor", "ftb"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setBuyerType(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  buyerType === type
                    ? "bg-background shadow-sm border border-border/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "investor" ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {type === "investor" ? "Investor" : "First-Time Buyer"}
              </button>
            ))}
          </div>

          {floorPlans.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Unit:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedPlanId("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    !selectedPlanId ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >Default</button>
                {floorPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedPlanId === plan.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {plan.unit_type}{plan.price_from && <span className="ml-1.5 opacity-70">{plan.price_from}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ml-auto text-right shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Calculating for</p>
            <p className="text-lg font-bold text-primary">{formatCAD(price)}</p>
          </div>
        </div>

        {/* FTB banner */}
        {isFirstTimeBuyer && (
          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">First-Time Buyer Advantages Applied</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                {price <= 1100000 ? "Full PTT exemption on new construction (BC 2024) · " : price <= 1150000 ? "Partial PTT exemption (BC 2024) · " : ""}
                {price <= 1000000 ? "GST new housing rebate available" : "GST rebate phased out above $1M"}
              </p>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left: Mortgage Calculator */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground">Monthly Payment Calculator</h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Down Payment</span>
                  <span className="text-sm font-bold text-primary">{downPct}% · {formatCAD(mortgageCalc.downAmt)}</span>
                </div>
                <Slider min={5} max={50} step={1} value={[downPct]} onValueChange={([v]) => setDownPct(v)} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5% min</span><span>50%</span></div>
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
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        amort === yr ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >{yr} yr</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly payment hero card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Est. Monthly Payment</p>
                  <p className="text-4xl font-bold text-primary">{formatCAD(mortgageCalc.monthly)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCAD(mortgageCalc.mortgageAmount)} mortgage · {rate}% · {amort} yr
                    {mortgageCalc.cmhc > 0 && " · CMHC insured"}
                  </p>
                </div>
                {mortgageCalc.cmhc > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>CMHC premium {formatCAD(mortgageCalc.cmhc)} added (under 20% down)</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-primary/10">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Down Payment</p>
                    <p className="text-sm font-bold text-foreground">{formatCAD(mortgageCalc.downAmt)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Mortgage Amount</p>
                    <p className="text-sm font-bold text-foreground">{formatCAD(mortgageCalc.mortgageAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash needed at closing */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Cash Needed at Closing</p>
                {isFirstTimeBuyer && (
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                    FTB Benefits
                  </span>
                )}
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { label: "Down Payment", value: mortgageCalc.downAmt, positive: false },
                  ...(includeGST ? [
                    { label: "GST (5%)", value: closingCosts.gst, positive: false },
                    ...(isFirstTimeBuyer && closingCosts.gstRebate > 0
                      ? [{ label: "GST Rebate (FTB)", value: -closingCosts.gstRebate, positive: true }]
                      : []),
                  ] : []),
                  ...(includePTT ? [
                    { label: `PTT${isFirstTimeBuyer && closingCosts.ptt === 0 ? " (Exempt)" : ""}`, value: closingCosts.ptt, positive: closingCosts.ptt === 0 },
                  ] : []),
                  { label: "Legal Fees (est.)", value: closingCosts.legalFees, positive: false },
                ].map(({ label, value, positive }) => (
                  <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className={positive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>{label}</span>
                    <span className={`font-semibold ${positive ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                      {positive && value < 0 ? `-${formatCAD(Math.abs(value))}` : value === 0 ? "$0" : formatCAD(value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-muted/30 font-bold">
                  <span className="text-sm text-foreground">Total Cash Needed</span>
                  <span className="text-sm text-primary">{formatCAD(closingCosts.cashNeeded)}</span>
                </div>
              </div>
              <div className="flex gap-4 px-4 py-3 border-t border-border/40 bg-muted/20">
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

            <p className="text-[11px] text-muted-foreground">
              * BC 2024 new construction rules. PTT exemption for FTB ≤$1.1M. GST rebate for primary residence ≤$1M. Consult a licensed advisor.
            </p>
          </div>

          {/* Right: 5-Year Appreciation Chart */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground">5-Year Value Forecast</h3>

            <div className="h-64">
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
                      <Cell key={i} fill="hsl(var(--primary))" opacity={0.6 + i * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 5-year summary */}
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-primary/15">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">5-Year Summary</p>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {[
                    ["Purchase Price", formatCAD(price)],
                    ["Projected Value", formatCAD(projectedValue5yr)],
                    ["Equity Gain", formatCAD(equity5yr)],
                    ["Total Appreciation", `${(totalAppr5yr * 100).toFixed(1)}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={`font-bold ${k === "Equity Gain" ? "text-primary" : "text-foreground"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Home, label: "Projected Value (5yr)", value: formatCAD(projectedValue5yr), sub: `+${formatCAD(equity5yr)} equity` },
                { icon: TrendingUp, label: "5-Year Appreciation", value: `~${(totalAppr5yr * 100).toFixed(1)}%`, sub: appreciation.map((p) => `${p}%`).join(" · ") },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <stat.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">{stat.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
