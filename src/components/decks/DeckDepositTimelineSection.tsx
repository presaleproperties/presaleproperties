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
  const mortgageBase = balanceAtCompletion * 0.8;
  const monthlyPayment = calcMonthly(mortgageBase);

  const selectedPlan = plansWithPrice.find((p) => p.id === selectedPlanId);

  const allNodes = [
    ...steps.map((s, i) => ({ ...s, isCompletion: false, idx: i })),
    {
      id: "__completion__",
      label: "Completion & Keys",
      percent: 100 - totalDepositPct,
      timing: completionYear ? `Estimated ${completionYear}` : "Estimated completion",
      isCompletion: true,
      idx: steps.length,
    },
  ];

  return (
    <section id="deposit-timeline" className="relative py-14 sm:py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-8 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">06 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How & When You Pay</h2>
          <p className="text-muted-foreground text-sm">A simple breakdown of every payment — from signing to getting your keys.</p>
        </div>

        {/* Floor plan selector or slider */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Select Unit</p>
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

        {/* Timeline full width */}
        <div className="relative">
            {/* Deposit steps */}
            <div className="space-y-3">
              {allNodes.filter(n => !n.isCompletion).map((node, i, arr) => {
                const amt = price * (node.percent / 100);
                const StepIcon = STEP_ICONS[node.idx] ?? Clock;
                const isLast = i === arr.length - 1;

                return (
                  <div key={node.id} className="relative">
                    <div className="flex gap-4 items-center">
                      {/* Icon + connector */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 bg-card border-border/70 text-muted-foreground">
                          <StepIcon className="h-4 w-4" />
                        </div>
                        {!isLast && <div className="w-px flex-1 min-h-[12px] bg-border/50 mt-1" />}
                      </div>

                      {/* Row card */}
                      <div className="flex-1 flex items-center justify-between rounded-xl px-4 py-3 border border-border/50 bg-card">
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{node.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{node.timing}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-base font-black text-primary">{fmt(amt)}</p>
                          <p className="text-[10px] text-muted-foreground">{node.percent}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gap divider — Under Construction period */}
            <div className="flex items-center gap-3 my-5 pl-0">
              <div className="flex flex-col items-center shrink-0 w-10">
                <div className="w-px h-4 bg-border/30" />
                <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
                <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
                <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-dashed border-border/60">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Under Construction</span>
              </div>
            </div>

            {/* Completion node */}
            {allNodes.filter(n => n.isCompletion).map((node) => (
              <div key={node.id} className="flex gap-4 items-start">
                <div className="relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 bg-primary border-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] shrink-0 mt-0.5">
                  <Key className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-xl px-4 py-3 border border-primary/30 bg-primary/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-primary leading-tight">Completion — Keys in Hand</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{node.timing}</p>
                      <p className="text-[11px] text-primary/70 mt-1.5 font-medium">🏦 Mortgage starts here — your balance becomes your loan</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-primary">{fmt(balanceAtCompletion)}</p>
                      <p className="text-[10px] text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% balance</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
