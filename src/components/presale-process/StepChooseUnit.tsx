import { SectionCard, StatGrid, Checklist, SectionLabel, CostRow } from "./shared";

export function StepChooseUnit() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            Choose Your Unit
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Selecting the right unit goes beyond square footage. Floor level, orientation, and corner-vs-interior all affect your long-term value and liveability.
          </p>
        </div>
        <Checklist
          items={[
            "Higher floors carry a 1–3% premium per level",
            "South and west exposure = more natural light and higher value",
            "Corner units have dual-aspect views — better resale upside",
            "Avoid units near elevators, garbage chutes, or loading docks",
            "Compare net vs. gross square footage carefully",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Floor premium breakdown" />
          <CostRow label="Floors 2–10" value="Base Price" />
          <CostRow label="Floors 11–20" value="+$3K–$8K/floor" />
          <CostRow label="Floors 21–30" value="+$5K–$12K/floor" />
          <CostRow label="Penthouse levels" value="+15–25%" highlight />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Value factors" />
          <StatGrid
            stats={[
              { value: "+8%", label: "Corner unit premium" },
              { value: "+5%", label: "South exposure" },
              { value: "+12%", label: "Unobstructed views" },
              { value: "+3%", label: "In-suite laundry" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
