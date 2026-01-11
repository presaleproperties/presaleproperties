// Investment Snapshot - Responsive: Desktop, Tablet, Mobile
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RotateCcw, Share2, Download, DollarSign, Percent, Home, Calendar } from 'lucide-react';
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
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
    const priceWithGST = inputs.purchasePrice + gst;
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    const downPayment = priceWithGST * (inputs.downPaymentPercent / 100);
    const mortgageAmount = priceWithGST - downPayment;
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, inputs.interestRate, inputs.amortizationYears);
    const ptt = inputs.includePTT ? calculatePTT(inputs.purchasePrice, false) : 0;
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div ref={snapshotRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Investment Snapshot</h1>
                <p className="text-xs sm:text-sm opacity-70 hidden sm:block">Metro Vancouver Presale Calculator</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={resetToDefaults} className="text-background/70 hover:text-background hover:bg-white/10 h-9 w-9">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-background/70 hover:text-background hover:bg-white/10 h-9 w-9">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownloadImage} disabled={isDownloading} className="text-background/70 hover:text-background hover:bg-white/10 h-9 w-9">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Column 1: Price & Deposits */}
            <div className="space-y-4">
              {/* Purchase Price */}
              <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Purchase Price
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={`$${inputs.purchasePrice.toLocaleString()}`}
                  onChange={handlePriceChange}
                  className="text-2xl sm:text-3xl font-bold text-center h-14 border-2 border-primary/20 bg-white focus:border-primary"
                />
                {inputs.includeGST && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Price + GST: <span className="font-semibold">{fmt(results.priceWithGST)}</span>
                  </p>
                )}
              </div>

              {/* Deposits */}
              <div className="bg-secondary/20 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  Construction Deposits
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Deposit 1</span>
                      <span className="text-sm font-bold text-primary">{inputs.firstDepositPercent}%</span>
                    </div>
                    <Slider
                      value={[inputs.firstDepositPercent]}
                      onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
                      min={1} max={15} step={1}
                      className="my-2"
                    />
                    <div className="text-center text-sm font-semibold">{fmt(results.firstDeposit)}</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Deposit 2</span>
                      <span className="text-sm font-bold text-primary">{inputs.secondDepositPercent}%</span>
                    </div>
                    <Slider
                      value={[inputs.secondDepositPercent]}
                      onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
                      min={0} max={15} step={1}
                      className="my-2"
                    />
                    <div className="text-center text-sm font-semibold">{fmt(results.secondDeposit)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-sm font-medium">Total Deposits</span>
                  <span className="text-lg font-bold">{fmt(results.totalDeposits)}</span>
                </div>
              </div>

              {/* Down Payment */}
              <div className="bg-secondary/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Down Payment</h3>
                  <span className="text-lg font-bold text-primary">{inputs.downPaymentPercent}%</span>
                </div>
                <Slider
                  value={[inputs.downPaymentPercent]}
                  onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
                  min={5} max={35} step={5}
                  className="my-3"
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Required</span>
                  <span className="font-bold text-lg">{fmt(results.downPayment)}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Costs & Mortgage */}
            <div className="space-y-4">
              {/* GST/PTT Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={inputs.includeGST}
                      onCheckedChange={(v) => updateInput('includeGST', v)}
                    />
                    <span className="text-sm font-medium">GST (5%)</span>
                  </div>
                  <span className="text-sm font-bold">{fmt(results.gst)}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={inputs.includePTT}
                      onCheckedChange={(v) => updateInput('includePTT', v)}
                    />
                    <span className="text-sm font-medium">PTT</span>
                  </div>
                  <span className="text-sm font-bold">{fmt(results.ptt)}</span>
                </div>
              </div>

              {/* Mortgage Settings */}
              <div className="bg-secondary/20 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  Mortgage Terms
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Interest Rate %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={inputs.interestRate}
                      onChange={(e) => updateInput('interestRate', parseFloat(e.target.value) || 0)}
                      className="h-10 text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Amortization (Yrs)</label>
                    <Input
                      type="number"
                      value={inputs.amortizationYears}
                      onChange={(e) => updateInput('amortizationYears', parseInt(e.target.value) || 0)}
                      className="h-10 text-center font-semibold"
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mortgage Principal</span>
                  <span className="font-bold">{fmt(results.mortgageAmount)}</span>
                </div>
              </div>

              {/* Monthly Expenses */}
              <div className="bg-secondary/20 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Monthly Expenses</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Strata Fees</label>
                    <Input
                      type="number"
                      value={inputs.strataFees}
                      onChange={(e) => updateInput('strataFees', parseInt(e.target.value) || 0)}
                      className="h-10 text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Property Tax</label>
                    <Input
                      type="number"
                      value={inputs.propertyTax}
                      onChange={(e) => updateInput('propertyTax', parseInt(e.target.value) || 0)}
                      className="h-10 text-center font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mortgage Payment</span>
                    <span className="font-medium">{fmt(results.monthlyMortgage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Strata + Tax</span>
                    <span className="font-medium">{fmt(inputs.strataFees + inputs.propertyTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border/50">
                    <span>Total Monthly</span>
                    <span className="text-destructive">{fmt(results.totalMonthlyExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Results */}
            <div className="space-y-4">
              {/* Rent Input */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">Expected Rent</label>
                <Input
                  type="number"
                  value={inputs.monthlyRent}
                  onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
                  className="h-14 text-2xl text-center font-bold text-green-700 bg-white border-green-300 focus:border-green-500"
                />
              </div>

              {/* Cash Flow Result */}
              <div className={`rounded-xl p-5 text-center border-2 ${isPositive ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm font-bold uppercase tracking-wide ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? 'Cash Flow Positive' : 'Cash Burn'}
                  </span>
                </div>
                <div className={`text-3xl sm:text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                  <span className="text-base font-normal">/mo</span>
                </div>
                <div className={`text-sm mt-1 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                  {isPositive ? '+' : ''}{fmt(results.annualCashFlow)} per year
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="bg-foreground text-background rounded-xl p-4">
                  <div className="text-xs opacity-70 uppercase tracking-wider mb-1">Cash at Completion</div>
                  <div className="text-2xl font-bold">{fmt(results.cashAtCompletion)}</div>
                  <p className="text-xs opacity-60 mt-1">Down payment balance + PTT</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <div className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">Total Investment</div>
                  <div className="text-2xl font-bold text-foreground">{fmt(results.totalCashRequired)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Deposits + Cash at Completion</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-secondary/10 rounded-xl p-4 text-sm">
                <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Investment Breakdown</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit 1 ({inputs.firstDepositPercent}%)</span>
                    <span className="font-medium">{fmt(results.firstDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit 2 ({inputs.secondDepositPercent}%)</span>
                    <span className="font-medium">{fmt(results.secondDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Down Payment</span>
                    <span className="font-medium">{fmt(results.remainingDownPayment)}</span>
                  </div>
                  {inputs.includePTT && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PTT (Due on Completion)</span>
                      <span className="font-medium">{fmt(results.ptt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
                    <span>Total</span>
                    <span>{fmt(results.totalCashRequired)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="flex gap-2 mt-4 lg:hidden">
        <Button variant="outline" onClick={resetToDefaults} className="flex-1 h-11">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex-1 h-11">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button onClick={handleDownloadImage} disabled={isDownloading} className="flex-1 h-11">
          <Download className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}
