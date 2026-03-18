import { useState, useMemo } from "react";
import { Clock, Key, FileSignature, DollarSign, Check } from "lucide-react";
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
  price_from: string;
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

const STEP_ICONS = [FileSignature, Clock, Clock, Clock, DollarSign];

const TIMING_DESCRIPTIONS: Record<string, string> = {
  "Due within 7 days": "Your first deposit is due within 7 days of signing your Purchase Agreement.",
  "Due in 7 days": "Your first deposit is due within 7 days of signing your Purchase Agreement.",
  "Due in 3 months": "Second deposit is due 90 days after signing.",
  "Due in 6 months": "Third deposit is due 180 days after signing. No further payments until completion.",
};

function getTimingDescription(timing: string): string {
  return TIMING_DESCRIPTIONS[timing] || timing;
}

export function DeckDepositTimelineSection({
  depositSteps,
  projectName,
  completionYear,
  defaultPrice,
  floorPlans = [],
}: DeckDepositTimelineSectionProps) {
  const plansWithPrice = floorPlans.filter((fp) => fp.price_from && parsePrice(fp.price_from) > 0);
  const fallbackPrice = plansWithPrice[0] ? parsePrice(plansWithPrice[0].price_from) : (defaultPrice ?? DEFAULT_PRICE);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plansWithPrice[0]?.id ?? null);
  const [manualPrice, setManualPrice] = useState<number>(fallbackPrice);

  const price = useMemo(() => {
    if (selectedPlanId) {
      const plan = plansWithPrice.find((p) => p.id === selectedPlanId);
      if (plan) return parsePrice(plan.price_from);
    }
    return manualPrice;
  }, [selectedPlanId, manualPrice, plansWithPrice]);

  const steps = depositSteps.length > 0 ? depositSteps : [];
  const totalDepositPct = useMemo(() => steps.reduce((acc, s) => acc + s.percent, 0), [steps]);
  const totalDepositAmt = price * (totalDepositPct / 100);
  const balanceAtCompletion = price - totalDepositAmt;

  return (
    <section id="deposit-timeline" className="relative py-14 sm:py-20 overflow-hidden bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-8 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">When You Pay</h2>
          <p className="text-muted-foreground text-sm max-w-lg">
            Every payment from signing to completion — clearly laid out. <strong className="text-foreground">No payments during construction.</strong>
          </p>
        </div>

        {/* Unit price selector */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Calculate for unit</p>
              <p className="text-xl font-black text-primary">{fmt(price)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {plansWithPrice.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all touch-manipulation",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-background text-foreground hover:border-primary/50"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                    {plan.unit_type}
                    <span className={cn("font-normal", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {fmt(parsePrice(plan.price_from))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 p-5 rounded-2xl border border-border/60 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Unit Price</p>
              <span className="text-xl font-bold text-primary">{fmt(price)}</span>
            </div>
            <input
              type="range" min={300_000} max={2_000_000} step={10_000}
              value={manualPrice}
              onChange={(e) => { setSelectedPlanId(null); setManualPrice(Number(e.target.value)); }}
              className="w-full accent-primary h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>$300K</span><span>$2M</span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Deposit steps */}
          <div className="space-y-3">
            {steps.map((node, i) => {
              const amt = price * (node.percent / 100);
              const StepIcon = STEP_ICONS[i] ?? Clock;
              const isLast = i === steps.length - 1;
              const desc = getTimingDescription(node.timing);

              return (
                <div key={node.id} className="relative">
                  <div className="flex gap-4 items-stretch">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 bg-card border-border/70 text-muted-foreground shrink-0">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      {!isLast && <div className="w-px flex-1 min-h-[16px] bg-border/40 mt-1" />}
                    </div>

                    {/* Card */}
                    <div className="flex-1 rounded-xl px-4 py-3.5 border border-border/50 bg-card mb-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight">{node.label}</p>
                          <p className="text-xs font-semibold text-primary mt-0.5">{node.timing}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{desc}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-base font-black text-primary">{fmt(amt)}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{node.percent}% of price</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Under Construction gap */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex flex-col items-center shrink-0 w-10">
              <div className="w-px h-3 bg-border/30" />
              <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
              <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
              <div className="w-px h-3 border-l-2 border-dashed border-primary/30" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-dashed border-border/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Under Construction — No Further Payments</span>
            </div>
          </div>

          {/* Completion node */}
          <div className="flex gap-4 items-start">
            <div className="relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 bg-primary border-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] shrink-0 mt-0.5">
              <Key className="h-4 w-4" />
            </div>
            <div className="flex-1 rounded-xl px-4 py-4 border border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary leading-tight">Completion & Possession</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completionYear ? `Estimated ${completionYear}` : "Estimated completion"}
                  </p>
                  <p className="text-[12px] text-foreground/80 mt-2 leading-snug">
                    Pay any <strong>remaining down payment</strong> and take possession. The {totalDepositPct}% already paid counts toward your down payment.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-primary/80 bg-primary/10 rounded-lg px-3 py-2 w-fit">
                    <span>🏦 Mortgage begins here</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Balance owing</p>
                  <p className="text-lg font-black text-primary">{fmt(balanceAtCompletion)}</p>
                  <p className="text-[10px] text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% of price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Total Deposits", value: fmt(totalDepositAmt), sub: `${totalDepositPct}% during construction` },
              { label: "Balance at Keys", value: fmt(balanceAtCompletion), sub: `${(100 - totalDepositPct).toFixed(0)}% at completion` },
              { label: "Purchase Price", value: fmt(price), sub: "All-in before taxes" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl bg-muted/40 border border-border/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-sm sm:text-base font-black text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
