import { SectionCard, Checklist, CostRow, SectionLabel } from "./shared";
import { cn } from "@/lib/utils";

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "muted" | "gold" }) {
  return (
    <span className={cn(
      "inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm",
      variant === "gold" && "bg-primary/15 text-primary border border-primary/25",
      variant === "muted" && "bg-muted text-muted-foreground border border-border",
      variant === "default" && "bg-secondary text-secondary-foreground border border-border",
    )}>
      {children}
    </span>
  );
}

export function StepGetPreApproved() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Before you can reserve any presale unit, you need a full mortgage pre-approval — not a pre-qualification. Most developers require written proof of financing before they'll let you sign. Get this done first, before you fall in love with a floor plan.
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-3">
            Pre-Qualified vs. Pre-Approved — What's the difference?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Pre-Qualified</p>
                <Badge variant="muted">Informal</Badge>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>Based on self-reported income only</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>No credit check required</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>Not accepted by developers</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>No rate hold protection</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Pre-Approved</p>
                <Badge variant="gold">Required</Badge>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Income, assets & credit fully verified</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Written commitment from a lender</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Accepted by presale developers</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Rate hold for 90–120 days</li>
              </ul>
            </div>
          </div>
        </div>

        <Checklist
          items={[
            "Use a mortgage broker who specialises in presale timelines",
            "Gather T4s, NOAs, pay stubs, and 90 days of bank statements",
            "Know your max purchase price — and the number you're comfortable with",
            "Ask about insured (<20% down) vs. conventional (20%+ down) options",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Property Transfer Tax (PTT) — BC" />
          <div className="space-y-0 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2 border-b border-border">
              <span>1% on the first $200,000</span>
              <span className="font-semibold text-foreground tabular-nums">$2,000</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2 border-b border-border">
              <span>2% on $200,001–$2,000,000</span>
              <span className="font-semibold text-foreground tabular-nums">balance × 2%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2">
              <span>3% on amounts over $2,000,000</span>
              <span className="font-semibold text-foreground tabular-nums">balance × 3%</span>
            </div>
          </div>
          <div className="rounded-lg bg-background border border-border p-3 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Example on $600,000</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">1% on $200K + 2% on $400K</span>
              <span className="font-bold text-foreground tabular-nums">$10,000</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/8 border border-primary/20 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">First-Time Buyer Exemption — New Construction (BC 2026)</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Full exemption</strong> if purchase price ≤ $1,100,000 (PTT = $0).<br />
              <strong className="text-foreground">Partial exemption</strong> on $1,100,001–$1,150,000 (sliding scale).<br />
              <strong className="text-foreground">No exemption</strong> above $1,150,000 — full PTT applies.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Investors pay full PTT — no exemption available.</p>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="GST on New Construction — 5%" />
          <div className="space-y-0 mb-3">
            <CostRow label="GST on $600,000" value="$30,000" />
            <CostRow label="GST on $800,000" value="$40,000" />
            <CostRow label="GST on $1,000,000" value="$50,000" />
          </div>
          <div className="rounded-lg bg-primary/8 border border-primary/20 p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">GST New Housing Rebate — Bill C-4 (2026)</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-primary flex-shrink-0">✓</span>
                <span><strong className="text-foreground">≤ $1,000,000:</strong> 100% GST rebate (up to $50,000). Primary residence only.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary flex-shrink-0">~</span>
                <span><strong className="text-foreground">$1,000,001–$1,499,999:</strong> Partial rebate, phases out on a sliding scale.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive flex-shrink-0">✕</span>
                <span><strong className="text-foreground">≥ $1,500,000:</strong> No rebate — full GST applies.</span>
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Investors do not qualify for the GST rebate regardless of price.
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Other closing costs to budget for" />
          <CostRow label="Legal / conveyancing fees" value="$1,200–$2,000" />
          <CostRow label="Title insurance" value="~$300" />
          <CostRow label="Home insurance (annual)" value="$800–$1,500" />
          <CostRow label="Strata move-in fee" value="$200–$500" />
          <CostRow label="Property tax adjustment" value="Pro-rated" />
        </SectionCard>
      </div>
    </div>
  );
}
