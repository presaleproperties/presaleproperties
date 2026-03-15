import { SectionCard, MilestoneTimeline, Checklist, SectionLabel, StatGrid } from "./shared";

export function StepTrackConstruction() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Track Construction
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            From groundbreaking to topping out, you'll want to stay informed on your building's progress. Pay attention to the sunset clause date — if the developer can't complete by then, they can cancel the contract.
          </p>
        </div>

        <Checklist
          items={[
            "Sign up for developer construction updates",
            "Monitor city building permit status online",
            "Watch for sunset clause deadlines in your contract",
            "Begin your mortgage financing 6–9 months before completion",
            "Arrange home insurance before your completion date",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Typical construction timeline" />
          <MilestoneTimeline
            items={[
              { label: "Site prep & excavation", desc: "0–4 months", done: true },
              { label: "Foundation & underground", desc: "4–8 months", done: true },
              { label: "Structure & framing", desc: "8–18 months", done: true },
              { label: "Building envelope", desc: "18–24 months", done: false },
              { label: "Interior finishing", desc: "24–30 months", done: false },
              { label: "Occupancy & PDI", desc: "30–36 months", done: false },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Key milestones" />
          <StatGrid
            stats={[
              { value: "2–3 yr", label: "Avg. build time (concrete)" },
              { value: "6–9 mo", label: "Start mortgage process" },
              { value: "30 days", label: "Typical completion notice" },
              { value: "Sunset", label: "Know your deadline" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
