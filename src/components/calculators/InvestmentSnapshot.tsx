// Investment Snapshot - Single Page with Step Navigation
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  TrendingUp, TrendingDown, RotateCcw, Share2, Download, Save, BarChart3, 
  ChevronLeft, ChevronRight, DollarSign, Building, Wallet, Home as HomeIcon
} from 'lucide-react';
import { calculatePTT, calculateGST } from '@/hooks/useROICalculator';
import { useSavedSnapshots } from '@/hooks/useSavedSnapshots';
import { SnapshotComparison } from './SnapshotComparison';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

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
  includeGST: false, // Off by default - user opts in
  includePTT: true,
};

const STEPS = [
  { id: 1, label: 'Price', icon: DollarSign },
  { id: 2, label: 'Costs', icon: Building },
  { id: 3, label: 'Rent', icon: Wallet },
  { id: 4, label: 'Results', icon: TrendingUp },
];

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);
  
  const { snapshots, saveSnapshot, deleteSnapshot, clearAllSnapshots, canSaveMore } = useSavedSnapshots();

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
    // GST only added to mortgage if user opts in
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
    const cashAtCompletion = remainingDownPayment + ptt + (inputs.includeGST ? 0 : calculateGST(inputs.purchasePrice));
    const totalCashRequired = totalDeposits + cashAtCompletion;
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    return {
      firstDeposit, secondDeposit, totalDeposits, downPayment, remainingDownPayment,
      mortgageAmount, monthlyMortgage, ptt, gst, priceWithGST, cashAtCompletion,
      totalCashRequired, totalMonthlyExpenses, monthlyCashFlow, annualCashFlow,
      gstAmount: calculateGST(inputs.purchasePrice),
    };
  }, [inputs]);

  const updateInput = (field: keyof SnapshotInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setInputs(DEFAULT_INPUTS);
    setCurrentStep(1);
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

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    const success = saveSnapshot(scenarioName.trim(), inputs, {
      totalCashRequired: results.totalCashRequired,
      monthlyCashFlow: results.monthlyCashFlow,
      annualCashFlow: results.annualCashFlow,
      cashAtCompletion: results.cashAtCompletion,
      mortgageAmount: results.mortgageAmount,
      monthlyMortgage: results.monthlyMortgage,
      totalMonthlyExpenses: results.totalMonthlyExpenses,
    });
    
    if (success) {
      toast.success('Scenario saved!');
      setShowSaveDialog(false);
      setScenarioName('');
      setShowComparison(true);
    } else {
      toast.error('Maximum 3 scenarios. Delete one first.');
    }
  };

  const openSaveDialog = () => {
    if (!canSaveMore) {
      toast.error('Maximum 3 scenarios. Delete one to save more.');
      setShowComparison(true);
      return;
    }
    setScenarioName(`${fmt(inputs.purchasePrice)} @ ${inputs.downPaymentPercent}%`);
    setShowSaveDialog(true);
  };

  const isPositive = results.monthlyCashFlow >= 0;
  const nextStep = () => setCurrentStep(s => Math.min(s + 1, 4));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-4">
      {/* Comparison Toggle */}
      {snapshots.length > 0 && !showComparison && (
        <button
          onClick={() => setShowComparison(true)}
          className="w-full mb-3 py-2 px-4 bg-primary/10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Compare {snapshots.length} saved scenario{snapshots.length > 1 ? 's' : ''}
        </button>
      )}

      {/* Comparison Panel */}
      {showComparison && snapshots.length > 0 && (
        <div className="mb-4">
          <SnapshotComparison
            snapshots={snapshots}
            onDelete={deleteSnapshot}
            onClearAll={() => {
              clearAllSnapshots();
              setShowComparison(false);
            }}
          />
          <Button 
            variant="ghost" 
            onClick={() => setShowComparison(false)} 
            className="w-full mt-2 text-muted-foreground"
          >
            Back to Calculator
          </Button>
        </div>
      )}

      {/* Main Calculator Card */}
      {!showComparison && (
        <div ref={snapshotRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with Actions */}
          <div className="bg-foreground text-background px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-primary" />
                <span className="font-bold">Investment Snapshot</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={resetToDefaults} className="text-background/70 hover:text-background hover:bg-white/10 h-8 w-8">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-background/70 hover:text-background hover:bg-white/10 h-8 w-8">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownloadImage} disabled={isDownloading} className="text-background/70 hover:text-background hover:bg-white/10 h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="bg-secondary/30 px-2 py-2">
            <div className="flex gap-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all",
                      isActive && "bg-white shadow-sm text-foreground",
                      !isActive && isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-4">
            {/* Step 1: Price & Down Payment */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold">Purchase Price</h2>
                  <p className="text-xs text-muted-foreground">Enter the presale purchase price</p>
                </div>

                <Input
                  type="text"
                  inputMode="numeric"
                  value={`$${inputs.purchasePrice.toLocaleString()}`}
                  onChange={handlePriceChange}
                  className="text-3xl font-bold text-center h-16 border-2 border-primary/30 focus:border-primary"
                />

                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Down Payment</span>
                    <span className="text-xl font-bold text-primary">{inputs.downPaymentPercent}%</span>
                  </div>
                  <Slider
                    value={[inputs.downPaymentPercent]}
                    onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
                    min={5} max={35} step={5}
                    className="my-2"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold">{fmt(results.downPayment)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Deposit 1</div>
                    <div className="flex items-center justify-between">
                      <Slider
                        value={[inputs.firstDepositPercent]}
                        onValueChange={(v) => updateInput('firstDepositPercent', v[0])}
                        min={1} max={15} step={1}
                        className="flex-1 mr-3"
                      />
                      <span className="text-sm font-bold w-10 text-right">{inputs.firstDepositPercent}%</span>
                    </div>
                    <div className="text-sm font-semibold mt-1">{fmt(results.firstDeposit)}</div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Deposit 2</div>
                    <div className="flex items-center justify-between">
                      <Slider
                        value={[inputs.secondDepositPercent]}
                        onValueChange={(v) => updateInput('secondDepositPercent', v[0])}
                        min={0} max={15} step={1}
                        className="flex-1 mr-3"
                      />
                      <span className="text-sm font-bold w-10 text-right">{inputs.secondDepositPercent}%</span>
                    </div>
                    <div className="text-sm font-semibold mt-1">{fmt(results.secondDeposit)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Closing Costs & Mortgage */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold">Closing Costs & Mortgage</h2>
                  <p className="text-xs text-muted-foreground">Configure your financing</p>
                </div>

                {/* GST Option - Prominent Toggle */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-amber-800 mb-1">Add GST to Mortgage?</div>
                      <p className="text-xs text-amber-700">
                        New construction requires 5% GST ({fmt(results.gstAmount)}). 
                        {inputs.includeGST 
                          ? ' It will be added to your mortgage principal.' 
                          : ' Currently due at completion as cash.'}
                      </p>
                    </div>
                    <Switch
                      checked={inputs.includeGST}
                      onCheckedChange={(v) => updateInput('includeGST', v)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* PTT Toggle */}
                <div className="flex items-center justify-between bg-secondary/20 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-medium">Property Transfer Tax</div>
                    <div className="text-xs text-muted-foreground">Due at completion</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{fmt(results.ptt)}</span>
                    <Switch
                      checked={inputs.includePTT}
                      onCheckedChange={(v) => updateInput('includePTT', v)}
                    />
                  </div>
                </div>

                {/* Mortgage Terms */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Interest Rate %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={inputs.interestRate}
                      onChange={(e) => updateInput('interestRate', parseFloat(e.target.value) || 0)}
                      className="h-11 text-center font-bold text-lg"
                    />
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Amortization</label>
                    <Input
                      type="number"
                      value={inputs.amortizationYears}
                      onChange={(e) => updateInput('amortizationYears', parseInt(e.target.value) || 0)}
                      className="h-11 text-center font-bold text-lg"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-foreground text-background rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm opacity-70">Mortgage Principal</span>
                    <span className="font-bold">{fmt(results.mortgageAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Monthly Payment</span>
                    <span className="font-bold text-primary">{fmt(results.monthlyMortgage)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Monthly Costs & Rent */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold">Monthly Cash Flow</h2>
                  <p className="text-xs text-muted-foreground">Enter your expected costs and rent</p>
                </div>

                {/* Monthly Expenses */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <label className="text-xs text-red-700 block mb-1">Strata Fees</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={inputs.strataFees}
                        onChange={(e) => updateInput('strataFees', parseInt(e.target.value) || 0)}
                        className="h-11 text-center font-bold pl-7"
                      />
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <label className="text-xs text-red-700 block mb-1">Property Tax</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={inputs.propertyTax}
                        onChange={(e) => updateInput('propertyTax', parseInt(e.target.value) || 0)}
                        className="h-11 text-center font-bold pl-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Monthly Costs */}
                <div className="bg-red-100 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-red-800">Total Monthly Costs</span>
                  <span className="text-xl font-bold text-red-700">{fmt(results.totalMonthlyExpenses)}</span>
                </div>

                {/* Expected Rent */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <label className="text-sm font-semibold text-green-700 block mb-2">Expected Monthly Rent</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 text-xl font-bold">$</span>
                    <Input
                      type="number"
                      value={inputs.monthlyRent}
                      onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
                      className="h-14 text-2xl text-center font-bold text-green-700 bg-white border-green-300 pl-10"
                    />
                  </div>
                </div>

                {/* Quick Preview */}
                <div className={cn(
                  "rounded-xl p-4 text-center",
                  isPositive ? "bg-green-100 border-2 border-green-300" : "bg-red-100 border-2 border-red-300"
                )}>
                  <div className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: isPositive ? '#166534' : '#dc2626' }}>
                    Monthly Cash Flow
                  </div>
                  <div className={cn("text-3xl font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                    {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Results Summary */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold">Investment Summary</h2>
                  <p className="text-xs text-muted-foreground">{fmt(inputs.purchasePrice)} presale investment</p>
                </div>

                {/* Cash Flow Result - Hero */}
                <div className={cn(
                  "rounded-xl p-4 text-center border-2",
                  isPositive ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"
                )}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {isPositive ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                    <span className={cn("text-sm font-bold uppercase", isPositive ? "text-green-600" : "text-red-600")}>
                      {isPositive ? 'Cash Flow Positive' : 'Cash Burn'}
                    </span>
                  </div>
                  <div className={cn("text-4xl font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                    {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}<span className="text-lg">/mo</span>
                  </div>
                  <div className={cn("text-sm", isPositive ? "text-green-700" : "text-red-700")}>
                    {isPositive ? '+' : ''}{fmt(results.annualCashFlow)} per year
                  </div>
                </div>

                {/* Investment Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-foreground text-background rounded-xl p-3 text-center">
                    <div className="text-xs opacity-70 mb-1">Cash at Completion</div>
                    <div className="text-xl font-bold">{fmt(results.cashAtCompletion)}</div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-primary font-medium mb-1">Total Investment</div>
                    <div className="text-xl font-bold">{fmt(results.totalCashRequired)}</div>
                  </div>
                </div>

                {/* Breakdown Details */}
                <div className="bg-secondary/10 rounded-xl p-3 text-sm space-y-1.5">
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
                  {!inputs.includeGST && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (Due at Completion)</span>
                      <span className="font-medium">{fmt(results.gstAmount)}</span>
                    </div>
                  )}
                  {inputs.includePTT && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PTT (Due at Completion)</span>
                      <span className="font-medium">{fmt(results.ptt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total Cash Needed</span>
                    <span>{fmt(results.totalCashRequired)}</span>
                  </div>
                </div>

                {/* Save Button */}
                <Button onClick={openSaveDialog} className="w-full h-11" variant={canSaveMore ? "default" : "outline"}>
                  <Save className="w-4 h-4 mr-2" />
                  {canSaveMore ? 'Save & Compare' : `Compare ${snapshots.length}/3 Scenarios`}
                </Button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex-1 h-11"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStep === 4}
                className="flex-1 h-11"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-2">Scenario Name</label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., $599K @ 20% down"
                className="h-12"
                autoFocus
              />
            </div>
            <div className="bg-secondary/20 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium">{fmt(inputs.purchasePrice)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Monthly Cash Flow</span>
                <span className={cn("font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                  {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Investment</span>
                <span className="font-medium">{fmt(results.totalCashRequired)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
