import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, Home, DollarSign, TrendingUp, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepositStep {
  id: string;
  label: string;          // e.g. "Upon Signing"
  percent: number;        // e.g. 2.5
  timing: string;         // e.g. "Due in 7 days"
  note?: string;
}

interface DeckDepositTimelineSectionProps {
  depositSteps: DepositStep[];
  projectName: string;
  completionYear?: string;
  defaultPrice?: number;
}

const DEFAULT_PRICE = 799_000;

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-CA");
}

function calcMonthly(principal: number, annualRate = 5.24, years = 25) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function DeckDepositTimelineSection({
  depositSteps,
  projectName,
  completionYear,
  defaultPrice,
}: DeckDepositTimelineSectionProps) {
  const [price, setPrice] = useState(defaultPrice ?? DEFAULT_PRICE);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const steps = depositSteps.length > 0 ? depositSteps : [];

  const totalDepositPct = useMemo(
    () => steps.reduce((acc, s) => acc + s.percent, 0),
    [steps]
  );
  const totalDepositAmt = price * (totalDepositPct / 100);
  const balanceAtCompletion = price - totalDepositAmt;

  // GST estimate (~5% on new builds, rebate may apply)
  const gstEstimate = price * 0.05;
  const gstRebate = price <= 1_000_000 ? Math.min(gstEstimate * 0.36, 6_300) : 0;
  const netGst = gstEstimate - gstRebate;
  const ptt = price <= 1_100_000 ? 0 : price <= 1_150_000 ? (price - 1_100_000) * 0.02 : (price * 0.02) - 8_000 + (price - 500_000) * 0.01;
  const closingCosts = 1_800; // legal
  const totalClosingCosts = netGst + ptt + closingCosts;
  const cashAtCompletion = balanceAtCompletion + totalClosingCosts;
  const monthlyPayment = calcMonthly(balanceAtCompletion * 0.8); // 20% down assumed
  const mortgageBase = balanceAtCompletion * 0.8;

  const priceFmt = fmt(price);
  const priceK = Math.round(price / 1000);

  // cumulative deposit up to step i
  const cumulative = (idx: number) =>
    steps.slice(0, idx + 1).reduce((a, s) => a + s.percent, 0);

  return (
    <section id="deposit-timeline" className="relative py-14 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          05
        </div>

        {/* Header */}
        <div className="mb-8 sm:mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Payment Plan</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Deposit Timeline</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Walk through every payment milestone — from signing day to your keys at completion.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 items-start">

          {/* ── Left: Price slider + timeline ── */}
          <div className="space-y-6">
            {/* Price selector */}
            <div className="p-5 rounded-2xl border border-border/60 bg-background space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Your Unit Price</p>
                <span className="text-xl font-bold text-primary">{priceFmt}</span>
              </div>
              <input
                type="range"
                min={300_000}
                max={2_000_000}
                step={10_000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>$300K</span>
                <span>$2M</span>
              </div>
            </div>

            {/* Timeline steps */}
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-border/60" />

              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const isActive = activeStep === step.id;
                  const amt = price * (step.percent / 100);
                  const cum = cumulative(idx);
                  const cumAmt = price * (cum / 100);

                  return (
                    <div key={step.id}>
                      <button
                        type="button"
                        onClick={() => setActiveStep(isActive ? null : step.id)}
                        className={cn(
                          "w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 touch-manipulation",
                          isActive
                            ? "border-primary/40 bg-primary/5 shadow-sm"
                            : "border-border/50 bg-background hover:border-primary/25 hover:bg-primary/3"
                        )}
                      >
                        {/* Step icon */}
                        <div className={cn(
                          "relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                          isActive ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border/60 text-muted-foreground"
                        )}>
                          {idx === steps.length - 1 ? (
                            <Home className="h-4 w-4" />
                          ) : idx === 0 ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-foreground leading-tight">{step.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.timing}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-primary">{fmt(amt)}</p>
                              <p className="text-[10px] text-muted-foreground">{step.percent}%</p>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isActive && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Deposit paid to date</span>
                                <span className="font-semibold text-foreground">{fmt(cumAmt)} ({cum}%)</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Balance remaining</span>
                                <span className="font-semibold text-foreground">{fmt(price - cumAmt)}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full h-2 rounded-full bg-muted overflow-hidden mt-2">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${Math.min(cum, 100)}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground">{cum}% of purchase price secured</p>
                              {step.note && (
                                <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mt-1">{step.note}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0 mt-1">
                          {isActive
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                      </button>
                    </div>
                  );
                })}

                {/* Completion step */}
                <div className="w-full text-left flex items-start gap-4 p-4 rounded-2xl border border-primary/30 bg-primary/5">
                  <div className="relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-primary border-primary text-primary-foreground">
                    <Home className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-foreground leading-tight">
                          Completion & Keys
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {completionYear ? `Estimated ${completionYear}` : "Estimated completion"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">{fmt(balanceAtCompletion)}</p>
                        <p className="text-[10px] text-muted-foreground">{(100 - totalDepositPct).toFixed(0)}% balance</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      Balance due at completion — typically financed via mortgage. Total deposits paid: <span className="font-semibold text-foreground">{fmt(totalDepositAmt)} ({totalDepositPct}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Summary card ── */}
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* Totals card */}
            <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Payment Summary</p>
                <p className="text-2xl font-bold text-foreground mt-1">{priceFmt}</p>
                <p className="text-xs text-muted-foreground">{projectName}</p>
              </div>

              <div className="px-5 py-4 space-y-3">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        idx === 0 ? "bg-primary" : idx === 1 ? "bg-primary/70" : idx === 2 ? "bg-primary/45" : "bg-primary/25"
                      )} />
                      <span className="text-muted-foreground text-xs">{step.label}</span>
                    </div>
                    <span className="font-semibold text-foreground text-xs">{fmt(price * step.percent / 100)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total Deposits</span>
                  <span className="text-sm font-bold text-primary">{fmt(totalDepositAmt)} <span className="text-muted-foreground font-normal text-xs">({totalDepositPct}%)</span></span>
                </div>
              </div>
            </div>

            {/* Completion breakdown toggle */}
            <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
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
                  <Row label="Purchase Price" value={fmt(price)} />
                  <Row label={`Deposits Paid (${totalDepositPct}%)`} value={`− ${fmt(totalDepositAmt)}`} muted />
                  <Row label="Balance Due" value={fmt(balanceAtCompletion)} highlight />
                  <div className="h-px bg-border/50 my-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Closing Costs (Est.)</p>
                  <Row label="GST (Net of Rebate)" value={fmt(netGst)} />
                  <Row label="Property Transfer Tax" value={price <= 1_100_000 ? "Exempt (FTB)" : fmt(ptt)} />
                  <Row label="Legal / Conveyancing" value={fmt(closingCosts)} />
                  <div className="h-px bg-border/50 my-1" />
                  <Row label="Total Cash at Closing" value={fmt(cashAtCompletion)} highlight bold />
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    * PTT exempt for First-Time Buyers on properties ≤ $1.1M. GST rebate applies for primary residence ≤ $1M. Estimates only — consult your notary.
                  </p>
                </div>
              )}
            </div>

            {/* Mortgage snapshot */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Mortgage at Completion</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background border border-border/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Monthly</p>
                  <p className="text-lg font-bold text-primary">{fmt(monthlyPayment)}/mo</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">5.24% · 25yr amort</p>
                </div>
                <div className="rounded-xl bg-background border border-border/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mortgage Base</p>
                  <p className="text-lg font-bold text-foreground">{fmt(mortgageBase)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">80% LTV assumed</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Based on 20% down at completion. Rate and qualification are subject to change. Speak with a mortgage advisor for a personalized estimate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, muted, highlight, bold }: { label: string; value: string; muted?: boolean; highlight?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn("text-muted-foreground", muted && "line-through opacity-60")}>{label}</span>
      <span className={cn("font-semibold text-foreground", highlight && "text-primary", bold && "text-sm")}>{value}</span>
    </div>
  );
}
