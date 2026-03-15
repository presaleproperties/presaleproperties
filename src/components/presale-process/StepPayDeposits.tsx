import { SectionCard, DepositBar, Checklist, SectionLabel } from "./shared";

export function StepPayDeposits() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Pay Your Deposits
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            Presale deposits are typically 15–20% of the purchase price, staggered over 12–18 months. All deposits are held in a lawyer's trust account and are protected until completion.
          </p>
        </div>

        <Checklist
          items={[
            "Deposits are held in a lawyer's trust account — not by the developer",
            "Typical structure: 5% + 5% + 5% over 12–18 months",
            "Some developers offer extended deposit structures (5% + 5% + 5% + 5%)",
            "You earn interest on trust account deposits in BC",
            "Set calendar reminders — late deposits can void your contract",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Deposit schedule — $600K unit" />
          <div className="space-y-5">
            <DepositBar label="Deposit 1 — At signing" pct={5} amount="$30,000" />
            <DepositBar label="Deposit 2 — 90 days" pct={5} amount="$30,000" />
            <DepositBar label="Deposit 3 — 180 days" pct={5} amount="$30,000" />
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(201,169,110,0.18)" }}>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "#F5F0E8", fontFamily: "DM Sans, sans-serif" }}>Total Deposits</span>
              <span className="text-sm font-semibold" style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}>$90,000 (15%)</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Trust account protection" />
          <p className="text-sm leading-relaxed" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            Under BC's <strong style={{ color: "#F5F0E8" }}>Real Estate Development Marketing Act</strong>, all deposits must be held in trust. Developers cannot access these funds until the title transfers at completion.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
