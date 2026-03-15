import { SectionCard, DepositBar, Checklist, SectionLabel } from "./shared";

export function StepPayDeposits() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Pay Your Deposits
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            Presale deposits are typically 15–20% of the purchase price, staggered over 12–18 months. All deposits are held in a lawyer's trust account and are protected until completion.
          </p>
        </div>
        <Checklist
          items={[
            "Deposits are held in a lawyer's trust account — not by the developer",
            "Typical structure: 5% + 5% + 5% over 12–18 months",
            "Some developers offer extended structures (5%+5%+5%+5%)",
            "You earn interest on trust account deposits in BC",
            "Set calendar reminders — late deposits can void your contract",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Deposit schedule — $600K unit" />
          {/* maxPct=15 so each 5% fills 33% of bar — clearly visible */}
          <div className="space-y-5">
            <DepositBar label="Deposit 1 — At signing" pct={5} amount="$30,000" maxPct={15} />
            <DepositBar label="Deposit 2 — 90 days" pct={5} amount="$30,000" maxPct={15} />
            <DepositBar label="Deposit 3 — 180 days" pct={5} amount="$30,000" maxPct={15} />
          </div>
          <div className="mt-5 pt-4 border-t border-border flex justify-between items-center gap-2">
            <span className="text-sm font-medium text-foreground">Total Deposits</span>
            <span className="text-lg font-bold text-primary whitespace-nowrap">$90,000 (15%)</span>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Trust account protection" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Under BC's <strong className="text-foreground font-semibold">Real Estate Development Marketing Act</strong>, all deposits must be held in trust. Developers cannot access these funds until the title transfers at completion.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
