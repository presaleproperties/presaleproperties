import { useState, useMemo } from "react";
import { Check, Key } from "lucide-react";
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

  // All nodes: deposit steps + completion
  const allNodes = [
    ...steps.map((s, i) => ({
      id: s.id,
      label: s.label,
      timing: s.timing,
      percent: s.percent,
      amt: price * (s.percent / 100),
      isCompletion: false,
      index: i,
    })),
    {
      id: "completion",
      label: "Completion",
      timing: completionYear ? `Est. ${completionYear}` : "Est. Completion",
      percent: 100 - totalDepositPct,
      amt: balanceAtCompletion,
      isCompletion: true,
      index: steps.length,
    },
  ];

  return (
    <section id="deposit-timeline" className="relative py-14 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-8 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Deposit Structure</h2>
          <p className="text-muted-foreground text-sm">
            Simple payments from signing to completion. <strong className="text-foreground">No payments during construction.</strong>
          </p>
        </div>

        {/* Unit price selector */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 p-4 rounded-2xl border border-border/60 bg-card">
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

        {/* ── One-liner horizontal timeline ── */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-px bg-border/50" style={{ zIndex: 0 }} />

          <div className="relative flex items-start justify-between gap-2" style={{ zIndex: 1 }}>
            {allNodes.map((node) => (
              <div key={node.id} className="flex flex-col items-center flex-1 min-w-0">
                {/* Dot */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 shrink-0 mb-3",
                    node.isCompletion
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                      : "bg-card border-border/70 text-muted-foreground"
                  )}
                >
                  {node.isCompletion
                    ? <Key className="h-4 w-4" />
                    : <span className="text-xs font-bold text-foreground">{node.index + 1}</span>
                  }
                </div>

                {/* Label + timing */}
                <p className={cn(
                  "text-[11px] sm:text-xs font-bold text-center leading-tight mb-0.5",
                  node.isCompletion ? "text-primary" : "text-foreground"
                )}>
                  {node.label}
                </p>
                <p className="text-[10px] text-muted-foreground text-center leading-tight mb-2">
                  {node.timing}
                </p>

                {/* Amount pill */}
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-center",
                  node.isCompletion
                    ? "bg-primary/10 border border-primary/25"
                    : "bg-muted/60 border border-border/50"
                )}>
                  <p className={cn(
                    "text-[11px] sm:text-xs font-black leading-none",
                    node.isCompletion ? "text-primary" : "text-foreground"
                  )}>
                    {fmt(node.amt)}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{node.percent}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Under construction note */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px flex-1 border-t border-dashed border-border/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-dashed border-border/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">No payments during construction</span>
            </div>
            <div className="h-px flex-1 border-t border-dashed border-border/50" />
          </div>

          {/* Summary strip */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Total Deposits", value: fmt(totalDepositAmt), sub: `${totalDepositPct}% upfront` },
              { label: "Balance at Keys", value: fmt(balanceAtCompletion), sub: `${(100 - totalDepositPct).toFixed(0)}% at completion` },
              { label: "Purchase Price", value: fmt(price), sub: "Before taxes" },
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
