import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Percent, Calendar } from "lucide-react";
import { FinancingDetails } from "@/types/roi";

interface FinancingStepProps {
  financing: FinancingDetails;
  purchasePrice: number;
  updateInputs: (field: string, value: number | string) => void;
}

export function FinancingStep({ financing, purchasePrice, updateInputs }: FinancingStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate mortgage details
  const totalDeposit = purchasePrice * ((financing.deposit1Percent + financing.deposit2Percent) / 100);
  const downPayment = purchasePrice * (financing.downPaymentPercent / 100);
  const additionalAtClose = Math.max(0, downPayment - totalDeposit);
  const mortgageAmount = purchasePrice - downPayment;

  // Calculate monthly payment
  const monthlyRate = financing.mortgageInterestRate / 100 / 12;
  const numPayments = financing.amortizationYears * 12;
  const monthlyPayment = mortgageAmount > 0 && monthlyRate > 0
    ? mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Deposit & Financing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your deposit structure and mortgage terms.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deposit Structure */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Deposit Structure</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deposit1">First Deposit (%)</Label>
              <Input
                id="deposit1"
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={financing.deposit1Percent}
                onChange={(e) => updateInputs("deposit1Percent", parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(purchasePrice * (financing.deposit1Percent / 100))}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit1Months">Due (months)</Label>
              <Input
                id="deposit1Months"
                type="number"
                min="0"
                max="24"
                value={financing.deposit1Months}
                onChange={(e) => updateInputs("deposit1Months", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {financing.deposit1Months === 0 ? "At signing" : `In ${financing.deposit1Months} months`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deposit2">Second Deposit (%)</Label>
              <Input
                id="deposit2"
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={financing.deposit2Percent}
                onChange={(e) => updateInputs("deposit2Percent", parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(purchasePrice * (financing.deposit2Percent / 100))}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit2Months">Due (months)</Label>
              <Input
                id="deposit2Months"
                type="number"
                min="0"
                max="24"
                value={financing.deposit2Months}
                onChange={(e) => updateInputs("deposit2Months", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {`In ${financing.deposit2Months} months`}
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deposits:</span>
              <span className="font-medium">{formatCurrency(totalDeposit)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Down Payment at Completion */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Down Payment at Completion</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Down Payment: {financing.downPaymentPercent}%</Label>
              <span className="text-sm font-medium">{formatCurrency(downPayment)}</span>
            </div>
            <Slider
              value={[financing.downPaymentPercent]}
              onValueChange={([value]) => updateInputs("downPaymentPercent", value)}
              min={5}
              max={50}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {additionalAtClose > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional at closing:</span>
                <span className="font-medium text-primary">{formatCurrency(additionalAtClose)}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Mortgage Terms */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Mortgage Terms</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Interest Rate: {financing.mortgageInterestRate.toFixed(2)}%
              </Label>
            </div>
            <Slider
              value={[financing.mortgageInterestRate]}
              onValueChange={([value]) => updateInputs("mortgageInterestRate", value)}
              min={2}
              max={8}
              step={0.25}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2%</span>
              <span>8%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amortization" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Amortization
              </Label>
              <Select
                value={financing.amortizationYears.toString()}
                onValueChange={(value) => updateInputs("amortizationYears", parseInt(value))}
              >
                <SelectTrigger id="amortization">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Mortgage Term</Label>
              <Select
                value={financing.mortgageTermYears.toString()}
                onValueChange={(value) => updateInputs("mortgageTermYears", parseInt(value))}
              >
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="7">7 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mortgage Summary */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mortgage Amount:</span>
            <span className="font-medium">{formatCurrency(mortgageAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Payment:</span>
            <span className="font-semibold text-primary">{formatCurrency(monthlyPayment)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
