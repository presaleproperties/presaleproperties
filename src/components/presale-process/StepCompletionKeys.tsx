import { SectionCard, CostRow, SectionLabel, StatGrid } from "./shared";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Completion day is the finish line. Your lawyer manages the title transfer, your mortgage funds flow to the developer's lawyer, and you pay the balance of the purchase price including taxes and closing costs. Once everything clears at the Land Title Office, your keys are released.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            "Your lender releases mortgage funds to the developer's lawyer on completion day",
            "Title transfers from the developer to you at the BC Land Title Office",
            "PTT and all remaining closing costs are due on the day of completion",
            "Your lawyer registers both the title and the mortgage in your name",
            "Keys are typically released same day or the following business day",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 sm:gap-3 text-sm text-muted-foreground min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Your costs differ by buyer type</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">First-Time Buyer</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-primary flex-shrink-0">✓</span>PTT = $0 (if ≤ $500K)</li>
                <li className="flex items-start gap-1.5"><span className="text-primary flex-shrink-0">✓</span>GST rebate (if ≤ $450K)</li>
                <li className="flex items-start gap-1.5"><span className="text-muted-foreground flex-shrink-0">→</span>Must be primary residence</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Investor</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>Full PTT applies always</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>No GST rebate available</li>
                <li className="flex items-start gap-1.5"><span className="text-muted-foreground flex-shrink-0">→</span>Higher cash needed at closing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Closing costs — Investor ($600K unit)" />
          <CostRow label="Deposits paid (5% + 5% = 10%)" value="−$60,000" />
          <CostRow label="Remaining down payment (20% − deposits)" value="$60,000" />
          <CostRow label="GST (5% on $600K)" value="$30,000" />
          <CostRow label="PTT (1% on $200K + 2% on $400K)" value="$10,000" />
          <CostRow label="Legal fees + title insurance" value="~$2,300" />
          <CostRow label="GST rebate" value="Not eligible" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Cash needed at completion</span>
            <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">~$102,300</span>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Closing costs — First-Time Buyer ($480K unit)" />
          <CostRow label="Deposits paid (5% + 5% = 10%)" value="−$48,000" />
          <CostRow label="Remaining down payment (5% − deposits)" value="−$24,000" />
          <CostRow label="GST (5% on $480K)" value="$24,000" />
          <CostRow label="PTT (≤ $1.1M new construction — full exemption)" value="$0" highlight />
          <CostRow label="GST rebate (price ≤ $450K threshold)" value="Partial ~$2,400" highlight />
          <CostRow label="CMHC insurance (5% down)" value="$19,200" />
          <CostRow label="Legal fees + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Cash needed at completion</span>
            <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">~$45,100</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            * CMHC premium is added to the mortgage, not paid upfront. PTT = $0 as price is ≤ $500K.
          </p>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Quick reference" />
          <StatGrid
            stats={[
              { value: "$10K", label: "PTT on $600K (investor)" },
              { value: "$0", label: "PTT on ≤$500K (FTB)" },
              { value: "$6,300", label: "Max GST rebate (≤$350K)" },
              { value: "$0", label: "GST rebate on ≥$450K" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
