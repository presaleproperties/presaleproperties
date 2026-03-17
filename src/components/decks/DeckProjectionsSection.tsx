import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TrendingUp, Home, Users, Building2, DollarSign, PiggyBank, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import {
  calculatePTT,
  calculateGST,
  calculateGSTRebate,
  calculateCMHCInsurance,
} from "@/hooks/useROICalculator";
import { FloorPlan } from "./FloorPlanModal";

export interface Projections {
  appreciation?: number[];
}

interface DeckProjectionsSectionProps {
  projections: Projections;
  defaultPrice?: number;
  floorPlans?: FloorPlan[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

function parsePriceFromString(s?: string): number | null {
  if (!s) return null;
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

function calcMortgage(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcMortgagePaydown(principal: number, annualRate: number, years: number, holdYears: number) {
  if (principal <= 0 || annualRate <= 0) return { principalPaid: 0, remainingBalance: principal };
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const pmt = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = principal;
  let paid = 0;
  for (let i = 0; i < holdYears * 12 && bal > 0; i++) {
    const interest = bal * r;
    paid += pmt - interest;
    bal -= pmt - interest;
  }
  return { principalPaid: paid, remainingBalance: Math.max(0, bal) };
}

function Row({ label, value, green, bold, sub }: { label: string; value: string; green?: boolean; bold?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        {sub && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>}
      </div>
      <span className={cn("text-sm font-semibold", green && "text-green-600 dark:text-green-400", bold && "text-foreground")}>{value}</span>
    </div>
  );
}

export function DeckProjectionsSection({ projections, defaultPrice, floorPlans = [] }: DeckProjectionsSectionProps) {
  const [buyerType, setBuyerType] = useState<"investor" | "ftb">("investor");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(3.79);
  const [amort, setAmort] = useState(30);
  const [includeGST, setIncludeGST] = useState(true);
  const [includePTT, setIncludePTT] = useState(true);
  const [strataFees, setStrataFees] = useState(400);
  const [propertyTax, setPropertyTax] = useState(150);
  const [holdYears, setHoldYears] = useState(5);
  const [appRate, setAppRate] = useState(4);
  const [dep1Pct, setDep1Pct] = useState(5);
  const [dep2Pct, setDep2Pct] = useState(5);

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan ? parsePriceFromString(selectedPlan.price_from) : null;
  const price = Math.min(Math.max(planPrice ?? defaultPrice ?? 799900, 200000), 5000000);
  const projectedRent = selectedPlan?.projected_rent ?? null;
  const isFirstTimeBuyer = buyerType === "ftb";

  const results = useMemo(() => {
    const gst = includeGST ? calculateGST(price) : 0;
    const priceWithGST = price + gst;
    const gstRebate = isFirstTimeBuyer && includeGST ? calculateGSTRebate(price, gst) : 0;
    const pttRaw = calculatePTT(price, false);
    const ptt = isFirstTimeBuyer ? 0 : (includePTT ? pttRaw : 0);

    const dep1 = price * (dep1Pct / 100);
    const dep2 = price * (dep2Pct / 100);
    const totalDeposits = dep1 + dep2;

    const downAmt = priceWithGST * (downPct / 100);
    const baseMortgage = priceWithGST - downAmt;
    const cmhc = calculateCMHCInsurance(baseMortgage, downPct);
    const mortgageAmt = baseMortgage + cmhc;
    const monthly = calcMortgage(mortgageAmt, rate, amort);

    const legalFees = 2000;
    const remainingDown = Math.max(0, downAmt - totalDeposits);
    const cashAtClosing = remainingDown + ptt + legalFees - gstRebate;
    const totalCashNeeded = totalDeposits + cashAtClosing;

    const totalMonthlyExpenses = monthly + strataFees + propertyTax;
    const monthlyCashFlow = projectedRent ? projectedRent - totalMonthlyExpenses : null;
    const annualCashFlow = monthlyCashFlow !== null ? monthlyCashFlow * 12 : null;

    const { principalPaid, remainingBalance } = calcMortgagePaydown(mortgageAmt, rate, amort, holdYears);
    const futureValue = price * Math.pow(1 + appRate / 100, holdYears);
    const appreciation = futureValue - price;
    const totalEquity = downAmt + principalPaid + appreciation;
    const totalCashFlow = annualCashFlow !== null ? annualCashFlow * holdYears : 0;
    const totalReturn = appreciation + principalPaid + totalCashFlow;
    const roiPct = totalCashNeeded > 0 ? (totalReturn / totalCashNeeded) * 100 : 0;

    // Cap rate
    const noi = projectedRent ? (projectedRent - strataFees - propertyTax) * 12 : null;
    const capRate = noi ? (noi / priceWithGST) * 100 : null;
    const cashOnCash = annualCashFlow !== null && totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded) * 100 : null;

    return {
      gst, priceWithGST, gstRebate, pttRaw, ptt, dep1, dep2, totalDeposits,
      downAmt, baseMortgage, cmhc, mortgageAmt, monthly,
      legalFees, remainingDown, cashAtClosing, totalCashNeeded,
      totalMonthlyExpenses, monthlyCashFlow, annualCashFlow,
      principalPaid, remainingBalance, futureValue, appreciation,
      totalEquity, totalCashFlow, totalReturn, roiPct,
      capRate, cashOnCash,
    };
  }, [price, isFirstTimeBuyer, includeGST, includePTT, downPct, rate, amort, dep1Pct, dep2Pct, strataFees, propertyTax, holdYears, appRate, projectedRent]);

  const isPositiveCF = (results.monthlyCashFlow ?? 0) >= 0;

  return (
    <section id="projections" className="relative py-16 sm:py-24 bg-muted/10 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">05</div>

        <div className="mb-8 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Projections</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Investment Calculator</h2>
          <p className="text-muted-foreground text-sm">BC 2026 tax rules — same calculator as our site, pre-loaded with this project's numbers.</p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card shadow-[0_8px_48px_-12px_hsl(var(--foreground)/0.08)] overflow-hidden">

          {/* Header */}
          <div className="bg-foreground px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-background leading-none">Investment Snapshot</h3>
                <p className="text-[11px] text-background/40 mt-0.5">BC 2026 presale rules applied</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-background/40 uppercase tracking-wider">Calculating for</p>
              <p className="text-lg font-bold text-primary">{fmt(price)}</p>
            </div>
          </div>

          {/* Buyer type + unit selector */}
          <div className="px-4 sm:px-5 py-3 bg-muted/40 border-b border-border/50 space-y-3">
            <div className="flex justify-center gap-2">
              {(["investor", "ftb"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBuyerType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all touch-manipulation flex-1 justify-center",
                    buyerType === type
                      ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.30)]"
                      : "bg-background text-muted-foreground hover:bg-secondary/60 border border-border/60"
                  )}
                >
                  {type === "investor" ? <Building2 className="h-3.5 w-3.5 shrink-0" /> : <Users className="h-3.5 w-3.5 shrink-0" />}
                  {type === "investor" ? "Investor" : "First-Time Buyer"}
                </button>
              ))}
            </div>

