import { SectionCard, Checklist, SectionLabel } from "./shared";

export function StepPDI() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The Pre-Delivery Inspection is your walkthrough before you accept the keys. Document every deficiency in writing — anything you miss here is harder to claim under warranty later.
        </p>
        <Checklist
          items={[
            "Test every faucet, outlet, switch, and appliance",
            "Check all doors, drawers, and cabinet closures",
            "Photograph every deficiency with timestamps",
            "Run the dishwasher and washing machine once through",
            "Check windows for drafts and flooring for damage",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="What to bring" />
          <ul className="space-y-2.5">
            {[
              "Phone for timestamped photos",
              "Blue painter's tape to mark defects",
              "Phone charger to test every outlet",
              "Small level for counters and floors",
              "Your signed contract for reference",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Key facts" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "60–90 min", label: "Typical duration" },
              { value: "30 days", label: "Deficiency fix period" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-background border border-border p-3">
                <p className="text-lg font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
