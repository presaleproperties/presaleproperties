import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Receipt, Building, FileText, Shield, Zap, Wrench } from "lucide-react";
import { OperatingExpenses } from "@/types/roi";

interface OperatingExpensesStepProps {
  expenses: OperatingExpenses;
  updateInputs: (field: string, value: number) => void;
}

export function OperatingExpensesStep({ expenses, updateInputs }: OperatingExpensesStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const annualStrata = expenses.strataMonthly * 12;
  const totalAnnualExpenses = 
    annualStrata + 
    expenses.propertyTaxAnnual + 
    expenses.insuranceAnnual + 
    expenses.utilitiesAnnual + 
    expenses.maintenanceReserveAnnual +
    expenses.otherExpensesAnnual;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Operating Expenses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your estimated annual operating costs.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strata Fees */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="strata" className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Strata Fees (monthly)
            </Label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(annualStrata)}/yr
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="strata"
              type="number"
              value={expenses.strataMonthly}
              onChange={(e) => updateInputs("strataMonthly", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="350"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Annual Growth: {expenses.strataAnnualGrowthPercent}%</span>
            </div>
            <Slider
              value={[expenses.strataAnnualGrowthPercent]}
              onValueChange={([value]) => updateInputs("strataAnnualGrowthPercent", value)}
              min={0}
              max={10}
              step={0.5}
              className="py-1"
            />
          </div>
        </div>

        {/* Property Tax */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="propertyTax" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Property Tax (annual)
            </Label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="propertyTax"
              type="number"
              value={expenses.propertyTaxAnnual}
              onChange={(e) => updateInputs("propertyTaxAnnual", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="2800"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Annual Growth: {expenses.propertyTaxGrowthPercent}%</span>
            </div>
            <Slider
              value={[expenses.propertyTaxGrowthPercent]}
              onValueChange={([value]) => updateInputs("propertyTaxGrowthPercent", value)}
              min={0}
              max={10}
              step={0.5}
              className="py-1"
            />
          </div>
        </div>

        {/* Insurance */}
        <div className="space-y-2">
          <Label htmlFor="insurance" className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Insurance (annual)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="insurance"
              type="number"
              value={expenses.insuranceAnnual}
              onChange={(e) => updateInputs("insuranceAnnual", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="600"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Landlord/rental property insurance
          </p>
        </div>

        {/* Utilities */}
        <div className="space-y-2">
          <Label htmlFor="utilities" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            Utilities (annual)
            <span className="text-xs text-muted-foreground">(if not tenant-paid)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="utilities"
              type="number"
              value={expenses.utilitiesAnnual}
              onChange={(e) => updateInputs("utilitiesAnnual", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="0"
            />
          </div>
        </div>

        {/* Maintenance Reserve */}
        <div className="space-y-2">
          <Label htmlFor="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Maintenance Reserve (annual)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="maintenance"
              type="number"
              value={expenses.maintenanceReserveAnnual}
              onChange={(e) => updateInputs("maintenanceReserveAnnual", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="500"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            For minor repairs, appliance replacement, etc.
          </p>
        </div>

        {/* Other Expenses */}
        <div className="space-y-2">
          <Label htmlFor="other" className="flex items-center gap-2">
            Other Expenses (annual)
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="other"
              type="number"
              value={expenses.otherExpensesAnnual}
              onChange={(e) => updateInputs("otherExpensesAnnual", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="0"
            />
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Strata:</span>
            <span>{formatCurrency(annualStrata)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Property Tax:</span>
            <span>{formatCurrency(expenses.propertyTaxAnnual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Insurance:</span>
            <span>{formatCurrency(expenses.insuranceAnnual)}</span>
          </div>
          {expenses.utilitiesAnnual > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilities:</span>
              <span>{formatCurrency(expenses.utilitiesAnnual)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Maintenance:</span>
            <span>{formatCurrency(expenses.maintenanceReserveAnnual)}</span>
          </div>
          {expenses.otherExpensesAnnual > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Other:</span>
              <span>{formatCurrency(expenses.otherExpensesAnnual)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>Total Annual Expenses:</span>
            <span className="text-destructive">{formatCurrency(totalAnnualExpenses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
