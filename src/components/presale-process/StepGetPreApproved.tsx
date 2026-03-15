import { SectionCard, StatGrid, Checklist, CostRow, SectionLabel } from "./shared";

export function StepGetPreApproved() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: editorial */}
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Get Pre-Approved
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            Before you can reserve a presale unit, you need a pre-approval letter from a mortgage broker. This confirms your budget and signals to developers that you're a serious buyer.
          </p>
        </div>

        <Checklist
          items={[
            "Connect with a mortgage broker who specialises in presale",
            "Gather proof of income, tax returns, and ID",
            "Understand your maximum purchase price vs. comfort zone",
            "Get a rate hold — locks your rate for 90–120 days",
            "Ask about insured vs. uninsured mortgage requirements",
          ]}
        />
      </div>

      {/* Right: stats + cost rows */}
      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Key numbers to know" />
          <StatGrid
            stats={[
              { value: "5%", label: "Min down payment" },
              { value: "$525K", label: "Avg. presale price" },
              { value: "~$13K", label: "PTT (first-time exempt)" },
              { value: "5% GST", label: "On new construction" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Estimated closing costs" />
          <CostRow label="Legal fees" value="$1,200 – $2,000" />
          <CostRow label="Property Transfer Tax" value="~1-2% of price" />
          <CostRow label="GST (5%)" value="~$26,250" />
          <CostRow label="GST Rebate (if eligible)" value="-$6,300" highlight />
          <CostRow label="Home insurance" value="$800 – $1,500/yr" />
        </SectionCard>
      </div>
    </div>
  );
}
