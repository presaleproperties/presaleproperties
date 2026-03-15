import { SectionCard, StatGrid, Checklist, SectionLabel } from "./shared";

export function StepRegisterAccess() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <h2
            className="font-['Cormorant_Garamond'] font-light leading-[1.1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#F5F0E8" }}
          >
            Register for VIP Access
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            Most presale projects in Vancouver offer early access to registered buyers before going public. Working with an agent who has developer relationships gives you first pick at the best units and pricing.
          </p>
        </div>

        <Checklist
          items={[
            "Register directly through a Platinum agent for priority access",
            "VIP events typically open 2–4 weeks before public launch",
            "First-access buyers often get lower floors and better pricing",
            "Agent registration is free — developers pay the commission",
            "Ask about incentive packages (free upgrades, deposit structures)",
          ]}
        />
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Why VIP access matters" />
          <StatGrid
            stats={[
              { value: "2–4 wk", label: "Early access window" },
              { value: "70%", label: "Units sold before public launch" },
              { value: "$0", label: "Cost to register" },
              { value: "5–15%", label: "Avg. savings vs. resale" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionLabel text="What happens after you register" />
          <div className="space-y-3 text-sm" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
            <div className="flex items-center gap-3">
              <span style={{ color: "#C9A96E" }} className="font-['Cormorant_Garamond'] text-xl">01</span>
              <p>You receive floor plans and pricing ahead of the public</p>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: "#C9A96E" }} className="font-['Cormorant_Garamond'] text-xl">02</span>
              <p>Your agent reviews options and shortlists top units</p>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: "#C9A96E" }} className="font-['Cormorant_Garamond'] text-xl">03</span>
              <p>You attend the VIP event and sign your contract of purchase</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
