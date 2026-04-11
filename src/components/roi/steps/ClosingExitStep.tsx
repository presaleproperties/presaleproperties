import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Info, ShieldCheck } from "lucide-react";
import { ExitAssumptions, FinancingDetails, PurchaseDetails } from "@/types/roi";
import { calculatePTT, calculateGST, calculateGSTRebate, calculateCMHCInsurance } from "@/hooks/useROICalculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClosingExitStepProps {
  exit: ExitAssumptions;
  purchasePrice: number;
  financing?: FinancingDetails;
  purchase?: PurchaseDetails;
  updateInputs: (field: string, value: number | string | boolean) => void;
}

export function ClosingExitStep({ exit, purchasePrice, financing, purchase, updateInputs }: ClosingExitStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isFirstTimeBuyer = purchase?.buyerType === 'firstTimeBuyer';

  // Auto-calculate GST and PTT when price changes
  useEffect(() => {
    if (exit.includeGST) {
      const calculatedGST = calculateGST(purchasePrice);
      if (calculatedGST !== exit.gstAmount) {
        updateInputs("gstAmount", calculatedGST);
      }
    }
    if (exit.includePTT) {
      const calculatedPTT = calculatePTT(purchasePrice, isFirstTimeBuyer);
      if (calculatedPTT !== exit.pttAmount) {
        updateInputs("pttAmount", calculatedPTT);
      }
    }
  }, [purchasePrice, exit.includeGST, exit.includePTT, isFirstTimeBuyer]);

  // Financing-derived values
  const deposit1Amount = financing ? purchasePrice * (financing.deposit1Percent / 100) : 0;
  const deposit2Amount = financing ? purchasePrice * (financing.deposit2Percent / 100) : 0;
  const totalDepositPaid = deposit1Amount + deposit2Amount;
  const totalDownPayment = financing ? purchasePrice * (financing.downPaymentPercent / 100) : 0;
  const additionalDownPayment = Math.max(0, totalDownPayment - totalDepositPaid);
  const downPaymentPercent = financing?.downPaymentPercent || 20;

  const gstAmount = exit.includeGST ? exit.gstAmount : 0;
  const pttAmount = exit.includePTT ? exit.pttAmount : 0;
  const developerCredit = exit.developerCredit || 0;

  // CMHC insurance (< 20% down)
  const cmhcInsurance = calculateCMHCInsurance(purchasePrice - totalDownPayment, downPaymentPercent);

  // GST rebate for first-time buyers
  const gstRebate = isFirstTimeBuyer && exit.includeGST
    ? calculateGSTRebate(purchasePrice, gstAmount)
    : 0;

  // Net GST after rebate
  const netGST = gstAmount - gstRebate;

  // Total cash needed at closing
  const totalCashAtClosing =
    additionalDownPayment +
    netGST +
    pttAmount -
    developerCredit +
    exit.legalFees +
    exit.mortgageFees;

  // Grand total including deposits already paid
  const grandTotalCashInvested = totalDepositPaid + totalCashAtClosing;

  const estimatedYear5Value = purchasePrice * Math.pow(1 + exit.annualPriceGrowthPercent / 100, 5);
  const sellingCosts = estimatedYear5Value * (exit.sellingCostPercent / 100);

  // PTT exemption info — NEW CONSTRUCTION (BC April 2024+)
  // Full exemption ≤ $1.1M | Partial $1.1M–$1.15M
  const pttFullExemption = isFirstTimeBuyer && purchasePrice <= 1100000;
  const pttPartialExemption = isFirstTimeBuyer && purchasePrice > 1100000 && purchasePrice <= 1150000;

  return (
    <div className="space-y-6">
      {/* First-Time Buyer Banner */}
      {isFirstTimeBuyer && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">First-Time Buyer Benefits Applied</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                PTT exemption{pttFullExemption ? ' (full — new construction ≤$1.1M)' : pttPartialExemption ? ' (partial — new construction $1.1M–$1.15M)' : ' (over $1.15M — no exemption)'},{' '}
                GST rebate{gstRebate > 0 ? ` (${formatCurrency(gstRebate)} back)` : ' (not eligible above $1.5M)'}
                {cmhcInsurance > 0 ? `, CMHC insurance required` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Needed at Closing */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            Cash Needed at Closing
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isFirstTimeBuyer
              ? "Your complete closing day breakdown with first-time buyer benefits"
              : "Complete breakdown of what you'll need on completion day"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Deposits Already Paid */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Deposits Already Paid
            </div>
            {financing && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">1st Deposit ({financing.deposit1Percent}%)</span>
                  <span className="font-medium">{formatCurrency(deposit1Amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">2nd Deposit ({financing.deposit2Percent}%)</span>
                  <span className="font-medium">{formatCurrency(deposit2Amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t border-border/50 pt-1.5">
                  <span>Total Deposits Paid</span>
                  <span className="text-green-600 dark:text-green-400">✓ {formatCurrency(totalDepositPaid)}</span>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Additional Down Payment */}
          <div className="flex justify-between text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                    Additional Down Payment
                    <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    {isFirstTimeBuyer && downPaymentPercent < 20
                      ? `${downPaymentPercent}% down payment minus deposits. CMHC insurance applies for less than 20% down.`
                      : "Total down payment minus deposits already paid during construction"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-medium">{formatCurrency(additionalDownPayment)}</span>
          </div>

          {/* CMHC Insurance (first-time buyers with < 20% down) */}
          {cmhcInsurance > 0 && (
            <div className="flex justify-between text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-help">
                      CMHC Mortgage Insurance
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p className="text-xs">Required for down payments under 20%. Added to your mortgage — not paid upfront.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-right">
                <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(cmhcInsurance)}</span>
                <p className="text-[10px] text-muted-foreground">Added to mortgage</p>
              </div>
            </div>
          )}

          {/* GST */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">GST (5%)</Label>
                  <Switch
                    checked={exit.includeGST}
                    onCheckedChange={(checked) => updateInputs("includeGST", checked)}
                    className="scale-75"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isFirstTimeBuyer
                    ? "New construction GST — rebate may apply for primary residence"
                    : "New construction — investors pay full 5% GST"}
                </p>
              </div>
              <span className="text-sm font-medium">
                {exit.includeGST ? formatCurrency(gstAmount) : '$0'}
              </span>
            </div>
            {/* GST Rebate line for first-time buyers */}
            {isFirstTimeBuyer && exit.includeGST && (
              <div className="flex justify-between text-sm ml-4">
                <span className="text-green-600 dark:text-green-400 text-xs">
                  GST New Housing Rebate
                  {gstRebate === 0 && purchasePrice >= 450000 && (
                    <span className="text-muted-foreground"> (not eligible over $450K)</span>
                  )}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {gstRebate > 0 ? `-${formatCurrency(gstRebate)}` : '$0'}
                </span>
              </div>
            )}
            {isFirstTimeBuyer && exit.includeGST && gstRebate > 0 && (
              <div className="flex justify-between text-sm ml-4 font-medium">
                <span className="text-xs text-muted-foreground">Net GST</span>
                <span>{formatCurrency(netGST)}</span>
              </div>
            )}
          </div>

          {/* PTT */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Property Transfer Tax</Label>
                <Switch
                  checked={exit.includePTT}
                  onCheckedChange={(checked) => updateInputs("includePTT", checked)}
                  className="scale-75"
                />
                {isFirstTimeBuyer && pttFullExemption && (
                  <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                    EXEMPT
                  </Badge>
                )}
                {isFirstTimeBuyer && pttPartialExemption && (
                  <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                    PARTIAL
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isFirstTimeBuyer
                  ? pttFullExemption
                    ? "Full exemption — new construction ≤$1.1M (BC 2026)"
                    : pttPartialExemption
                    ? "Partial exemption — new construction $1.1M–$1.15M (BC 2026)"
                    : "Over $1.15M — standard PTT rates apply"
                  : "BC PTT — tiered rate on purchase price"}
              </p>
            </div>
            <span className="text-sm font-medium">
              {exit.includePTT ? formatCurrency(pttAmount) : '$0'}
            </span>
          </div>

          {/* Developer Credit */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm text-green-600 dark:text-green-400">Developer Credit / Incentive</Label>
              <p className="text-[10px] text-muted-foreground">Any closing credit from developer</p>
            </div>
            <div className="w-28">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">-$</span>
                <Input
                  type="number"
                  value={exit.developerCredit || ''}
                  onChange={(e) => updateInputs("developerCredit", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-7 h-8 text-sm text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Legal & Mortgage Fees */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="legalFees" className="text-xs">Legal Fees</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  id="legalFees"
                  type="number"
                  value={exit.legalFees || ''}
                  onChange={(e) => updateInputs("legalFees", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-6 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mortgageFees" className="text-xs">Mortgage Setup</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  id="mortgageFees"
                  type="number"
                  value={exit.mortgageFees || ''}
                  onChange={(e) => updateInputs("mortgageFees", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-6 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cash at Closing Total */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Cash Needed at Closing</span>
              <span className="text-primary text-lg">{formatCurrency(totalCashAtClosing)}</span>
            </div>
            <Separator className="bg-primary/10" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>+ Deposits Already Paid</span>
              <span>{formatCurrency(totalDepositPaid)}</span>
            </div>
            {cmhcInsurance > 0 && (
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                <span>+ CMHC Insurance (on mortgage)</span>
                <span>{formatCurrency(cmhcInsurance)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-primary/10">
              <span>Total Cash Invested</span>
              <span className="text-primary">{formatCurrency(grandTotalCashInvested)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exit Assumptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Exit Assumptions (5-Year)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Appreciation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Annual Price Growth: {exit.annualPriceGrowthPercent}%</Label>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(estimatedYear5Value)} at Year 5
              </span>
            </div>
            <Slider
              value={[exit.annualPriceGrowthPercent]}
              onValueChange={([value]) => updateInputs("annualPriceGrowthPercent", value)}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Conservative 0%</span>
              <span>Aggressive 10%</span>
            </div>
          </div>

          {/* Selling Costs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Selling Costs: {exit.sellingCostPercent}%</Label>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(sellingCosts)}
              </span>
            </div>
            <Slider
              value={[exit.sellingCostPercent]}
              onValueChange={([value]) => updateInputs("sellingCostPercent", value)}
              min={1}
              max={7}
              step={0.5}
            />
            <p className="text-[10px] text-muted-foreground">
              Includes realtor commissions, legal, and other selling fees
            </p>
          </div>

          {/* Exit Summary */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Value (Year 5):</span>
              <span className="font-medium">{formatCurrency(estimatedYear5Value)}</span>
            </div>
            <div className="flex justify-between text-destructive text-xs">
              <span>Less Selling Costs:</span>
              <span>-{formatCurrency(sellingCosts)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Net Proceeds:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatCurrency(estimatedYear5Value - sellingCosts)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
