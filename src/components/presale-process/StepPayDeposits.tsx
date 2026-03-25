import { SectionCard, DepositBar, Checklist, SectionLabel } from "./shared";

export function StepPayDeposits() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Deposits are typically 15–20% of the purchase price, split into installments over 12–18 months. Your money is fully protected in a lawyer's trust account until you get your keys.
        </p>
        <Checklist
          items={[
            "Deposits sit in a lawyer's trust — the developer can't touch them",
            "Typical structure: 5% + 5% + 5% over 18 months",
            "You earn interest on your deposits in BC",
            "Missing a deadline can void your contract — set reminders",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Example deposit schedule — $600K unit" />
          <div className="space-y-5">
            <DepositBar label="Deposit 1 — At signing" pct={5} amount="$30,000" maxPct={15} />
            <DepositBar label="Deposit 2 — 90 days" pct={5} amount="$30,000" maxPct={15} />
            <DepositBar label="Deposit 3 — 180 days" pct={5} amount="$30,000" maxPct={15} />
          </div>
          <div className="mt-5 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">$90,000 (15%)</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
