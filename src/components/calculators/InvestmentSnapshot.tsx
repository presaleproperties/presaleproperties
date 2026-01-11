// Investment Snapshot - 2-Page Wizard with Equity Analysis
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, RotateCcw, Share2, Download, DollarSign, 
  Percent, Home, Calendar, Save, BarChart3, ChevronRight, ChevronLeft,
  PiggyBank, ArrowUpRight, Users, Building
} from 'lucide-react';
import { calculatePTT, calculateGST } from '@/hooks/useROICalculator';
import { useSavedSnapshots } from '@/hooks/useSavedSnapshots';
import { SnapshotComparison } from './SnapshotComparison';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

type BuyerType = 'firstTimeBuyer' | 'investor';

interface SnapshotInputs {
  buyerType: BuyerType;
  purchasePrice: number;
  firstDepositPercent: number;
  secondDepositPercent: number;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  closingCosts: number;
  monthlyRent: number;
  strataFees: number;
  propertyTax: number;
  includeGST: boolean;
  holdingPeriodYears: number;
  appreciationRate: number;
}

const DEFAULT_INPUTS: SnapshotInputs = {
  buyerType: 'investor',
  purchasePrice: 599000,
  firstDepositPercent: 5,
  secondDepositPercent: 5,
  downPaymentPercent: 20,
  interestRate: 3.79,
  amortizationYears: 30,
  closingCosts: 3000,
  monthlyRent: 2400,
  strataFees: 275,
  propertyTax: 125,
  includeGST: true,
  holdingPeriodYears: 5,
  appreciationRate: 3,
};

function calculateCMHCPremium(mortgageAmount: number, downPaymentPercent: number): number {
  // CMHC insurance is required for down payments less than 20%
  if (downPaymentPercent >= 20) return 0;
  
  // CMHC premium rates based on down payment percentage
  let premiumRate: number;
  if (downPaymentPercent >= 15) {
    premiumRate = 0.028; // 2.80%
  } else if (downPaymentPercent >= 10) {
    premiumRate = 0.031; // 3.10%
  } else {
    premiumRate = 0.04; // 4.00%
  }
  
  return mortgageAmount * premiumRate;
}

