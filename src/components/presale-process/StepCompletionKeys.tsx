import { SectionCard, CostRow, SectionLabel } from "./shared";

export function StepCompletionKeys() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          On completion day your lawyer handles the title transfer and your mortgage funds flow to the developer. Once everything clears, you get your keys. What you owe at closing depends on whether you're a first-time buyer or an investor.
        </p>

        <ul className="space-y-2.5">
          {[
            "Mortgage funds released by your lender to the developer's lawyer",
            "Title transfers to you at the Land Title Office",
            "PTT and all closing costs are due on completion day",
            "Keys released same day or next business day",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionLabel text="Closing costs — Investor ($600K unit)" />
          <CostRow label="Deposits already paid (10%)" value="−$60,000" />
          <CostRow label="Remaining down payment" value="$60,000" />
          <CostRow label="GST (5%)" value="$30,000" />
          <CostRow label="PTT" value="$10,000" />
          <CostRow label="Legal + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Cash needed at closing</span>
            <span className="text-xl font-bold text-primary">~$102,300</span>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionLabel text="Closing costs — First-Time Buyer ($480K unit)" />
          <CostRow label="Deposits already paid (10%)" value="−$48,000" />
          <CostRow label="Remaining down payment" value="−$24,000" />
          <CostRow label="GST (5%)" value="$24,000" />
          <CostRow label="PTT — full exemption (≤ $1.1M)" value="$0" highlight />
          <CostRow label="GST rebate (partial)" value="~−$2,400" highlight />
          <CostRow label="CMHC insurance (added to mortgage)" value="$19,200" />
          <CostRow label="Legal + title insurance" value="~$2,300" />
          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Cash needed at closing</span>
            <span className="text-xl font-bold text-primary">~$45,100</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
