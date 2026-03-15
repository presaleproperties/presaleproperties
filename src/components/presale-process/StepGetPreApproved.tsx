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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

      {/* ── Left: editorial + pre-approval vs pre-qualified ── */}
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-2 sm:mb-3">
            Get Pre-Approved
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Before you can reserve a presale unit, you need a mortgage pre-approval — not just a pre-qualification. Developers require written proof of financing before you sign.
          </p>
        </div>

        {/* Pre-Qual vs Pre-Approved comparison */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-3">
            Pre-Qualified vs. Pre-Approved
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pre-Qualified */}
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Pre-Qualified</p>
                <Badge variant="muted">Informal</Badge>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>Based on self-reported income — not verified</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>No credit pull or documentation required</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>Not accepted by developers</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 flex-shrink-0">✕</span>No rate hold</li>
              </ul>
            </div>
            {/* Pre-Approved */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Pre-Approved</p>
                <Badge variant="gold">Required</Badge>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Income, assets & credit fully verified</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Written commitment from lender</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Required to sign a presale contract</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5 flex-shrink-0">✓</span>Rate hold 90–120 days</li>
              </ul>
            </div>
          </div>
        </div>

        <Checklist
          items={[
            "Work with a mortgage broker experienced in presales",
            "Gather T4s, NOAs, pay stubs, and 90 days of bank statements",
            "Understand your max purchase price — and your comfort zone",
            "Ask about insured (<20% down) vs. conventional (20%+ down)",
          ]}
        />
      </div>

      {/* ── Right: accurate cost cards ── */}
      <div className="space-y-4">

        {/* PTT card — role-differentiated */}
        <SectionCard>
          <SectionLabel text="Property Transfer Tax (PTT) — BC" />
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground py-1 border-b border-border">
              <span>1% on first $200,000</span>
              <span className="font-semibold text-foreground tabular-nums">$2,000</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground py-1 border-b border-border">
              <span>2% on $200,001–$2,000,000</span>
              <span className="font-semibold text-foreground tabular-nums">balance × 2%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
              <span>3% on amounts over $2,000,000</span>
              <span className="font-semibold text-foreground tabular-nums">balance × 3%</span>
            </div>
          </div>
          {/* Example on $600K */}
          <div className="rounded-md bg-secondary/60 border border-border p-3 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Example on $600,000</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">1% on $200K + 2% on $400K</span>
              <span className="font-bold text-foreground tabular-nums">$10,000</span>
            </div>
          </div>
          {/* Exemption callout */}
          <div className="rounded-md bg-primary/8 border border-primary/20 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">First-Time Buyer Exemption</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Full exemption</strong> if purchase price ≤ $500,000 (PTT = $0).
              <br />
              <strong className="text-foreground">Partial exemption</strong> on $500,001–$525,000 (sliding scale).
              <br />
              <strong className="text-foreground">No exemption</strong> above $525,000 — full PTT applies.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Investors pay full PTT — no exemption available.</p>
        </SectionCard>

        {/* GST card */}
        <SectionCard>
          <SectionLabel text="GST on New Construction — 5%" />
          <div className="space-y-0 mb-3">
            <CostRow label="GST on $525,000" value="$26,250" />
            <CostRow label="GST on $600,000" value="$30,000" />
            <CostRow label="GST on $750,000" value="$37,500" />
          </div>
          {/* GST Rebate callout */}
          <div className="rounded-md bg-primary/8 border border-primary/20 p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">GST New Housing Rebate</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-primary flex-shrink-0">✓</span>
                <span><strong className="text-foreground">≤ $350,000:</strong> Rebate of 36% of GST (~$6,300 max). Primary residence only.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary flex-shrink-0">~</span>
                <span><strong className="text-foreground">$350,001–$449,999:</strong> Partial rebate on sliding scale.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive flex-shrink-0">✕</span>
                <span><strong className="text-foreground">≥ $450,000:</strong> No rebate — full GST applies.</span>
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Investors do not qualify for the GST rebate regardless of price.
            </p>
          </div>
        </SectionCard>

        {/* Other closing costs */}
        <SectionCard>
          <SectionLabel text="Other closing costs" />
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
