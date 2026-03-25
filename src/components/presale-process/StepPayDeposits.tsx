import { SectionCard, DepositBar, Checklist, SectionLabel } from "./shared";

export function StepPayDeposits() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Presale deposits are typically 15–20% of the purchase price, spread across several installments over 12–18 months. Your money is protected throughout — BC law requires all deposits to be held in a lawyer's trust account, not accessible by the developer until title transfers at completion.
          </p>
        </div>
        <Checklist
          items={[
            "All deposits are held in a lawyer's trust account — the developer cannot touch them",
            "Typical structure: 5% + 5% + 5% paid over 12–18 months",
            "Some projects offer extended structures such as 5% + 5% + 5% + 5%",
            "In BC, you earn interest on deposits held in trust",
            "Set calendar reminders — missing a deposit deadline can void your contract",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Typical deposit schedule — $600K unit" />
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
          <SectionLabel text="Your deposit protection under BC law" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Under BC's <strong className="text-foreground font-semibold">Real Estate Development Marketing Act</strong>, every deposit dollar must be held in trust. Developers cannot access these funds until the property title officially transfers to you at completion. If the project is cancelled, your deposits are returned in full.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
