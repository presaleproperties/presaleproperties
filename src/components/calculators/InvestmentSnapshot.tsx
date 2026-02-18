// Investment Snapshot - Optimized 2-Page Wizard
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  TrendingUp, RotateCcw, Share2, Download, DollarSign, 
  Percent, Home, Calendar, Save, BarChart3, ChevronRight,
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
  sqft: number;
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
  creditPercent: number;
  creditAmount: number;
  currentRent: number;
  rentIncreaseRate: number;
}

const DEFAULT_INPUTS: SnapshotInputs = {
  buyerType: 'investor',
  purchasePrice: 499900,
  sqft: 550,
  firstDepositPercent: 5,
  secondDepositPercent: 5,
  downPaymentPercent: 20,
  interestRate: 3.79,
  amortizationYears: 30,
  closingCosts: 2000,
  monthlyRent: 2150,
  strataFees: 300,
  propertyTax: 130,
  includeGST: true,
  holdingPeriodYears: 5,
  appreciationRate: 3,
  creditPercent: 0,
  creditAmount: 0,
  currentRent: 2200,
  rentIncreaseRate: 3,
};

// CMHC Premium rates (applied to insured mortgage amount)
function calculateCMHCPremium(purchasePrice: number, downPaymentPercent: number): number {
  if (downPaymentPercent >= 20) return 0;
  // CMHC only applies to homes under $1M
  if (purchasePrice > 1000000) return 0;
  
  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const mortgageAmount = purchasePrice - downPayment;
  
  // CMHC premium rates based on loan-to-value
  if (downPaymentPercent >= 15) return mortgageAmount * 0.028;
  if (downPaymentPercent >= 10) return mortgageAmount * 0.031;
  return mortgageAmount * 0.04; // 5-9.99% down
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
  for (let i = 0; i < holdingYears * 12 && balance > 0; i++) {
    const interestPayment = balance * monthlyRate;
    totalPrincipalPaid += monthlyPayment - interestPayment;
    balance -= monthlyPayment - interestPayment;
  }
  return { principalPaid: totalPrincipalPaid, remainingBalance: Math.max(0, balance) };
}

function parseUrlParams(searchParams: URLSearchParams): Partial<SnapshotInputs> {
  const parsed: Partial<SnapshotInputs> = {};
  const keys: Record<string, keyof SnapshotInputs> = {
    p: 'purchasePrice', d1: 'firstDepositPercent', d2: 'secondDepositPercent',
    dp: 'downPaymentPercent', r: 'interestRate', a: 'amortizationYears',
    rent: 'monthlyRent', s: 'strataFees', t: 'propertyTax',
    hold: 'holdingPeriodYears', app: 'appreciationRate',
    crp: 'creditPercent', cra: 'creditAmount',
  };
  Object.entries(keys).forEach(([param, field]) => {
    const val = searchParams.get(param);
    if (val) (parsed as any)[field] = Number(val);
  });
  const gst = searchParams.get('gst');
  if (gst) parsed.includeGST = gst === '1';
  const bt = searchParams.get('bt');
  if (bt) parsed.buyerType = bt === 'ftb' ? 'firstTimeBuyer' : 'investor';
  return parsed;
}

