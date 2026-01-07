import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DoorOpen, TrendingUp, Receipt, Calculator } from "lucide-react";
import { ExitAssumptions } from "@/types/roi";
import { calculateGST, calculatePTT } from "@/hooks/useROICalculator";
import { useEffect } from "react";

interface ExitAssumptionsStepProps {
  exit: ExitAssumptions;
  purchasePrice: number;
  updateInputs: (field: string, value: number | boolean) => void;
}

export function ExitAssumptionsStep({ exit, purchasePrice, updateInputs }: ExitAssumptionsStepProps) {
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

  const totalClosingCosts = 
    exit.legalFees + 
    (exit.includeGST ? exit.gstAmount : 0) + 
    (exit.includePTT ? exit.pttAmount : 0) + 
    exit.mortgageFees;

  const estimatedYear5Value = purchasePrice * Math.pow(1 + exit.annualPriceGrowthPercent / 100, 5);
  const sellingCosts = estimatedYear5Value * (exit.sellingCostPercent / 100);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DoorOpen className="h-5 w-5 text-primary" />
          Closing Costs & Exit Assumptions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure closing costs and 5-year exit assumptions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Closing Costs */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Closing Costs
          </h4>

          {/* Legal Fees */}
          <div className="space-y-2">
            <Label htmlFor="legal">Legal Fees</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="legal"
                type="number"
                value={exit.legalFees}
                onChange={(e) => updateInputs("legalFees", parseInt(e.target.value) || 0)}
                className="pl-7"
                placeholder="1500"
              />
            </div>
          </div>

          {/* GST Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="gst" className="text-sm font-medium">
                Include GST (5%)
              </Label>
              <p className="text-xs text-muted-foreground">
                GST applies to new construction
              </p>
            </div>
            <Switch
              id="gst"
              checked={exit.includeGST}
              onCheckedChange={(checked) => updateInputs("includeGST", checked)}
            />
          </div>
          {exit.includeGST && (
            <div className="space-y-2 pl-4">
              <Label htmlFor="gstAmount">GST Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="gstAmount"
                  type="number"
                  value={exit.gstAmount}
                  onChange={(e) => updateInputs("gstAmount", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
          )}

          {/* PTT Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="ptt" className="text-sm font-medium">
                Include Property Transfer Tax
              </Label>
              <p className="text-xs text-muted-foreground">
                BC PTT applies on completion
              </p>
            </div>
            <Switch
              id="ptt"
              checked={exit.includePTT}
              onCheckedChange={(checked) => updateInputs("includePTT", checked)}
            />
          </div>
          {exit.includePTT && (
            <div className="space-y-2 pl-4">
              <Label htmlFor="pttAmount">PTT Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="pttAmount"
                  type="number"
                  value={exit.pttAmount}
                  onChange={(e) => updateInputs("pttAmount", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                First-time buyers may qualify for exemptions
              </p>
            </div>
          )}

          {/* Mortgage Fees */}
          <div className="space-y-2">
            <Label htmlFor="mortgageFees">Mortgage Fees (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="mortgageFees"
                type="number"
                value={exit.mortgageFees}
                onChange={(e) => updateInputs("mortgageFees", parseInt(e.target.value) || 0)}
                className="pl-7"
                placeholder="500"
              />
            </div>
          </div>

          {/* Closing Costs Summary */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex justify-between font-medium">
              <span>Total Closing Costs:</span>
              <span className="text-destructive">{formatCurrency(totalClosingCosts)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Exit Assumptions */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            5-Year Exit Assumptions
          </h4>

          {/* Annual Price Growth */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Annual Price Appreciation: {exit.annualPriceGrowthPercent}%</Label>
            </div>
            <Slider
              value={[exit.annualPriceGrowthPercent]}
              onValueChange={([value]) => updateInputs("annualPriceGrowthPercent", value)}
              min={0}
              max={10}
              step={0.5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Metro Vancouver historical average: 4-6%
            </p>
          </div>

          {/* Selling Cost */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Selling Costs: {exit.sellingCostPercent}%</Label>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(sellingCosts)}
              </span>
            </div>
            <Slider
              value={[exit.sellingCostPercent]}
              onValueChange={([value]) => updateInputs("sellingCostPercent", value)}
              min={3}
              max={7}
              step={0.5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3%</span>
              <span>7%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Includes realtor commissions, legal fees, etc.
            </p>
          </div>

          {/* Estimated Year 5 Value */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Value (Year 5):</span>
              <span className="font-medium">{formatCurrency(estimatedYear5Value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selling Costs:</span>
              <span className="text-destructive">-{formatCurrency(sellingCosts)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tax Estimate Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="showTax" className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Show Tax Set-Aside (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Estimate capital gains tax on sale
              </p>
            </div>
            <Switch
              id="showTax"
              checked={exit.showTaxEstimate}
              onCheckedChange={(checked) => updateInputs("showTaxEstimate", checked)}
            />
          </div>
          
          {exit.showTaxEstimate && (
            <div className="space-y-3 pl-4">
              <div className="flex justify-between items-center">
                <Label>Marginal Tax Rate: {exit.marginalTaxRate}%</Label>
              </div>
              <Slider
                value={[exit.marginalTaxRate]}
                onValueChange={([value]) => updateInputs("marginalTaxRate", value)}
                min={20}
                max={53}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20%</span>
                <span>53%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only 50% of capital gains are taxable in Canada
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
