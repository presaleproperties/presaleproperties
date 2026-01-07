import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Home, TrendingUp, AlertCircle, Building, FileText, Shield, Wrench } from "lucide-react";
import { RentalIncomeDetails, OperatingExpenses } from "@/types/roi";

interface IncomeExpensesStepProps {
  rental: RentalIncomeDetails;
  expenses: OperatingExpenses;
  updateRental: (field: string, value: number) => void;
  updateExpenses: (field: string, value: number) => void;
}

export function IncomeExpensesStep({ 
  rental, 
  expenses, 
  updateRental, 
  updateExpenses 
}: IncomeExpensesStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Income calculations
  const annualGrossRent = rental.monthlyRentStart * 12;
  const annualOtherIncome = rental.otherIncomeMonthly * 12;
  const vacancyLoss = (annualGrossRent + annualOtherIncome) * (rental.vacancyPercent / 100);
  const effectiveRent = annualGrossRent + annualOtherIncome - vacancyLoss;
  const managementCost = effectiveRent * (rental.managementPercent / 100);

  // Expense calculations
  const annualStrata = expenses.strataMonthly * 12;
  const totalAnnualExpenses = 
    annualStrata + 
    expenses.propertyTaxAnnual + 
    expenses.insuranceAnnual + 
    expenses.utilitiesAnnual + 
    expenses.maintenanceReserveAnnual +
    expenses.otherExpensesAnnual +
    managementCost;

  const noi = effectiveRent - totalAnnualExpenses;

  return (
    <div className="space-y-4">
      {/* Rental Income */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-4 w-4 text-primary" />
            Rental Income
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monthly Rent */}
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monthlyRent"
                type="number"
                value={rental.monthlyRentStart}
                onChange={(e) => updateRental("monthlyRentStart", parseInt(e.target.value) || 0)}
                className="pl-7 text-lg font-medium"
                placeholder="2400"
              />
            </div>
          </div>

          {/* Rent Growth & Vacancy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                Rent Growth: {rental.annualRentGrowthPercent}%
              </Label>
              <Slider
                value={[rental.annualRentGrowthPercent]}
                onValueChange={([value]) => updateRental("annualRentGrowthPercent", value)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Vacancy: {rental.vacancyPercent}%
              </Label>
              <Slider
                value={[rental.vacancyPercent]}
                onValueChange={([value]) => updateRental("vacancyPercent", value)}
                min={0}
                max={15}
                step={1}
              />
            </div>
          </div>

          {/* Property Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Property Management: {rental.managementPercent}%</Label>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(managementCost)}/yr
              </span>
            </div>
            <Slider
              value={[rental.managementPercent]}
              onValueChange={([value]) => updateRental("managementPercent", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-[10px] text-muted-foreground">0% = self-managed</p>
          </div>

          {/* Income Summary */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Rent:</span>
              <span>{formatCurrency(annualGrossRent)}/yr</span>
            </div>
            <div className="flex justify-between text-destructive text-xs">
              <span>Less Vacancy:</span>
              <span>-{formatCurrency(vacancyLoss)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Effective Income:</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(effectiveRent)}/yr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-primary" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Expenses Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="strata" className="text-sm">Strata (monthly)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="strata"
                  type="number"
                  value={expenses.strataMonthly}
                  onChange={(e) => updateExpenses("strataMonthly", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="propertyTax" className="flex items-center gap-1 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Property Tax (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="propertyTax"
                  type="number"
                  value={expenses.propertyTaxAnnual}
                  onChange={(e) => updateExpenses("propertyTaxAnnual", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurance" className="flex items-center gap-1 text-sm">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Insurance (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="insurance"
                  type="number"
                  value={expenses.insuranceAnnual}
                  onChange={(e) => updateExpenses("insuranceAnnual", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maintenance" className="flex items-center gap-1 text-sm">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                Maintenance (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="maintenance"
                  type="number"
                  value={expenses.maintenanceReserveAnnual}
                  onChange={(e) => updateExpenses("maintenanceReserveAnnual", parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Expenses Summary */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strata:</span>
              <span>{formatCurrency(annualStrata)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Tax:</span>
              <span>{formatCurrency(expenses.propertyTaxAnnual)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance + Maint:</span>
              <span>{formatCurrency(expenses.insuranceAnnual + expenses.maintenanceReserveAnnual)}/yr</span>
            </div>
            {rental.managementPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Management:</span>
                <span>{formatCurrency(managementCost)}/yr</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Total Expenses:</span>
              <span className="text-destructive">{formatCurrency(totalAnnualExpenses)}/yr</span>
            </div>
          </div>

          {/* NOI */}
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Operating Income (Year 1)</p>
            <p className={`text-xl font-bold ${noi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {formatCurrency(noi)}/yr
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
