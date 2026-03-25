import { SectionCard, MilestoneTimeline, Checklist, SectionLabel } from "./shared";

export function StepTrackConstruction() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Expect 2–3 years from groundbreaking to keys. Your main job during this phase is to stay informed and watch your sunset clause date — if the developer misses it, they can cancel your contract.
        </p>
        <Checklist
          items={[
            "Sign up for developer construction updates",
            "Start your mortgage financing 6–9 months before completion",
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
              { label: "PDI & occupancy", desc: "30–36 months", done: false },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
