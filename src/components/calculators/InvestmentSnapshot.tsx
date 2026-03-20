// Investment Snapshot - Premium 2-Tab Wizard
import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  TrendingUp, RotateCcw, Share2, Download, DollarSign,
  Percent, Home, Calendar, Save, BarChart3, ChevronRight,
  PiggyBank, ArrowUpRight, Users, Building, TrendingDown,
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
  includePTT: boolean;
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
  includePTT: true,
  holdingPeriodYears: 5,
  appreciationRate: 3,
  creditPercent: 0,
  creditAmount: 0,
  currentRent: 2200,
  rentIncreaseRate: 3,
};

function calculateCMHCPremium(purchasePrice: number, downPaymentPercent: number): number {
  if (downPaymentPercent >= 20) return 0;
  if (purchasePrice > 1000000) return 0;
  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const mortgageAmount = purchasePrice - downPayment;
  if (downPaymentPercent >= 15) return mortgageAmount * 0.028;
  if (downPaymentPercent >= 10) return mortgageAmount * 0.031;
  return mortgageAmount * 0.04;
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

/* ── Reusable sub-components ── */
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card overflow-hidden", className)}>
      {children}
    </div>
  );
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

function Row({ label, value, sub, accent, green }: { label: string; value: string; sub?: string; accent?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div>
        <span className="text-[14px] text-foreground/80">{label}</span>
        {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
      <span className={cn(
        "text-[14px] font-bold",
        accent && "text-foreground",
        green && "text-green-600"
      )}>
        {value}
      </span>
    </div>
  );
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
    const gst = inputs.includeGST ? calculateGST(inputs.purchasePrice) : 0;
    const priceWithGST = inputs.purchasePrice + gst;
    const firstDeposit = inputs.purchasePrice * (inputs.firstDepositPercent / 100);
    const secondDeposit = inputs.purchasePrice * (inputs.secondDepositPercent / 100);
    const totalDeposits = firstDeposit + secondDeposit;
    const downPayment = priceWithGST * (inputs.downPaymentPercent / 100);
    const baseMortgageAmount = priceWithGST - downPayment;
    const cmhcPremium = calculateCMHCPremium(priceWithGST, inputs.downPaymentPercent);
    const mortgageAmount = baseMortgageAmount + cmhcPremium;
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, inputs.interestRate, inputs.amortizationYears);
    const pttRaw = calculatePTT(inputs.purchasePrice, false);
    const ptt = isFirstTimeBuyer ? 0 : (inputs.includePTT ? pttRaw : 0);
    const creditTotal = Math.max(inputs.purchasePrice * (inputs.creditPercent / 100), inputs.creditAmount);
    const remainingDownPayment = Math.max(0, downPayment - totalDeposits);
    const cashAtCompletion = Math.max(0, remainingDownPayment + ptt + inputs.closingCosts - creditTotal);
    const totalCashRequired = totalDeposits + cashAtCompletion;
    const totalMonthlyExpenses = monthlyMortgage + inputs.strataFees + inputs.propertyTax;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const { principalPaid, remainingBalance } = calculateMortgagePaydown(mortgageAmount, inputs.interestRate, inputs.amortizationYears, inputs.holdingPeriodYears);
    const futureValue = inputs.purchasePrice * Math.pow(1 + inputs.appreciationRate / 100, inputs.holdingPeriodYears);
    const appreciation = futureValue - inputs.purchasePrice;
    const totalEquityBuilt = downPayment + principalPaid + appreciation;
    const totalCashFlowOverPeriod = annualCashFlow * inputs.holdingPeriodYears;
    const totalReturn = appreciation + principalPaid + totalCashFlowOverPeriod;
    const roiPercent = totalCashRequired > 0 ? (totalReturn / totalCashRequired) * 100 : 0;
    return {
      firstDeposit, secondDeposit, totalDeposits, downPayment, remainingDownPayment,
      baseMortgageAmount, cmhcPremium, mortgageAmount, monthlyMortgage,
      ptt, pttRaw, gst, priceWithGST, creditTotal, cashAtCompletion, totalCashRequired,
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-4 space-y-5">

      {/* ── Main card ── */}
      <div ref={snapshotRef} className="rounded-3xl border border-border/60 bg-card shadow-[0_8px_48px_-12px_hsl(var(--foreground)/0.10)] overflow-hidden">

        {/* ── Card Header ── */}
        <div className="bg-foreground px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-background leading-none">Investment Snapshot</h1>
              <p className="text-[11px] text-background/40 mt-0.5">Presale Cash Flow Tool</p>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            {[
              { icon: RotateCcw, label: "Reset",    onClick: () => { setInputs(DEFAULT_INPUTS); toast.success('Reset'); } },
              { icon: Share2,    label: "Share",    onClick: handleShare },
              { icon: Download,  label: "Download", onClick: handleDownloadImage, disabled: isDownloading },
              {
                icon: Save, label: "Save",
                onClick: () => {
                  if (!canSaveMore) { toast.error('Max 3 scenarios'); setShowComparison(true); return; }
                  setScenarioName(`${fmt(inputs.purchasePrice)} @ ${inputs.downPaymentPercent}%`);
                  setShowSaveDialog(true);
                }
              },
            ].map(({ icon: Icon, label, onClick, disabled }, i) => (
              <button
                key={i}
                onClick={onClick}
                disabled={disabled}
                title={label}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-background/50 hover:text-background hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            {snapshots.length > 0 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                title="Compare Scenarios"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/15 transition-colors relative"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary text-background text-[8px] font-bold rounded-full flex items-center justify-center">
                  {snapshots.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Buyer type selector ── */}
        <div className="px-5 py-3.5 bg-muted/40 border-b border-border/50 flex justify-center gap-2.5">
          {(['firstTimeBuyer', 'investor'] as BuyerType[]).map((type) => (
            <button
              key={type}
              onClick={() => updateInput('buyerType', type)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all min-h-[44px]",
                inputs.buyerType === type
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.30)]"
                  : "bg-background text-muted-foreground hover:bg-secondary/60 border border-border/60"
              )}
            >
              {type === 'firstTimeBuyer' ? <Users className="h-3.5 w-3.5" /> : <Building className="h-3.5 w-3.5" />}
              {type === 'firstTimeBuyer' ? 'First-Time Buyer' : 'Investor'}
            </button>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as 'cashflow' | 'equity')} className="w-full">
          <TabsList className="w-full h-auto p-0 bg-muted/30 rounded-none border-b border-border/50">
            {[
              { value: 'cashflow', icon: DollarSign, label: isFirstTimeBuyer ? 'Monthly Payment' : 'Cash Flow' },
              { value: 'equity',   icon: PiggyBank,  label: 'Equity & Growth' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-1 h-11 rounded-none gap-2 text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ══════════════════════════════════════
              PAGE 1: Cash Flow
          ══════════════════════════════════════ */}
          <TabsContent value="cashflow" className="mt-0">
            <div className="p-4 sm:p-5">
              <div className="grid lg:grid-cols-[1fr_1fr] gap-5">

                {/* ── Left: Inputs ── */}
                <div className="space-y-3">

                  {/* Purchase Price */}
                  <SectionCard>
                    <div className="p-3">
                      <FieldLabel>Purchase Price</FieldLabel>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={`$${inputs.purchasePrice.toLocaleString()}`}
                        onChange={(e) => updateInput('purchasePrice', Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className="mt-2 text-2xl font-extrabold text-center h-12 border-2 border-primary/25 bg-primary/3 focus-visible:ring-primary/40"
                      />
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/40">
                        <div>
                          <FieldLabel className="block mb-1.5">Sqft</FieldLabel>
                          <Input
                            type="number"
                            value={inputs.sqft}
                            onChange={(e) => updateInput('sqft', parseInt(e.target.value) || 0)}
                            className="h-9 text-center font-semibold text-sm"
                          />
                        </div>
                        <div>
                          <FieldLabel className="block mb-1.5">$/sqft</FieldLabel>
                          <div className="h-9 flex items-center justify-center rounded-lg bg-primary/8 text-sm font-bold text-primary border border-primary/15">
                            {inputs.sqft > 0 ? `$${Math.round(inputs.purchasePrice / inputs.sqft).toLocaleString()}` : '—'}
                          </div>
                        </div>
                      </div>
                      {inputs.includeGST && (
                        <div className="flex justify-between mt-2 text-[13px] text-muted-foreground">
                          <span>Incl. GST</span>
                          <span className="font-semibold">{fmt(results.priceWithGST)}</span>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* Down Payment */}
                  <SectionCard>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Down Payment</FieldLabel>
                        <span className="text-xl font-black text-primary">{inputs.downPaymentPercent}%</span>
                      </div>
                      <Slider
                        value={[inputs.downPaymentPercent]}
                        onValueChange={(v) => updateInput('downPaymentPercent', v[0])}
                        min={5} max={60} step={5}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-[12px] mb-2">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-bold">{fmt(results.downPayment)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
                        {[
                          { label: 'Deposit 1', field: 'firstDepositPercent' as const, value: results.firstDeposit },
                          { label: 'Deposit 2', field: 'secondDepositPercent' as const, value: results.secondDeposit },
                        ].map(({ label, field, value }) => (
                          <div key={field} className="bg-muted/40 rounded-xl p-3">
                            <div className="flex justify-between mb-2">
                              <FieldLabel>{label}</FieldLabel>
                              <span className="text-[13px] font-bold text-primary">{inputs[field]}%</span>
                            </div>
                            <Slider
                              value={[inputs[field]]}
                              onValueChange={(v) => updateInput(field, v[0])}
                              min={field === 'firstDepositPercent' ? 1 : 0}
                              max={15} step={1}
                            />
                            <div className="text-center text-[13px] font-semibold mt-2 text-foreground/70">{fmt(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  {/* Rate + Monthly costs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Rate %',  field: 'interestRate' as const, step: 0.01 },
                      { label: 'Strata',  field: 'strataFees' as const },
                      { label: 'Tax/mo',  field: 'propertyTax' as const },
                    ].map(({ label, field, step }) => (
                      <SectionCard key={field}>
                        <div className="p-3">
                          <FieldLabel className="block mb-1.5">{label}</FieldLabel>
                          <Input
                            type="number"
                            step={step}
                            value={inputs[field] as number}
                            onChange={(e) => updateInput(field, step ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                            className="h-9 text-center font-bold text-sm"
                          />
                        </div>
                      </SectionCard>
                    ))}
                  </div>

                  {/* Closing Adjustments */}
                  <SectionCard>
                    <div className="p-4 space-y-0">
                      <FieldLabel className="block mb-3">Closing</FieldLabel>

                      {/* GST */}
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-[14px] font-semibold text-foreground">GST (5%)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-bold">{fmt(results.gst)}</span>
                          <Switch checked={inputs.includeGST} onCheckedChange={(v) => updateInput('includeGST', v)} />
                        </div>
                      </div>

                      {/* PTT */}
                      <div className="flex items-center justify-between py-2.5 border-t border-border/40">
                        <span className="text-[14px] font-semibold text-foreground">
                          PTT{isFirstTimeBuyer && <span className="text-green-600 text-[12px] ml-2">✓ Exempt</span>}
                        </span>
                        {isFirstTimeBuyer ? (
                          <span className="text-[14px] font-bold text-green-600 line-through opacity-60">
                            {fmt(results.pttRaw)}
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className={cn("text-[14px] font-bold", !inputs.includePTT && "text-muted-foreground line-through opacity-50")}>
                              {fmt(results.pttRaw)}
                            </span>
                            <Switch checked={inputs.includePTT} onCheckedChange={(v) => updateInput('includePTT', v)} />
                          </div>
                        )}
                      </div>

                      {/* Developer Credit */}
                      <div className="pt-2.5 border-t border-border/40">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[14px] font-semibold text-foreground">Dev. Credit</span>
                          <span className="text-[14px] font-bold text-green-600">-{fmt(results.creditTotal)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" step="0.5" min="0" max="10" value={inputs.creditPercent}
                            onChange={(e) => updateInput('creditPercent', parseFloat(e.target.value) || 0)}
                            className="h-9 text-center text-sm" placeholder="% of price" />
                          <Input type="number" step="1000" min="0" value={inputs.creditAmount}
                            onChange={(e) => updateInput('creditAmount', parseInt(e.target.value) || 0)}
                            className="h-9 text-center text-sm" placeholder="Fixed $" />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Rent input */}
                  {isFirstTimeBuyer ? (
                    <SectionCard className="border-primary/25 bg-primary/3">
                      <div className="p-4">
                        <FieldLabel className="text-primary/80">Current Rent</FieldLabel>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={inputs.currentRent ? `$${inputs.currentRent.toLocaleString()}` : ''}
                          onChange={(e) => updateInput('currentRent', Number(e.target.value.replace(/\D/g, '')) || 0)}
                          className="mt-2 h-11 text-center font-bold border-primary/30 text-base"
                          placeholder="$2,200"
                        />
                      </div>
                    </SectionCard>
                  ) : (
                    <SectionCard className="border-green-200 bg-green-50/50">
                      <div className="p-4">
                        <FieldLabel className="text-green-700/80">Monthly Rent</FieldLabel>
                        <Input
                          type="number"
                          value={inputs.monthlyRent}
                          onChange={(e) => updateInput('monthlyRent', parseInt(e.target.value) || 0)}
                          className="mt-2 h-11 text-center font-bold border-green-200 text-base"
                        />
                      </div>
                    </SectionCard>
                  )}
                </div>

                {/* ── Right: Results ── */}
                <div className="space-y-3">

                  {/* Hero result */}
                  <div className={cn(
                    "rounded-2xl p-5 text-center border-2",
                    isFirstTimeBuyer
                      ? "bg-primary/6 border-primary/25"
                      : isPositive
                        ? "bg-green-50/80 border-green-200"
                        : "bg-red-50/70 border-red-200"
                  )}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isFirstTimeBuyer
                        ? <Home className="h-4 w-4 text-primary" />
                        : isPositive
                          ? <TrendingUp className="h-4 w-4 text-green-600" />
                          : <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                      <FieldLabel className={cn(
                        isFirstTimeBuyer ? "text-primary" : isPositive ? "text-green-700" : "text-red-700"
                      )}>
                        {isFirstTimeBuyer ? 'Monthly Payment' : 'Monthly Cash Flow'}
                      </FieldLabel>
                    </div>
                    <div className={cn(
                      "text-[44px] font-black leading-none tracking-tight",
                      isFirstTimeBuyer ? "text-foreground" : isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isFirstTimeBuyer
                        ? fmt(results.totalMonthlyExpenses)
                        : (isPositive ? '+' : '') + fmt(results.monthlyCashFlow)
                      }
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-1">per month</div>
                  </div>

                  {/* Monthly Breakdown */}
                  <SectionCard>
                    <div className="p-4">
                      <FieldLabel className="block mb-3">Monthly Breakdown</FieldLabel>
                      <Row label="Mortgage" value={fmt(results.monthlyMortgage)} />
                      <Row label="Strata" value={fmt(inputs.strataFees)} />
                      <Row label="Property Tax" value={fmt(inputs.propertyTax)} />
                      <div className="flex justify-between pt-2.5 mt-1 border-t border-border/50">
                        <span className="text-[15px] font-bold text-foreground">Total Expenses</span>
                        <span className="text-[15px] font-black text-foreground">{fmt(results.totalMonthlyExpenses)}</span>
                      </div>
                      {!isFirstTimeBuyer && (
                        <div className="flex justify-between pt-2">
                          <span className="text-[15px] font-bold text-foreground">Rent Income</span>
                          <span className="text-[15px] font-black text-green-600">{fmt(inputs.monthlyRent)}</span>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* Cash Required — dark card */}
                  <div className="rounded-2xl bg-foreground text-background p-4">
                    <div className="flex items-center justify-between mb-3">
                      <FieldLabel className="text-background/50">Total Cash Required</FieldLabel>
                      <span className="text-2xl font-black text-background">{fmt(results.totalCashRequired)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: 'Deposits', value: results.totalDeposits },
                        { label: 'At Closing', value: results.cashAtCompletion },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-background/8 rounded-xl p-3 text-center">
                          <div className="text-[12px] text-background/50 uppercase font-semibold mb-1">{label}</div>
                          <div className="text-[17px] font-black text-background">{fmt(value)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-background/15 pt-3 space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-background/65">Remaining Down</span>
                        <span className="font-semibold">{fmt(results.remainingDownPayment)}</span>
                      </div>
                      {results.ptt > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/65">PTT</span>
                          <span className="font-semibold">{fmt(results.ptt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-background/65">Legal & Closing</span>
                        <span className="font-semibold">{fmt(inputs.closingCosts)}</span>
                      </div>
                      {results.creditTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/65">Dev. Credit</span>
                          <span className="font-semibold text-green-400">-{fmt(results.creditTotal)}</span>
                        </div>
                      )}
                      {results.cmhcPremium > 0 && (
                        <div className="flex justify-between">
                          <span className="text-background/65">CMHC</span>
                          <span className="font-semibold">{fmt(results.cmhcPremium)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* First-time buyer: PTT + GST savings */}
                  {isFirstTimeBuyer && (
                    <SectionCard className="border-green-200 bg-green-50/60">
                      <div className="p-3 space-y-2">
                        <FieldLabel className="text-green-700/80 block">FTB Savings</FieldLabel>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-semibold text-green-800">PTT Exempt</span>
                          <span className="text-lg font-black text-green-600">{fmt(calculatePTT(inputs.purchasePrice, false))}</span>
                        </div>
                        {inputs.includeGST && (
                          <div className="flex justify-between items-center pt-2 border-t border-green-200">
                            <span className="text-[13px] font-semibold text-green-800">GST Rebate</span>
                            <span className="text-lg font-black text-green-600">
                              {fmt(inputs.purchasePrice <= 1000000 ? Math.min(results.gst, 50000) : inputs.purchasePrice < 1500000 ? Math.min(results.gst, 50000) * ((1500000 - inputs.purchasePrice) / 500000) : 0)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-green-300">
                          <span className="text-[12px] font-bold text-green-800 uppercase tracking-wide">Total Savings</span>
                          <span className="text-2xl font-black text-green-700">
                            {fmt(calculatePTT(inputs.purchasePrice, false) + (inputs.includeGST ? inputs.purchasePrice <= 1000000 ? Math.min(results.gst, 50000) : inputs.purchasePrice < 1500000 ? Math.min(results.gst, 50000) * ((1500000 - inputs.purchasePrice) / 500000) : 0 : 0))}
                          </span>
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  <Button onClick={() => setCurrentPage('equity')} className="w-full h-10 text-[13px] font-bold gap-2" variant="outline">
                    Equity & Growth <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equity" className="mt-0">
            <div className="p-4 sm:p-5 space-y-4">

              {/* Controls */}
              <div className="grid grid-cols-2 gap-3">
                <SectionCard className="border-primary/25 bg-primary/5">
                  <div className="p-3">
                    <FieldLabel className="text-primary/80 flex items-center gap-1 block mb-2">
                      <Calendar className="h-3 w-3" /> Hold Period
                    </FieldLabel>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => updateInput('holdingPeriodYears', Math.max(1, inputs.holdingPeriodYears - 1))}
                        className="h-8 w-8 rounded-xl border border-border/60 bg-background flex items-center justify-center text-lg font-bold hover:bg-secondary transition-colors">
                        −
                      </button>
                      <div className="text-center">
                        <span className="text-3xl font-black text-primary">{inputs.holdingPeriodYears}</span>
                        <span className="text-[12px] text-muted-foreground ml-1">yr</span>
                      </div>
                      <button onClick={() => updateInput('holdingPeriodYears', Math.min(30, inputs.holdingPeriodYears + 1))}
                        className="h-8 w-8 rounded-xl border border-border/60 bg-background flex items-center justify-center text-lg font-bold hover:bg-secondary transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="p-3">
                    <FieldLabel className="flex items-center gap-1 block mb-2">
                      <TrendingUp className="h-3 w-3" /> Appreciation
                    </FieldLabel>
                    <div className="text-center mb-2">
                      <span className="text-3xl font-black text-primary">{inputs.appreciationRate}</span>
                      <span className="text-[12px] text-muted-foreground ml-1">% / yr</span>
                    </div>
                    <Slider
                      value={[inputs.appreciationRate]}
                      onValueChange={(v) => updateInput('appreciationRate', v[0])}
                      min={0} max={10} step={0.5}
                    />
                  </div>
                </SectionCard>
              </div>

              {/* Future Value Hero */}
              <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-50/30 border border-green-200 p-4 flex items-center justify-between">
                <div>
                  <FieldLabel className="text-green-600 block mb-0.5">Value in {inputs.holdingPeriodYears}yr</FieldLabel>
                  <div className="text-3xl font-black text-green-700">{fmt(results.futureValue)}</div>
                  <div className="flex items-center gap-1 text-[12px] text-green-600 mt-0.5 font-semibold">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{fmt(results.appreciation)}
                  </div>
                </div>
                <div className="text-right">
                  <FieldLabel className="block mb-0.5">Purchase</FieldLabel>
                  <div className="text-[14px] font-semibold text-muted-foreground">{fmt(inputs.purchasePrice)}</div>
                  {inputs.includeGST && <div className="text-[11px] text-muted-foreground/60 mt-0.5">+GST: {fmt(results.priceWithGST)}</div>}
                </div>
              </div>

              {/* Equity Breakdown */}
              <SectionCard>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel className="flex items-center gap-1.5"><PiggyBank className="h-3 w-3" /> Equity Built</FieldLabel>
                    <span className="text-xl font-black text-foreground">{fmt(results.totalEquityBuilt)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex mb-3 bg-muted/60">
                    {[
                      { value: results.downPayment,    color: 'bg-primary/70' },
                      { value: results.principalPaid,  color: 'bg-blue-500' },
                      { value: results.appreciation,   color: 'bg-green-500' },
                    ].map(({ value, color }, i) => (
                      <div key={i} className={cn(color, "transition-all")}
                        style={{ width: `${(value / (results.totalEquityBuilt || 1)) * 100}%` }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Down Pmt', value: results.downPayment,   dot: 'bg-primary/70' },
                      { label: 'Paydown',  value: results.principalPaid, dot: 'bg-blue-500' },
                      { label: 'Apprec.',  value: results.appreciation,  dot: 'bg-green-500' },
                    ].map(({ label, value, dot }) => (
                      <div key={label}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <div className={cn("h-2 w-2 rounded-full", dot)} />
                          <FieldLabel>{label}</FieldLabel>
                        </div>
                        <div className="text-[13px] font-bold text-foreground">{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total Return',  value: fmt(results.totalReturn),                                                                         dark: true },
                  { label: 'ROI',           value: `${results.roiPercent.toFixed(1)}%`,                    sub: `${inputs.holdingPeriodYears}yr`,      dark: false },
                  { label: 'Annualized',    value: `${inputs.holdingPeriodYears > 0 ? (results.roiPercent / inputs.holdingPeriodYears).toFixed(1) : '0.0'}%`, sub: 'per yr', dark: false },
                  { label: 'Cash In',       value: fmt(results.totalCashRequired),                                                                    dark: false },
                ].map(({ label, value, sub, dark }) => (
                  <div key={label} className={cn(
                    "rounded-2xl p-3 text-center",
                    dark ? "bg-foreground text-background" : "bg-muted/50 border border-border/50"
                  )}>
                    <FieldLabel className={dark ? "text-background/45" : ""}>{label}</FieldLabel>
                    <div className={cn("text-[14px] font-black mt-1", dark ? "text-background" : "text-foreground")}>
                      {value}
                    </div>
                    {sub && <div className={cn("text-[10px] mt-0.5", dark ? "text-background/40" : "text-muted-foreground/60")}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Investor: Return Sources + Metrics */}
              {!isFirstTimeBuyer && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <SectionCard>
                    <div className="p-3">
                      <FieldLabel className="block mb-2.5">Return Sources</FieldLabel>
                      <div className="space-y-3">
                        {[
                          { label: 'Appreciation', value: results.appreciation, pct: results.totalReturn !== 0 ? (results.appreciation / Math.abs(results.totalReturn) * 100) : 0, color: 'bg-green-500' },
                          { label: 'Paydown', value: results.principalPaid, pct: results.totalReturn !== 0 ? (results.principalPaid / Math.abs(results.totalReturn) * 100) : 0, color: 'bg-blue-500' },
                          { label: 'Cash Flow', value: results.totalCashFlowOverPeriod, pct: results.totalReturn !== 0 ? (results.totalCashFlowOverPeriod / Math.abs(results.totalReturn) * 100) : 0, color: results.totalCashFlowOverPeriod >= 0 ? 'bg-emerald-400' : 'bg-red-400' },
                        ].map(({ label, value, pct, color }) => (
                          <div key={label}>
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="text-muted-foreground">{label} <span className="text-muted-foreground/50">({pct.toFixed(0)}%)</span></span>
                              <span className={cn("font-bold", value >= 0 ? "text-green-600" : "text-red-600")}>
                                {value >= 0 ? '+' : ''}{fmt(value)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className={cn(color, "h-full rounded-full transition-all")} style={{ width: `${Math.abs(pct)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard>
                    <div className="p-3">
                      <FieldLabel className="block mb-2.5">Metrics</FieldLabel>
                      <Row label="Cap Rate"     value={`${((inputs.monthlyRent * 12 - (inputs.strataFees + inputs.propertyTax) * 12) / results.priceWithGST * 100).toFixed(2)}%`} sub="NOI / Price" />
                      <Row label="Cash-on-Cash" value={`${results.totalCashRequired > 0 ? (results.annualCashFlow / results.totalCashRequired * 100).toFixed(2) : '0.00'}%`} sub="Annual CF / Cash In" />
                      <Row label="Mortgage"     value={fmt(results.mortgageAmount)} sub={`Yr${inputs.holdingPeriodYears}: ${fmt(results.remainingBalance)}`} />
                      <Row label="Monthly CF"   value={fmt(results.monthlyCashFlow)} />
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* Year-by-Year Growth */}
              <SectionCard>
                <div className="p-3">
                  <FieldLabel className="block mb-2.5">Value Over Time</FieldLabel>
                  <div className="space-y-1.5">
                    {Array.from({ length: Math.min(inputs.holdingPeriodYears, 10) }, (_, i) => {
                      const yr = i + 1;
                      const val = inputs.purchasePrice * Math.pow(1 + inputs.appreciationRate / 100, yr);
                      const gain = val - inputs.purchasePrice;
                      const maxVal = inputs.purchasePrice * Math.pow(1 + inputs.appreciationRate / 100, Math.min(inputs.holdingPeriodYears, 10));
                      const maxGain = maxVal - inputs.purchasePrice;
                      return (
                        <div key={yr} className="flex items-center gap-2 text-[12px]">
                          <span className="w-8 text-muted-foreground font-semibold shrink-0">Yr{yr}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                              style={{ width: `${maxGain > 0 ? (gain / maxGain) * 100 : 0}%` }} />
                          </div>
                          <span className="w-[68px] text-right font-bold shrink-0">{fmt(val)}</span>
                          <span className="w-[52px] text-right text-green-600 font-semibold shrink-0">+{fmt(gain)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* First-Time Buyer: Rent vs Own */}
              {isFirstTimeBuyer && (
                <SectionCard className="border-primary/25 bg-primary/4">
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="text-[13px] font-bold text-primary">Rent vs Own — {inputs.holdingPeriodYears}yr</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      {[
                        { label: 'Total Rent Paid', value: `-${fmt(rentVsOwn.totalRentPaid)}`, color: 'text-red-600' },
                        { label: 'Equity Built',    value: fmt(rentVsOwn.equityBuilt),          color: 'text-green-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-background rounded-xl p-2.5 border border-border/50 text-center">
                          <FieldLabel className="block mb-0.5">{label}</FieldLabel>
                          <div className={cn("text-lg font-black", color)}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className={cn(
                      "rounded-xl p-2.5 text-center",
                      rentVsOwn.owningIsBetter ? "bg-green-100 border border-green-300" : "bg-amber-50 border border-amber-200"
                    )}>
                      <div className={cn("text-[13px] font-bold", rentVsOwn.owningIsBetter ? "text-green-700" : "text-amber-700")}>
                        {rentVsOwn.owningIsBetter
                          ? `Buying builds ${fmt(rentVsOwn.wealthDifference)} more wealth`
                          : `Renting saves ${fmt(Math.abs(rentVsOwn.wealthDifference))}`
                        }
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Comparison Panel ── */}
      {showComparison && snapshots.length > 0 && (
        <SnapshotComparison
          snapshots={snapshots}
          onDelete={deleteSnapshot}
          onClearAll={() => { clearAllSnapshots(); setShowComparison(false); }}
        />
      )}

      {/* ── Empty Save Prompt ── */}
      {!showComparison && snapshots.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-[14px] mb-1">Compare Scenarios</h3>
          <p className="text-[12px] text-muted-foreground mb-4">Save up to 3 scenarios side-by-side</p>
          <Button
            onClick={() => { setScenarioName(`${fmt(inputs.purchasePrice)} @ ${inputs.downPaymentPercent}%`); setShowSaveDialog(true); }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            Save Current
          </Button>
        </div>
      )}

      {/* ── Save Dialog ── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <Input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g. Surrey Condo — Conservative"
              className="h-11"
              autoFocus
            />
            <div className="bg-muted/40 rounded-xl p-3.5 text-[13px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{fmt(inputs.purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Flow</span>
                <span className={cn("font-semibold", results.monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600")}>
                  {fmt(results.monthlyCashFlow)}/mo
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveScenario}>Save Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
