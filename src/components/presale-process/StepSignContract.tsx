import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepSignContract() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Review &amp; Sign the Contract
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            The Contract of Purchase and Sale is a binding agreement. BC law gives you a 7-day rescission period — use it wisely. Have your lawyer review every clause before the window closes.
          </p>
        </div>

        <Checklist
          items={[
            "You have 7 calendar days to rescind (with 0.25% penalty)",
            "Review the sunset clause — this is the developer's cancellation power",
            "Confirm the 2-5-10 New Home Warranty is in place",
            "Verify the completion date range and any extension rights",
            "Check assignment clause if you may sell before completion",
            "Have a real estate lawyer review — not just your agent",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Critical contract terms" />
          <StatGrid
            stats={[
              { value: "7 days", label: "Rescission period" },
              { value: "0.25%", label: "Rescission penalty" },
              { value: "2-5-10", label: "BC warranty coverage" },
              { value: "Sunset", label: "Developer out clause" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="2-5-10 warranty explained" />
          <div className="space-y-3 text-sm" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            <div className="flex gap-3">
              <span className="font-['Cormorant_Garamond'] text-lg font-semibold" style={{ color: "#C9A96E" }}>2yr</span>
              <p>Materials and labour defects</p>
            </div>
            <div className="flex gap-3">
              <span className="font-['Cormorant_Garamond'] text-lg font-semibold" style={{ color: "#C9A96E" }}>5yr</span>
              <p>Building envelope (water penetration)</p>
            </div>
            <div className="flex gap-3">
              <span className="font-['Cormorant_Garamond'] text-lg font-semibold" style={{ color: "#C9A96E" }}>10yr</span>
              <p>Structural defects</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
