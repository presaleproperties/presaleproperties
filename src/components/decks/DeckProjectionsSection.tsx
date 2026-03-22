import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TrendingUp, Home, Users, Building2, DollarSign, PiggyBank, CheckCircle2, AlertCircle, ArrowUpRight, Info, Lock as LockIcon } from "lucide-react";
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
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
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

function BreakdownRow({ label, value, green, sub, strikethrough }: { label: string; value: string; green?: boolean; sub?: string; strikethrough?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-background/15 last:border-0">
      <div>
        <span className="text-sm text-background/75">{label}</span>
        {sub && <div className="text-xs text-background/50 mt-0.5">{sub}</div>}
      </div>
      <span className={cn(
        "text-sm font-semibold",
        green && "text-green-400",
        strikethrough && "line-through text-background/35"
      )}>{value}</span>
    </div>
  );
}

export function DeckProjectionsSection({ projections, defaultPrice, floorPlans = [], isUnlocked = false }: DeckProjectionsSectionProps) {
  const [buyerType, setBuyerType] = useState<"investor" | "ftb">("investor");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => floorPlans?.[0]?.id ?? "");
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(3.79);
  const [amort, setAmort] = useState(30);
  const [strataFees, setStrataFees] = useState(300);
  const [strataInput, setStrataInput] = useState("300");
  const [propertyTax, setPropertyTax] = useState(125);
  const [taxInput, setTaxInput] = useState("125");
  const [holdYears, setHoldYears] = useState(5);
  const [appRate, setAppRate] = useState(4);
  const [depositPct, setDepositPct] = useState(10);

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan ? parsePriceFromString(selectedPlan.price_from) : null;
  const price = Math.min(Math.max(planPrice ?? defaultPrice ?? 799900, 200000), 5000000);
  const projectedRent = selectedPlan?.projected_rent ?? null;
  const isFirstTimeBuyer = buyerType === "ftb";

  const results = useMemo(() => {
    const gstGross = calculateGST(price);
    const pttRaw = calculatePTT(price, false);
    const ptt = calculatePTT(price, isFirstTimeBuyer);
    const gstRebate = isFirstTimeBuyer ? calculateGSTRebate(price, gstGross) : 0;
    const gstNet = gstGross - gstRebate;
    const priceWithGST = price + gstGross;
    const priceWithGSTNet = price + gstNet;
    const depositAmt = price * (depositPct / 100);
    const downBase = isFirstTimeBuyer ? priceWithGSTNet : priceWithGST;
    const downAmt = downBase * (downPct / 100);
    const remainingDown = Math.max(0, downAmt - depositAmt);
    const baseMortgage = downBase - downAmt;
    const cmhc = calculateCMHCInsurance(baseMortgage, downPct);
    const mortgageAmt = baseMortgage + cmhc;
    const monthly = calcMortgage(mortgageAmt, rate, amort);
    const legalFees = 2000;
    const cashAtCompletion = isFirstTimeBuyer
      ? remainingDown + ptt + gstNet + legalFees
      : remainingDown + ptt + legalFees;
    const totalCashNeeded = depositAmt + cashAtCompletion;
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
    const noi = projectedRent ? (projectedRent - strataFees - propertyTax) * 12 : null;
    const capRate = noi ? (noi / priceWithGSTNet) * 100 : null;
    const cashOnCash = annualCashFlow !== null && totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded) * 100 : null;

    return {
      gstGross, gstRebate, gstNet, pttRaw, ptt, depositAmt,
      downAmt, remainingDown, baseMortgage, cmhc, mortgageAmt, monthly,
      priceWithGSTNet, legalFees, cashAtCompletion, totalCashNeeded,
      totalMonthlyExpenses, monthlyCashFlow, annualCashFlow,
      principalPaid, remainingBalance, futureValue, appreciation,
      totalEquity, totalCashFlow, totalReturn, roiPct,
      capRate, cashOnCash,
    };
  }, [price, isFirstTimeBuyer, downPct, rate, amort, depositPct, strataFees, propertyTax, holdYears, appRate, projectedRent]);

  const isPositiveCF = (results.monthlyCashFlow ?? 0) >= 0;

  return (
    <div id="projections" className="relative w-full">
      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LockIcon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Investment Calculator Locked</h3>
            <p className="text-sm text-muted-foreground">Unlock the full calculator with your details to run your numbers — mortgage, cash flow, ROI and more.</p>
          </div>
        </div>
      )}

        <div className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-3">06 — Your Numbers</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">Run Your Numbers</h2>
          <p className="text-muted-foreground text-base mt-2">Estimate your monthly payment and what you need at closing. BC 2026 tax rules applied.</p>
        </div>


        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

          {/* Header bar */}
          <div className="bg-foreground px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-background leading-none">Investment Calculator</h3>
                <p className="text-xs text-background/50 mt-1">BC 2026 · GST rebate · PTT exemption rules applied</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-background/50 uppercase tracking-wider mb-0.5">Purchase price</p>
              <p className="text-2xl font-bold text-primary">{fmt(price)}</p>
            </div>
          </div>

          {/* Buyer type + unit */}
          <div className="px-4 sm:px-5 py-4 bg-muted/40 border-b border-border/50 space-y-3">
            <div className="flex gap-2">
              {(["investor", "ftb"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBuyerType(type)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all touch-manipulation flex-1 justify-center",
                    buyerType === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background text-muted-foreground border border-border/60 hover:border-primary/40"
                  )}
                >
                  {type === "investor" ? <Building2 className="h-4 w-4 shrink-0" /> : <Users className="h-4 w-4 shrink-0" />}
                  {type === "investor" ? "Investor" : "First-Time Buyer"}
                </button>
              ))}
            </div>

            {floorPlans.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {floorPlans.map((plan) => {
                  const isActive = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all touch-manipulation",
                        isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {plan.unit_type}
                      {parsePriceFromString(plan.price_from) && (
                        <span className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                          {fmt(parsePriceFromString(plan.price_from)!)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FTB savings banner */}
          {isFirstTimeBuyer && (
            <div className="mx-4 sm:mx-5 mt-4 flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">First-Time Buyer Savings Applied</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {price <= 1_100_000 ? "✓ Full PTT exemption · " : price <= 1_150_000 ? "✓ Partial PTT exemption · " : "✗ No PTT exemption (over $1.15M) · "}
                  {price <= 1_000_000 ? "✓ 100% GST rebate (≤$1M, Bill C-4)" : price < 1_500_000 ? "✓ Partial GST rebate ($1M–$1.5M, Bill C-4)" : "✗ No GST rebate above $1.5M"}
                  {results.gstRebate > 0 || results.ptt === 0 ? ` · You save ${fmt(results.pttRaw - results.ptt + results.gstRebate)}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="cashflow" className="w-full">
            <TabsList className="w-full h-auto p-0 bg-muted/30 rounded-none border-b border-border/50 mt-4">
              {[
                { value: "cashflow", icon: DollarSign, label: "Monthly Payment" },
                { value: "equity", icon: PiggyBank, label: "Equity & Growth" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 h-12 rounded-none gap-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors touch-manipulation"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab 1: Monthly Payment / Cash Flow ── */}
            <TabsContent value="cashflow" className="mt-0">
              <div className="p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-2 gap-6 sm:gap-8">

                {/* Left: controls */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-base font-semibold text-foreground">Total Down Payment</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Your total equity at completion</p>
                      </div>
                      <span className="text-base font-bold text-primary">{downPct}% · {fmt(results.downAmt)}</span>
                    </div>
                    <Slider min={5} max={50} step={5} value={[downPct]} onValueChange={([v]) => setDownPct(v)} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1.5"><span>5%</span><span>50%</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-base font-semibold text-foreground">Deposits During Construction</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Balance due at keys: <strong className="text-foreground">{fmt(results.remainingDown)}</strong>
                        </p>
                      </div>
                      <span className="text-base font-bold text-primary">{depositPct}% · {fmt(results.depositAmt)}</span>
                    </div>
                    <Slider min={0} max={Math.min(30, downPct)} step={1} value={[Math.min(depositPct, downPct)]} onValueChange={([v]) => setDepositPct(v)} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1.5"><span>0%</span><span>{Math.min(30, downPct)}%</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base font-semibold text-foreground">Mortgage Rate</span>
                      <span className="text-base font-bold text-primary">{rate.toFixed(2)}%</span>
                    </div>
                    <Slider min={2} max={9} step={0.01} value={[rate]} onValueChange={([v]) => setRate(parseFloat(v.toFixed(2)))} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1.5"><span>2%</span><span>9%</span></div>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-foreground mb-2.5">Amortization</p>
                    <div className="flex gap-2.5">
                      {[25, 30].map((yr) => (
                        <button key={yr} onClick={() => setAmort(yr)}
                          className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all touch-manipulation",
                            amort === yr ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          )}>{yr} yr</button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly strata + tax */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/50 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Strata Fees /mo</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" min={0} max={3000} value={strataInput}
                          onChange={(e) => { setStrataInput(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) setStrataFees(n); }}
                          onBlur={() => setStrataInput(strataFees.toString())}
                          className="w-full pl-6 pr-2 py-2 rounded-lg border border-border/60 bg-background text-sm font-bold text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Property Tax /mo</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" min={0} max={3000} value={taxInput}
                          onChange={(e) => { setTaxInput(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) setPropertyTax(n); }}
                          onBlur={() => setTaxInput(propertyTax.toString())}
                          className="w-full pl-6 pr-2 py-2 rounded-lg border border-border/60 bg-background text-sm font-bold text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                    </div>
                  </div>

                  {/* Monthly payment hero */}
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Monthly Mortgage Payment</p>
                    <p className="text-5xl font-bold text-primary">{fmt(results.monthly)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {fmt(results.mortgageAmt)} loan · {rate}% · {amort}yr
                      {results.cmhc > 0 && " · CMHC insured"}
                    </p>
                    {results.cmhc > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 mt-3">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>CMHC premium {fmt(results.cmhc)} added to mortgage (down payment &lt;20%)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: closing costs + cash flow */}
                <div className="space-y-4">

                  {/* Total cash needed — dark card */}
                  <div className="rounded-2xl bg-foreground text-background p-5">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs text-background/60 font-bold uppercase tracking-wider">Total Cash You Need</span>
                      <span className="text-2xl font-black text-background">{fmt(results.totalCashNeeded)}</span>
                    </div>

                    {/* Two buckets */}
                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      <div className="bg-background/10 rounded-xl p-3.5 text-center">
                        <div className="text-xs text-background/55 uppercase font-semibold mb-1.5">During Construction</div>
                        <div className="text-lg font-black text-background">{fmt(results.depositAmt)}</div>
                        <div className="text-xs text-background/50 mt-0.5">{depositPct}% deposits</div>
                      </div>
                      <div className="bg-background/10 rounded-xl p-3.5 text-center">
                        <div className="text-xs text-background/55 uppercase font-semibold mb-1.5">Due at Completion</div>
                        <div className="text-lg font-black text-background">{fmt(results.cashAtCompletion)}</div>
                        <div className="text-xs text-background/50 mt-0.5">keys day</div>
                      </div>
                    </div>

                    {/* Completion day breakdown */}
                    <div className="border-t border-background/15 pt-3 space-y-0">
                      <div className="text-xs text-background/50 font-bold uppercase mb-3 tracking-wider">Completion Day Breakdown</div>
                      <BreakdownRow
                        label="Remaining Down Payment"
                        value={fmt(results.remainingDown)}
                        sub={isFirstTimeBuyer
                          ? `${downPct}% of (price + net GST) − ${depositPct}% already paid`
                          : `${downPct}% of (price + GST) − ${depositPct}% already paid`}
                      />
                      {isFirstTimeBuyer ? (
                        <>
                          <BreakdownRow
                            label="GST — 5% Federal Tax"
                            value={results.gstNet > 0 ? fmt(results.gstNet) : "Fully Rebated"}
                            green={results.gstNet === 0}
                            sub={results.gstRebate > 0 ? `${fmt(results.gstGross)} gross − ${fmt(results.gstRebate)} rebate` : "No rebate above $1.5M"}
                          />
                        </>
                      ) : (
                        <BreakdownRow
                          label="GST — 5% Federal Tax"
                          value={fmt(results.gstGross)}
                          sub="Added to mortgage — not paid at closing"
                          green
                        />
                      )}
                      {results.ptt > 0 ? (
                        <BreakdownRow label="Property Transfer Tax (PTT)" value={fmt(results.ptt)} sub={isFirstTimeBuyer ? "BC one-time fee" : "Paid out of pocket at closing"} />
                      ) : (
                        <BreakdownRow label="Property Transfer Tax" value="$0 — Waived" green sub={price <= 1_100_000 ? "FTB full exemption ≤$1.1M" : "Partial FTB exemption"} />
                      )}
                      <BreakdownRow label="Lawyer / Notary Fees" value={fmt(results.legalFees)} />
                      {results.cmhc > 0 && (
                        <BreakdownRow label="CMHC Insurance" value={fmt(results.cmhc)} sub="Added to mortgage, not cash" />
                      )}
                    </div>
                  </div>

                  {/* Monthly cash flow if rent provided */}
                  {results.monthlyCashFlow !== null && (
                    <div className={cn(
                      "rounded-2xl p-5 border-2 text-center",
                      isPositiveCF ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    )}>
                      <p className={cn("text-xs font-bold uppercase tracking-widest mb-2", isPositiveCF ? "text-green-700" : "text-red-700")}>Monthly Profit After All Costs</p>
                      <p className={cn("text-5xl font-black", isPositiveCF ? "text-green-600" : "text-red-600")}>
                        {isPositiveCF ? "+" : ""}{fmt(results.monthlyCashFlow)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {fmt(projectedRent!)} rent − {fmt(results.totalMonthlyExpenses)} total expenses
                      </p>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    BC 2026 rules. FTB PTT exemption: full ≤$1.1M, phase-out to $1.15M. GST new build rebate (Bill C-4): 100% ≤$1M, partial up to $1.5M. Investors do not qualify for GST rebates. Always consult a licensed advisor.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Equity & Growth ── */}
            <TabsContent value="equity" className="mt-0">
              <div className="p-4 sm:p-6 space-y-6">

                {/* Hold period + appreciation rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-3">How Long Will You Hold?</p>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setHoldYears(Math.max(1, holdYears - 1))}
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background flex items-center justify-center text-xl font-bold hover:bg-secondary transition-colors touch-manipulation">−</button>
                      <div className="text-center">
                        <span className="text-4xl font-black text-primary">{holdYears}</span>
                        <span className="text-sm text-muted-foreground ml-1">yr</span>
                      </div>
                      <button onClick={() => setHoldYears(Math.min(20, holdYears + 1))}
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background flex items-center justify-center text-xl font-bold hover:bg-secondary transition-colors touch-manipulation">+</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Assumed Growth / Year
                    </p>
                    <div className="text-center mb-3">
                      <span className="text-4xl font-black text-primary">{appRate}</span>
                      <span className="text-sm text-muted-foreground ml-1">% / yr</span>
                    </div>
                    <Slider value={[appRate]} onValueChange={([v]) => setAppRate(v)} min={0} max={10} step={0.5} />
                  </div>
                </div>

                {/* Future value */}
                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/30 dark:to-green-950/10 border border-green-200 dark:border-green-800 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1.5">Est. Value in {holdYears} yr</p>
                    <div className="text-3xl font-black text-green-700 dark:text-green-400">{fmt(results.futureValue)}</div>
                    <div className="flex items-center gap-1.5 text-sm text-green-600 mt-1.5 font-semibold">
                      <ArrowUpRight className="h-4 w-4" />
                      +{fmt(results.appreciation)} appreciation
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1.5">Purchase price</p>
                    <p className="text-base font-semibold text-muted-foreground">{fmt(price)}</p>
                  </div>
                </div>

                {/* Equity breakdown */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><PiggyBank className="h-3.5 w-3.5" /> Total Wealth Built</p>
                      <span className="text-2xl font-black text-foreground">{fmt(results.totalEquity)}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex mb-5 bg-muted/60">
                      {[
                        { value: results.downAmt, color: "bg-primary/70" },
                        { value: results.principalPaid, color: "bg-blue-500" },
                        { value: results.appreciation, color: "bg-green-500" },
                      ].map(({ value, color }, i) => (
                        <div key={i} className={cn(color, "transition-all")}
                          style={{ width: `${(value / (results.totalEquity || 1)) * 100}%` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Down Payment", value: results.downAmt, dot: "bg-primary/70" },
                        { label: "Mortgage Paid", value: results.principalPaid, dot: "bg-blue-500" },
                        { label: "Value Growth", value: results.appreciation, dot: "bg-green-500" },
                      ].map(({ label, value, dot }) => (
                        <div key={label}>
                          <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <div className={cn("h-2.5 w-2.5 rounded-full", dot)} />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                          </div>
                          <div className="text-base font-bold text-foreground">{fmt(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Profit", value: fmt(results.totalReturn), dark: true },
                    { label: "Total Return", value: `${results.roiPct.toFixed(1)}%`, sub: `over ${holdYears} years`, dark: false },
                    { label: "Per Year", value: `${holdYears > 0 ? (results.roiPct / holdYears).toFixed(1) : "0.0"}%`, sub: "avg annual", dark: false },
                    { label: "Cash You Put In", value: fmt(results.totalCashNeeded), dark: false },
                  ].map(({ label, value, sub, dark }) => (
                    <div key={label} className={cn("rounded-2xl p-4 text-center", dark ? "bg-foreground text-background" : "bg-muted/50 border border-border/50")}>
                      <span className={cn("text-xs font-bold uppercase tracking-wider", dark ? "text-background/55" : "text-muted-foreground")}>{label}</span>
                      <div className={cn("text-lg font-black mt-2", dark ? "text-background" : "text-foreground")}>{value}</div>
                      {sub && <div className={cn("text-xs mt-0.5", dark ? "text-background/50" : "text-muted-foreground/60")}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {!isFirstTimeBuyer && (results.capRate !== null || results.cashOnCash !== null) && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Rental Metrics</p>
                    {results.capRate !== null && (
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <div>
                          <span className="text-sm text-muted-foreground">Yield (Cap Rate)</span>
                          <div className="text-xs text-muted-foreground/60 mt-0.5">Annual NOI ÷ purchase price</div>
                        </div>
                        <span className="text-base font-semibold">{results.capRate.toFixed(2)}%</span>
                      </div>
                    )}
                    {results.cashOnCash !== null && (
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <div>
                          <span className="text-sm text-muted-foreground">Cash-on-Cash Return</span>
                          <div className="text-xs text-muted-foreground/60 mt-0.5">Annual profit ÷ cash invested</div>
                        </div>
                        <span className="text-base font-semibold">{results.cashOnCash.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Projections are estimates only. Past appreciation does not guarantee future results. Consult a licensed financial advisor before purchasing.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
