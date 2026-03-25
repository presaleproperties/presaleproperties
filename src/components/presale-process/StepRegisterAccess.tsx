import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepRegisterAccess() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The best presale units in Vancouver are rarely available to the general public. Developers prioritise registered Platinum-level buyers weeks before the public launch. If you want the highest floor, the best exposure, and the launch-day price — you need an agent with direct developer relationships to get you in first.
          </p>
        </div>
        <Checklist
          items={[
            "Register through a Platinum agent for true first-access priority",
            "VIP events typically open 2–4 weeks ahead of the public launch",
            "Early buyers secure lower floors at launch pricing before increases",
            "There is no cost to register — developers pay the agent commission",
            "Ask upfront about incentive packages: upgrades, deposit relief, and credits",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Why being first matters" />
          <StatGrid
            stats={[
              { value: "2–4 wk", label: "Ahead of the public" },
              { value: "70%", label: "Sold before public launch" },
              { value: "$0", label: "Cost to register" },
              { value: "5–15%", label: "Potential savings vs. resale" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="What happens after you register" />
          <div className="space-y-4">
            {[
              { num: "01", text: "You receive floor plans, pricing, and unit availability before anyone else." },
              { num: "02", text: "Your agent reviews the options and shortlists the highest-value units for your goals." },
              { num: "03", text: "You attend the VIP event, choose your unit, and sign your purchase contract." },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-3.5 min-w-0">
                <span className="text-xl font-bold text-primary/30 leading-tight tabular-nums flex-shrink-0 w-8">{item.num}</span>
                <p className="text-sm text-muted-foreground leading-relaxed min-w-0">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
