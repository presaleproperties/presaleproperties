import { useState, useMemo } from "react";
import { Check, KeyRound, Clock, Lock } from "lucide-react";
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
  isUnlocked?: boolean;
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
  const plansWithPrice = floorPlans.filter(
    (fp) => fp.price_from && parsePrice(fp.price_from) > 0
  );
  const fallbackPrice = plansWithPrice[0]
    ? parsePrice(plansWithPrice[0].price_from)
    : defaultPrice ?? DEFAULT_PRICE;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plansWithPrice[0]?.id ?? null
  );
  const [manualPrice, setManualPrice] = useState<number>(fallbackPrice);

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

  return (
    <div id="deposit-timeline" className="w-full">

      {/* Header */}
      <div className="mb-10">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.2em] mb-3">
          05 — Payment Plan
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Deposit Structure
        </h2>
        <p className="text-muted-foreground text-base mt-2">
          No payments during construction — here's exactly when money moves.
        </p>
      </div>

      {/* Unit selector */}
      {plansWithPrice.length > 0 ? (
        <div className="mb-10 flex flex-wrap gap-2">
          {plansWithPrice.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-background text-foreground hover:border-primary/40"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                {plan.unit_type} · {fmt(parsePrice(plan.price_from))}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-10 space-y-2">
          <div className="flex items-center justify-between text-base">
            <span className="text-muted-foreground">Unit price</span>
            <span className="font-bold text-foreground">{fmt(price)}</span>
          </div>
          <input
            type="range"
            min={300_000}
            max={2_000_000}
            step={10_000}
            value={manualPrice}
            onChange={(e) => {
              setSelectedPlanId(null);
              setManualPrice(Number(e.target.value));
            }}
            className="w-full accent-primary h-1.5 cursor-pointer"
          />
        </div>
      )}

      {/* Timeline */}
      <div className="relative flex flex-col">

        {steps.map((step, i) => {
          const amt = price * (step.percent / 100);
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-5">
              {/* Left: node + connector */}
              <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
                {/* Node */}
                <div className="w-9 h-9 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm z-10 shrink-0">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>
                {/* Connector down to construction gap */}
                {!isLast && (
                  <div className="flex-1 w-px bg-border/50 my-1" />
                )}
              </div>

              {/* Right: content */}
              <div className={cn("flex-1 pb-8", isLast && "pb-6")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-foreground leading-snug">{step.label}</p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {step.timing}
                    </p>
                    {step.note && (
                      <p className="text-sm text-muted-foreground/70 mt-1 italic">{step.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-foreground tabular-nums">{fmt(amt)}</p>
                    <p className="text-sm text-muted-foreground">{step.percent}%</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Construction gap row */}
        <div className="flex gap-5">
          <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
            <div className="w-9 h-9 rounded-full bg-muted/40 border border-dashed border-border/70 flex items-center justify-center z-10 shrink-0">
              <span className="text-sm text-muted-foreground/50 font-bold">~</span>
            </div>
            <div className="flex-1 w-px border-l border-dashed border-border/40 my-1" />
          </div>
          <div className="flex-1 pb-6 flex items-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
              Construction — no further payments
            </p>
          </div>
        </div>

        {/* Completion / Keys node */}
        <div className="flex gap-5">
          <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-[0_0_0_5px_hsl(var(--primary)/0.12)] z-10 shrink-0">
              <KeyRound className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-primary leading-snug">Possession & Keys</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {completionYear ? `Estimated ${completionYear}` : "At completion"} · Mortgage begins
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-primary tabular-nums">{fmt(balanceAtCompletion)}</p>
                <p className="text-sm text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% balance</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Summary footer */}
      <div className="mt-8 pt-5 border-t border-border/40 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Total deposits</p>
          <p className="text-xl font-bold text-foreground mt-0.5">
            {fmt(totalDepositAmt)}
            <span className="text-base font-normal text-muted-foreground ml-1.5">({totalDepositPct}%)</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Balance at keys</p>
          <p className="text-xl font-bold text-foreground mt-0.5">
            {fmt(balanceAtCompletion)}
            <span className="text-base font-normal text-muted-foreground ml-1.5">
              ({(100 - totalDepositPct).toFixed(0)}%)
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}
