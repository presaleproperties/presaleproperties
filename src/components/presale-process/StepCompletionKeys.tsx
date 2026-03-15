import { SectionCard, CostRow, SectionLabel, StatGrid } from "./shared";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Completion &amp; Keys
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            This is closing day. Your lawyer handles the title transfer, your mortgage funds, and the balance of the purchase price is paid. Once everything clears, you receive your keys.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            "Mortgage funds are released by your lender to the developer's lawyer",
            "Title transfers from the developer to you at the Land Title Office",
            "Property Transfer Tax is due on completion day",
            "Your lawyer registers the title and mortgage",
            "Keys are typically released same day or next business day",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Closing cost breakdown — $600K unit" />
          <CostRow label="Remaining balance (after deposits)" value="$510,000" />
          <CostRow label="Property Transfer Tax" value="$10,000" />
          <CostRow label="GST (5%)" value="$30,000" />
          <CostRow label="GST Rebate (new, <$450K)" value="−$6,300" highlight />
          <CostRow label="Legal fees" value="$1,500" />
          <CostRow label="Title insurance" value="$300" />
          <CostRow label="Strata fee adjustment" value="~$200" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Total Due at Completion</span>
            <span className="text-xl font-bold text-primary">~$545,700</span>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Final numbers" />
          <StatGrid
            stats={[
              { value: "36%", label: "GST rebate (if eligible)" },
              { value: "1–2%", label: "PTT on purchase price" },
              { value: "Same day", label: "Key handover (typical)" },
              { value: "$1,500", label: "Avg. legal fees" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
