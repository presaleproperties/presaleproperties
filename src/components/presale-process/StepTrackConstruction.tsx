import { SectionCard, MilestoneTimeline, Checklist, SectionLabel, StatGrid } from "./shared";

export function StepTrackConstruction() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From groundbreaking to topping out, your building will take 2–3 years to complete. Stay proactive — monitor city permit updates, sign up for developer progress reports, and most importantly, watch the sunset clause date. If the developer cannot complete by that date, they have the right to cancel your contract.
          </p>
        </div>
        <Checklist
          items={[
            "Register for the developer's construction update newsletter",
            "Monitor your city's building permit portal for milestone updates",
            "Mark the sunset clause deadline in your calendar as a critical watch date",
            "Start the mortgage financing process 6–9 months before estimated completion",
            "Arrange home insurance coverage before your completion date arrives",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Typical construction timeline" />
          <MilestoneTimeline
            items={[
              { label: "Site prep & excavation", desc: "0–4 months", done: true },
              { label: "Foundation & underground parking", desc: "4–8 months", done: true },
              { label: "Structure & framing", desc: "8–18 months", done: true },
              { label: "Building envelope & cladding", desc: "18–24 months", done: false },
              { label: "Interior finishing", desc: "24–30 months", done: false },
              { label: "Occupancy & PDI", desc: "30–36 months", done: false },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Key milestones to track" />
          <StatGrid
            stats={[
              { value: "2–3 yr", label: "Average build time" },
              { value: "6–9 mo", label: "Start mortgage process" },
              { value: "30 days", label: "Completion notice period" },
              { value: "Sunset", label: "Know your deadline" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
