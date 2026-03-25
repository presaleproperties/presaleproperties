import { SectionCard, CostRow, SectionLabel } from "./shared";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          On completion day your lawyer handles the title transfer and your mortgage funds flow to the developer. Once everything clears, you get your keys. What you owe at closing depends on whether you're a first-time buyer or an investor.
        </p>

        <ul className="space-y-2.5">
          {[
            "Mortgage funds released by your lender to the developer's lawyer",
            "Title transfers to you at the Land Title Office",
            "PTT and all closing costs are due on completion day",
            "Keys released same day or next business day",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>

        {/* 2026 rule summary */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">2026 BC rules — New Construction</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-0.5">PTT — First-Time Buyer</p>
              <p>$0 PTT on new construction up to $1,100,000. Partial exemption $1.1M–$1.15M. Full PTT above $1.15M.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-0.5">GST Rebate (Bill C-4, 2026)</p>
              <p>Full GST rebate (up to $50K) for primary residences priced at $1M or under. Partial rebate up to $1.5M. No rebate above $1.5M or for investors.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Investor */}
        <SectionCard>
          <SectionLabel text="Investor — $600K unit, 20% down" />
          <CostRow label="Deposits already paid (10%)" value="−$60,000" />
          <CostRow label="Remaining down payment (10%)" value="$60,000" />
          <CostRow label="GST (5%)" value="$30,000" />
          <CostRow label="GST rebate" value="Not eligible" />
          <CostRow label="PTT (1% on $200K + 2% on $400K)" value="$10,000" />
          <CostRow label="Legal + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Cash needed at closing</span>
            <span className="text-xl font-bold text-primary">~$102,300</span>
          </div>
        </SectionCard>

        {/* FTB */}
        <SectionCard>
          <SectionLabel text="First-Time Buyer — $750K unit, 10% down" />
          <CostRow label="Deposits already paid (10%)" value="−$75,000" />
          <CostRow label="GST (5% on $750K)" value="$37,500" />
          <CostRow label="GST rebate — full (≤ $1M primary residence)" value="−$37,500" highlight />
          <CostRow label="PTT — full exemption (new construction ≤ $1.1M)" value="$0" highlight />
          <CostRow label="CMHC premium (added to mortgage, not upfront)" value="~$20,900" />
          <CostRow label="Legal + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Cash needed at closing</span>
            <span className="text-xl font-bold text-primary">~$2,300</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            * CMHC premium added to mortgage balance, not paid upfront. GST fully offset by rebate.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
