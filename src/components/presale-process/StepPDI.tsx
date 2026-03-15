import { SectionCard, Checklist, SectionLabel, StatGrid } from "./shared";

export function StepPDI() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Final Walkthrough (PDI)
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
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
          <div className="space-y-2 text-sm" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            {["Phone or camera for documentation", "Blue painter's tape (mark defects)", "Notebook and pen", "Phone charger (to test outlets)", "Level tool (check counters, floors)", "Your signed contract for reference"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#C9A96E" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
