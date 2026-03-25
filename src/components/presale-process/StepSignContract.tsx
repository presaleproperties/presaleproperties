import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepSignContract() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The Contract of Purchase and Sale is legally binding the moment you sign. BC law gives you a 7-day rescission period to change your mind — but that window closes fast. Use every one of those seven days. Have a real estate lawyer read every clause before you commit.
          </p>
        </div>
        <Checklist
          items={[
            "You have exactly 7 calendar days to rescind (a 0.25% penalty applies)",
            "Read the sunset clause carefully — it's the developer's right to cancel the project",
            "Confirm the 2-5-10 New Home Warranty is included in the contract",
            "Verify the estimated completion date and any permitted extension rights",
            "Check the assignment clause if you may want to sell before completion",
            "Use a real estate lawyer for review — your agent is not a substitute",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Critical contract terms at a glance" />
          <StatGrid
            stats={[
              { value: "7 days", label: "Rescission window" },
              { value: "0.25%", label: "Rescission penalty" },
              { value: "2-5-10", label: "BC home warranty" },
              { value: "Sunset", label: "Developer exit clause" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="The 2-5-10 New Home Warranty — explained" />
          <div className="space-y-0">
            {[
              { years: "2 yr", desc: "Materials and labour defects covered" },
              { years: "5 yr", desc: "Building envelope — water penetration & leakage" },
              { years: "10 yr", desc: "Structural defects in the building" },
            ].map((item) => (
              <div key={item.years} className="flex items-center gap-3.5 py-3 border-b border-border last:border-0 min-w-0">
                <span className="text-base sm:text-lg font-bold text-primary tabular-nums w-12 flex-shrink-0">{item.years}</span>
                <p className="text-sm text-muted-foreground min-w-0">{item.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