function calculateMonthlyMortgage(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateMortgagePaydown(principal: number, annualRate: number, years: number, holdingYears: number) {
  if (principal <= 0 || annualRate <= 0) return { principalPaid: 0, remainingBalance: principal };
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  let balance = principal;
  let totalPrincipalPaid = 0;
  const holdingMonths = holdingYears * 12;
  
  for (let i = 0; i < holdingMonths && balance > 0; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    totalPrincipalPaid += principalPayment;
    balance -= principalPayment;
  }
  
  return { principalPaid: totalPrincipalPaid, remainingBalance: Math.max(0, balance) };
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
  const bt = searchParams.get('bt');
  if (bt) parsed.buyerType = bt === 'ftb' ? 'firstTimeBuyer' : 'investor';
  const hold = searchParams.get('hold');
  if (hold) parsed.holdingPeriodYears = Number(hold);
  const app = searchParams.get('app');
  if (app) parsed.appreciationRate = Number(app);
  return parsed;
}

export function InvestmentSnapshot() {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<SnapshotInputs>(() => {
    const urlParams = parseUrlParams(searchParams);
    return { ...DEFAULT_INPUTS, ...urlParams };
  });
  const [currentPage, setCurrentPage] = useState<'cashflow' | 'equity'>('cashflow');
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
    const isFirstTimeBuyer = inputs.buyerType === 'firstTimeBuyer';
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
    const priceWithGST = inputs.purchasePrice + gst;
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    const downPayment = priceWithGST * (inputs.downPaymentPercent / 100);
    
    // Calculate base mortgage (before CMHC)
    const baseMortgageAmount = priceWithGST - downPayment;
    
    // Calculate CMHC insurance premium (added to mortgage if down payment < 20%)
    const cmhcPremium = calculateCMHCPremium(baseMortgageAmount, inputs.downPaymentPercent);
    
    // Total mortgage includes CMHC premium
    const mortgageAmount = baseMortgageAmount + cmhcPremium;
    
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, inputs.interestRate, inputs.amortizationYears);
    // First time buyers are exempt from PTT on properties under $500k (full) or partial up to $525k
    const ptt = isFirstTimeBuyer ? 0 : calculatePTT(inputs.purchasePrice, false);
    const remainingDownPayment = Math.max(0, downPayment - totalDeposits);
    const closingCosts = inputs.closingCosts;
    const cashAtCompletion = remainingDownPayment + ptt + closingCosts;
    const totalCashRequired = totalDeposits + cashAtCompletion;
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // Equity calculations
    const { principalPaid, remainingBalance } = calculateMortgagePaydown(
      mortgageAmount, 
      inputs.interestRate, 
      inputs.amortizationYears, 
      inputs.holdingPeriodYears
    );
    
    const futureValue = priceWithGST * Math.pow(1 + inputs.appreciationRate / 100, inputs.holdingPeriodYears);
    const appreciation = futureValue - priceWithGST;
    const totalEquityBuilt = downPayment + principalPaid + appreciation;
    const equityFromPaydown = principalPaid;
    const totalCashFlowOverPeriod = annualCashFlow * inputs.holdingPeriodYears;
    const totalReturn = appreciation + principalPaid + totalCashFlowOverPeriod;
    const roiPercent = totalCashRequired > 0 ? (totalReturn / totalCashRequired) * 100 : 0;

    return {
      firstDeposit, secondDeposit, totalDeposits, downPayment, remainingDownPayment,
      baseMortgageAmount, cmhcPremium, mortgageAmount, monthlyMortgage, ptt, gst, priceWithGST, 
      closingCosts, cashAtCompletion, totalCashRequired, totalMonthlyExpenses, monthlyCashFlow, annualCashFlow,
      principalPaid, remainingBalance, futureValue, appreciation, totalEquityBuilt,
      equityFromPaydown, totalCashFlowOverPeriod, totalReturn, roiPercent,
    };
  }, [inputs]);

  const updateInput = (field: keyof SnapshotInputs, value: number | boolean | BuyerType) => {
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
      bt: inputs.buyerType === 'firstTimeBuyer' ? 'ftb' : 'inv',
      hold: inputs.holdingPeriodYears.toString(),
      app: inputs.appreciationRate.toString(),
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8 space-y-4">
      {/* Main Calculator Card */}
      <div ref={snapshotRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold">Investment Snapshot</h1>
                <p className="text-[10px] sm:text-xs opacity-70 hidden sm:block">Metro Vancouver Presale Calculator</p>
              </div>
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
              <Button variant="ghost" size="icon" onClick={openSaveDialog} className="text-background/70 hover:text-background hover:bg-white/10 h-8 w-8">
                <Save className="w-4 h-4" />
              </Button>
              {snapshots.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowComparison(!showComparison)} 
                  className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 relative"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary text-background text-[9px] rounded-full flex items-center justify-center font-bold">
                    {snapshots.length}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Buyer Type Toggle */}
        <div className="px-4 py-3 bg-secondary/10 border-b border-border/30">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => updateInput('buyerType', 'firstTimeBuyer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                inputs.buyerType === 'firstTimeBuyer'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-secondary/50 border border-border/50'
              }`}
            >
              <Users className="w-4 h-4" />
              First Time Buyer
            </button>
            <button
              onClick={() => updateInput('buyerType', 'investor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                inputs.buyerType === 'investor'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-secondary/50 border border-border/50'
              }`}
            >
              <Building className="w-4 h-4" />
              Investor
            </button>
          </div>
        </div>

        {/* Page Tabs */}
        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as 'cashflow' | 'equity')} className="w-full">
          <div className="border-b border-border/50 bg-secondary/20">
            <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
              <TabsTrigger 
                value="cashflow" 
                className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <DollarSign className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">{inputs.buyerType === 'firstTimeBuyer' ? 'Monthly Payment' : 'Cash Flow'}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="equity" 
                className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <PiggyBank className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Equity & Growth</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Page 1: Cash Flow */}
          <TabsContent value="cashflow" className="p-4 sm:p-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Inputs */}
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
                    className="text-xl sm:text-2xl font-bold text-center h-12 border-2 border-primary/20 bg-white focus:border-primary"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Price + GST:</span>
                    <span className="font-semibold">{fmt(results.priceWithGST)}</span>
                  </div>
                </div>

                {/* Deposits Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/20 rounded-xl p-3">
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
                  <div className="bg-secondary/20 rounded-xl p-3">
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

                {/* Down Payment & Toggles */}
                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase">Down Payment</h3>
                    <span className="text-lg font-bold text-primary">{inputs.downPaymentPercent}%</span>
                  </div>
                  <Slider
                    value={[inputs.downPaymentPercent]}
                    onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
                    min={5} max={35} step={5}
                    className="my-2"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Required</span>
                    <span className="font-bold">{fmt(results.downPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={inputs.includeGST} onCheckedChange={(v) => updateInput('includeGST', v)} className="scale-75" />
                      <span className="text-xs">GST {fmt(results.gst)}</span>
                    </label>
                    {inputs.buyerType === 'investor' && results.ptt > 0 && (
                      <span className="text-xs text-muted-foreground">PTT: {fmt(results.ptt)}</span>
                    )}
                    {inputs.buyerType === 'firstTimeBuyer' && (
                      <span className="text-xs text-green-600 font-medium">PTT Exempt ✓</span>
                    )}
                  </div>
                </div>

                {/* Mortgage & Expenses */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/20 rounded-xl p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Rate %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={inputs.interestRate}
                      onChange={(e) => updateInput('interestRate', parseFloat(e.target.value) || 0)}
                      className="h-9 text-center font-semibold text-sm"
                    />
                  </div>
                  <div className="bg-secondary/20 rounded-xl p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Amortization</label>
                    <Input
                      type="number"
                      value={inputs.amortizationYears}
                      onChange={(e) => updateInput('amortizationYears', parseInt(e.target.value) || 0)}
                      className="h-9 text-center font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/20 rounded-xl p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Strata</label>
                    <Input
                      type="number"
                      value={inputs.strataFees}
                      onChange={(e) => updateInput('strataFees', parseInt(e.target.value) || 0)}
                      className="h-9 text-center font-semibold text-sm"
                    />
                  </div>
                  <div className="bg-secondary/20 rounded-xl p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Tax/mo</label>
                    <Input
                      type="number"
                      value={inputs.propertyTax}
                      onChange={(e) => updateInput('propertyTax', parseInt(e.target.value) || 0)}
                      className="h-9 text-center font-semibold text-sm"
                    />
                  </div>
                  {inputs.buyerType === 'investor' ? (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                      <label className="text-xs text-green-700 block mb-1">Rent</label>
                      <Input
                        type="number"
                        value={inputs.monthlyRent}
                        onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
                        className="h-9 text-center font-semibold text-sm text-green-700 border-green-300"
                      />
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                      <label className="text-xs text-amber-700 block mb-1">Closing</label>
                      <Input
                        type="number"
                        value={inputs.closingCosts}
                        onChange={(e) => updateInput('closingCosts', parseInt(e.target.value) || 0)}
                        className="h-9 text-center font-semibold text-sm text-amber-700 border-amber-300"
                      />
                      <p className="text-[9px] text-amber-600 mt-0.5">Lawyer, etc.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="space-y-4">
                {inputs.buyerType === 'firstTimeBuyer' ? (
                  <>
                    {/* First Time Buyer - Monthly Payment Focus */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center border-2 border-primary/30">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Home className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold uppercase text-primary">Your Monthly Payment</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-foreground">
                        {fmt(results.totalMonthlyExpenses)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </div>
                      <div className="text-xs mt-1 text-muted-foreground">
                        Mortgage + Strata + Tax
                      </div>
                    </div>

                    {/* Monthly Breakdown - First Time Buyer */}
                    <div className="bg-secondary/20 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Monthly Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mortgage</span>
                          <span className="font-medium">{fmt(results.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Strata</span>
                          <span className="font-medium">{fmt(inputs.strataFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Property Tax</span>
                          <span className="font-medium">{fmt(inputs.propertyTax)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
                          <span>Total Monthly</span>
                          <span>{fmt(results.totalMonthlyExpenses)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cash to Close - First Time Buyer */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase text-green-700">PTT Exemption Savings</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        You save {fmt(calculatePTT(inputs.purchasePrice, false))} on PTT
                      </div>
                      <p className="text-xs text-green-600 mt-1">First-time buyer benefit</p>
                    </div>

                    {/* Cash Required Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-foreground text-background rounded-xl p-3">
                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Cash at Completion</div>
                        <div className="text-lg font-bold">{fmt(results.cashAtCompletion)}</div>
                        <p className="text-[10px] opacity-60">Balance + Closing</p>
                      </div>
                      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                        <div className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-1">Total Cash Needed</div>
                        <div className="text-lg font-bold">{fmt(results.totalCashRequired)}</div>
                        <p className="text-[10px] text-muted-foreground">Deposits + Cash</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Investor - Cash Flow Focus */}
                    <div className={`rounded-xl p-4 text-center border-2 ${isPositive ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {isPositive ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                        <span className={`text-xs font-bold uppercase ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? 'Cash Flow Positive' : 'Cash Burn'}
                        </span>
                      </div>
                      <div className={`text-3xl sm:text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                        <span className="text-sm font-normal">/mo</span>
                      </div>
                      <div className={`text-xs mt-1 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                        {isPositive ? '+' : ''}{fmt(results.annualCashFlow)} per year
                      </div>
                    </div>

                    {/* Monthly Breakdown - Investor */}
                    <div className="bg-secondary/20 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Monthly Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">+ Rent Income</span>
                          <span className="font-medium text-green-600">{fmt(inputs.monthlyRent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">- Mortgage</span>
                          <span className="font-medium">{fmt(results.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">- Strata + Tax</span>
                          <span className="font-medium">{fmt(inputs.strataFees + inputs.propertyTax)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
                          <span>Net Cash Flow</span>
                          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                            {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Summary - Investor */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-foreground text-background rounded-xl p-3">
                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Cash at Completion</div>
                        <div className="text-lg font-bold">{fmt(results.cashAtCompletion)}</div>
                        <p className="text-[10px] opacity-60">Balance + PTT + Closing</p>
                      </div>
                      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                        <div className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-1">Total Investment</div>
                        <div className="text-lg font-bold">{fmt(results.totalCashRequired)}</div>
                        <p className="text-[10px] text-muted-foreground">Deposits + Cash</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Mortgage Info - Both */}
                <div className="bg-secondary/10 rounded-xl p-3 border border-border/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mortgage Principal</span>
                    <span className="font-bold">{fmt(results.mortgageAmount)}</span>
                  </div>
                  {results.cmhcPremium > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Base Mortgage</span>
                        <span>{fmt(results.baseMortgageAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-600">+ CMHC Insurance</span>
                        <span className="text-amber-600 font-medium">{fmt(results.cmhcPremium)}</span>
                      </div>
                      <p className="text-[10px] text-amber-600 pt-1 border-t border-border/30">
                        Required for down payments under 20%
                      </p>
                    </>
                  )}
                </div>

                {/* Next Page Button */}
                <Button 
                  onClick={() => setCurrentPage('equity')}
                  className="w-full h-11"
                  variant="outline"
                >
                  View Equity & Growth
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Page 2: Equity & Growth */}
          <TabsContent value="equity" className="p-4 sm:p-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Inputs */}
              <div className="space-y-4">
                {/* Holding Period */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <label className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Holding Period
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateInput('holdingPeriodYears', Math.max(1, inputs.holdingPeriodYears - 1))}
                      className="h-10 w-10"
                    >
                      -
                    </Button>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">{inputs.holdingPeriodYears}</div>
                      <div className="text-xs text-muted-foreground">years</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateInput('holdingPeriodYears', Math.min(30, inputs.holdingPeriodYears + 1))}
                      className="h-10 w-10"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Appreciation Rate */}
                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Annual Appreciation
                    </label>
                    <span className="text-lg font-bold text-primary">{inputs.appreciationRate}%</span>
                  </div>
                  <Slider
                    value={[inputs.appreciationRate]}
                    onValueChange={(v) => updateInput('appreciationRate', v[0])}
                    min={0} max={10} step={0.5}
                    className="my-3"
                  />
                  <div className="grid grid-cols-3 text-center text-xs text-muted-foreground pt-2">
                    <span>0%</span>
                    <span>5%</span>
                    <span>10%</span>
                  </div>
                </div>

                {/* Property Summary */}
                <div className="bg-secondary/10 rounded-xl p-4 border border-border/30 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Property Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="font-medium">{fmt(inputs.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price + GST</span>
                    <span className="font-medium">{fmt(results.priceWithGST)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mortgage Amount</span>
                    <span className="font-medium">{fmt(results.mortgageAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Down Payment</span>
                    <span className="font-medium">{fmt(results.downPayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Total Cash Invested</span>
                    <span className="font-bold">{fmt(results.totalCashRequired)}</span>
                  </div>
                </div>

                {/* Back Button */}
                <Button 
                  onClick={() => setCurrentPage('cashflow')}
                  className="w-full h-11 md:hidden"
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Cash Flow
                </Button>
              </div>

              {/* Right Column: Results */}
              <div className="space-y-4">
                {/* Future Value */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-green-700 uppercase">
                      Future Property Value
                    </span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {inputs.holdingPeriodYears} years
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">{fmt(results.futureValue)}</div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+{fmt(results.appreciation)} appreciation</span>
                  </div>
                </div>

                {/* Equity Breakdown */}
                <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                    <PiggyBank className="w-3.5 h-3.5" />
                    Total Equity Built
                  </h3>
                  <div className="text-3xl font-bold text-foreground mb-4">{fmt(results.totalEquityBuilt)}</div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Down Payment</span>
                        <span className="font-medium">{fmt(results.downPayment)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${(results.downPayment / results.totalEquityBuilt) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Mortgage Paydown</span>
                        <span className="font-medium">{fmt(results.principalPaid)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(results.principalPaid / results.totalEquityBuilt) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Appreciation</span>
                        <span className="font-medium text-green-600">+{fmt(results.appreciation)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(results.appreciation / results.totalEquityBuilt) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-foreground text-background rounded-xl p-3">
                    <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Total Return</div>
                    <div className="text-lg font-bold">{fmt(results.totalReturn)}</div>
                    <p className="text-[10px] opacity-60">{inputs.holdingPeriodYears}yr period</p>
                  </div>
                  <div className={`rounded-xl p-3 border-2 ${results.roiPercent > 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${results.roiPercent > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ROI
                    </div>
                    <div className={`text-lg font-bold ${results.roiPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.roiPercent.toFixed(1)}%
                    </div>
                    <p className={`text-[10px] ${results.roiPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      on {fmt(results.totalCashRequired)}
                    </p>
                  </div>
                </div>

                {/* Remaining Balance */}
                <div className="bg-secondary/10 rounded-xl p-3 border border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Mortgage</span>
                    <span className="font-bold">{fmt(results.remainingBalance)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    After {inputs.holdingPeriodYears} years of payments
                  </div>
                </div>

                {/* Cash Flow Impact */}
                <div className="bg-secondary/10 rounded-xl p-3 border border-border/30">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Cumulative Cash Flow</span>
                    <span className={`font-bold ${results.totalCashFlowOverPeriod >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.totalCashFlowOverPeriod >= 0 ? '+' : ''}{fmt(results.totalCashFlowOverPeriod)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(results.annualCashFlow)}/yr × {inputs.holdingPeriodYears} years
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Comparison Section */}
      {showComparison && snapshots.length > 0 && (
        <SnapshotComparison
          snapshots={snapshots}
          onDelete={deleteSnapshot}
          onClearAll={() => {
            clearAllSnapshots();
            setShowComparison(false);
          }}
        />
      )}

      {/* Empty state for comparison */}
      {!showComparison && snapshots.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-semibold text-sm mb-1">Compare Scenarios</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Save up to 3 scenarios to compare side-by-side
          </p>
          <Button onClick={openSaveDialog} variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Current
          </Button>
        </div>
      )}

      {/* Mobile Action Bar */}
      <div className="flex gap-2 sm:hidden">
        <Button variant="outline" onClick={resetToDefaults} className="flex-1 h-10">
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex-1 h-10">
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
        <Button onClick={handleDownloadImage} disabled={isDownloading} className="flex-1 h-10">
          <Download className="w-4 h-4 mr-1.5" />
          Save
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-sm font-medium block mb-2">Scenario Name</label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., $599K @ 20% down"
                className="h-11"
                autoFocus
              />
            </div>
            <div className="bg-secondary/20 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium">{fmt(inputs.purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Cash Flow</span>
                <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{fmt(results.monthlyCashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Investment</span>
                <span className="font-medium">{fmt(results.totalCashRequired)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
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
