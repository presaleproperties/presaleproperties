import { SectionCard, Checklist, SectionLabel, StatGrid } from "./shared";

export function StepPDI() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Final Walkthrough (PDI)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Pre-Delivery Inspection is your opportunity to document any deficiencies before you move in. Be thorough — anything missed here becomes harder to claim later under warranty.
          </p>
        </div>
        <Checklist
          items={[
            "Test every faucet, switch, outlet, and appliance",
            "Check all doors, drawers, and cabinet closures",
            "Look for paint chips, scuffs, and drywall imperfections",
            "Run the dishwasher and washing machine through a full cycle",
            "Document everything with timestamped photos",
            "Test the HVAC system in both heating and cooling modes",
            "Check window seals for drafts or condensation",
            "Verify flooring is level and free from scratches",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="PDI essentials" />
          <StatGrid
            stats={[
              { value: "60–90", label: "Minutes avg. PDI time" },
              { value: "30 days", label: "Deficiency fix period" },
              { value: "2-5-10", label: "Warranty protection" },
              { value: "Photos", label: "Document everything" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="What to bring" />
          <ul className="space-y-2">
            {[
              "Phone or camera for documentation",
              "Blue painter's tape (mark defects)",
              "Notebook and pen",
              "Phone charger (to test outlets)",
              "Level tool (check counters, floors)",
              "Your signed contract for reference",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
