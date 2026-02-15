import { useState } from "react";

interface MortgageCalculatorProps {
  price: number;
  associationFee?: number | null;
  taxAnnualAmount?: number | null;
  livingArea?: number | null;
}

export function MortgageCalculator({ price, associationFee, taxAnnualAmount, livingArea }: MortgageCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(5.5);
  const [amortizationYears, setAmortizationYears] = useState(25);

  const downPayment = price * (downPaymentPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = amortizationYears * 12;

  const monthlyPayment = monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const totalMonthly = monthlyPayment + (associationFee || 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Mortgage Calculator</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Down Payment (%)</label>
          <input
            type="range"
            min={5}
            max={50}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{downPaymentPercent}%</span>
            <span>${downPayment.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Interest Rate (%)</label>
          <input
            type="number"
            step={0.1}
            min={0.1}
            max={15}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amortization (years)</label>
          <select
            value={amortizationYears}
            onChange={(e) => setAmortizationYears(Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={25}>25 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monthly Mortgage</span>
          <span className="font-semibold text-foreground">${Math.round(monthlyPayment).toLocaleString()}</span>
        </div>
        {associationFee ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Strata Fee</span>
              <span className="text-foreground">${associationFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
              <span className="text-foreground">Total Monthly</span>
              <span className="text-primary">${Math.round(totalMonthly).toLocaleString()}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
