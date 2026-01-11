import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Building2, DollarSign, Home, TrendingUp, Banknote, Wallet } from 'lucide-react';
import { calculatePTT, calculateGST } from '@/hooks/useROICalculator';

interface SnapshotInputs {
  purchasePrice: number;
  firstDepositPercent: number;
  secondDepositPercent: number;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  monthlyRent: number;
  strataFees: number;
  propertyTax: number;
  isNewConstruction: boolean;
  isFirstTimeBuyer: boolean;
}

const DEFAULT_INPUTS: SnapshotInputs = {
  purchasePrice: 499000,
  firstDepositPercent: 5,
  secondDepositPercent: 5,
  downPaymentPercent: 20,
  interestRate: 3.79,
  amortizationYears: 30,
  monthlyRent: 2200,
  strataFees: 350,
  propertyTax: 200,
  isNewConstruction: true,
  isFirstTimeBuyer: false,
};

function calculateMonthlyMortgage(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

export function InvestmentSnapshot() {
  const [inputs, setInputs] = useState<SnapshotInputs>(DEFAULT_INPUTS);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const results = useMemo(() => {
    // Deposit calculations
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    
    const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
    const mortgageAmount = inputs.purchasePrice - downPayment;
    const monthlyMortgage = calculateMonthlyMortgage(
      mortgageAmount,
      inputs.interestRate,
      inputs.amortizationYears
    );

    // Closing costs
    const ptt = calculatePTT(inputs.purchasePrice, inputs.isFirstTimeBuyer);
    const gst = inputs.isNewConstruction ? calculateGST(inputs.purchasePrice) : 0;
    const totalClosingCosts = ptt + gst;
    
    // Cash needed at completion = Down Payment - Deposits Already Paid + Closing Costs
    const cashAtCompletion = Math.max(0, downPayment - totalDeposits) + totalClosingCosts;
    const totalCashRequired = downPayment + totalClosingCosts;

    // Monthly numbers
    const monthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - monthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // Determine cash flow status
    let cashFlowStatus: 'positive' | 'negative' | 'neutral';
    let cashFlowMessage: string;
    
    if (monthlyCashFlow > 200) {
      cashFlowStatus = 'positive';
      cashFlowMessage = 'Strong Positive Cash Flow • Good Investment';
    } else if (monthlyCashFlow > 0) {
      cashFlowStatus = 'neutral';
      cashFlowMessage = 'Tight but Positive Cash Flow • Long-term Hold';
    } else {
      cashFlowStatus = 'negative';
      cashFlowMessage = 'Negative Cash Flow • Review Numbers';
    }

    return {
      firstDeposit,
      secondDeposit,
      totalDeposits,
      downPayment,
      mortgageAmount,
      monthlyMortgage,
      ptt,
      gst,
      totalClosingCosts,
      cashAtCompletion,
      totalCashRequired,
      monthlyCashFlow,
      annualCashFlow,
      cashFlowStatus,
      cashFlowMessage,
    };
  }, [inputs]);

  const updateInput = (field: keyof SnapshotInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-block bg-[#1e3a5f] text-white px-6 py-3 rounded-t-xl">
          <h1 className="text-xl font-bold tracking-wide">CONDO INVESTMENT SNAPSHOT</h1>
        </div>
      </div>

      <Card className="p-6 space-y-6 shadow-lg border-0 rounded-2xl bg-gradient-to-b from-white to-secondary/30">
        {/* Purchase Overview - Inputs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center text-[#1e3a5f]">
            <Building2 className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Purchase Overview</span>
          </div>
          <Separator className="bg-[#1e3a5f]/20" />

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Purchase Price</Label>
              <Input
                type="number"
                value={inputs.purchasePrice}
                onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
                className="text-lg font-semibold text-center"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Down Payment</Label>
                <span className="text-sm font-medium">{inputs.downPaymentPercent}%</span>
              </div>
              <Slider
                value={[inputs.downPaymentPercent]}
                onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
                min={5}
                max={50}
                step={5}
                className="mb-2"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Purchase Price</div>
              <div className="text-base font-bold text-[#1e3a5f]">{formatCurrency(inputs.purchasePrice)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Down Payment</div>
              <div className="text-base font-bold text-[#1e3a5f]">{formatCurrency(results.downPayment)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Mortgage Amount</div>
              <div className="text-base font-bold text-[#1e3a5f]">{formatCurrency(results.mortgageAmount)}</div>
            </div>
          </div>
        </div>

        {/* Deposit Structure */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-[#c9a227]">
            <Wallet className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Deposit Structure</span>
          </div>
          <Separator className="bg-[#c9a227]/20" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs text-muted-foreground">First Deposit</Label>
                <span className="text-sm font-medium">{inputs.firstDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.firstDepositPercent]}
                onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
                min={1}
                max={20}
                step={1}
              />
              <div className="text-center text-sm font-semibold text-[#1e3a5f] mt-1">
                {formatCurrency(results.firstDeposit)}
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Second Deposit</Label>
                <span className="text-sm font-medium">{inputs.secondDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.secondDepositPercent]}
                onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
                min={0}
                max={20}
                step={1}
              />
              <div className="text-center text-sm font-semibold text-[#1e3a5f] mt-1">
                {formatCurrency(results.secondDeposit)}
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-secondary/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>First Deposit (on signing)</span>
              <span className="font-semibold">{formatCurrency(results.firstDeposit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Second Deposit (during construction)</span>
              <span className="font-semibold">{formatCurrency(results.secondDeposit)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Total Deposits</span>
              <span className="font-bold text-[#1e3a5f]">{formatCurrency(results.totalDeposits)}</span>
            </div>
          </div>

          {/* Cash Needed at Completion */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white rounded-lg py-3 px-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">Cash Needed at Completion</span>
              <span className="text-xl font-bold">{formatCurrency(results.cashAtCompletion)}</span>
            </div>
            <p className="text-xs text-white/70">Remaining down payment + closing costs</p>
          </div>
        </div>

        {/* Closing Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-[#4a7c59]">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Closing Costs</span>
          </div>
          <Separator className="bg-[#4a7c59]/20" />

          <div className="flex items-center justify-between">
            <span className="text-sm">New Construction (GST applies)</span>
            <Switch
              checked={inputs.isNewConstruction}
              onCheckedChange={(v) => updateInput('isNewConstruction', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">First-Time Home Buyer</span>
            <Switch
              checked={inputs.isFirstTimeBuyer}
              onCheckedChange={(v) => updateInput('isFirstTimeBuyer', v)}
            />
          </div>

          <div className="space-y-2 bg-secondary/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>PTT (BC Transfer Tax)</span>
              <span className="font-semibold">{formatCurrency(results.ptt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST</span>
              <span className="font-semibold">{formatCurrency(results.gst)}</span>
            </div>
          </div>

          {/* Total Cash Required */}
          <div className="bg-gradient-to-r from-[#c9a227] to-[#d4af37] text-white rounded-lg py-3 px-4 flex justify-between items-center">
            <span className="font-bold uppercase tracking-wide text-sm">Total Cash Required</span>
            <span className="text-xl font-bold">{formatCurrency(results.totalCashRequired)}</span>
          </div>
        </div>

        {/* Mortgage Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-[#1e3a5f]">
            <Home className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Mortgage Details</span>
          </div>
          <Separator className="bg-[#1e3a5f]/20" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={inputs.interestRate}
                onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amortization (Years)</Label>
              <Input
                type="number"
                value={inputs.amortizationYears}
                onChange={(e) => updateInput('amortizationYears', Number(e.target.value))}
                className="text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Interest Rate</div>
              <div className="text-lg font-bold text-[#1e3a5f]">{inputs.interestRate}%</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Amortization</div>
              <div className="text-lg font-bold text-[#1e3a5f]">{inputs.amortizationYears} Years</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className="text-xs text-[#4a7c59] font-medium mb-1">Monthly Payment</div>
              <div className="text-lg font-bold text-[#1e3a5f]">{formatCurrency(results.monthlyMortgage)}</div>
            </div>
          </div>
        </div>

        {/* Monthly Numbers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-[#1e3a5f]">
            <Banknote className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Monthly Numbers</span>
          </div>
          <Separator className="bg-[#1e3a5f]/20" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Monthly Rent</Label>
              <Input
                type="number"
                value={inputs.monthlyRent}
                onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Strata Fees</Label>
              <Input
                type="number"
                value={inputs.strataFees}
                onChange={(e) => updateInput('strataFees', Number(e.target.value))}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Property Tax</Label>
              <Input
                type="number"
                value={inputs.propertyTax}
                onChange={(e) => updateInput('propertyTax', Number(e.target.value))}
                className="text-center"
              />
            </div>
          </div>

          <div className="space-y-2 bg-secondary/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>Rent</span>
              <span className="font-semibold text-[#4a7c59]">{formatCurrency(inputs.monthlyRent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mortgage</span>
              <span className="font-semibold text-destructive">-{formatCurrency(results.monthlyMortgage)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Strata Fees</span>
              <span className="font-semibold text-destructive">-{formatCurrency(inputs.strataFees)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Property Tax</span>
              <span className="font-semibold text-destructive">-{formatCurrency(inputs.propertyTax)}</span>
            </div>
          </div>
        </div>

        {/* Cash Flow Result */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-[#1e3a5f]">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">Cash Flow Result</span>
          </div>
          <Separator className="bg-[#1e3a5f]/20" />

          <div className="space-y-2">
            <div className={`rounded-lg py-3 px-4 text-center ${
              results.monthlyCashFlow >= 0 
                ? 'bg-gradient-to-r from-[#4a7c59] to-[#5a8c69] text-white' 
                : 'bg-gradient-to-r from-destructive to-red-500 text-white'
            }`}>
              <div className="text-xl font-bold">
                {results.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(results.monthlyCashFlow)} / Month
              </div>
            </div>
            <div className={`rounded-lg py-3 px-4 text-center ${
              results.annualCashFlow >= 0 
                ? 'bg-gradient-to-r from-[#4a7c59] to-[#5a8c69] text-white' 
                : 'bg-gradient-to-r from-destructive to-red-500 text-white'
            }`}>
              <div className="text-xl font-bold">
                {results.annualCashFlow >= 0 ? '+' : ''}{formatCurrency(results.annualCashFlow)} / Year
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-[#1e3a5f] text-white rounded-lg py-4 px-4 text-center">
            <p className="text-sm font-medium italic">{results.cashFlowMessage}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
