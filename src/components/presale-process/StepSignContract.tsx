import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepSignContract() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Review &amp; Sign the Contract
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Contract of Purchase and Sale is a binding agreement. BC law gives you a 7-day rescission period — use it wisely. Have your lawyer review every clause before the window closes.
          </p>
        </div>
        <Checklist
          items={[
            "You have 7 calendar days to rescind (with 0.25% penalty)",
            "Review the sunset clause — this is the developer's cancellation power",
            "Confirm the 2-5-10 New Home Warranty is in place",
            "Verify the completion date range and any extension rights",
            "Check assignment clause if you may sell before completion",
            "Have a real estate lawyer review — not just your agent",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Critical contract terms" />
          <StatGrid
            stats={[
              { value: "7 days", label: "Rescission period" },
              { value: "0.25%", label: "Rescission penalty" },
              { value: "2-5-10", label: "BC warranty coverage" },
              { value: "Sunset", label: "Developer out clause" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="2-5-10 warranty explained" />
          <div className="space-y-3">
            {[
              { years: "2yr", desc: "Materials and labour defects" },
              { years: "5yr", desc: "Building envelope (water penetration)" },
              { years: "10yr", desc: "Structural defects" },
            ].map((item) => (
              <div key={item.years} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-lg font-bold text-primary tabular-nums w-10 flex-shrink-0">{item.years}</span>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
