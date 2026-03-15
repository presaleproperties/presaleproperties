import { SectionCard, CostRow, SectionLabel, StatGrid } from "./shared";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Completion &amp; Keys
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            This is closing day. Your lawyer handles the title transfer, your mortgage funds, and the balance of the purchase price is paid. Once everything clears, you receive your keys.
          </p>
        </div>

        <div className="space-y-2 text-sm" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
          {[
            "Mortgage funds are released by your lender to the developer's lawyer",
            "Title transfers from the developer to you at the Land Title Office",
            "Property Transfer Tax is due on completion day",
            "Your lawyer registers the title and mortgage",
            "Keys are typically released same day or next business day",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#C9A96E" }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Closing cost breakdown — $600K unit" />
          <CostRow label="Remaining balance (after deposits)" value="$510,000" />
          <CostRow label="Property Transfer Tax" value="$10,000" />
          <CostRow label="GST (5%)" value="$30,000" />
          <CostRow label="GST Rebate (new, <$450K)" value="-$6,300" highlight />
          <CostRow label="Legal fees" value="$1,500" />
          <CostRow label="Title insurance" value="$300" />
          <CostRow label="Strata fee adjustment" value="~$200" />
          <div className="mt-3 pt-3 flex justify-between" style={{ borderTop: "2px solid rgba(201,169,110,0.3)" }}>
            <span className="text-sm font-semibold" style={{ color: "#F5F0E8", fontFamily: "DM Sans, sans-serif" }}>
              Total Due at Completion
            </span>
            <span className="font-['Cormorant_Garamond'] text-xl font-semibold" style={{ color: "#C9A96E" }}>
              ~$545,700
            </span>
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
