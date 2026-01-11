// Investment Snapshot Calculator
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Home, Banknote, RotateCcw, Share2, Download, Image } from 'lucide-react';
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

    // Closing costs with toggles
    const ptt = inputs.includePTT ? calculatePTT(inputs.purchasePrice, false) : 0;
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
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
      gst: inputs.includeGST ? '1' : '0',
      ptt: inputs.includePTT ? '1' : '0',
    });
    return `${window.location.origin}/investment-snapshot?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = generateShareUrl();
    const shareData = {
      title: 'Investment Snapshot',
      text: `${formatCurrency(inputs.purchasePrice)} condo • ${formatCurrency(results.monthlyCashFlow)}/mo cash flow`,
      url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      } catch {
        toast.error('Failed to copy');
      }
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
      link.download = `investment-snapshot-${inputs.purchasePrice}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded!');
    } catch {
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const isPositiveCashFlow = results.monthlyCashFlow >= 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-8">
      {/* Snapshot Content - this is what gets captured */}
      <div ref={snapshotRef} className="bg-white p-4 space-y-3">
        {/* Header */}
        <div className="text-center pb-2">
          <h1 className="text-xl font-bold text-foreground">Investment Snapshot</h1>
        </div>

        {/* Purchase Price */}
        <Card className="p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Purchase Price</span>
            <div className="relative w-40">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                inputMode="numeric"
                value={inputs.purchasePrice.toLocaleString()}
                onChange={handlePriceChange}
                className="text-lg font-bold text-right pr-3 pl-7 h-10"
              />
            </div>
          </div>
        </Card>

        {/* Deposits */}
        <Card className="p-4 shadow-sm space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Deposits</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">On Signing</span>
                <span className="font-medium">{inputs.firstDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.firstDepositPercent]}
                onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
                min={1}
                max={15}
                step={1}
              />
              <div className="text-center font-semibold text-sm">{formatCurrency(results.firstDeposit)}</div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">During Build</span>
                <span className="font-medium">{inputs.secondDepositPercent}%</span>
              </div>
              <Slider
                value={[inputs.secondDepositPercent]}
                onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
                min={0}
                max={15}
                step={1}
              />
              <div className="text-center font-semibold text-sm">{formatCurrency(results.secondDeposit)}</div>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg py-2 px-3 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total Deposits</span>
            <span className="font-bold">{formatCurrency(results.totalDeposits)}</span>
          </div>
        </Card>

        {/* Down Payment & Closing */}
        <Card className="p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Down Payment</span>
            <span className="text-sm font-medium">{inputs.downPaymentPercent}%</span>
          </div>
          <Slider
            value={[inputs.downPaymentPercent]}
            onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
            min={5}
            max={35}
            step={5}
          />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Down Payment</span>
              <span className="font-medium">{formatCurrency(results.downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">− Deposits</span>
              <span className="font-medium text-green-600">−{formatCurrency(results.totalDeposits)}</span>
            </div>
          </div>

          <Separator />

          {/* GST & PTT Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={inputs.includeGST}
                  onCheckedChange={(v) => updateInput('includeGST', v)}
                  id="gst-toggle"
                />
                <Label htmlFor="gst-toggle" className="text-sm">GST (5%)</Label>
              </div>
              <span className="text-sm font-medium">{formatCurrency(results.gst)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={inputs.includePTT}
                  onCheckedChange={(v) => updateInput('includePTT', v)}
                  id="ptt-toggle"
                />
                <Label htmlFor="ptt-toggle" className="text-sm">PTT (BC)</Label>
              </div>
              <span className="text-sm font-medium">{formatCurrency(results.ptt)}</span>
            </div>
          </div>

          <div className="bg-foreground text-background rounded-lg py-3 px-4 text-center">
            <div className="text-xs opacity-70 mb-1">Cash Needed at Completion</div>
            <div className="text-xl font-bold">{formatCurrency(results.cashAtCompletion)}</div>
          </div>
        </Card>

        {/* Monthly Costs */}
        <Card className="p-4 shadow-sm space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Monthly Costs</div>
          
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Rate %</Label>
              <Input
                type="number"
                step="0.01"
                value={inputs.interestRate}
                onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                className="text-center h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Years</Label>
              <Input
                type="number"
                value={inputs.amortizationYears}
                onChange={(e) => updateInput('amortizationYears', Number(e.target.value))}
                className="text-center h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Strata</Label>
              <Input
                type="number"
                value={inputs.strataFees}
                onChange={(e) => updateInput('strataFees', Number(e.target.value))}
                className="text-center h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tax/mo</Label>
              <Input
                type="number"
                value={inputs.propertyTax}
                onChange={(e) => updateInput('propertyTax', Number(e.target.value))}
                className="text-center h-9 text-sm"
              />
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" /> Mortgage</span>
              <span className="font-medium">{formatCurrency(results.monthlyMortgage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strata + Tax</span>
              <span className="font-medium">{formatCurrency(inputs.strataFees + inputs.propertyTax)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Total Monthly</span>
              <span className="text-destructive">{formatCurrency(results.totalMonthlyExpenses)}</span>
            </div>
          </div>
        </Card>

        {/* Rent */}
        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Projected Rent</span>
            <div className="relative w-32">
              <Banknote className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={inputs.monthlyRent}
                onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
                className="text-lg font-bold text-right pr-3 pl-7 h-10"
              />
            </div>
          </div>
        </Card>

        {/* Cash Flow Result */}
        <Card className={`p-5 border-2 ${isPositiveCashFlow ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {isPositiveCashFlow ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className="font-bold">
                {isPositiveCashFlow ? 'Cash Flow Positive' : 'Cash Burn'}
              </span>
            </div>

            <div className={`text-3xl font-bold ${isPositiveCashFlow ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(results.monthlyCashFlow)}
              <span className="text-base font-normal"> /mo</span>
            </div>
            <div className={`text-sm font-semibold ${isPositiveCashFlow ? 'text-green-700' : 'text-red-700'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(results.annualCashFlow)} /year
            </div>
          </div>
        </Card>

        {/* Total Investment Summary */}
        <Card className="p-4 bg-foreground text-background">
          <div className="text-center space-y-1">
            <div className="text-xs opacity-70">Total Cash Investment</div>
            <div className="text-xl font-bold">{formatCurrency(results.totalCashRequired)}</div>
            <div className="flex justify-center gap-3 text-xs opacity-70">
              <span>Deposits: {formatCurrency(results.totalDeposits)}</span>
              <span>•</span>
              <span>Closing: {formatCurrency(results.cashAtCompletion)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons - Outside snapshot area */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="flex-1 gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex-1 gap-1.5"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        <Button
          size="sm"
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="flex-1 gap-1.5 bg-primary"
        >
          {isDownloading ? (
            <Download className="w-4 h-4 animate-pulse" />
          ) : (
            <Image className="w-4 h-4" />
          )}
          Save Image
        </Button>
      </div>
    </div>
  );
}