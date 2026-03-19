import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TrendingUp, Home, Users, Building2, DollarSign, PiggyBank, CheckCircle2, AlertCircle, ArrowUpRight, Info } from "lucide-react";
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

function BreakdownRow({ label, value, green, sub, strikethrough }: { label: string; value: string; green?: boolean; sub?: string; strikethrough?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-background/15 last:border-0">
      <div>
        <span className="text-[12px] text-background/65">{label}</span>
        {sub && <div className="text-[10px] text-background/40 mt-0.5">{sub}</div>}
      </div>
      <span className={cn(
        "text-[12px] font-semibold",
        green && "text-green-400",
        strikethrough && "line-through text-background/35"
      )}>{value}</span>
    </div>
  );
}

export function DeckProjectionsSection({ projections, defaultPrice, floorPlans = [] }: DeckProjectionsSectionProps) {
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
  // depositPct is the actual total deposits paid during construction (used for "cash needed" calc)
  const [depositPct, setDepositPct] = useState(10);

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan ? parsePriceFromString(selectedPlan.price_from) : null;
  const price = Math.min(Math.max(planPrice ?? defaultPrice ?? 799900, 200000), 5000000);
  const projectedRent = selectedPlan?.projected_rent ?? null;
  const isFirstTimeBuyer = buyerType === "ftb";

  const results = useMemo(() => {
    // GST: 5% on new construction
    const gstGross = calculateGST(price);

    // PTT — BC 2026 rules (same as main calculator)
    const pttRaw = calculatePTT(price, false);
    const ptt = calculatePTT(price, isFirstTimeBuyer);

    // ── INVESTOR logic ──
    // GST is added to the mortgage (not paid out of pocket)
    // Down payment = (purchase price + full GST) × down%
    // PTT is paid out of pocket at completion
    // cashAtCompletion = remaining down + PTT + legal fees (NO cash GST)
    //
    // ── FIRST-TIME BUYER logic ──
    // GST rebate applied (Bill C-4 2026): 100% ≤$1M, partial $1M–$1.5M
    // Net GST is paid out of pocket at completion (reduced by rebate)
    // Down payment = (price + net GST) × down%
    // PTT may be fully/partially waived

    const gstRebate = isFirstTimeBuyer ? calculateGSTRebate(price, gstGross) : 0;
    const gstNet = gstGross - gstRebate;

    // Base for down payment calculation:
    // Investor: price + full GST (GST rolls into mortgage, but down% is on that base)
    // FTB: price + net GST (what they actually need to finance)
    const priceWithGST = price + gstGross; // investor base (GST always in mortgage)
    const priceWithGSTNet = price + gstNet; // FTB base

    // Deposits paid during construction (% of purchase price, no GST)
    const depositAmt = price * (depositPct / 100);

    // Down payment base
    const downBase = isFirstTimeBuyer ? priceWithGSTNet : priceWithGST;
    const downAmt = downBase * (downPct / 100);

    // Remaining down payment due at completion (after deposits already paid)
    const remainingDown = Math.max(0, downAmt - depositAmt);

    // Mortgage principal
    // Investor: (price + GST) − down (GST rolled into mortgage)
    // FTB: (price + netGST) − down
    const baseMortgage = downBase - downAmt;
    const cmhc = calculateCMHCInsurance(baseMortgage, downPct);
    const mortgageAmt = baseMortgage + cmhc;
    const monthly = calcMortgage(mortgageAmt, rate, amort);

    // Legal/notary fees — $2,000 default
    const legalFees = 2000;

    // Cash needed at completion:
    // Investor: remaining down + PTT (out of pocket) + legal fees (NO GST cash — it's in mortgage)
    // FTB: remaining down + PTT (may be waived) + net GST (cash) + legal fees
    const cashAtCompletion = isFirstTimeBuyer
      ? remainingDown + ptt + gstNet + legalFees
      : remainingDown + ptt + legalFees;

    const totalCashNeeded = depositAmt + cashAtCompletion;

    // Cash flow (if rent provided)
    const totalMonthlyExpenses = monthly + strataFees + propertyTax;
    const monthlyCashFlow = projectedRent ? projectedRent - totalMonthlyExpenses : null;
    const annualCashFlow = monthlyCashFlow !== null ? monthlyCashFlow * 12 : null;

    // Equity / growth
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
    <div id="projections" className="w-full">

        <div className="mb-8 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">06 — Your Numbers</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Run Your Numbers</h2>
          <p className="text-muted-foreground text-sm">Estimate your monthly payment and what you need at closing. BC 2026 tax rules applied.</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

          {/* Header bar */}
          <div className="bg-foreground px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-background leading-none">Investment Calculator</h3>
                <p className="text-[11px] text-background/40 mt-0.5">BC 2026 · GST rebate · PTT exemption rules applied</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-background/40 uppercase tracking-wider">Purchase price</p>
              <p className="text-xl font-bold text-primary">{fmt(price)}</p>
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
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all touch-manipulation flex-1 justify-center",
                    buyerType === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background text-muted-foreground border border-border/60 hover:border-primary/40"
                  )}
                >
                  {type === "investor" ? <Building2 className="h-3.5 w-3.5 shrink-0" /> : <Users className="h-3.5 w-3.5 shrink-0" />}
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
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all touch-manipulation",
                        isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {plan.unit_type}
                      {parsePriceFromString(plan.price_from) && (
                        <span className={cn("text-[10px]", isActive ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
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
            <div className="mx-4 sm:mx-5 mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-800 dark:text-green-300">First-Time Buyer Savings Applied</p>
                <p className="text-[11px] text-green-700 dark:text-green-400 mt-0.5">
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
                  className="flex-1 h-11 rounded-none gap-1.5 text-xs sm:text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors touch-manipulation"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab 1: Monthly Payment / Cash Flow ── */}
            <TabsContent value="cashflow" className="mt-0">
              <div className="p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-2 gap-5 sm:gap-6">

                {/* Left: controls */}
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">Total Down Payment</span>
                        <p className="text-[10px] text-muted-foreground">Your total equity at completion</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{downPct}% · {fmt(results.downAmt)}</span>
                    </div>
                    <Slider min={5} max={50} step={5} value={[downPct]} onValueChange={([v]) => setDownPct(v)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5%</span><span>50%</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">Deposits During Construction</span>
                        <p className="text-[10px] text-muted-foreground">
                          Balance due at keys: <strong className="text-foreground">{fmt(results.remainingDown)}</strong>
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">{depositPct}% · {fmt(results.depositAmt)}</span>
                    </div>
                    <Slider min={0} max={Math.min(30, downPct)} step={1} value={[Math.min(depositPct, downPct)]} onValueChange={([v]) => setDepositPct(v)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0%</span><span>{Math.min(30, downPct)}%</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Mortgage Rate</span>
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
                            amort === yr ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          )}>{yr} yr</button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly strata + tax */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Strata Fees /mo</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" min={0} max={3000} value={strataInput}
                          onChange={(e) => { setStrataInput(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) setStrataFees(n); }}
                          onBlur={() => setStrataInput(strataFees.toString())}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-border/60 bg-background text-sm font-bold text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Property Tax /mo</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" min={0} max={3000} value={taxInput}
                          onChange={(e) => { setTaxInput(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) setPropertyTax(n); }}
                          onBlur={() => setTaxInput(propertyTax.toString())}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-border/60 bg-background text-sm font-bold text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                    </div>
                  </div>

                  {/* Monthly payment hero */}
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Monthly Mortgage Payment</p>
                    <p className="text-4xl font-bold text-primary">{fmt(results.monthly)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmt(results.mortgageAmt)} loan · {rate}% · {amort}yr
                      {results.cmhc > 0 && " · CMHC insured"}
                    </p>
                    {results.cmhc > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>CMHC premium {fmt(results.cmhc)} added to mortgage (down payment &lt;20%)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: closing costs + cash flow */}
                <div className="space-y-4">

                  {/* Total cash needed — dark card */}
                  <div className="rounded-2xl bg-foreground text-background p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] text-background/50 font-bold uppercase tracking-wider">Total Cash You Need</span>
                      <span className="text-2xl font-black text-background">{fmt(results.totalCashNeeded)}</span>
                    </div>

                    {/* Two buckets */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-background/8 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-background/45 uppercase font-semibold mb-1">During Construction</div>
                        <div className="text-base font-black text-background">{fmt(results.depositAmt)}</div>
                        <div className="text-[9px] text-background/40 mt-0.5">{depositPct}% deposits</div>
                      </div>
                      <div className="bg-background/8 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-background/45 uppercase font-semibold mb-1">Due at Completion</div>
                        <div className="text-base font-black text-background">{fmt(results.cashAtCompletion)}</div>
                        <div className="text-[9px] text-background/40 mt-0.5">keys day</div>
                      </div>
                    </div>

                    {/* Completion day breakdown */}
                    <div className="border-t border-background/15 pt-3 space-y-0.5">
                      <div className="text-[9px] text-background/40 font-bold uppercase mb-2 tracking-wider">Completion Day Breakdown</div>
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
                      {!isFirstTimeBuyer && (
                        <BreakdownRow
                          label="GST in Mortgage"
                          value={fmt(results.gstGross)}
                          sub={`Mortgage = ${fmt(results.mortgageAmt)} (incl. GST)`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Monthly cash flow if rent provided */}
                  {results.monthlyCashFlow !== null && (
                    <div className={cn(
                      "rounded-2xl p-4 border-2 text-center",
                      isPositiveCF ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    )}>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isPositiveCF ? "text-green-700" : "text-red-700")}>Monthly Profit After All Costs</p>
                      <p className={cn("text-4xl font-black", isPositiveCF ? "text-green-600" : "text-red-600")}>
                        {isPositiveCF ? "+" : ""}{fmt(results.monthlyCashFlow)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmt(projectedRent!)} rent − {fmt(results.totalMonthlyExpenses)} total expenses
                      </p>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    BC 2026 rules. FTB PTT exemption: full ≤$1.1M, phase-out to $1.15M. GST new build rebate (Bill C-4): 100% ≤$1M, partial up to $1.5M. Investors do not qualify for GST rebates. Always consult a licensed advisor.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Equity & Growth ── */}
            <TabsContent value="equity" className="mt-0">
              <div className="p-4 sm:p-6 space-y-5">

                {/* Hold period + appreciation rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-3">How Long Will You Hold?</p>
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
                      <TrendingUp className="h-3 w-3" /> Assumed Growth / Year
                    </p>
                    <div className="text-center mb-2">
                      <span className="text-4xl font-black text-primary">{appRate}</span>
                      <span className="text-[12px] text-muted-foreground ml-1">% / yr</span>
                    </div>
                    <Slider value={[appRate]} onValueChange={([v]) => setAppRate(v)} min={0} max={10} step={0.5} />
                  </div>
                </div>

                {/* Future value */}
                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/30 dark:to-green-950/10 border border-green-200 dark:border-green-800 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Est. Value in {holdYears} yr</p>
                    <div className="text-3xl font-black text-green-700 dark:text-green-400">{fmt(results.futureValue)}</div>
                    <div className="flex items-center gap-1 text-[13px] text-green-600 mt-1 font-semibold">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      +{fmt(results.appreciation)} appreciation
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Purchase price</p>
                    <p className="text-[14px] font-semibold text-muted-foreground">{fmt(price)}</p>
                  </div>
                </div>

                {/* Equity breakdown */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><PiggyBank className="h-3 w-3" /> Total Wealth Built</p>
                      <span className="text-xl font-black text-foreground">{fmt(results.totalEquity)}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex mb-4 bg-muted/60">
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
                    { label: "Total Profit", value: fmt(results.totalReturn), dark: true },
                    { label: "Total Return", value: `${results.roiPct.toFixed(1)}%`, sub: `over ${holdYears} years`, dark: false },
                    { label: "Per Year", value: `${holdYears > 0 ? (results.roiPct / holdYears).toFixed(1) : "0.0"}%`, sub: "avg annual", dark: false },
                    { label: "Cash You Put In", value: fmt(results.totalCashNeeded), dark: false },
                  ].map(({ label, value, sub, dark }) => (
                    <div key={label} className={cn("rounded-2xl p-3.5 text-center", dark ? "bg-foreground text-background" : "bg-muted/50 border border-border/50")}>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", dark ? "text-background/45" : "text-muted-foreground")}>{label}</span>
                      <div className={cn("text-[15px] font-black mt-1.5", dark ? "text-background" : "text-foreground")}>{value}</div>
                      {sub && <div className={cn("text-[10px] mt-0.5", dark ? "text-background/40" : "text-muted-foreground/60")}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {!isFirstTimeBuyer && (results.capRate !== null || results.cashOnCash !== null) && (
                  <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Rental Metrics</p>
                    {results.capRate !== null && (
                      <div className="flex justify-between py-2 border-b border-border/30">
                        <div>
                          <span className="text-sm text-muted-foreground">Yield (Cap Rate)</span>
                          <div className="text-[10px] text-muted-foreground/60">Annual NOI ÷ purchase price</div>
                        </div>
                        <span className="text-sm font-semibold">{results.capRate.toFixed(2)}%</span>
                      </div>
                    )}
                    {results.cashOnCash !== null && (
                      <div className="flex justify-between py-2 border-b border-border/30">
                        <div>
                          <span className="text-sm text-muted-foreground">Cash-on-Cash Return</span>
                          <div className="text-[10px] text-muted-foreground/60">Annual profit ÷ cash invested</div>
                        </div>
                        <span className="text-sm font-semibold">{results.cashOnCash.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Projections are estimates only. Past appreciation does not guarantee future results. Consult a licensed financial advisor before purchasing.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
