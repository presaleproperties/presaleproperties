import { useState, useMemo } from "react";
import { Clock, TrendingUp, ChevronDown, ChevronUp, CalendarDays, Key, FileSignature, DollarSign, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepositStep {
  id: string;
  label: string;
  percent: number;
  timing: string;
  note?: string;
}

interface FloorPlan {
  id: string;
  unit_type: string;
  size_range?: string;
  price_from: string;
  beds?: number | null;
  baths?: number | null;
  interior_sqft?: number | null;
}

interface DeckDepositTimelineSectionProps {
  depositSteps: DepositStep[];
  projectName: string;
  completionYear?: string;
  defaultPrice?: number;
  floorPlans?: FloorPlan[];
}

const DEFAULT_PRICE = 799_000;

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-CA");
}

function parsePrice(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function calcMonthly(principal: number, annualRate = 5.24, years = 25) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const STEP_ICONS = [FileSignature, Clock, Clock, Clock, DollarSign];

export function DeckDepositTimelineSection({
  depositSteps,
  projectName,
  completionYear,
  defaultPrice,
  floorPlans = [],
}: DeckDepositTimelineSectionProps) {
  // Determine selectable floor plans (those with a price)
  const plansWithPrice = floorPlans.filter((fp) => fp.price_from && parsePrice(fp.price_from) > 0);

  const firstPlanPrice = plansWithPrice[0] ? parsePrice(plansWithPrice[0].price_from) : undefined;
  const fallbackPrice = firstPlanPrice ?? defaultPrice ?? DEFAULT_PRICE;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plansWithPrice[0]?.id ?? null);
  const [manualPrice, setManualPrice] = useState<number>(fallbackPrice);
  const [activeStep, setActiveStep] = useState<string | null>(depositSteps[0]?.id ?? null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Price driven by selected floor plan, or manual slider if no plans
  const price = useMemo(() => {
    if (selectedPlanId) {
      const plan = plansWithPrice.find((p) => p.id === selectedPlanId);
      if (plan) return parsePrice(plan.price_from);
    }
    return manualPrice;
  }, [selectedPlanId, manualPrice, plansWithPrice]);

  const steps = depositSteps.length > 0 ? depositSteps : [];

  const totalDepositPct = useMemo(
    () => steps.reduce((acc, s) => acc + s.percent, 0),
    [steps]
  );
  const totalDepositAmt = price * (totalDepositPct / 100);
  const balanceAtCompletion = price - totalDepositAmt;

  const gstEstimate = price * 0.05;
  const gstRebate = price <= 1_500_000 ? Math.min(gstEstimate * (1 - (price - 350_000) / 1_150_000), gstEstimate) : 0;
  const netGst = Math.max(gstEstimate - gstRebate, 0);
  const ptt = price <= 1_100_000 ? 0 : price <= 1_150_000 ? (price - 1_100_000) * 0.02 : (price * 0.02) - 8_000 + (price - 500_000) * 0.01;
  const closingCosts = 1_800;
  const totalClosingCosts = netGst + ptt + closingCosts;
  const cashAtCompletion = balanceAtCompletion + totalClosingCosts;
  const mortgageBase = balanceAtCompletion * 0.8;
  const monthlyPayment = calcMonthly(mortgageBase);

  const cumulative = (idx: number) =>
    steps.slice(0, idx + 1).reduce((a, s) => a + s.percent, 0);

  const allNodes = [
    ...steps.map((s, i) => ({ ...s, isCompletion: false, idx: i })),
    {
      id: "__completion__",
      label: "Completion & Keys",
      percent: 100 - totalDepositPct,
      timing: completionYear ? `Estimated ${completionYear}` : "Estimated completion",
      note: `Balance of ${fmt(balanceAtCompletion)} financed via mortgage. GST, PTT & legal fees due at closing.`,
      isCompletion: true,
      idx: steps.length,
    },
  ];

  const selectedPlan = plansWithPrice.find((p) => p.id === selectedPlanId);

  return (
    <section id="deposit-timeline" className="relative py-14 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">06</div>

        {/* Header */}
        <div className="mb-10 sm:mb-14 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">06 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Roadmap to Completion</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Select a floor plan to see your exact deposit schedule and closing costs.
          </p>
        </div>

        {/* Floor plan selector (if plans exist) or manual price slider */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 p-5 rounded-2xl border border-border/60 bg-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Select Your Unit</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deposit amounts auto-calculate from the listed price</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-primary">{fmt(price)}</p>
                {selectedPlan && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{selectedPlan.unit_type}{selectedPlan.interior_sqft ? ` · ${selectedPlan.interior_sqft} sqft` : ""}</p>
                )}
              </div>
            </div>

            {/* Plan toggle pills */}
            <div className="flex flex-wrap gap-2">
              {plansWithPrice.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const planPrice = parsePrice(plan.price_from);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "relative flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all duration-200 touch-manipulation",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-primary" />
                    )}
                    <span className={cn("text-xs font-bold leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                      {plan.unit_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{fmt(planPrice)}</span>
                    {plan.interior_sqft && (
                      <span className="text-[10px] text-muted-foreground">{plan.interior_sqft} sqft</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Fallback: manual slider when no floor plans have prices */
          <div className="mb-8 p-5 rounded-2xl border border-border/60 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Adjust Your Unit Price</p>
              <span className="text-xl font-bold text-primary">{fmt(price)}</span>
            </div>
            <input
              type="range"
              min={300_000}
              max={2_000_000}
              step={10_000}
              value={manualPrice}
              onChange={(e) => { setSelectedPlanId(null); setManualPrice(Number(e.target.value)); }}
              className="w-full accent-primary h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>$300K</span><span>$2M</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* ── Left: Vertical roadmap ── */}
          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-primary/20 z-0" />

            <div className="space-y-0">
              {allNodes.map((node, i) => {
                const isActive = activeStep === node.id;
                const amt = node.isCompletion ? balanceAtCompletion : price * (node.percent / 100);
                const cum = node.isCompletion ? totalDepositPct : cumulative(node.idx);
                const cumAmt = price * (cum / 100);
                const StepIcon = node.isCompletion ? Key : (STEP_ICONS[node.idx] ?? Clock);

                return (
                  <div key={node.id} className="relative flex gap-4 sm:gap-6 pb-0">
                    {/* Node circle */}
                    <div className="relative z-10 flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveStep(isActive ? null : node.id)}
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md touch-manipulation",
                          node.isCompletion
                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                            : isActive
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-card border-border/80 text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <StepIcon className="h-5 w-5" />
                      </button>
                      {!node.isCompletion && (
                        <span className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">
                          Step {node.idx + 1}
                        </span>
                      )}
                      {node.isCompletion && (
                        <span className="text-[9px] font-bold text-primary mt-1 uppercase tracking-wide">Keys</span>
                      )}
                    </div>

                    {/* Card */}
                    <div className={cn(
                      "flex-1 mb-4 rounded-2xl border transition-all duration-200",
                      node.isCompletion
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : isActive
                        ? "border-primary/30 bg-primary/3 shadow-sm"
                        : "border-border/50 bg-card hover:border-primary/20"
                    )}>
                      <button
                        type="button"
                        onClick={() => setActiveStep(isActive ? null : node.id)}
                        className="w-full text-left p-4 sm:p-5 touch-manipulation"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn(
                              "font-bold text-base leading-tight",
                              node.isCompletion ? "text-primary" : "text-foreground"
                            )}>{node.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{node.timing}</p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <p className="text-lg font-black text-primary leading-tight">{fmt(amt)}</p>
                              <p className="text-[10px] text-muted-foreground text-right">
                                {node.isCompletion ? `${(100 - totalDepositPct).toFixed(0)}% balance` : `${node.percent}%`}
                              </p>
                            </div>
                            {!node.isCompletion && (
                              isActive
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        <div className="mt-3 w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", node.isCompletion ? "bg-primary" : "bg-primary/70")}
                            style={{ width: `${Math.min(node.isCompletion ? 100 : cum, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {node.isCompletion ? "100% of purchase price" : `${cum}% of purchase price secured`}
                        </p>
                      </button>

                      {isActive && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/40 mt-0 space-y-2">
                          {!node.isCompletion && (
                            <>
                              <div className="flex items-center justify-between text-xs pt-3">
                                <span className="text-muted-foreground">Cumulative deposits after this step</span>
                                <span className="font-semibold text-foreground">{fmt(cumAmt)} ({cum}%)</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Balance still remaining</span>
                                <span className="font-semibold text-foreground">{fmt(price - cumAmt)}</span>
                              </div>
                            </>
                          )}
                          {node.isCompletion && (
                            <div className="pt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-background border border-border/50 p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Balance Due</p>
                                <p className="text-base font-black text-foreground">{fmt(balanceAtCompletion)}</p>
                              </div>
                              <div className="rounded-xl bg-background border border-border/50 p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Monthly</p>
                                <p className="text-base font-black text-primary">{fmt(monthlyPayment)}/mo</p>
                              </div>
                            </div>
                          )}
                          {node.note && (
                            <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">{node.note}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Summary ── */}
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* Summary card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Payment Summary</p>
                <p className="text-2xl font-bold text-foreground mt-1">{fmt(price)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlan ? `${selectedPlan.unit_type} · ${projectName}` : projectName}
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        idx === 0 ? "bg-primary" : idx === 1 ? "bg-primary/65" : idx === 2 ? "bg-primary/40" : "bg-primary/25"
                      )} />
                      <span className="text-muted-foreground text-xs">{step.label}</span>
                      <span className="text-[10px] text-muted-foreground/60">{step.timing}</span>
                    </div>
                    <span className="font-semibold text-foreground text-xs">{fmt(price * step.percent / 100)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total Deposits</span>
                  <span className="text-sm font-bold text-primary">{fmt(totalDepositAmt)} <span className="text-muted-foreground font-normal text-[10px]">({totalDepositPct}%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance at Completion</span>
                  <span className="text-sm font-semibold text-foreground">{fmt(balanceAtCompletion)}</span>
                </div>
              </div>
            </div>

            {/* Cash at completion toggle */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBreakdown(b => !b)}
                className="w-full flex items-center justify-between px-5 py-4 text-left touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Cash Needed at Completion</span>
                </div>
                {showBreakdown ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showBreakdown && (
                <div className="px-5 pb-5 space-y-2.5 border-t border-border/50 pt-4">
                  <SummaryRow label="Purchase Price" value={fmt(price)} />
                  <SummaryRow label={`Deposits Paid (${totalDepositPct}%)`} value={`− ${fmt(totalDepositAmt)}`} muted />
                  <SummaryRow label="Balance Due" value={fmt(balanceAtCompletion)} highlight />
                  <div className="h-px bg-border/50 my-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Estimated Closing Costs</p>
                  <SummaryRow label="GST (Net of Rebate)" value={fmt(netGst)} />
                  <SummaryRow label="Property Transfer Tax" value={price <= 1_100_000 ? "Exempt (FTB)" : fmt(ptt)} />
                  <SummaryRow label="Legal / Conveyancing" value={fmt(closingCosts)} />
                  <div className="h-px bg-border/50 my-1" />
                  <SummaryRow label="Total Cash at Closing" value={fmt(cashAtCompletion)} highlight bold />
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    PTT exempt for First-Time Buyers ≤$1.1M. GST rebate applies ≤$1.5M. Estimates only — consult your notary.
                  </p>
                </div>
              )}
            </div>

            {/* Mortgage snapshot */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Mortgage at Completion</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Monthly</p>
                  <p className="text-lg font-bold text-primary">{fmt(monthlyPayment)}/mo</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">5.24% · 25yr amort</p>
                </div>
                <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mortgage Base</p>
                  <p className="text-lg font-bold text-foreground">{fmt(mortgageBase)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">80% LTV assumed</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Based on 20% down at completion. Rate subject to change. Speak with a mortgage advisor for a personalized estimate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, muted, highlight, bold }: { label: string; value: string; muted?: boolean; highlight?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn("text-muted-foreground", muted && "line-through opacity-60")}>{label}</span>
      <span className={cn("font-semibold text-foreground", highlight && "text-primary", bold && "text-sm")}>{value}</span>
    </div>
  );
}
