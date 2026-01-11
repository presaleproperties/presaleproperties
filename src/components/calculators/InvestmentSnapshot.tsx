// Investment Snapshot - GST added to mortgage, PTT due on completion
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RotateCcw, Share2, Download } from 'lucide-react';
import { calculatePTT, calculateGST } from '@/hooks/useROICalculator';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

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
  includeGST: boolean;
  includePTT: boolean;
}

const DEFAULT_INPUTS: SnapshotInputs = {
  purchasePrice: 599000,
  firstDepositPercent: 5,
  secondDepositPercent: 5,
  downPaymentPercent: 20,
  interestRate: 3.79,
  amortizationYears: 30,
  monthlyRent: 2400,
  strataFees: 275,
  propertyTax: 125,
  includeGST: true,
  includePTT: true,
};

function calculateMonthlyMortgage(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function parseUrlParams(searchParams: URLSearchParams): Partial<SnapshotInputs> {
  const parsed: Partial<SnapshotInputs> = {};
  const p = searchParams.get('p');
  if (p) parsed.purchasePrice = Number(p);
  const d1 = searchParams.get('d1');
  if (d1) parsed.firstDepositPercent = Number(d1);
  const d2 = searchParams.get('d2');
  if (d2) parsed.secondDepositPercent = Number(d2);
  const dp = searchParams.get('dp');
  if (dp) parsed.downPaymentPercent = Number(dp);
  const r = searchParams.get('r');
  if (r) parsed.interestRate = Number(r);
  const a = searchParams.get('a');
  if (a) parsed.amortizationYears = Number(a);
  const rent = searchParams.get('rent');
  if (rent) parsed.monthlyRent = Number(rent);
  const s = searchParams.get('s');
  if (s) parsed.strataFees = Number(s);
  const t = searchParams.get('t');
  if (t) parsed.propertyTax = Number(t);
  const gst = searchParams.get('gst');
  if (gst) parsed.includeGST = gst === '1';
  const ptt = searchParams.get('ptt');
  if (ptt) parsed.includePTT = ptt === '1';
  return parsed;
}

export function InvestmentSnapshot() {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<SnapshotInputs>(() => {
    const urlParams = parseUrlParams(searchParams);
    return { ...DEFAULT_INPUTS, ...urlParams };
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const fmt = (value: number) => new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    updateInput('purchasePrice', Number(rawValue) || 0);
  };

  const results = useMemo(() => {
    // GST is calculated on purchase price and added to mortgage principal
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
    const priceWithGST = inputs.purchasePrice + gst;
    
    // Deposits are based on original purchase price (paid during construction)
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    
    // Down payment is 20% of price INCLUDING GST
    const downPayment = priceWithGST * (inputs.downPaymentPercent / 100);
    
    // Mortgage includes GST (price + GST - down payment)
    const mortgageAmount = priceWithGST - downPayment;
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, inputs.interestRate, inputs.amortizationYears);
    
    // PTT is due on completion (closing cost, not added to mortgage)
    const ptt = inputs.includePTT ? calculatePTT(inputs.purchasePrice, false) : 0;
    
    // Cash at completion = remaining down payment + PTT
    const remainingDownPayment = Math.max(0, downPayment - totalDeposits);
    const cashAtCompletion = remainingDownPayment + ptt;
    const totalCashRequired = totalDeposits + cashAtCompletion;
    
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    return {
      firstDeposit, secondDeposit, totalDeposits, downPayment, remainingDownPayment,
      mortgageAmount, monthlyMortgage, ptt, gst, priceWithGST, cashAtCompletion,
      totalCashRequired, totalMonthlyExpenses, monthlyCashFlow, annualCashFlow,
    };
  }, [inputs]);

  const updateInput = (field: keyof SnapshotInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setInputs(DEFAULT_INPUTS);
    toast.success('Reset to defaults');
  };

  const generateShareUrl = () => {
    const params = new URLSearchParams({
      p: inputs.purchasePrice.toString(),
      d1: inputs.firstDepositPercent.toString(),
      d2: inputs.secondDepositPercent.toString(),
      dp: inputs.downPaymentPercent.toString(),
      r: inputs.interestRate.toString(),
      a: inputs.amortizationYears.toString(),
      rent: inputs.monthlyRent.toString(),
      s: inputs.strataFees.toString(),
      t: inputs.propertyTax.toString(),
      gst: inputs.includeGST ? '1' : '0',
      ptt: inputs.includePTT ? '1' : '0',
    });
    return `${window.location.origin}/investment-snapshot?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = generateShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Investment Snapshot', url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleDownloadImage = async () => {
    if (!snapshotRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(snapshotRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `investment-${inputs.purchasePrice}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsDownloading(false);
    }
  };

  const isPositive = results.monthlyCashFlow >= 0;

  return (
    <div className="w-full max-w-sm mx-auto px-3 pb-6">
      {/* Snapshot Card */}
      <div ref={snapshotRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-4 py-3 text-center">
          <h1 className="text-lg font-bold tracking-tight">Investment Snapshot</h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Purchase Price - Hero Input */}
          <div className="text-center">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Purchase Price</label>
            <Input
              type="text"
              inputMode="numeric"
              value={`$${inputs.purchasePrice.toLocaleString()}`}
              onChange={handlePriceChange}
              className="text-2xl font-bold text-center h-12 border-none shadow-none bg-secondary/30 mt-1"
            />
          </div>

          {/* Deposits Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/20 rounded-lg p-2.5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Deposit 1</span>
                <span className="font-semibold">{inputs.firstDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.firstDepositPercent]}
                onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
                min={1} max={15} step={1}
                className="my-1"
              />
              <div className="text-center text-sm font-bold">{fmt(results.firstDeposit)}</div>
            </div>
            <div className="bg-secondary/20 rounded-lg p-2.5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Deposit 2</span>
                <span className="font-semibold">{inputs.secondDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.secondDepositPercent]}
                onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
                min={0} max={15} step={1}
                className="my-1"
              />
              <div className="text-center text-sm font-bold">{fmt(results.secondDeposit)}</div>
            </div>
          </div>

          {/* Down Payment */}
          <div className="bg-secondary/20 rounded-lg p-2.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Down Payment</span>
              <span className="font-semibold">{inputs.downPaymentPercent}%</span>
            </div>
            <Slider
              value={[inputs.downPaymentPercent]}
              onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
              min={5} max={35} step={5}
              className="my-1"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{fmt(results.downPayment)}</span>
            </div>
          </div>

          {/* Closing Costs with Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={inputs.includeGST}
                  onCheckedChange={(v) => updateInput('includeGST', v)}
                  className="scale-75"
                />
                <span className="text-xs">GST</span>
              </div>
              <span className="text-xs font-semibold">{fmt(results.gst)}</span>
            </div>
            <div className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={inputs.includePTT}
                  onCheckedChange={(v) => updateInput('includePTT', v)}
                  className="scale-75"
                />
                <span className="text-xs">PTT</span>
              </div>
              <span className="text-xs font-semibold">{fmt(results.ptt)}</span>
            </div>
          </div>

          {/* Cash at Completion */}
          <div className="bg-foreground text-background rounded-lg p-3 text-center">
            <div className="text-xs opacity-70">Cash at Completion</div>
            <div className="text-xl font-bold">{fmt(results.cashAtCompletion)}</div>
          </div>

          {/* Mortgage Inputs - Compact Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center">
              <label className="text-[10px] text-muted-foreground block mb-0.5">Rate %</label>
              <Input
                type="number"
                step="0.01"
                value={inputs.interestRate}
                onChange={(e) => updateInput('interestRate', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs text-center px-1"
              />
            </div>
            <div className="text-center">
              <label className="text-[10px] text-muted-foreground block mb-0.5">Years</label>
              <Input
                type="number"
                value={inputs.amortizationYears}
                onChange={(e) => updateInput('amortizationYears', parseInt(e.target.value) || 0)}
                className="h-8 text-xs text-center px-1"
              />
            </div>
            <div className="text-center">
              <label className="text-[10px] text-muted-foreground block mb-0.5">Strata</label>
              <Input
                type="number"
                value={inputs.strataFees}
                onChange={(e) => updateInput('strataFees', parseInt(e.target.value) || 0)}
                className="h-8 text-xs text-center px-1"
              />
            </div>
            <div className="text-center">
              <label className="text-[10px] text-muted-foreground block mb-0.5">Tax</label>
              <Input
                type="number"
                value={inputs.propertyTax}
                onChange={(e) => updateInput('propertyTax', parseInt(e.target.value) || 0)}
                className="h-8 text-xs text-center px-1"
              />
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-secondary/30 rounded-lg p-2.5 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Mortgage</span>
              <span className="font-medium">{fmt(results.monthlyMortgage)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Strata + Tax</span>
              <span className="font-medium">{fmt(inputs.strataFees + inputs.propertyTax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/50">
              <span>Monthly Costs</span>
              <span className="text-destructive">{fmt(results.totalMonthlyExpenses)}</span>
            </div>
          </div>

          {/* Rent Input */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-green-700">Rent</span>
            <Input
              type="number"
              value={inputs.monthlyRent}
              onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
              className="w-24 h-8 text-right font-bold text-green-700 bg-transparent border-green-200"
            />
          </div>

          {/* Cash Flow Result */}
          <div className={`rounded-lg p-4 text-center border-2 ${isPositive ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              <span className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? 'Cash Flow Positive' : 'Cash Burn'}
              </span>
            </div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}<span className="text-sm font-normal">/mo</span>
            </div>
            <div className={`text-xs ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}{fmt(results.annualCashFlow)}/year
            </div>
          </div>

          {/* Total Investment */}
          <div className="bg-foreground text-background rounded-lg p-3 text-center">
            <div className="text-xs opacity-70">Total Cash Required</div>
            <div className="text-xl font-bold">{fmt(results.totalCashRequired)}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={resetToDefaults} className="flex-1 h-9 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 h-9 text-xs">
          <Share2 className="w-3.5 h-3.5 mr-1" />
          Share
        </Button>
        <Button size="sm" onClick={handleDownloadImage} disabled={isDownloading} className="flex-1 h-9 text-xs">
          <Download className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}