            {floorPlans.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">Unit:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedPlanId("")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all touch-manipulation",
                      !selectedPlanId ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >Default</button>
                  {floorPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all touch-manipulation",
                        selectedPlanId === plan.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {plan.unit_type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FTB banner */}
          {isFirstTimeBuyer && (
            <div className="mx-4 sm:mx-5 mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
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
          <Tabs defaultValue="cashflow" className="w-full">
            <TabsList className="w-full h-auto p-0 bg-muted/30 rounded-none border-b border-border/50 mt-3">
              {[
                { value: "cashflow", icon: DollarSign, label: isFirstTimeBuyer ? "Monthly Payment" : "Cash Flow" },
                { value: "equity",   icon: PiggyBank,  label: "Equity & Growth" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 h-10 sm:h-11 rounded-none gap-1.5 text-xs sm:text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors touch-manipulation"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab 1: Cash Flow / Monthly Payment ── */}
            <TabsContent value="cashflow" className="mt-0">
              <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Left: Sliders */}
                <div className="space-y-5">
                  {/* Down payment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Down Payment</span>
                      <span className="text-sm font-bold text-primary">{downPct}% · {fmt(results.downAmt)}</span>
                    </div>
                    <Slider min={5} max={50} step={5} value={[downPct]} onValueChange={([v]) => setDownPct(v)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5%</span><span>50%</span></div>
                  </div>

                  {/* Deposit structure */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "Deposit 1", val: dep1Pct, set: setDep1Pct, amt: results.dep1 },
                      { label: "Deposit 2", val: dep2Pct, set: setDep2Pct, amt: results.dep2 },
                    ] as const).map(({ label, val, set, amt }) => (
                      <div key={label} className="rounded-xl bg-muted/40 p-3">
                        <div className="flex justify-between text-[11px] mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                          <span className="font-bold text-primary">{val}%</span>
                        </div>
                        <Slider min={0} max={15} step={1} value={[val]} onValueChange={([v]) => set(v)} />
                        <p className="text-center text-[11px] font-semibold text-muted-foreground mt-1">{fmt(amt)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rate + amortization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Interest Rate</span>
                      <span className="text-sm font-bold text-primary">{rate.toFixed(2)}%</span>
                    </div>
                    <Slider min={2} max={9} step={0.01} value={[rate]} onValueChange={([v]) => setRate(parseFloat(v.toFixed(2)))} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>2%</span><span>9%</span></div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Amortization</p>
                    <div className="flex gap-2">
                      {[25, 30].map((yr) => (
                        <button key={yr} onClick={() => setAmort(yr)}
                          className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-all touch-manipulation",
                            amort === yr ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          )}>{yr} yr</button>
                      ))}
                    </div>
                  </div>

                  {/* Strata + Tax */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "Strata /mo", val: strataFees, set: setStrataFees },
                      { label: "Tax /mo",    val: propertyTax, set: setPropertyTax },
                    ] as const).map(({ label, val, set }) => (
                      <div key={label} className="rounded-xl border border-border/50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
                        <Slider min={0} max={1500} step={25} value={[val]} onValueChange={([v]) => set(v)} />
                        <p className="text-center text-sm font-bold text-foreground mt-1">{fmt(val)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hero: Monthly payment */}
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Est. Monthly Payment</p>
                    <p className="text-4xl font-bold text-primary">{fmt(results.monthly)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmt(results.mortgageAmt)} mortgage · {rate}% · {amort}yr
                      {results.cmhc > 0 && " · CMHC insured"}
                    </p>
                    {results.cmhc > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>CMHC premium {fmt(results.cmhc)} added to mortgage</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Closing costs + cash flow */}
                <div className="space-y-4">

                  {/* Cash at closing — dark card */}
                  <div className="rounded-2xl bg-foreground text-background p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-background/50 font-bold uppercase tracking-wider">Total Cash Required</span>
                      <span className="text-2xl font-black text-background">{fmt(results.totalCashNeeded)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: "Deposits", value: results.totalDeposits },
                        { label: "At Closing", value: results.cashAtClosing },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-background/8 rounded-xl p-3 text-center">
                          <div className="text-[10px] text-background/45 uppercase font-semibold mb-1">{label}</div>
                          <div className="text-[15px] font-black text-background">{fmt(value)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-background/15 pt-3 space-y-1.5 text-[12px]">
                      <div className="text-[10px] text-background/40 font-bold uppercase mb-2">Closing Detail</div>
                      <div className="flex justify-between">
                        <span className="text-background/60">Remaining Down</span>
                        <span className="font-semibold">{fmt(results.remainingDown)}</span>
                      </div>
                      {includeGST && (
                        <div className="flex justify-between">
                          <span className="text-background/60">GST (5%)</span>
                          <span className="font-semibold">{fmt(results.gst)}</span>
                        </div>
                      )}
                      {includeGST && isFirstTimeBuyer && results.gstRebate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/60">GST Rebate (FTB)</span>
                          <span className="font-semibold text-green-400">-{fmt(results.gstRebate)}</span>
                        </div>
                      )}
                      {results.ptt > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/60">Property Transfer Tax</span>
                          <span className="font-semibold">{fmt(results.ptt)}</span>
                        </div>
                      )}
                      {isFirstTimeBuyer && results.pttRaw > 0 && results.ptt === 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/60">PTT (Exempt FTB)</span>
                          <span className="font-semibold text-green-400">$0</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-background/60">Legal & Closing</span>
                        <span className="font-semibold">{fmt(results.legalFees)}</span>
                      </div>
                      {results.cmhc > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/60">CMHC Premium</span>
                          <span className="font-semibold">{fmt(results.cmhc)} <span className="text-background/30 text-[10px]">(in mortgage)</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="divide-y divide-border/30">
                      {[
                        { label: "Include GST (5%)", sub: "New construction tax", amount: fmt(results.gst), checked: includeGST, onChange: setIncludeGST },
                        { label: isFirstTimeBuyer ? "PTT — Exempt (FTB)" : "Property Transfer Tax", sub: isFirstTimeBuyer ? "First-time buyer exempt" : "BC tiered rate", amount: isFirstTimeBuyer ? "-" + fmt(results.pttRaw) : fmt(results.pttRaw), checked: includePTT, onChange: setIncludePTT, disabled: isFirstTimeBuyer },
                      ].map(({ label, sub, amount, checked, onChange, disabled }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-[11px] text-muted-foreground">{sub}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("text-sm font-bold", isFirstTimeBuyer && label.includes("PTT") ? "text-green-600 line-through opacity-60" : "")}>{amount}</span>
                            <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly cash flow (if projected rent set) */}
                  {results.monthlyCashFlow !== null && (
                    <div className={cn(
                      "rounded-2xl p-4 border-2 text-center",
                      isPositiveCF ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    )}>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isPositiveCF ? "text-green-700" : "text-red-700")}>Monthly Cash Flow</p>
                      <p className={cn("text-4xl font-black", isPositiveCF ? "text-green-600" : "text-red-600")}>
                        {isPositiveCF ? "+" : ""}{fmt(results.monthlyCashFlow)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmt(projectedRent!)} rent − {fmt(results.totalMonthlyExpenses)} expenses
                      </p>
                    </div>
                  )}

                  {/* FTB savings */}
                  {isFirstTimeBuyer && (results.pttRaw > 0 || results.gstRebate > 0) && (
                    <div className="rounded-xl border border-green-200 bg-green-50/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-3">First-Time Buyer Savings</p>
                      <div className="space-y-2">
                        {results.pttRaw > 0 && <Row label="PTT Exempt" value={fmt(results.pttRaw)} green />}
                        {results.gstRebate > 0 && <Row label="GST Rebate" value={fmt(results.gstRebate)} green />}
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-sm font-bold text-green-800">Total Saved</span>
                          <span className="text-lg font-black text-green-700">{fmt(results.pttRaw + results.gstRebate)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    BC 2026 rules. PTT exemption FTB ≤$1.1M. GST rebate 100% ≤$1M, partial $1M–$1.5M (Bill C-4, Mar 2026). Consult a licensed advisor.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Equity & Growth ── */}
            <TabsContent value="equity" className="mt-0">
              <div className="p-4 sm:p-6 space-y-5">

                {/* Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-3">Hold Period</p>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setHoldYears(Math.max(1, holdYears - 1))}
                        className="h-9 w-9 rounded-xl border border-border/60 bg-background flex items-center justify-center text-lg font-bold hover:bg-secondary transition-colors touch-manipulation">−</button>
                      <div className="text-center">
                        <span className="text-4xl font-black text-primary">{holdYears}</span>
                        <span className="text-[12px] text-muted-foreground ml-1">yr</span>
                      </div>
                      <button onClick={() => setHoldYears(Math.min(20, holdYears + 1))}
                        className="h-9 w-9 rounded-xl border border-border/60 bg-background flex items-center justify-center text-lg font-bold hover:bg-secondary transition-colors touch-manipulation">+</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Appreciation
                    </p>
                    <div className="text-center mb-2">
                      <span className="text-4xl font-black text-primary">{appRate}</span>
                      <span className="text-[12px] text-muted-foreground ml-1">% / yr</span>
                    </div>
                    <Slider value={[appRate]} onValueChange={([v]) => setAppRate(v)} min={0} max={10} step={0.5} />
                  </div>
                </div>

                {/* Future value hero */}
                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/30 dark:to-green-950/10 border border-green-200 dark:border-green-800 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Est. Value in {holdYears}yr</p>
                    <div className="text-3xl font-black text-green-700 dark:text-green-400">{fmt(results.futureValue)}</div>
                    <div className="flex items-center gap-1 text-[13px] text-green-600 mt-1 font-semibold">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      +{fmt(results.appreciation)} appreciation
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Purchase</p>
                    <p className="text-[14px] font-semibold text-muted-foreground">{fmt(price)}</p>
                    {includeGST && <p className="text-[11px] text-muted-foreground/60 mt-0.5">+GST: {fmt(results.priceWithGST)}</p>}
                  </div>
                </div>

                {/* Equity breakdown */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><PiggyBank className="h-3 w-3" /> Total Equity Built</p>
                      <span className="text-xl font-black text-foreground">{fmt(results.totalEquity)}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex mb-4 bg-muted/60">
                      {[
                        { value: results.downAmt,       color: "bg-primary/70" },
                        { value: results.principalPaid,  color: "bg-blue-500" },
                        { value: results.appreciation,   color: "bg-green-500" },
                      ].map(({ value, color }, i) => (
                        <div key={i} className={cn(color, "transition-all")}
                          style={{ width: `${(value / (results.totalEquity || 1)) * 100}%` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Down Payment",  value: results.downAmt,      dot: "bg-primary/70" },
                        { label: "Paydown",       value: results.principalPaid, dot: "bg-blue-500" },
                        { label: "Appreciation",  value: results.appreciation,  dot: "bg-green-500" },
                      ].map(({ label, value, dot }) => (
                        <div key={label}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className={cn("h-2 w-2 rounded-full", dot)} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                          </div>
                          <div className="text-[14px] font-bold text-foreground">{fmt(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Return",  value: fmt(results.totalReturn),                                         dark: true },
                    { label: "ROI",           value: `${results.roiPct.toFixed(1)}%`,  sub: `${holdYears}yr total`,   dark: false },
                    { label: "Annualized",    value: `${holdYears > 0 ? (results.roiPct / holdYears).toFixed(1) : "0.0"}%`, sub: "per year", dark: false },
                    { label: "Cash Invested", value: fmt(results.totalCashNeeded),                                     dark: false },
                  ].map(({ label, value, sub, dark }) => (
                    <div key={label} className={cn("rounded-2xl p-3.5 text-center", dark ? "bg-foreground text-background" : "bg-muted/50 border border-border/50")}>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", dark ? "text-background/45" : "text-muted-foreground")}>{label}</span>
                      <div className={cn("text-[15px] font-black mt-1.5", dark ? "text-background" : "text-foreground")}>{value}</div>
                      {sub && <div className={cn("text-[10px] mt-0.5", dark ? "text-background/40" : "text-muted-foreground/60")}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Investor metrics */}
                {!isFirstTimeBuyer && (
                  <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Investor Metrics</p>
                      <div className="space-y-0">
                        {results.capRate !== null && (
                          <Row label="Cap Rate" value={`${results.capRate.toFixed(2)}%`} sub="NOI / Price incl. GST" />
                        )}
                        {results.cashOnCash !== null && (
                          <Row label="Cash-on-Cash" value={`${results.cashOnCash.toFixed(2)}%`} sub="Annual CF / Cash In" />
                        )}
                        <Row label="Mortgage" value={fmt(results.mortgageAmt)} sub={`Yr${holdYears} balance: ${fmt(results.remainingBalance)}`} />
                        {results.monthlyCashFlow !== null && (
                          <Row label="Monthly CF" value={fmt(results.monthlyCashFlow)} sub={`${fmt(projectedRent!)} rent − ${fmt(results.totalMonthlyExpenses)} costs`} green={isPositiveCF} />
                        )}
                        <Row label="Mortgage Paydown" value={fmt(results.principalPaid)} sub={`Over ${holdYears} years`} green />
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Projections are estimates. Past appreciation does not guarantee future results. Consult a licensed financial advisor.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
