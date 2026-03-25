import { SectionCard, Checklist, SectionLabel } from "./shared";

export function StepSignContract() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The Contract of Purchase and Sale is binding the moment you sign. BC law gives you 7 days to walk away — no penalty for presales. Use every one of those days and have a real estate lawyer review the contract before they run out.
        </p>
        <Checklist
          items={[
            "7 calendar days to rescind — no penalty on presales",
            "Read the sunset clause — it lets the developer cancel the project",
            "Confirm the 2-5-10 New Home Warranty is included",
            "Check the assignment clause if you may sell before completion",
            "Always use a real estate lawyer, not just your agent",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Things to check in your contract" />
          <div className="space-y-0">
            {[
              { term: "Rescission period", detail: "7 days to walk away, no penalty (presale)" },
              { term: "Sunset clause", detail: "Developer's right to cancel if not complete by a set date" },
              { term: "2-5-10 Warranty", detail: "2yr labour · 5yr envelope · 10yr structure" },
              { term: "Assignment clause", detail: "Determines if you can sell before completion" },
            ].map((item) => (
              <div key={item.term} className="py-3 border-b border-border last:border-0">
                <p className="text-sm font-semibold text-foreground">{item.term}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
