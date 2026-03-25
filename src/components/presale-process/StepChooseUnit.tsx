import { SectionCard, Checklist, SectionLabel } from "./shared";

export function StepChooseUnit() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Choosing a unit is more than picking a floor plan. Floor level, sun exposure, and view lines all affect both your daily life and long-term resale value.
        </p>
        <Checklist
          items={[
            "Higher floors cost more but hold value better",
            "South/west exposure = more natural light and stronger resale",
            "Corner units have two views — worth paying for",
            "Avoid units next to elevators or garbage rooms",
            "Always check net livable sqft, not just the brochure number",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Typical floor premiums" />
          <div className="space-y-0">
            {[
              { range: "Floors 2–10", price: "Base price" },
              { range: "Floors 11–20", price: "+$3K–$8K per floor" },
              { range: "Floors 21–30", price: "+$5K–$12K per floor" },
              { range: "Penthouse", price: "+15–25%" },
            ].map((item) => (
              <div key={item.range} className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{item.range}</span>
                <span className="font-semibold text-foreground">{item.price}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Value add-ons" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "+8%", label: "Corner unit" },
              { value: "+5%", label: "South facing" },
              { value: "+12%", label: "Unobstructed view" },
              { value: "+3%", label: "In-suite laundry" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-background border border-border p-3">
                <p className="text-xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
