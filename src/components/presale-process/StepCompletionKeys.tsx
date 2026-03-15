import { SectionCard, CostRow, SectionLabel, StatGrid } from "./shared";
import { cn } from "@/lib/utils";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-2 sm:mb-3">
            Completion &amp; Keys
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            This is closing day. Your lawyer handles the title transfer, your mortgage funds, and the balance of the purchase price is paid. Once everything clears, you receive your keys.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            "Mortgage funds are released by your lender to the developer's lawyer",
            "Title transfers from the developer to you at the Land Title Office",
            "PTT and any remaining closing costs are due on completion day",
            "Your lawyer registers the title and mortgage",
            "Keys are typically released same day or next business day",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 sm:gap-3 text-sm text-muted-foreground min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>

        {/* Buyer-type cost diff callout */}
        <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Cost differs by buyer type</p>
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
                <li className="flex items-start gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>No GST rebate</li>
                <li className="flex items-start gap-1.5"><span className="text-muted-foreground flex-shrink-0">→</span>Higher cash at closing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Investor scenario */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1">
            <SectionLabel text="Closing costs — Investor ($600K unit)" />
          </div>
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

        {/* FTB scenario */}
        <SectionCard>
          <SectionLabel text="Closing costs — First-Time Buyer ($480K unit)" />
          <CostRow label="Deposits paid (5% + 5% = 10%)" value="−$48,000" />
          <CostRow label="Remaining down payment (5% − deposits)" value="−$24,000" />
          <CostRow label="GST (5% on $480K)" value="$24,000" />
          <CostRow label="PTT (≤ $500K — full exemption)" value="$0" highlight />
          <CostRow label="GST rebate (price ≤ $450K threshold)" value="Partial ~$2,400" highlight />
          <CostRow label="CMHC insurance (5% down)" value="$19,200" />
          <CostRow label="Legal fees + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Cash needed at completion</span>
            <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">~$45,100</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            * CMHC premium added to mortgage, not paid upfront. PTT = $0 as price ≤ $500K.
          </p>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Quick stats" />
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
