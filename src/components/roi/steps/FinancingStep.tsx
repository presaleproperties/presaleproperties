import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Percent, Calendar, Pen, Clock, Key, CheckCircle2 } from "lucide-react";
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

  const totalDeposit = purchasePrice * ((financing.deposit1Percent + financing.deposit2Percent) / 100);
  const downPayment = purchasePrice * (financing.downPaymentPercent / 100);
  const additionalAtClose = Math.max(0, downPayment - totalDeposit);
  const mortgageAmount = purchasePrice - downPayment;

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

        {/* Deposit Timeline */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Deposit Structure</h4>

          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-border" />

            <div className="space-y-4">

              {/* Step 1 — At Signing */}
              <div className="flex gap-4 items-start">
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-warning text-on-dark ring-2 ring-warning shrink-0">
                  <Pen className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">1st Deposit — At Signing</p>
                      <p className="text-xs text-muted-foreground">Due immediately upon contract</p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(purchasePrice * (financing.deposit1Percent / 100))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Percent</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        value={financing.deposit1Percent}
                        onChange={(e) => updateInputs("deposit1Percent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <span className="pt-5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              {/* Step 2 — 2nd Deposit */}
              <div className="flex gap-4 items-start">
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-secondary-foreground ring-2 ring-border shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">2nd Deposit</p>
                      <p className="text-xs text-muted-foreground">
                        {financing.deposit2Months === 0
                          ? "At signing"
                          : `In ${financing.deposit2Months} month${financing.deposit2Months !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(purchasePrice * (financing.deposit2Percent / 100))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Percent</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        value={financing.deposit2Percent}
                        onChange={(e) => updateInputs("deposit2Percent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <span className="pt-5 text-xs text-muted-foreground">%</span>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Due (months)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        value={financing.deposit2Months}
                        onChange={(e) => updateInputs("deposit2Months", parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <span className="pt-5 text-xs text-muted-foreground">mo</span>
                  </div>
                </div>
              </div>

              {/* Step 3 — Completion */}
              <div className="flex gap-4 items-start">
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground ring-2 ring-primary/20 shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Balance at Completion</p>
                      <p className="text-xs text-muted-foreground">Remaining down payment due at keys</p>
                    </div>
                    <span className="font-semibold text-sm text-primary">
                      {formatCurrency(additionalAtClose)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4 — Total */}
              <div className="flex gap-4 items-start">
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-success text-on-dark ring-2 ring-success shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Total Cash Pre-Completion</p>
                      <p className="text-xs text-muted-foreground">All deposits combined</p>
                    </div>
                    <span className="font-bold text-base">
                      {formatCurrency(totalDeposit)}
                    </span>
                  </div>
                </div>
              </div>

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
