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

  return (
    <div id="deposit-timeline" className="w-full">

      {/* Header */}
      <div className="mb-10">
        <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">05 — Payment Plan</p>
        <h2 className="text-3xl font-bold text-foreground">Deposit Structure</h2>
        <p className="text-muted-foreground text-sm mt-1">No payments during construction.</p>
      </div>

      {/* Unit selector */}
      {plansWithPrice.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
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

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, i) => {
          const amt = price * (step.percent / 100);
          return (
            <div key={step.id} className="flex items-center gap-5 py-5 border-b border-border/40">
              {/* Step number */}
              <span className="text-3xl font-black text-muted-foreground/20 leading-none w-7 shrink-0 text-right">
                {i + 1}
              </span>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.timing}</p>
              </div>
              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-foreground">{fmt(amt)}</p>
                <p className="text-[10px] text-muted-foreground">{step.percent}%</p>
              </div>
            </div>
          );
        })}

        {/* Construction gap */}
        <div className="flex items-center gap-3 py-4">
          <div className="w-7 shrink-0 flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25 animate-pulse" />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">
            Construction period — no payments
          </p>
        </div>

        {/* Completion */}
        <div className="flex items-center gap-5 py-5">
          <span className="text-3xl font-black leading-none w-7 shrink-0 text-right">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center ml-auto">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">Possession</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completionYear ? `Est. ${completionYear}` : "At completion"} · Mortgage starts
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-primary">{fmt(balanceAtCompletion)}</p>
            <p className="text-[10px] text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% remaining</p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-2 pt-4 border-t border-border/40 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total deposits during construction</span>
        <span className="text-sm font-bold text-foreground">{fmt(totalDepositAmt)} <span className="text-muted-foreground font-normal text-xs">({totalDepositPct}%)</span></span>
      </div>

    </div>
  );
}
