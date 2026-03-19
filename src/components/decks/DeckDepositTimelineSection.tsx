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

        {/* Timeline nodes */}
        <div className="flex items-start gap-0">
          {nodes.map((node, i) => {
            const isLast = i === nodes.length - 1;
            return (
              <div key={node.id} className="flex-1 flex flex-col items-center relative">
                {/* Connecting line */}
                {!isLast && (
                  <div className="absolute top-3 left-1/2 right-0 h-px bg-border/50" style={{ width: "100%" }} />
                )}

                {/* Dot */}
                <div className={cn(
                  "relative z-10 w-6 h-6 rounded-full border-2 mb-3 shrink-0",
                  node.isCompletion
                    ? "bg-primary border-primary"
                    : "bg-background border-border/60"
                )} />

                {/* Content */}
                <div className="text-center px-1 w-full">
                  <p className={cn(
                    "text-xl sm:text-2xl font-black leading-none mb-1",
                    node.isCompletion ? "text-primary" : "text-foreground"
                  )}>
                    {node.percent}%
                  </p>
                  <p className="text-xs font-semibold text-foreground mb-0.5">{node.label}</p>
                  <p className="text-[10px] text-muted-foreground mb-2 leading-tight">{node.timing}</p>
                  <p className={cn(
                    "text-xs font-bold",
                    node.isCompletion ? "text-primary" : "text-muted-foreground"
                  )}>
                    {fmt(node.amt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total deposits ({totalDepositPct}%)</span>
          <span className="font-bold text-foreground">{fmt(totalDepositAmt)}</span>
        </div>

      </div>
    </section>
  );
}
