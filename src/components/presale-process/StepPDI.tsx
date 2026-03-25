import { SectionCard, Checklist, SectionLabel, StatGrid } from "./shared";

export function StepPDI() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The Pre-Delivery Inspection is your one formal opportunity to document every deficiency before you accept the unit. Be methodical and thorough — anything you don't note in writing today becomes significantly harder to claim under warranty later. Bring the right tools and allocate at least 90 minutes.
          </p>
        </div>
        <Checklist
          items={[
            "Test every faucet, light switch, outlet, and built-in appliance",
            "Open and close all doors, drawers, cabinet doors, and closet hardware",
            "Look for paint chips, scuffs, scratches, and drywall imperfections",
            "Run the dishwasher and washing machine through a complete cycle",
            "Document every issue with timestamped photos on your phone",
            "Test the HVAC system in both heating and cooling modes",
            "Check all window frames and seals for drafts or condensation",
            "Verify flooring is level, tight, and free of scratches or lifting edges",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="PDI at a glance" />
          <StatGrid
            stats={[
              { value: "60–90", label: "Minutes avg. duration" },
              { value: "30 days", label: "Deficiency repair period" },
              { value: "2-5-10", label: "Warranty coverage" },
              { value: "Photos", label: "Document everything" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="What to bring to your PDI" />
          <ul className="space-y-2.5">
            {[
              "Phone or camera for timestamped photo documentation",
              "Blue painter's tape to mark and label defects on surfaces",
              "Notebook and pen for written deficiency notes",
              "Phone charger to test every outlet in every room",
              "Small level tool to check countertops, islands, and floors",
              "Your signed contract for reference during the walkthrough",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
