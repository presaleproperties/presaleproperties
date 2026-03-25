import { SectionCard, Checklist, SectionLabel } from "./shared";
import { cn } from "@/lib/utils";

export function StepGetPreApproved() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Before you start looking at projects, get pre-qualified with a mortgage broker. This tells you what you can comfortably afford and what your deposit needs will be. A full pre-approval comes later — once you're ready to sign a contract.
        </p>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-3">Pre-Qualified vs. Pre-Approved</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Pre-Qualified</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>Self-reported income only</li>
                <li className="flex gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>Not accepted by developers</li>
                <li className="flex gap-1.5"><span className="text-destructive flex-shrink-0">✕</span>No rate hold</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Pre-Approved ✓</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-1.5"><span className="text-primary flex-shrink-0">✓</span>Fully verified by lender</li>
                <li className="flex gap-1.5"><span className="text-primary flex-shrink-0">✓</span>Accepted by developers</li>
                <li className="flex gap-1.5"><span className="text-primary flex-shrink-0">✓</span>90–120 day rate hold</li>
              </ul>
            </div>
          </div>
        </div>

        <Checklist
          items={[
            "Use a mortgage broker experienced with presales",
            "Know your max purchase price before you look",
            "Ask about insured (<20% down) vs. conventional (20%+ down)",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Key costs to budget for" />
          <div className="space-y-3">
            {[
              { label: "Property Transfer Tax (PTT)", note: "1–3% of purchase price. First-time buyers buying new construction ≤ $1.1M pay $0." },
              { label: "GST (5%)", note: "On new builds. Full rebate available up to $1M for primary residences (Bill C-4, 2026)." },
              { label: "Legal fees", note: "~$1,500–$2,300 for a real estate lawyer at closing." },
            ].map((item) => (
              <div key={item.label} className="pb-3 border-b border-border last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
