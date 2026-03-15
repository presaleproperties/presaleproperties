import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepRegisterAccess() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Register for VIP Access
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Most presale projects in Vancouver offer early access to registered buyers before going public. Working with an agent who has developer relationships gives you first pick at the best units and pricing.
          </p>
        </div>
        <Checklist
          items={[
            "Register directly through a Platinum agent for priority access",
            "VIP events typically open 2–4 weeks before public launch",
            "First-access buyers often get lower floors and better pricing",
            "Agent registration is free — developers pay the commission",
            "Ask about incentive packages (free upgrades, deposit structures)",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Why VIP access matters" />
          <StatGrid
            stats={[
              { value: "2–4 wk", label: "Early access window" },
              { value: "70%", label: "Units sold before public" },
              { value: "$0", label: "Cost to register" },
              { value: "5–15%", label: "Avg. savings vs. resale" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="What happens after you register" />
          <div className="space-y-4">
            {[
              { num: "01", text: "You receive floor plans and pricing ahead of the public" },
              { num: "02", text: "Your agent reviews options and shortlists top units" },
              { num: "03", text: "You attend the VIP event and sign your contract of purchase" },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-3">
                <span className="text-xl font-bold text-primary/40 leading-tight tabular-nums">{item.num}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
