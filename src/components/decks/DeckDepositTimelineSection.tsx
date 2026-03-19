import { useState, useMemo } from "react";
import { Check } from "lucide-react";
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

export function DeckDepositTimelineSection({
  depositSteps,
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

  const nodes = [
    ...steps.map((s) => ({
      id: s.id,
      label: s.label,
      timing: s.timing,
      percent: s.percent,
      amt: price * (s.percent / 100),
      isCompletion: false,
    })),
    {
      id: "completion",
      label: "Possession",
      timing: completionYear ? `Est. ${completionYear}` : "At completion",
      percent: 100 - totalDepositPct,
      amt: balanceAtCompletion,
      isCompletion: true,
    },
  ];

  return (
    <div id="deposit-timeline" className="w-full">

        {/* Header */}
        <div className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">05 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Deposit Structure</h2>
          <p className="text-muted-foreground text-sm mt-1">No payments during construction.</p>
        </div>

        {/* Unit selector */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {plansWithPrice.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background text-foreground hover:border-primary/40"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {plan.unit_type} · {fmt(parsePrice(plan.price_from))}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unit price</span>
              <span className="font-bold text-foreground">{fmt(price)}</span>
            </div>
            <input
              type="range" min={300_000} max={2_000_000} step={10_000}
              value={manualPrice}
              onChange={(e) => { setSelectedPlanId(null); setManualPrice(Number(e.target.value)); }}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
          </div>
        )}

        {/* Vertical timeline */}
        <div className="relative flex flex-col">
          {nodes.map((node, i) => {
            const isLast = i === nodes.length - 1;
            const isConstGap = !node.isCompletion && i === steps.length - 1;
            return (
              <div key={node.id}>
                <div className="flex items-start gap-4">
                  {/* Left: dot + connector */}
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                      node.isCompletion
                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                        : "bg-background border-border/70 text-muted-foreground"
                    )}>
                      {node.isCompletion
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        : <span className="text-[11px] font-bold text-foreground">{i + 1}</span>
                      }
                    </div>
                    {!isLast && (
                      <div className={cn(
                        "w-px flex-1 min-h-[28px] mt-1",
                        isConstGap ? "border-l-2 border-dashed border-border/40" : "bg-border/40"
                      )} />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={cn(
                    "flex-1 pb-5",
                    isLast && "pb-0"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn(
                          "text-sm font-bold leading-tight",
                          node.isCompletion ? "text-primary" : "text-foreground"
                        )}>{node.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{node.timing}</p>
                        {node.isCompletion && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1">Mortgage starts here</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-base font-black leading-none",
                          node.isCompletion ? "text-primary" : "text-foreground"
                        )}>{fmt(node.amt)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{node.percent}%</p>
                      </div>
                    </div>

                    {/* Construction gap tag after last deposit */}
                    {isConstGap && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-dashed border-border/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">No payments during construction</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total deposits ({totalDepositPct}%)</span>
          <span className="font-bold text-foreground">{fmt(totalDepositAmt)}</span>
        </div>

    </div>
  );
}
