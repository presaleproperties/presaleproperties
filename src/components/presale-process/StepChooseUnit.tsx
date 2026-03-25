import { SectionCard, StatGrid, Checklist, SectionLabel, CostRow } from "./shared";

export function StepChooseUnit() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Choosing a unit is about more than square footage. Floor level, orientation, view corridors, and proximity to building amenities all affect your lived experience and long-term resale value. Take your time — this decision will compound over years.
          </p>
        </div>
        <Checklist
          items={[
            "Higher floors carry a 1–3% price premium per level — know if it's worth it for your goals",
            "South and west-facing exposure delivers more natural light and stronger resale appeal",
            "Corner units offer dual-aspect views — a meaningful premium on the secondary market",
            "Avoid units directly adjacent to elevators, garbage chutes, or loading bays",
            "Always compare net livable square footage, not just the gross number in the brochure",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Floor premium breakdown" />
          <CostRow label="Floors 2–10" value="Base Price" />
          <CostRow label="Floors 11–20" value="+$3K–$8K / floor" />
          <CostRow label="Floors 21–30" value="+$5K–$12K / floor" />
          <CostRow label="Penthouse levels" value="+15–25%" highlight />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Value-add factors to look for" />
          <StatGrid
            stats={[
              { value: "+8%", label: "Corner unit premium" },
              { value: "+5%", label: "South exposure" },
              { value: "+12%", label: "Unobstructed view" },
              { value: "+3%", label: "In-suite laundry" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
