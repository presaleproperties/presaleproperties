import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { FileText, TrendingUp, Calculator } from "lucide-react";
import { ExitAssumptions } from "@/types/roi";
import { calculatePTT, calculateGST } from "@/hooks/useROICalculator";

interface ClosingExitStepProps {
  exit: ExitAssumptions;
  purchasePrice: number;
  updateInputs: (field: string, value: number | string | boolean) => void;
}

export function ClosingExitStep({ exit, purchasePrice, updateInputs }: ClosingExitStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Auto-calculate GST and PTT when price changes
  useEffect(() => {
    if (exit.includeGST) {
      const calculatedGST = calculateGST(purchasePrice);
      if (calculatedGST !== exit.gstAmount) {
        updateInputs("gstAmount", calculatedGST);
      }
    }
    if (exit.includePTT) {
      const calculatedPTT = calculatePTT(purchasePrice);
      if (calculatedPTT !== exit.pttAmount) {
        updateInputs("pttAmount", calculatedPTT);
      }
    }
  }, [purchasePrice, exit.includeGST, exit.includePTT]);

  // Calculate totals
  const totalClosingCosts = 
    exit.legalFees + 
    (exit.includeGST ? exit.gstAmount : 0) + 
    (exit.includePTT ? exit.pttAmount : 0) + 
    exit.mortgageFees;

  const estimatedYear5Value = purchasePrice * Math.pow(1 + exit.annualPriceGrowthPercent / 100, 5);
  const sellingCosts = estimatedYear5Value * (exit.sellingCostPercent / 100);

  return (
    <div className="space-y-4">
      {/* Closing Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Closing Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GST Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Include GST (5%)</Label>
              <p className="text-xs text-muted-foreground">New construction tax</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {exit.includeGST ? formatCurrency(exit.gstAmount) : '$0'}
              </span>
              <Switch
                checked={exit.includeGST}
                onCheckedChange={(checked) => updateInputs("includeGST", checked)}
              />
            </div>
          </div>

          {/* PTT Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Include PTT</Label>
              <p className="text-xs text-muted-foreground">Property Transfer Tax</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {exit.includePTT ? formatCurrency(exit.pttAmount) : '$0'}
              </span>
              <Switch
                checked={exit.includePTT}
                onCheckedChange={(checked) => updateInputs("includePTT", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Legal & Mortgage Fees */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="legalFees" className="text-sm">Legal Fees</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="legalFees"
                  type="number"
                  value={exit.legalFees}
                  onChange={(e) => updateInputs("legalFees", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mortgageFees" className="text-sm">Mortgage Fees</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="mortgageFees"
                  type="number"
                  value={exit.mortgageFees}
                  onChange={(e) => updateInputs("mortgageFees", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Closing Costs Total */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex justify-between font-medium">
              <span>Total Closing Costs:</span>
              <span className="text-primary">{formatCurrency(totalClosingCosts)}</span>
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