export function InvestmentSnapshot() {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<SnapshotInputs>(() => ({ ...DEFAULT_INPUTS, ...parseUrlParams(searchParams) }));
  const [currentPage, setCurrentPage] = useState<'cashflow' | 'equity'>('cashflow');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);
  const { snapshots, saveSnapshot, deleteSnapshot, clearAllSnapshots, canSaveMore } = useSavedSnapshots();

  const fmt = (v: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  const updateInput = (field: keyof SnapshotInputs, value: number | boolean | BuyerType) => setInputs(prev => ({ ...prev, [field]: value }));

  const results = useMemo(() => {
    const isFirstTimeBuyer = inputs.buyerType === 'firstTimeBuyer';
    
    // GST (5% on new construction)
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
    
    // Total purchase price including GST
    const priceWithGST = inputs.purchasePrice + gst;
    
    // Deposits (based on base price, not GST-inclusive)
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    
    // Down payment is calculated on price + GST (total amount being financed)
    const downPayment = priceWithGST * (inputs.downPaymentPercent / 100);
    
    // Mortgage amount (what you're borrowing)
    const baseMortgageAmount = priceWithGST - downPayment;
    
    // CMHC Premium (only on purchases under $1M, added to mortgage)
    const cmhcPremium = calculateCMHCPremium(priceWithGST, inputs.downPaymentPercent);
    const mortgageAmount = baseMortgageAmount + cmhcPremium;
    
    // Monthly mortgage payment
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, inputs.interestRate, inputs.amortizationYears);
    
    // PTT (Property Transfer Tax) - exempt for first-time buyers under $500k, partial up to $525k
    const ptt = isFirstTimeBuyer ? 0 : calculatePTT(inputs.purchasePrice, false);
    
    // Developer Credit (higher of percentage or fixed amount)
    const creditTotal = Math.max(inputs.purchasePrice * (inputs.creditPercent / 100), inputs.creditAmount);
    
    // Cash required at completion:
    // = (Down payment - Deposits already paid) + PTT + Closing costs - Developer credits
    const remainingDownPayment = Math.max(0, downPayment - totalDeposits);
    const cashAtCompletion = Math.max(0, remainingDownPayment + ptt + inputs.closingCosts - creditTotal);
    
    // Total cash out of pocket
    const totalCashRequired = totalDeposits + cashAtCompletion;
    
    // Monthly expenses
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    
    // Monthly cash flow (for investors)
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Mortgage paydown over holding period
    const { principalPaid, remainingBalance } = calculateMortgagePaydown(
      mortgageAmount, 
      inputs.interestRate, 
      inputs.amortizationYears, 
      inputs.holdingPeriodYears
    );
    
    // Future value with appreciation (on base price, not GST)
    const futureValue = inputs.purchasePrice * Math.pow(1 + inputs.appreciationRate / 100, inputs.holdingPeriodYears);
    const appreciation = futureValue - inputs.purchasePrice;
    
    // Total equity built = Down payment + Principal paid + Appreciation
    const totalEquityBuilt = downPayment + principalPaid + appreciation;
    
    // Total return calculation
    const totalCashFlowOverPeriod = annualCashFlow * inputs.holdingPeriodYears;
    const totalReturn = appreciation + principalPaid + totalCashFlowOverPeriod;
    
    // ROI percentage (total return / cash invested)
    const roiPercent = totalCashRequired > 0 ? (totalReturn / totalCashRequired) * 100 : 0;

    return { 
      firstDeposit, secondDeposit, totalDeposits, downPayment, remainingDownPayment, 
      baseMortgageAmount, cmhcPremium, mortgageAmount, monthlyMortgage, 
      ptt, gst, priceWithGST, creditTotal, cashAtCompletion, totalCashRequired, 
      totalMonthlyExpenses, monthlyCashFlow, annualCashFlow, 
      principalPaid, remainingBalance, futureValue, appreciation, 
      totalEquityBuilt, totalCashFlowOverPeriod, totalReturn, roiPercent 
    };
  }, [inputs]);

  const rentVsOwn = useMemo(() => {
    let totalRentPaid = 0, totalOwnershipCost = 0, currentRent = inputs.currentRent, homeValue = inputs.purchasePrice, mortgageBalance = results.mortgageAmount;
    const monthlyRate = inputs.interestRate / 100 / 12;
    for (let year = 1; year <= inputs.holdingPeriodYears; year++) {
      totalRentPaid += currentRent * 12;
      currentRent *= 1 + inputs.rentIncreaseRate / 100;
      totalOwnershipCost += results.totalMonthlyExpenses * 12;
      homeValue *= 1 + inputs.appreciationRate / 100;
      for (let m = 0; m < 12 && mortgageBalance > 0; m++) {
        mortgageBalance -= Math.min(results.monthlyMortgage - mortgageBalance * monthlyRate, mortgageBalance);
      }
    }
    const equityBuilt = homeValue - mortgageBalance;
    let investedSavings = results.totalCashRequired;
    for (let y = 1; y <= inputs.holdingPeriodYears; y++) investedSavings *= 1.06;
    const wealthDifference = (equityBuilt - totalOwnershipCost) - (investedSavings - totalRentPaid);
    return { totalRentPaid, equityBuilt, wealthDifference, owningIsBetter: wealthDifference > 0 };
  }, [inputs, results]);

  const handleShare = async () => {
    const params = new URLSearchParams({ p: String(inputs.purchasePrice), dp: String(inputs.downPaymentPercent), r: String(inputs.interestRate), bt: inputs.buyerType === 'firstTimeBuyer' ? 'ftb' : 'inv' });
    const url = `${window.location.origin}/calculator?${params}`;
    if (navigator.share) await navigator.share({ title: 'Investment Snapshot', url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  const handleDownloadImage = async () => {
    if (!snapshotRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(snapshotRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `investment-${inputs.purchasePrice}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image saved!');
    } catch { toast.error('Failed to save'); }
    finally { setIsDownloading(false); }
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) { toast.error('Please enter a name'); return; }
    if (saveSnapshot(scenarioName.trim(), inputs, { totalCashRequired: results.totalCashRequired, monthlyCashFlow: results.monthlyCashFlow, annualCashFlow: results.annualCashFlow, cashAtCompletion: results.cashAtCompletion, mortgageAmount: results.mortgageAmount, monthlyMortgage: results.monthlyMortgage, totalMonthlyExpenses: results.totalMonthlyExpenses, creditTotal: results.creditTotal })) {
      toast.success('Scenario saved!'); setShowSaveDialog(false); setScenarioName(''); setShowComparison(true);
    } else toast.error('Maximum 3 scenarios.');
  };

  const isPositive = results.monthlyCashFlow >= 0;
  const isFirstTimeBuyer = inputs.buyerType === 'firstTimeBuyer';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8 space-y-4">
      <div ref={snapshotRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-bold">Investment Snapshot</h1>
          </div>
          <div className="flex gap-1">
            {[
              { icon: RotateCcw, onClick: () => { setInputs(DEFAULT_INPUTS); toast.success('Reset'); } },
              { icon: Share2, onClick: handleShare },
              { icon: Download, onClick: handleDownloadImage, disabled: isDownloading },
              { icon: Save, onClick: () => { if (!canSaveMore) { toast.error('Max 3 scenarios'); setShowComparison(true); return; } setScenarioName(`${fmt(inputs.purchasePrice)} @ ${inputs.downPaymentPercent}%`); setShowSaveDialog(true); } },
            ].map(({ icon: Icon, onClick, disabled }, i) => (
              <Button key={i} variant="ghost" size="icon" onClick={onClick} disabled={disabled} className="text-background/70 hover:text-background hover:bg-white/10 h-8 w-8">
                <Icon className="w-4 h-4" />
              </Button>
            ))}
            {snapshots.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setShowComparison(!showComparison)} className="text-primary hover:bg-primary/10 h-8 w-8 relative">
                <BarChart3 className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary text-background text-[9px] rounded-full flex items-center justify-center font-bold">{snapshots.length}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Buyer Type Toggle */}
        <div className="px-4 py-3 bg-secondary/10 border-b border-border/30 flex justify-center gap-2">
          {(['firstTimeBuyer', 'investor'] as BuyerType[]).map((type) => (
            <button key={type} onClick={() => updateInput('buyerType', type)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${inputs.buyerType === type ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white text-muted-foreground hover:bg-secondary/50 border border-border/50'}`}>
              {type === 'firstTimeBuyer' ? <Users className="w-4 h-4" /> : <Building className="w-4 h-4" />}
              {type === 'firstTimeBuyer' ? 'First Time Buyer' : 'Investor'}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as 'cashflow' | 'equity')} className="w-full">
          <TabsList className="w-full h-auto p-0 bg-secondary/20 rounded-none border-b border-border/50">
            <TabsTrigger value="cashflow" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white">
              <DollarSign className="w-4 h-4 mr-1.5" />
              {isFirstTimeBuyer ? 'Monthly Payment' : 'Cash Flow'}
            </TabsTrigger>
            <TabsTrigger value="equity" className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white">
              <PiggyBank className="w-4 h-4 mr-1.5" />
              Equity & Growth
            </TabsTrigger>
          </TabsList>

          {/* Page 1: Cash Flow */}
          <TabsContent value="cashflow" className="p-4 sm:p-6 mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                {/* Price & Size */}
                <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4">
                  <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-3.5 h-3.5" /> Purchase Price
                  </label>
                  <Input type="text" inputMode="numeric" value={`$${inputs.purchasePrice.toLocaleString()}`}
                    onChange={(e) => updateInput('purchasePrice', Number(e.target.value.replace(/\D/g, '')) || 0)}
                    className="text-xl font-bold text-center h-12 border-2 border-primary/20 bg-white" />
                  
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/30">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Unit Size (sqft)</label>
                      <Input type="number" value={inputs.sqft} onChange={(e) => updateInput('sqft', parseInt(e.target.value) || 0)}
                        className="h-9 text-center font-semibold text-sm" placeholder="550" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="text-[10px] text-muted-foreground mb-1">Price per sqft</div>
                      <div className="h-9 flex items-center justify-center bg-primary/10 rounded-md text-sm font-bold text-primary">
                        {inputs.sqft > 0 ? `$${Math.round(inputs.purchasePrice / inputs.sqft).toLocaleString()}` : '—'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>+ GST:</span><span className="font-semibold">{fmt(results.priceWithGST)}</span>
                  </div>
                </div>

                {/* Down Payment */}
                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Down Payment</span>
                    <span className="text-lg font-bold text-primary">{inputs.downPaymentPercent}%</span>
                  </div>
                  <Slider value={[inputs.downPaymentPercent]} onValueChange={(v) => updateInput('downPaymentPercent', v[0])} min={5} max={60} step={5} className="my-2" />
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Required</span><span className="font-bold">{fmt(results.downPayment)}</span></div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/30">
                    {[{ label: 'Deposit 1', field: 'firstDepositPercent' as const, value: results.firstDeposit }, { label: 'Deposit 2', field: 'secondDepositPercent' as const, value: results.secondDeposit }].map(({ label, field, value }) => (
                      <div key={field}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-bold text-primary">{inputs[field]}%</span></div>
                        <Slider value={[inputs[field]]} onValueChange={(v) => updateInput(field, v[0])} min={field === 'firstDepositPercent' ? 1 : 0} max={15} step={1} />
                        <div className="text-center text-xs font-semibold mt-1">{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Inputs */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Rate %', field: 'interestRate' as const, step: 0.01 },
                    { label: 'Strata', field: 'strataFees' as const },
                    { label: 'Tax/mo', field: 'propertyTax' as const },
                  ].map(({ label, field, step }) => (
                    <div key={field} className="bg-secondary/20 rounded-xl p-2.5">
                      <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
                      <Input type="number" step={step} value={inputs[field]}
                        onChange={(e) => updateInput(field, step ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                        className="h-9 text-center font-semibold text-sm" />
                    </div>
                  ))}
                </div>

                {/* GST, PTT & Developer Credit Section */}
                <div className="bg-secondary/20 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">Closing Adjustments</h3>
                  
                  {/* GST Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Include GST (5%)</span>
                      <p className="text-[10px] text-muted-foreground">New construction tax</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{fmt(results.gst)}</span>
                      <Switch checked={inputs.includeGST} onCheckedChange={(v) => updateInput('includeGST', v)} />
                    </div>
                  </div>
                  
                  {/* PTT Display */}
                  <div className="flex items-center justify-between py-2 border-t border-border/30">
                    <div>
                      <span className="text-sm font-medium">PTT (Property Transfer Tax)</span>
                      {isFirstTimeBuyer && <p className="text-[10px] text-green-600">✓ First-time buyer exempt</p>}
                    </div>
                    <span className={`text-sm font-semibold ${isFirstTimeBuyer ? 'text-green-600 line-through' : ''}`}>
                      {fmt(isFirstTimeBuyer ? calculatePTT(inputs.purchasePrice, false) : results.ptt)}
                    </span>
                  </div>
                  
                  {/* Developer Credit */}
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Developer Credit</span>
                      <span className="text-sm font-semibold text-green-600">-{fmt(results.creditTotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">% of Price</label>
                        <Input type="number" step="0.5" min="0" max="10" value={inputs.creditPercent}
                          onChange={(e) => updateInput('creditPercent', parseFloat(e.target.value) || 0)}
                          className="h-8 text-center text-sm" placeholder="0%" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Or Fixed $</label>
                        <Input type="number" step="1000" min="0" value={inputs.creditAmount}
                          onChange={(e) => updateInput('creditAmount', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm" placeholder="$0" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Applied towards closing costs</p>
                  </div>
                </div>

                {!isFirstTimeBuyer && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <label className="text-xs text-green-700 block mb-1">Monthly Rent</label>
                    <Input type="number" value={inputs.monthlyRent} onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
                      className="h-10 text-center font-semibold text-green-700 border-green-300" />
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="space-y-4">
                {/* Key Result */}
                <div className={`rounded-xl p-4 text-center border-2 ${isFirstTimeBuyer ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' : isPositive ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300' : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300'}`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {isFirstTimeBuyer ? <Home className="w-5 h-5 text-primary" /> : isPositive ? <TrendingUp className="w-5 h-5 text-green-600" /> : <PiggyBank className="w-5 h-5 text-red-600" />}
                    <span className={`text-xs font-bold uppercase ${isFirstTimeBuyer ? 'text-primary' : isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {isFirstTimeBuyer ? 'Your Monthly Payment' : 'Monthly Cash Flow'}
                    </span>
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold ${isFirstTimeBuyer ? 'text-foreground' : isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isFirstTimeBuyer ? fmt(results.totalMonthlyExpenses) : (isPositive ? '+' : '') + fmt(results.monthlyCashFlow)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div className="bg-secondary/20 rounded-xl p-4 space-y-2 text-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Monthly Breakdown</h3>
                  {[{ label: 'Mortgage', value: results.monthlyMortgage }, { label: 'Strata', value: inputs.strataFees }, { label: 'Tax', value: inputs.propertyTax }].map(({ label, value }) => (
                    <div key={label} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{fmt(value)}</span></div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border/50 font-bold"><span>Total</span><span>{fmt(results.totalMonthlyExpenses)}</span></div>
                </div>

                {/* Cash Required */}
                <div className="bg-foreground text-background rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase opacity-80">Cash Required</span>
                    <span className="text-xl font-bold">{fmt(results.totalCashRequired)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/10 rounded-lg p-2 text-center"><div className="opacity-70">Deposits</div><div className="font-bold">{fmt(results.totalDeposits)}</div></div>
                    <div className="bg-white/10 rounded-lg p-2 text-center"><div className="opacity-70">At Closing</div><div className="font-bold">{fmt(results.cashAtCompletion)}</div></div>
                  </div>
                  {results.cmhcPremium > 0 && <div className="mt-2 pt-2 border-t border-white/20 text-xs flex justify-between"><span className="opacity-70">CMHC</span><span>{fmt(results.cmhcPremium)}</span></div>}
                </div>

                {isFirstTimeBuyer && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <div><div className="text-xs font-bold text-green-700 uppercase">PTT Savings</div><p className="text-[10px] text-green-600">First-time buyer exempt</p></div>
                      <span className="text-lg font-bold text-green-600">{fmt(calculatePTT(inputs.purchasePrice, false))}</span>
                    </div>
                    {inputs.includeGST && (
                      <div className="pt-2 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-green-700 uppercase">GST Rebate (2025 Rules)</div>
                            <p className="text-[10px] text-green-600">
                              {inputs.purchasePrice <= 1000000
                                ? 'Up to 100% rebate (max $50,000)'
                                : inputs.purchasePrice < 1500000
                                ? 'Partial rebate (phaseout $1M–$1.5M)'
                                : 'Not eligible — home over $1.5M'}
                            </p>
                          </div>
                          <span className={`text-lg font-bold ${inputs.purchasePrice <= 1500000 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {fmt(
                              inputs.purchasePrice <= 1000000
                                ? Math.min(results.gst, 50000)
                                : inputs.purchasePrice < 1500000
                                ? Math.min(results.gst, 50000) * ((1500000 - inputs.purchasePrice) / 500000)
                                : 0
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          *Primary residence only. Builder typically applies on your behalf. Agreements signed on or after May 27, 2025.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={() => setCurrentPage('equity')} className="w-full h-11" variant="outline">
                  View Equity & Growth <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Page 2: Equity */}
          <TabsContent value="equity" className="p-4 sm:p-6 mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <label className="text-xs font-medium text-primary uppercase flex items-center gap-1.5 mb-3"><Calendar className="w-3.5 h-3.5" /> Holding Period</label>
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => updateInput('holdingPeriodYears', Math.max(1, inputs.holdingPeriodYears - 1))} className="h-10 w-10">-</Button>
                    <div className="text-center"><div className="text-4xl font-bold text-primary">{inputs.holdingPeriodYears}</div><div className="text-xs text-muted-foreground">years</div></div>
                    <Button variant="outline" size="icon" onClick={() => updateInput('holdingPeriodYears', Math.min(30, inputs.holdingPeriodYears + 1))} className="h-10 w-10">+</Button>
                  </div>
                </div>

                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Annual Appreciation</label>
                    <span className="text-lg font-bold text-primary">{inputs.appreciationRate}%</span>
                  </div>
                  <Slider value={[inputs.appreciationRate]} onValueChange={(v) => updateInput('appreciationRate', v[0])} min={0} max={10} step={0.5} />
                </div>

                <div className="bg-secondary/10 rounded-xl p-4 border border-border/30 space-y-2 text-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Summary</h3>
                  {[{ label: 'Purchase', value: inputs.purchasePrice }, { label: 'Price + GST', value: results.priceWithGST }, { label: 'Mortgage', value: results.mortgageAmount }, { label: 'Cash Invested', value: results.totalCashRequired, bold: true }].map(({ label, value, bold }) => (
                    <div key={label} className={`flex justify-between ${bold ? 'pt-2 border-t border-border/50 font-bold' : ''}`}>
                      <span className="text-muted-foreground">{label}</span><span className={bold ? 'font-bold' : 'font-medium'}>{fmt(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-green-700 uppercase">Future Value</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{inputs.holdingPeriodYears}yr</span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">{fmt(results.futureValue)}</div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600"><ArrowUpRight className="w-4 h-4" />+{fmt(results.appreciation)}</div>
                </div>

                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> Total Equity Built</h3>
                  <div className="text-3xl font-bold mb-4">{fmt(results.totalEquityBuilt)}</div>
                  {[{ label: 'Down Payment', value: results.downPayment, color: 'bg-primary/70' }, { label: 'Paydown', value: results.principalPaid, color: 'bg-blue-500' }, { label: 'Appreciation', value: results.appreciation, color: 'bg-green-500' }].map(({ label, value, color }) => (
                    <div key={label} className="mb-2">
                      <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{fmt(value)}</span></div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${(value / results.totalEquityBuilt) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-foreground text-background rounded-xl p-3">
                    <div className="text-[10px] opacity-70 uppercase mb-1">Total Return</div>
                    <div className="text-lg font-bold">{fmt(results.totalReturn)}</div>
                  </div>
                  <div className={`rounded-xl p-3 border-2 ${results.roiPercent > 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <div className={`text-[10px] uppercase font-semibold mb-1 ${results.roiPercent > 0 ? 'text-green-700' : 'text-red-700'}`}>ROI</div>
                    <div className={`text-lg font-bold ${results.roiPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>{results.roiPercent.toFixed(1)}%</div>
                  </div>
                </div>

                {isFirstTimeBuyer && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/30">
                    <div className="flex items-center gap-2 mb-3"><Home className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-primary">Rent vs Own</span></div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 border"><div className="text-xs text-muted-foreground">Rent Paid</div><div className="text-lg font-bold text-red-600">-{fmt(rentVsOwn.totalRentPaid)}</div></div>
                      <div className="bg-white rounded-lg p-3 border"><div className="text-xs text-muted-foreground">Equity Built</div><div className="text-lg font-bold text-green-600">{fmt(rentVsOwn.equityBuilt)}</div></div>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${rentVsOwn.owningIsBetter ? 'bg-green-100 border border-green-300' : 'bg-amber-100 border border-amber-300'}`}>
                      <div className={`text-sm font-bold ${rentVsOwn.owningIsBetter ? 'text-green-700' : 'text-amber-700'}`}>
                        {rentVsOwn.owningIsBetter ? `Buying = ${fmt(rentVsOwn.wealthDifference)} more wealth` : `Renting saves ${fmt(Math.abs(rentVsOwn.wealthDifference))}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showComparison && snapshots.length > 0 && <SnapshotComparison snapshots={snapshots} onDelete={deleteSnapshot} onClearAll={() => { clearAllSnapshots(); setShowComparison(false); }} />}

      {!showComparison && snapshots.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-semibold text-sm mb-1">Compare Scenarios</h3>
          <p className="text-xs text-muted-foreground mb-3">Save up to 3 scenarios</p>
          <Button onClick={() => { setScenarioName(`${fmt(inputs.purchasePrice)} @ ${inputs.downPaymentPercent}%`); setShowSaveDialog(true); }} variant="outline" size="sm"><Save className="w-4 h-4 mr-2" />Save Current</Button>
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Save Scenario</DialogTitle></DialogHeader>
          <div className="py-3 space-y-4">
            <Input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="Scenario name" className="h-11" autoFocus />
            <div className="bg-secondary/20 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">{fmt(inputs.purchasePrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cash Flow</span><span className={results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(results.monthlyCashFlow)}</span></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button><Button onClick={handleSaveScenario}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
