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
    <section id="deposit-timeline" className="relative py-14 sm:py-20 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">05 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Deposit Structure</h2>
        </div>

        {/* Unit selector */}
        {plansWithPrice.length > 0 ? (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">Show for:</span>
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

        {/* Payment rows */}
        <div className="space-y-0 rounded-2xl border border-border/60 overflow-hidden bg-card divide-y divide-border/40">
          {steps.map((step, i) => {
            const amt = price * (step.percent / 100);
            return (
              <div key={step.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-5 h-5 rounded-full bg-muted/60 border border-border/60 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.timing}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{fmt(amt)}</p>
                  <p className="text-[10px] text-muted-foreground">{step.percent}%</p>
                </div>
              </div>
            );
          })}

          {/* Construction gap row */}
          <div className="flex items-center justify-center gap-2 px-5 py-3 bg-muted/30">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              No payments during construction
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
          </div>

          {/* Completion row */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary/5">
            <div className="flex items-center gap-3.5">
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">Completion & Possession</p>
                <p className="text-xs text-muted-foreground">
                  {completionYear ? `Est. ${completionYear}` : "Estimated completion"} · Mortgage starts here
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{fmt(balanceAtCompletion)}</p>
              <p className="text-[10px] text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% remaining</p>
            </div>
          </div>
        </div>

        {/* Total deposit summary — one line */}
        <div className="mt-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>Total deposits during construction</span>
          <span className="font-bold text-foreground">{fmt(totalDepositAmt)} <span className="font-normal text-muted-foreground">({totalDepositPct}%)</span></span>
        </div>

      </div>
    </section>
  );
}
