import { SectionCard, StatGrid, Checklist, CostRow, SectionLabel } from "./shared";

export function StepGetPreApproved() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-2 sm:mb-3">
            Get Pre-Approved
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Key numbers to know" />
          <StatGrid
            stats={[
              { value: "5%", label: "Min down payment" },
              { value: "$525K", label: "Avg. presale price" },
              { value: "~$13K", label: "PTT (1st-time exempt)" },
              { value: "5% GST", label: "On new construction" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Estimated closing costs" />
          <CostRow label="Legal fees" value="$1,200–$2,000" />
          <CostRow label="Property Transfer Tax" value="~1–2% of price" />
          <CostRow label="GST (5%)" value="~$26,250" />
          <CostRow label="GST Rebate (if eligible)" value="−$6,300" highlight />
          <CostRow label="Home insurance" value="$800–$1,500/yr" />
        </SectionCard>
      </div>
    </div>
  );
}
