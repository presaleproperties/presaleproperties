import { SectionCard, Checklist, SectionLabel } from "./shared";

export function StepRegisterAccess() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The best units are sold before most people even know the project exists. Register through a Platinum agent to get floor plans and pricing weeks before the public launch — at no cost to you.
        </p>
        <Checklist
          items={[
            "Register through a Platinum agent for first access",
            "VIP events open 2–4 weeks before public launch",
            "Developers pay the agent commission — it's free for you",
            "Ask about incentives: upgrades, deposit relief, or credits",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="How VIP access works" />
          <div className="space-y-4">
            {[
              { num: "01", text: "Your agent registers you and sends floor plans + pricing before anyone else." },
              { num: "02", text: "Together, you shortlist the best units for your budget and goals." },
              { num: "03", text: "You attend the VIP event, pick your unit, and sign the contract." },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-3.5 min-w-0">
                <span className="text-xl font-bold text-primary/30 tabular-nums w-8 flex-shrink-0">{item.num}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Why it matters" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "70%", label: "Sold before public launch" },
              { value: "$0", label: "Cost to register" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-background border border-border p-3">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
