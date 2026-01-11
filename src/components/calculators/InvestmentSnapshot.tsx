import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowDown, TrendingUp, TrendingDown, DollarSign, Calendar, Home, Banknote, RotateCcw, Share2, Copy, Check } from 'lucide-react';
import { calculatePTT, calculateGST } from '@/hooks/useROICalculator';
import { toast } from 'sonner';

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
  purchasePrice: 599000,
  firstDepositPercent: 5,
  secondDepositPercent: 5,
  downPaymentPercent: 20,
  interestRate: 4.49,
  amortizationYears: 25,
  monthlyRent: 2400,
  strataFees: 400,
  propertyTax: 175,
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
  
  const nc = searchParams.get('nc');
  if (nc) parsed.isNewConstruction = nc === '1';
  
  return parsed;
}

export function InvestmentSnapshot() {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<SnapshotInputs>(() => {
    const urlParams = parseUrlParams(searchParams);
    return { ...DEFAULT_INPUTS, ...urlParams };
  });
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    updateInput('purchasePrice', Number(rawValue) || 0);
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
    const remainingDownPayment = Math.max(0, downPayment - totalDeposits);
    const cashAtCompletion = remainingDownPayment + totalClosingCosts;
    const totalCashRequired = totalDeposits + cashAtCompletion;

    // Monthly numbers
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    return {
      firstDeposit,
      secondDeposit,
      totalDeposits,
      downPayment,
      remainingDownPayment,
      mortgageAmount,
      monthlyMortgage,
      ptt,
      gst,
      totalClosingCosts,
      cashAtCompletion,
      totalCashRequired,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualCashFlow,
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
      nc: inputs.isNewConstruction ? '1' : '0',
    });
    return `${window.location.origin}/investment-snapshot?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = generateShareUrl();
    const shareData = {
      title: 'Investment Snapshot',
      text: `Check out this condo investment: ${formatCurrency(inputs.purchasePrice)} with ${formatCurrency(results.monthlyCashFlow)}/mo cash flow`,
      url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const url = generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const isPositiveCashFlow = results.monthlyCashFlow >= 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-foreground">Investment Snapshot</h1>
        <p className="text-sm text-muted-foreground">Quick cash flow analysis</p>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Step 1: Purchase Price */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</div>
          <h2 className="font-semibold text-foreground">Purchase Price</h2>
        </div>
        
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            inputMode="numeric"
            value={inputs.purchasePrice.toLocaleString()}
            onChange={handlePriceChange}
            className="text-2xl font-bold text-center pl-10 h-14"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">New Construction</span>
          <Switch
            checked={inputs.isNewConstruction}
            onCheckedChange={(v) => updateInput('isNewConstruction', v)}
          />
        </div>
      </Card>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Step 2: Deposit Structure */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</div>
          <h2 className="font-semibold text-foreground">Deposits</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">On Signing</Label>
              <span className="text-xs font-medium">{inputs.firstDepositPercent}%</span>
            </div>
            <Slider
              value={[inputs.firstDepositPercent]}
              onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
              min={1}
              max={15}
              step={1}
            />
            <div className="text-center font-bold text-foreground">{formatCurrency(results.firstDeposit)}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">During Build</Label>
              <span className="text-xs font-medium">{inputs.secondDepositPercent}%</span>
            </div>
            <Slider
              value={[inputs.secondDepositPercent]}
              onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
              min={0}
              max={15}
              step={1}
            />
            <div className="text-center font-bold text-foreground">{formatCurrency(results.secondDeposit)}</div>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <span className="text-xs text-muted-foreground">Total Deposits</span>
          <div className="text-lg font-bold text-foreground">{formatCurrency(results.totalDeposits)}</div>
        </div>
      </Card>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Step 3: Down Payment & Completion */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">3</div>
          <h2 className="font-semibold text-foreground">At Completion</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground">Total Down Payment</Label>
            <span className="text-sm font-medium">{inputs.downPaymentPercent}%</span>
          </div>
          <Slider
            value={[inputs.downPaymentPercent]}
            onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
            min={5}
            max={35}
            step={5}
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Down Payment</span>
            <span className="font-medium">{formatCurrency(results.downPayment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− Deposits Paid</span>
            <span className="font-medium text-green-600">−{formatCurrency(results.totalDeposits)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining Down Payment</span>
            <span className="font-semibold">{formatCurrency(results.remainingDownPayment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">+ Closing Costs (PTT, GST)</span>
            <span className="font-medium">+{formatCurrency(results.totalClosingCosts)}</span>
          </div>
        </div>

        <div className="bg-foreground text-background rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs opacity-80 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Cash Needed at Completion</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(results.cashAtCompletion)}</div>
        </div>
      </Card>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Step 4: Mortgage & Carrying Costs */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">4</div>
          <h2 className="font-semibold text-foreground">Monthly Costs</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Rate %</Label>
            <Input
              type="number"
              step="0.01"
              value={inputs.interestRate}
              onChange={(e) => updateInput('interestRate', Number(e.target.value))}
              className="text-center h-10"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Years</Label>
            <Input
              type="number"
              value={inputs.amortizationYears}
              onChange={(e) => updateInput('amortizationYears', Number(e.target.value))}
              className="text-center h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Strata</Label>
            <Input
              type="number"
              value={inputs.strataFees}
              onChange={(e) => updateInput('strataFees', Number(e.target.value))}
              className="text-center h-10"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Property Tax /mo</Label>
            <Input
              type="number"
              value={inputs.propertyTax}
              onChange={(e) => updateInput('propertyTax', Number(e.target.value))}
              className="text-center h-10"
            />
          </div>
        </div>

        <div className="space-y-2 bg-secondary/30 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" /> Mortgage</span>
            <span className="font-medium">{formatCurrency(results.monthlyMortgage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strata</span>
            <span className="font-medium">{formatCurrency(inputs.strataFees)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property Tax</span>
            <span className="font-medium">{formatCurrency(inputs.propertyTax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total Monthly</span>
            <span className="text-destructive">{formatCurrency(results.totalMonthlyExpenses)}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Step 5: Rental Income */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">5</div>
          <h2 className="font-semibold text-foreground">Projected Rent</h2>
        </div>

        <div className="relative">
          <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="number"
            value={inputs.monthlyRent}
            onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
            className="text-2xl font-bold text-center pl-10 h-14"
          />
        </div>
      </Card>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Step 6: Cash Flow Result */}
      <Card className={`p-6 shadow-lg border-2 ${isPositiveCashFlow ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            {isPositiveCashFlow ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
            <h2 className="font-bold text-lg">
              {isPositiveCashFlow ? 'Cash Flow Positive' : 'Cash Burn'}
            </h2>
          </div>

          <div className="space-y-1">
            <div className={`text-4xl font-bold ${isPositiveCashFlow ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(results.monthlyCashFlow)}
              <span className="text-lg font-normal"> /mo</span>
            </div>
            <div className={`text-lg font-semibold ${isPositiveCashFlow ? 'text-green-700' : 'text-red-700'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(results.annualCashFlow)}
              <span className="text-sm font-normal"> /year</span>
            </div>
          </div>

          <div className="pt-3 border-t space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Rent</span>
              <span className="text-green-600 font-medium">+{formatCurrency(inputs.monthlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span>Expenses</span>
              <span className="text-red-600 font-medium">−{formatCurrency(results.totalMonthlyExpenses)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Investment Summary */}
      <Card className="p-4 bg-foreground text-background">
        <div className="text-center space-y-2">
          <div className="text-xs opacity-70">Total Cash Investment</div>
          <div className="text-2xl font-bold">{formatCurrency(results.totalCashRequired)}</div>
          <div className="flex justify-center gap-4 text-xs opacity-70">
            <span>Deposits: {formatCurrency(results.totalDeposits)}</span>
            <span>•</span>
            <span>At Closing: {formatCurrency(results.cashAtCompletion)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}